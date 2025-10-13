import { Router } from 'express';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middlewares/cacheMiddleware.js';

const router = Router();

// CRUD básico de members sob RLS
router.get('/', cacheMiddleware({ ttl: 300 }), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const { data, error } = await s.from('members').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
});

// Retorna o registro do member do usuário autenticado
router.get('/me', cacheMiddleware({ ttl: 180 }), async (req, res) => {
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

router.post('/', invalidateCacheMiddleware(['members']), async (req, res) => {
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
      name: body.name,
      email: body.email,
      regional_id: body.regional_id,
      funcao: body.funcao,
      area: body.area
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
    payload = { ...body, auth_user_id: user.id };
    
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

router.put('/:id', invalidateCacheMiddleware(['members']), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const id = req.params.id;
  const body = req.body || {};
  
  // Nunca permitir mudar o vínculo do usuário
  if ('auth_user_id' in body) delete body.auth_user_id;
  
  // Verificar se o membro existe primeiro
  const { data: existingMember, error: checkError } = await s
    .from('members')
    .select('*')
    .eq('id', id);

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
    return res.status(404).json({ error: 'Membro não encontrado' });
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
        message: `Multiple members found with ID: ${id}`
      }
    });
    return res.status(400).json({ error: 'Múltiplos membros encontrados com o mesmo ID' });
  }

  const payload = body;

  const { data, error } = await s
    .from('members')
    .update(payload)
    .eq('id', id)
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
    return res.status(404).json({ error: 'Nenhum membro foi atualizado' });
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
        message: `Multiple members updated for ID: ${id}`
      }
    });
    return res.status(400).json({ error: 'Múltiplos membros foram atualizados' });
  }

  // Log de sucesso
  logger.logMemberAction('update_member', user.id, {
    memberId: id,
    memberName: data[0].name,
    userEmail: user.email,
    updatedFields: Object.keys(payload)
  });

  res.json({ data: data[0] });
});

router.delete('/:id', invalidateCacheMiddleware(['members']), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const s = getSupabaseForToken(token);
  if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const id = req.params.id;
  
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

  const { data, error } = await s.from('members').delete().eq('id', id).select('*').single();
  
  if (error) {
    logger.logMemberAction('delete_member', user.id, {
      memberId: id,
      userEmail: user.email
    }, error);
    return res.status(400).json({ error: error.message });
  }

  // Log de sucesso
  logger.info('Member deleted successfully', {
    userId: user.id,
    action: 'delete_member',
    resource: 'members',
    context: {
      adminUserId: user.id,
      deletedMemberId: id,
      userEmail: user.email
    }
  });

  logger.logMemberAction('delete_member', user.id, {
    deletedMemberId: data.id,
    deletedMemberName: data.name,
    userEmail: user.email
  });

  res.json({ data });
});

export default router;