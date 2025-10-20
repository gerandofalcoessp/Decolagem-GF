import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middlewares/cacheMiddleware.js';
import { z } from 'zod';
import { requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

// DEPRECATED: Esta rota está sendo descontinuada
// Use /api/regionals/users para obter dados de usuários da tabela usuarios
router.get('/', cacheMiddleware({ ttl: 300 }), async (req, res) => {
  logger.warn('DEPRECATED: /api/members endpoint is deprecated. Use /api/regionals/users instead.');
  
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const { data, error } = await s.from('members').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// DEPRECATED: Esta rota está sendo descontinuada
// Use /api/regionals/users para obter dados do usuário autenticado
router.get('/me', cacheMiddleware({ ttl: 180 }), async (req, res) => {
  logger.warn('DEPRECATED: /api/members/me endpoint is deprecated. Use /api/regionals/users instead.');
  
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const { data, error } = await s.from('members').select('*').eq('auth_user_id', user.id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json({ data });
});

router.post('/', requireRole('super_admin'), invalidateCacheMiddleware(['members']), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  // Log da tentativa de criação
  logger.info('Member creation attempt', {
    userId: user.id,
    action: 'create_member',
    resource: 'member',
    context: {
      userEmail: user.email,
      requestBody: req.body
    }
  });

  const body = req.body || {};
  const createMemberSchema = z.object({}).passthrough().refine(obj => !('auth_user_id' in obj), {
    message: 'auth_user_id_not_allowed'
  });
  const parsedBody = createMemberSchema.safeParse(body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parsedBody.error.flatten() });
  }

  const safeBody = parsedBody.data;
  
  // Verificar se o usuário atual já tem um registro na tabela members
  const { data: existingMember, error: checkError } = await s
    .from('members')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  let payload;
  
  if (existingMember && !checkError) {
    // Usuário já tem um member - criar um novo member sem auth_user_id (para outros usuários)
    // Isso permite que admins criem membros para outras pessoas
    payload = { 
      name: safeBody.name,
      email: safeBody.email,
      regional_id: safeBody.regional_id,
      funcao: safeBody.funcao,
      area: safeBody.area
      // Não incluir auth_user_id - será null, permitindo múltiplos membros sem usuário associado
    };
    
    logger.info('Admin creating member for another user', {
      userId: user.id,
      action: 'create_member_admin',
      resource: 'members',
      context: {
        adminUserId: user.id,
        adminEmail: user.email,
        newMemberData: payload
      }
    });
  } else {
    // Usuário não tem member ainda - criar member para ele mesmo
    payload = { ...safeBody, auth_user_id: user.id };
    
    logger.info('User creating their own member record', {
      userId: user.id,
      action: 'create_member_self',
      resource: 'members',
      context: {
        userEmail: user.email
      }
    });
  }

  const { data, error } = await s.from('members').insert(payload).select('*').single();
  
  if (error) {
    logger.logMemberAction('create_member', user.id, {
      payload,
      userEmail: user.email
    }, error);
    return res.status(400).json({ error: error.message });
  }

  // Log de sucesso
  logger.logMemberAction('create_member', user.id, {
    memberId: data.id,
    memberName: data.name,
    userEmail: user.email,
    isAdminCreation: !!existingMember
  });

  res.status(201).json({ data });
});

router.put('/:id', requireRole('super_admin'), invalidateCacheMiddleware(['members']), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const idSchema = z.string().min(1);
  const idParse = idSchema.safeParse(req.params.id);
  if (!idParse.success) {
    return res.status(400).json({ error: 'invalid_id', details: idParse.error.flatten() });
  }

  const body = req.body || {};
  const updateMemberSchema = z.object({}).passthrough().refine(obj => !('auth_user_id' in obj), {
    message: 'auth_user_id_not_allowed'
  });
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
  }

  const safeBody = parsed.data;
  
  // Verificar se o membro existe primeiro
  const { data: existingMember, error: checkError } = await s
    .from('members')
    .select('*')
    .eq('id', idParse.data);

  if (checkError) {
    logger.error('Error checking existing member', {
      userId: user.id,
      action: 'update_member',
      resource: 'members',
      error: {
        name: checkError.name || 'CheckError',
        message: checkError.message
      }
    });
    return res.status(400).json({ error: checkError.message });
  }

  if (!existingMember || existingMember.length === 0) {
    return res.status(404).json({ error: 'member_not_found' });
  }

  if (existingMember.length > 1) {
    logger.error('Multiple members found with same ID', {
      userId: user.id,
      action: 'update_member',
      resource: 'members',
      context: {
        count: existingMember.length
      },
      error: {
        name: 'MultipleMembers',
        message: `Multiple members found with ID: ${idParse.data}`
      }
    });
    return res.status(400).json({ error: 'multiple_members_same_id' });
  }

  const payload = safeBody;

  const { data, error } = await s
    .from('members')
    .update(payload)
    .eq('id', idParse.data)
    .select('*');
    
  if (error) {
    logger.error('Error updating member', {
      userId: user.id,
      action: 'update_member',
      resource: 'members',
      context: {
        payload
      },
      error: {
        name: error.name || 'UpdateError',
        message: error.message
      }
    });
    return res.status(400).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'no_member_updated' });
  }

  if (data.length > 1) {
    logger.error('Multiple members updated', {
      userId: user.id,
      action: 'update_member',
      resource: 'members',
      context: {
        count: data.length
      },
      error: {
        name: 'MultipleUpdates',
        message: `Multiple members updated for ID: ${idParse.data}`
      }
    });
    return res.status(400).json({ error: 'multiple_members_updated' });
  }

  // Log de sucesso
  logger.logMemberAction('update_member', user.id, {
    memberId: idParse.data,
    memberName: data[0].name,
    userEmail: user.email,
    updatedFields: Object.keys(payload)
  });

  res.json({ data: data[0] });
});

router.delete('/:id', requireRole('super_admin'), invalidateCacheMiddleware(['members']), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const idSchema = z.string().min(1);
  const idParse = idSchema.safeParse(req.params.id);
  if (!idParse.success) {
    return res.status(400).json({ error: 'invalid_id', details: idParse.error.flatten() });
  }

  const id = idParse.data;
  
  // Log da tentativa de exclusão
  logger.info('Member deletion attempt', {
    userId: user.id,
    action: 'delete_member',
    resource: 'member',
    context: {
      memberId: id,
      userEmail: user.email
    }
  });

  const { data, error } = await s
    .from('members')
    .delete()
    .eq('id', id)
    .select('*');
  
  if (error) {
    logger.error('Error deleting member', {
      userId: user.id,
      action: 'delete_member',
      resource: 'members',
      context: {
        memberId: id
      },
      error: {
        name: error.name || 'DeleteError',
        message: error.message
      }
    });
    return res.status(400).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'member_not_found_for_deletion' });
  }

  // Log de sucesso
  logger.logMemberAction('delete_member', user.id, {
    memberId: id,
    userEmail: user.email,
    deletedMember: data[0]
  });

  res.json({ data: data[0] });
});

export default router;