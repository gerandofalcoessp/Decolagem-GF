import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService.js'
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js';
import { logger } from '../utils/logger.js';
import { supabaseAdmin } from '../services/supabaseClient.js'
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const router = Router();

/**
 * POST /auth/login
 * Realiza login do usuário
 */
router.post('/login', async (req: Request, res: Response) => {
  const startTime = Date.now();

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
  });
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.logAuthEvent('auth_failure', undefined, req.ip, {
      stage: 'login',
      reason: 'invalid_payload',
      issues: parsed.error.issues,
      userAgent: req.get('User-Agent')
    });
    return res.status(400).json({
      error: 'invalid_payload',
      details: parsed.error.flatten()
    });
  }
  const { email, password } = parsed.data;
  
  try {
    logger.logAuthEvent('login', undefined, req.ip, {
      stage: 'attempt',
      email,
      userAgent: req.get('User-Agent')
    });

    const result = await AuthService.signIn(email, password);

    if (result.error) {
      logger.logAuthEvent('auth_failure', undefined, req.ip, {
        stage: 'login',
        reason: 'invalid_credentials',
        error: { name: 'AuthError', message: result.error.message },
        userAgent: req.get('User-Agent'),
        duration: `${Date.now() - startTime}ms`,
        email
      });
      return res.status(401).json({
        error: 'invalid_credentials',
      });
    }

    if (!result.user || !result.session) {
      logger.logAuthEvent('auth_failure', undefined, req.ip, {
        stage: 'login',
        reason: 'no_user_or_session',
        email,
        userAgent: req.get('User-Agent'),
        duration: `${Date.now() - startTime}ms`
      });
      return res.status(401).json({
        error: 'invalid_credentials',
      });
    }

    // Buscar dados do membro associado
    const memberData = await AuthService.getMemberData(result.user.id);

    logger.logAuthEvent('login', result.user.id, req.ip, {
      status: 'success',
      email: result.user.email,
      memberRole: memberData?.role,
      userAgent: req.get('User-Agent'),
      duration: `${Date.now() - startTime}ms`
    });

    return res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        ...result.user.user_metadata,
      },
      member: memberData,
      session: {
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
        expires_at: result.session.expires_at,
      },
    });
  } catch (error) {
    logger.logAuthEvent('auth_failure', undefined, req.ip, {
      stage: 'login',
      email,
      error: {
        name: error instanceof Error ? error.name : 'Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      userAgent: req.get('User-Agent'),
      duration: `${Date.now() - startTime}ms`
    });
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * POST /auth/logout
 * Realiza logout do usuário
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const user = (req as any).user;
  
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      logger.logAuthEvent('auth_failure', user?.id, req.ip, {
        stage: 'logout',
        reason: 'no_token',
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({ error: 'invalid_token' });
    }

    logger.logAuthEvent('logout', user?.id, req.ip, {
      status: 'attempt',
      userAgent: req.get('User-Agent')
    });

    const result = await AuthService.signOut(token);

    if (result.error) {
      logger.logAuthEvent('auth_failure', user?.id, req.ip, {
        stage: 'logout',
        reason: 'service_error',
        error: { name: 'AuthError', message: result.error.message },
        userAgent: req.get('User-Agent'),
        duration: `${Date.now() - startTime}ms`
      });
      return res.status(400).json({
        error: result.error.message,
      });
    }

    logger.logAuthEvent('logout', user?.id, req.ip, {
      status: 'success',
      userAgent: req.get('User-Agent'),
      duration: `${Date.now() - startTime}ms`
    });

    return res.json({
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    logger.logAuthEvent('auth_failure', user?.id, req.ip, {
      stage: 'logout',
      error: {
        name: error instanceof Error ? error.name : 'Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      userAgent: req.get('User-Agent'),
      duration: `${Date.now() - startTime}ms`
    });
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * GET /auth/me
 * Obtém dados do usuário autenticado
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const user = (req as any).user;
  
  try {
    if (!user) {
      logger.logAuthEvent('auth_failure', undefined, req.ip, {
        stage: 'me',
        reason: 'no_user',
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Buscar dados do membro associado
    const memberData = await AuthService.getMemberData(user.id);

    logger.info('User data retrieved successfully', {
      userId: user.id,
      duration: `${Date.now() - startTime}ms`,
      context: {
        email: user.email,
        memberRole: memberData?.role
      }
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        ...user.user_metadata,
      },
      member: memberData,
    });
  } catch (error) {
    logger.error('Error retrieving user data', {
      userId: user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      duration: `${Date.now() - startTime}ms`,
      error: {
        name: error instanceof Error ? error.name : 'Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }
    });
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * POST /auth/register-public
 * Registra novo usuário (endpoint público para desenvolvimento)
 */
router.post('/register-public', async (req: Request, res: Response) => {
  try {
    const { email, password, nome, role, tipo, regional, funcao, area, permissao } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email_and_password_required' });
    }

    const result = await AuthService.signUp({
      email,
      password,
      metadata: {
        nome,
        role: role || permissao || 'user',
        tipo,
        regional,
        funcao,
        area
      }
    });

    if (result.error) {
      logger.error('Error in public user registration', {
        error: result.error,
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({ 
        error: 'registration_failed',
        details: result.error.message 
      });
    }

    logger.info('Public user registration successful', {
      userId: result.user?.id,
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(201).json({
      message: 'user_created_successfully',
      user: {
        id: result.user?.id,
        email: result.user?.email,
        ...result.user?.user_metadata,
      }
    });
  } catch (error) {
    logger.error('Error in public user registration', {
      error: {
        name: error instanceof Error ? error.name : 'Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * POST /auth/register
 * Registra novo usuário (apenas para admins)
 */
router.post('/register', authMiddleware, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const { email, password, nome, role, tipo, regional, funcao } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email_and_password_required' });
    }

    const result = await AuthService.signUp({
      email,
      password,
      metadata: {
        nome,
        role,
        tipo,
        regional,
        funcao,
      },
    });

    if (result.error) {
      return res.status(400).json({
        error: result.error.message,
      });
    }

    // Os triggers do banco de dados criam automaticamente a entrada na tabela usuarios
    console.log('✅ Usuário criado no Auth:', result.user?.email);

    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: result.user?.id,
        email: result.user?.email,
        ...result.user?.user_metadata,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * GET /auth/users
 * Lista todos os usuários cadastrados (apenas para super admins)
 */
router.get('/users', authMiddleware, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const result = await AuthService.listUsers();

    if (result.error) {
      return res.status(500).json({ error: 'list_users_failed' });
    }

    return res.json({
      users: result.users,
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * PUT /auth/users/:id
 * Atualiza um usuário
 */
router.put('/users/:id', authMiddleware, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, nome, regional, role, tipo, funcao } = req.body;

    console.log('🔄 Atualizando usuário:', { id, email, nome, regional, role, tipo, funcao });

    // Preparar dados para atualização no user_metadata
    const userData: any = {};
    
    if (email) {
      userData.email = email;
    }

    if (nome || regional || role || tipo || funcao) {
      userData.user_metadata = {};
      if (nome) userData.user_metadata.nome = nome;
      if (regional) userData.user_metadata.regional = regional;
      if (role) userData.user_metadata.role = role;
      if (tipo) userData.user_metadata.tipo = tipo;
      if (funcao) userData.user_metadata.funcao = funcao;
    }

    console.log('📝 Dados para user_metadata:', userData);

    // Atualizar no Supabase Auth
    const result = await AuthService.updateUser(id, userData);

    if (!result.success) {
      return res.status(400).json({ error: result.error?.message || 'update_user_failed' });
    }

    console.log('✅ user_metadata atualizado com sucesso');

    // Sincronizar com a tabela usuarios
    try {
      // const { supabaseAdmin } = require('../services/supabaseClient.js');
      
      // Verificar se existe entrada na tabela usuarios
      const { data: existingUsuario, error: selectError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar usuario:', selectError);
      }

      if (existingUsuario) {
        // Atualizar registro existente
        const usuarioUpdateData: any = {
          updated_at: new Date().toISOString(),
        };
        if (nome) usuarioUpdateData.nome = nome;
        if (email) usuarioUpdateData.email = email;
        if (funcao) usuarioUpdateData.funcao = funcao;
        if (regional) usuarioUpdateData.regional = regional;
        if (role) {
          usuarioUpdateData.permissao = role; // Usar permissao como campo principal
          usuarioUpdateData.role = role; // Manter role por compatibilidade
        }
        if (tipo) usuarioUpdateData.tipo = tipo;

        console.log('🔄 Atualizando usuario existente:', usuarioUpdateData);

        const { error: updateError } = await supabaseAdmin
          .from('usuarios')
          .update(usuarioUpdateData)
          .eq('auth_user_id', id);

        if (updateError) {
          console.error('❌ Erro ao atualizar usuario:', updateError);
        } else {
          console.log('✅ Usuario atualizado com sucesso');
        }
      } else {
        // Criar novo registro na tabela usuarios
        const usuarioData = {
          auth_user_id: id,
          nome: nome || email?.split('@')[0] || 'Usuário',
          email: email,
          funcao: funcao || null,
          area: regional || null,
          regional: regional || null,
          tipo: tipo || 'nacional',
          permissao: role || 'user', // Usar permissao como campo principal
          role: role || 'user', // Manter role por compatibilidade
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('🆕 Criando novo usuario:', usuarioData);

        const { error: insertError } = await supabaseAdmin
          .from('usuarios')
          .insert(usuarioData);

        if (insertError) {
          console.error('❌ Erro ao criar usuario:', insertError);
        } else {
          console.log('✅ Novo usuario criado com sucesso');
        }
      }
    } catch (usuarioError) {
      console.error('❌ Erro geral ao sincronizar tabela usuarios:', usuarioError);
      // Não falha a operação principal se houver erro na tabela usuarios
    }

    return res.json({ 
      message: 'Usuário atualizado com sucesso',
      user: result.user 
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * POST /auth/users/:id/block
 * Bloqueia um usuário
 */
router.post('/users/:id/block', authMiddleware, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    const result = await AuthService.blockUser(id, duration);

    if (!result.success) {
      return res.status(500).json({ error: 'block_user_failed' });
    }

    return res.json({
      message: 'Usuário bloqueado com sucesso',
      user: result.user,
    });
  } catch (error) {
    console.error('Erro ao bloquear usuário:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * POST /auth/users/:id/unblock
 * Desbloqueia um usuário
 */
router.post('/users/:id/unblock', authMiddleware, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await AuthService.unblockUser(id);

    if (!result.success) {
      return res.status(500).json({ error: 'unblock_user_failed' });
    }

    return res.json({
      message: 'Usuário desbloqueado com sucesso',
      user: result.user,
    });
  } catch (error) {
    console.error('Erro ao desbloquear usuário:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * DELETE /auth/users/:id
 * Exclui um usuário
 */
router.delete('/users/:id', authMiddleware, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    // Criar contexto de usuário autenticado para o AuthService
    const userContext = {
      supabase: createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    };

    // Definir a sessão do usuário autenticado
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    
    if (token) {
      await userContext.supabase.auth.setSession({
        access_token: token,
        refresh_token: '' // Não precisamos do refresh token para esta operação
      });
    }
    
    const result = await AuthService.deleteUser(id, userContext);

    if (!result.success) {
      return res.status((result.error as any)?.status || 500).json({
        error: result.error?.message || 'delete_user_failed',
      });
    }

    return res.json({ message: 'user_deleted_successfully' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * POST /auth/reset-password
 * Envia email de recuperação de senha
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email_required' });
    }

    const result = await AuthService.resetPassword(email);

    if (result.error) {
      return res.status(400).json({
        error: result.error.message,
      });
    }

    return res.json({
      message: 'Email de recuperação enviado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * PUT /auth/update-password
 * Atualiza senha do usuário autenticado
 */
router.put('/update-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!newPassword) {
      return res.status(400).json({ error: 'new_password_required' });
    }

    if (!token) {
      return res.status(400).json({ error: 'invalid_token' });
    }

    const result = await AuthService.updatePassword(token, newPassword);

    if (result.error) {
      return res.status(400).json({
        error: result.error.message,
      });
    }

    return res.json({
      message: 'Senha atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * PUT /auth/users/:id/update-password
 * Atualiza senha de um usuário específico (apenas admin)
 */
router.put('/users/:id/update-password', authMiddleware, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'new_password_required' });
    }

    const result = await AuthService.updateUserPassword(id, newPassword);

    if (!result.success || result.error) {
      return res.status(400).json({ error: result.error?.message || 'update_password_failed' });
    }

    return res.json({
      message: 'Senha atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar senha do usuário:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

/**
 * POST /auth/users/:id/generate-password
 * Gera uma nova senha temporária para um usuário
 */
router.post('/users/:id/generate-password', authMiddleware, requireRole('super_admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await AuthService.generateNewPassword(id);

    if (result.error) {
      return res.status(400).json({
        error: result.error.message,
      });
    }

    return res.json({
      message: 'new_password_generated',
      password: result.password,
    });
  } catch (error) {
    console.error('Erro ao gerar nova senha:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

export default router;