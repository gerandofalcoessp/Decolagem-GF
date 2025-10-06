import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

/**
 * POST /auth/login
 * Realiza login do usuário
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
      });
    }

    const result = await AuthService.signIn(email, password);

    if (result.error) {
      return res.status(401).json({
        error: result.error.message,
      });
    }

    if (!result.user || !result.session) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
      });
    }

    // Buscar dados do membro associado
    const memberData = await AuthService.getMemberData(result.user.id);

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
    console.error('Erro no login:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * POST /auth/logout
 * Realiza logout do usuário
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(400).json({
        error: 'Token não fornecido',
      });
    }

    const result = await AuthService.signOut(token);

    if (result.error) {
      return res.status(400).json({
        error: result.error.message,
      });
    }

    return res.json({
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /auth/me
 * Obtém dados do usuário autenticado
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
      });
    }

    // Buscar dados do membro associado
    const memberData = await AuthService.getMemberData(user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        ...user.user_metadata,
      },
      member: memberData,
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * POST /auth/register
 * Registra novo usuário (apenas para admins)
 */
router.post('/register', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Verificar se o usuário tem permissão para criar outros usuários
    const memberData = await AuthService.getMemberData(user.id);
    if (!memberData || memberData.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas super admins podem criar usuários.',
      });
    }

    const { email, password, nome, role, tipo, regional, funcao } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
      });
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

    // Criar entrada na tabela usuarios após o registro bem-sucedido
    if (result.user) {
      try {
        const { supabaseAdmin } = require('../services/supabaseClient');
        
        const usuarioData = {
          auth_user_id: result.user.id,
          nome: nome || email.split('@')[0],
          email: result.user.email,
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

        console.log('🆕 Criando usuario para novo usuário:', usuarioData);

        const { error: usuarioError } = await supabaseAdmin
          .from('usuarios')
          .insert(usuarioData);

        if (usuarioError) {
          console.error('❌ Erro ao criar entrada na tabela usuarios:', usuarioError);
          // Não falhar o registro se a criação do usuario falhar
        } else {
          console.log('✅ Entrada criada na tabela usuarios para:', result.user.email);
        }
      } catch (usuarioCreationError) {
        console.error('Erro ao criar entrada na tabela usuarios:', usuarioCreationError);
      }
    }

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
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * GET /auth/users
 * Lista todos os usuários cadastrados (apenas para super admins)
 */
router.get('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Verificar se o usuário é super admin
    const memberData = await AuthService.getMemberData(user.id);
    
    if (!memberData || memberData.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas super admins podem listar usuários.',
      });
    }

    const result = await AuthService.listUsers();

    if (result.error) {
      return res.status(500).json({
        error: 'Erro ao listar usuários',
      });
    }

    return res.json({
      users: result.users,
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * PUT /auth/users/:id
 * Atualiza um usuário
 */
router.put('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, nome, regional, role, tipo, funcao } = req.body;

    console.log('🔄 Atualizando usuário:', { id, email, nome, regional, role, tipo, funcao });

    // Verificar se é super admin
    const userRole = (req as any).user?.role;
    if (userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas super admins podem atualizar usuários.' });
    }

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
      return res.status(400).json({ error: result.error?.message || 'Erro ao atualizar usuário' });
    }

    console.log('✅ user_metadata atualizado com sucesso');

    // Sincronizar com a tabela usuarios
    try {
      const { supabaseAdmin } = require('../services/supabaseClient');
      
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
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /auth/users/:id/block
 * Bloqueia um usuário
 */
router.post('/users/:id/block', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { duration } = req.body;
    
    // Verificar se o usuário é super admin
    const memberData = await AuthService.getMemberData(user.id);
    
    if (!memberData || memberData.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas super admins podem bloquear usuários.',
      });
    }

    const result = await AuthService.blockUser(id, duration);

    if (!result.success) {
      return res.status(500).json({
        error: 'Erro ao bloquear usuário',
      });
    }

    return res.json({
      message: 'Usuário bloqueado com sucesso',
      user: result.user,
    });
  } catch (error) {
    console.error('Erro ao bloquear usuário:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * POST /auth/users/:id/unblock
 * Desbloqueia um usuário
 */
router.post('/users/:id/unblock', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    // Verificar se o usuário é super admin
    const memberData = await AuthService.getMemberData(user.id);
    
    if (!memberData || memberData.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas super admins podem desbloquear usuários.',
      });
    }

    const result = await AuthService.unblockUser(id);

    if (!result.success) {
      return res.status(500).json({
        error: 'Erro ao desbloquear usuário',
      });
    }

    return res.json({
      message: 'Usuário desbloqueado com sucesso',
      user: result.user,
    });
  } catch (error) {
    console.error('Erro ao desbloquear usuário:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * DELETE /auth/users/:id
 * Exclui um usuário
 */
router.delete('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    // Verificar se o usuário é super admin
    const memberData = await AuthService.getMemberData(user.id);
    
    if (!memberData || memberData.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas super admins podem excluir usuários.',
      });
    }

    const result = await AuthService.deleteUser(id);

    if (!result.success) {
      return res.status((result.error as any)?.status || 500).json({
        error: result.error?.message || 'Erro ao excluir usuário',
      });
    }

    return res.json({
      message: 'Usuário excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
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
      return res.status(400).json({
        error: 'Email é obrigatório',
      });
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
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
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
      return res.status(400).json({
        error: 'Nova senha é obrigatória',
      });
    }

    if (!token) {
      return res.status(400).json({
        error: 'Token não fornecido',
      });
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
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * PUT /auth/users/:id/update-password
 * Atualiza senha de um usuário específico (apenas admin)
 */
router.put('/users/:id/update-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { newPassword } = req.body;
    
    // Verificar se o usuário é super admin
    const memberData = await AuthService.getMemberData(user.id);
    
    if (!memberData || memberData.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas super admins podem atualizar senhas de usuários.',
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        error: 'Nova senha é obrigatória',
      });
    }

    const result = await AuthService.updateUserPassword(id, newPassword);

    if (!result.success || result.error) {
      return res.status(400).json({
        error: result.error?.message || 'Erro ao atualizar senha',
      });
    }

    return res.json({
      message: 'Senha atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar senha do usuário:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * POST /auth/users/:id/generate-password
 * Gera uma nova senha temporária para um usuário
 */
router.post('/users/:id/generate-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    // Verificar se o usuário é super admin
    const memberData = await AuthService.getMemberData(user.id);
    
    if (!memberData || memberData.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas super admins podem gerar novas senhas.',
      });
    }

    const result = await AuthService.generateNewPassword(id);

    if (result.error) {
      return res.status(400).json({
        error: result.error.message,
      });
    }

    return res.json({
      message: 'Nova senha gerada com sucesso',
      password: result.password,
    });
  } catch (error) {
    console.error('Erro ao gerar nova senha:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
});

export default router;