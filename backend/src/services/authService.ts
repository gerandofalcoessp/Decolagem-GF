import { supabaseAdmin, supabase } from './supabaseClient.js';
import { AuthError, User } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: any;
  error: AuthError | null;
}

export interface SignUpData {
  email: string;
  password: string;
  metadata?: {
    nome?: string;
    role?: string;
    tipo?: string;
    regional?: string;
    funcao?: string;
  };
}

// Interface específica para usuários retornados pela função listUsers
export interface ListedUser {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string | null;
  role?: string | null;
  nome?: string | null;
  regional?: string | null;
  tipo?: string | null;
  funcao?: string | null;
  area?: string | null;
  status?: string;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  banned_until?: string | null;
}

export class AuthService {
  /**
   * Realiza login do usuário
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!supabase) {
      return {
        user: null,
        session: null,
        error: new AuthError('Supabase não configurado', 500)
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return {
        user: data.user,
        session: data.session,
        error,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Registra novo usuário (apenas admin pode fazer isso)
   */
  static async signUp(userData: SignUpData): Promise<AuthResponse> {
    if (!supabaseAdmin) {
      return {
        user: null,
        session: null,
        error: new AuthError('Supabase Admin não configurado', 500)
      };
    }

    try {
      const { data, error } = await supabaseAdmin!.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirma o email
        user_metadata: userData.metadata || {},
      });

      if (error) {
        return {
          user: data?.user || null,
          session: null,
          error,
        };
      }

      // Criar entrada na tabela usuarios após criar no Auth
      if (data.user) {
        await this.syncUserToUsuariosTable(data.user.id, {
          email: data.user.email,
          ...userData.metadata
        });
      }

      return {
        user: data.user,
        session: null,
        error,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sincroniza dados do usuário com a tabela usuarios
   */
  static async syncUserToUsuariosTable(authUserId: string, userData: {
    email?: string;
    nome?: string;
    role?: string;
    regional?: string;
    tipo?: string;
    funcao?: string;
  }) {
    try {
      if (!supabaseAdmin) {
        console.error('supabaseAdmin não configurado');
        return;
      }

      // Verificar se o usuário já existe na tabela usuarios
      const { data: existingUser, error: selectError } = await supabaseAdmin!
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Erro ao buscar usuário na tabela usuarios:', selectError);
        return;
      }

      const now = new Date().toISOString();

      if (existingUser) {
        // Atualizar usuário existente
        const updateData: any = {
          updated_at: now,
        };

        if (userData.email) updateData.email = userData.email;
        if (userData.nome) updateData.nome = userData.nome;
        if (userData.role) {
          updateData.permissao = userData.role; // Usar permissao como campo principal
          updateData.role = userData.role; // Manter role por compatibilidade
        }
        if (userData.regional) updateData.regional = userData.regional;
        if (userData.tipo) updateData.tipo = userData.tipo;
        if (userData.funcao) updateData.funcao = userData.funcao;

        const { error: updateError } = await supabaseAdmin!
          .from('usuarios')
          .update(updateData)
          .eq('auth_user_id', authUserId);

        if (updateError) {
          console.error('Erro ao atualizar usuário na tabela usuarios:', updateError);
        } else {
          console.log('✅ Usuário atualizado na tabela usuarios:', authUserId);
        }
      } else {
        // Criar novo usuário
        const insertData = {
          auth_user_id: authUserId,
          email: userData.email || '',
          nome: userData.nome || userData.email?.split('@')[0] || 'Usuário',
          permissao: userData.role || 'user', // Usar permissao como campo principal
          role: userData.role || 'user', // Manter role por compatibilidade
          regional: userData.regional || null,
          tipo: userData.tipo || 'nacional',
          funcao: userData.funcao || null,
          area: userData.regional || null,
          status: 'ativo',
          created_at: now,
          updated_at: now,
        };

        if (!supabaseAdmin) {
          console.error('supabaseAdmin não configurado');
          return;
        }

        const { error: insertError } = await supabaseAdmin!
          .from('usuarios')
          .insert([insertData]);

        if (insertError) {
          console.error('Erro ao criar usuário na tabela usuarios:', insertError);
        } else {
          console.log('✅ Usuário criado na tabela usuarios:', authUserId);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar usuário com tabela usuarios:', error);
    }
  }

  /**
   * Faz logout do usuário
   */
  static async signOut(token: string): Promise<{ error: AuthError | null }> {
    if (!supabase) {
      return { error: new AuthError('Supabase não configurado', 500) };
    }

    try {
      // Define o token na sessão antes de fazer logout
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '', // Não temos refresh token aqui
      });

      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Obtém dados do usuário pelo token
   */
  static async getUserFromToken(token: string): Promise<User | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error) return null;
      return data.user;
    } catch {
      return null;
    }
  }

  /**
   * Gera uma nova senha temporária para um usuário
   */
  static async generateNewPassword(userId: string): Promise<{ password?: string; error: AuthError | null }> {
    if (!supabaseAdmin) {
      return { error: new AuthError('Supabase Admin não configurado', 500) };
    }

    try {
      // Gera uma senha temporária de 8 caracteres
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
      
      const { error } = await supabaseAdmin!.auth.admin.updateUserById(userId, {
        password: tempPassword
      });

      if (error) {
        return { error: new AuthError(error.message, 400) };
      }

      return { password: tempPassword, error: null };
    } catch (error) {
      console.error('Erro ao gerar nova senha:', error);
      return { error: new AuthError('Erro interno do servidor', 500) };
    }
  }

  /**
   * Atualiza senha do usuário
   */
  static async updatePassword(token: string, newPassword: string): Promise<{ error: AuthError | null }> {
    if (!supabase) {
      return { error: new AuthError('Supabase não configurado', 500) };
    }

    try {
      // Define o token na sessão
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      });

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Envia email de recuperação de senha
   */
  static async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    if (!supabase) {
      return { error: new AuthError('Supabase não configurado', 500) };
    }

    try {
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Verifica se o token é válido
   */
  static async verifyToken(token: string): Promise<boolean> {
    const user = await this.getUserFromToken(token);
    return !!user;
  }

  /**
   * Obtém dados do usuário pelo ID do usuário
   */
  static async getMemberData(userId: string) {
    try {
      if (!supabaseAdmin) {
        console.error('supabaseAdmin não configurado');
        return null;
      }

      // Buscar os dados do usuário na tabela usuarios
      const { data: userData, error: userError } = await supabaseAdmin!
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário na tabela usuarios:', userError);
        
        // Fallback: buscar dados do Auth se não encontrar na tabela usuarios
        const { data: authUser, error: authError } = await supabaseAdmin!.auth.admin.getUserById(userId);
        
        if (authError) {
          console.error('Erro ao buscar usuário no Supabase Auth:', authError);
          return null;
        }

        console.log('Usuário não encontrado na tabela usuarios, usando dados do Auth:', userId);
        return {
          id: userId,
          name: authUser.user.user_metadata?.nome || authUser.user.email,
          email: authUser.user.email,
          role: authUser.user.user_metadata?.role || null,
          auth_user_id: userId,
          funcao: authUser.user.user_metadata?.funcao || null,
          area: authUser.user.user_metadata?.regional || null,
          regional: authUser.user.user_metadata?.regional || null,
          tipo: authUser.user.user_metadata?.tipo || null,
          status: 'ativo'
        };
      }

      // Retornar dados da tabela usuarios
      return {
        id: userData.id,
        auth_user_id: userData.auth_user_id,
        name: userData.nome,
        email: userData.email,
        role: userData.permissao || userData.role, // Usar permissao primeiro, fallback para role
        funcao: userData.funcao,
        area: userData.area,
        regional: userData.regional,
        tipo: userData.tipo,
        status: userData.status,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  }

  /**
   * Lista todos os usuários cadastrados
   */
  static async listUsers(): Promise<{ users: ListedUser[]; error: AuthError | null }> {
    try {
      if (!supabaseAdmin) {
        console.error('supabaseAdmin não configurado');
        return { users: [], error: new AuthError('supabaseAdmin não configurado', 500) };
      }

      // Buscar usuários da tabela usuarios
      const { data: usuariosData, error: usuariosError } = await supabaseAdmin!
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (usuariosError) {
        console.error('Erro ao buscar usuários na tabela usuarios:', usuariosError);
        
        // Fallback: buscar do Supabase Auth se a tabela usuarios não estiver disponível
        const { data, error } = await supabaseAdmin!.auth.admin.listUsers();
        
        if (error) {
          console.error('Erro ao listar usuários do Auth:', error);
          return { users: [], error };
        }

        // Mapear os usuários do Auth para o formato esperado
        const users: ListedUser[] = data.users.map(user => ({
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          role: user.user_metadata?.role || null,
          nome: user.user_metadata?.nome || null,
          regional: user.user_metadata?.regional || null,
          tipo: user.user_metadata?.tipo || null,
          funcao: user.user_metadata?.funcao || null,
          email_confirmed_at: user.email_confirmed_at,
          phone_confirmed_at: user.phone_confirmed_at,
          banned_until: (user as any).banned_until || user.user_metadata?.banned_until || null,
        }));

        return { users, error: null };
      }

      // Mapear dados da tabela usuarios para o formato esperado
      const users: ListedUser[] = usuariosData.map(usuario => ({
        id: usuario.auth_user_id,
        email: usuario.email,
        created_at: usuario.created_at,
        updated_at: usuario.updated_at,
        role: usuario.permissao || usuario.role, // Usar permissao primeiro, fallback para role
        nome: usuario.nome,
        regional: usuario.regional,
        tipo: usuario.tipo,
        funcao: usuario.funcao,
        area: usuario.area,
        status: usuario.status,
        // Campos que podem não estar disponíveis na tabela usuarios
        last_sign_in_at: null,
        email_confirmed_at: null,
        phone_confirmed_at: null,
        banned_until: null,
      }));

      return { users, error: null };
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return { users: [], error };
    }
  }

  /**
   * Atualiza senha de um usuário específico (apenas admin)
   */
  static async updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error: AuthError | null }> {
    if (!supabaseAdmin) {
      return { success: false, error: new AuthError('Supabase Admin não configurado', 500) };
    }

    try {
      const { data, error } = await supabaseAdmin!.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        console.error('Erro ao atualizar senha do usuário:', error);
        return { success: false, error: new AuthError(error.message, 400) };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erro ao atualizar senha do usuário:', error);
      return { success: false, error: new AuthError('Erro interno do servidor', 500) };
    }
  }

  /**
   * Atualiza dados de um usuário
   */
  static async updateUser(userId: string, userData: { email?: string; user_metadata?: any }): Promise<{ success: boolean; user?: any; error?: AuthError | any | null }> {
    try {
      if (!supabaseAdmin) {
        console.error('supabaseAdmin não configurado');
        return { success: false, error: new AuthError('supabaseAdmin não configurado', 500) };
      }

      const { data, error } = await supabaseAdmin!.auth.admin.updateUserById(userId, userData);

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        return { success: false, error };
      }

      // Sincronizar com a tabela usuarios
      if (data.user) {
        await this.syncUserToUsuariosTable(data.user.id, {
          email: userData.email,
          ...userData.user_metadata
        });
      }

      return { success: true, user: data.user, error: null };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, error };
    }
  }

  /**
   * Bloqueia um usuário
   */
  static async blockUser(userId: string, duration?: string) {
    try {
      if (!supabaseAdmin) {
        console.error('supabaseAdmin não configurado');
        return { success: false, error: new AuthError('supabaseAdmin não configurado', 500) };
      }

      const banned_until = duration ? new Date(Date.now() + (duration === '24h' ? 24 * 60 * 60 * 1000 : 0)).toISOString() : null;
      const { data, error } = await supabaseAdmin!.auth.admin.updateUserById(userId, {
        user_metadata: { banned_until }
      });

      if (error) {
        console.error('Erro ao bloquear usuário:', error);
        return { success: false, error };
      }

      return { success: true, user: data.user, error: null };
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      return { success: false, error };
    }
  }

  /**
   * Desbloqueia um usuário
   */
  static async unblockUser(userId: string) {
    try {
      if (!supabaseAdmin) {
        console.error('supabaseAdmin não configurado');
        return { success: false, error: new AuthError('supabaseAdmin não configurado', 500) };
      }

      const banned_until = null;
      const { data, error } = await supabaseAdmin!.auth.admin.updateUserById(userId, {
        user_metadata: { banned_until }
      });

      if (error) {
        console.error('Erro ao desbloquear usuário:', error);
        return { success: false, error };
      }

      return { success: true, user: data.user, error: null };
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      return { success: false, error };
    }
  }

  /**
   * Exclui um usuário
   */
  static async deleteUser(userId: string) {
    if (!supabaseAdmin) {
      return { success: false, error: new AuthError('Supabase Admin não configurado', 500) };
    }

    try {
      const admin = supabaseAdmin!;

      // Determinar se o parâmetro é um UUID (auth_user_id) ou um ID numérico da tabela usuarios
      let targetAuthId: string | null = userId;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(userId)) {
        const numericId = Number(userId);
        if (!Number.isFinite(numericId)) {
          return { success: false, error: new AuthError('ID de usuário inválido', 400) };
        }

        // Buscar na tabela usuarios para obter o auth_user_id
        const { data: usuario, error: usuarioErr } = await admin!
          .from('usuarios')
          .select('id, auth_user_id')
          .eq('id', numericId)
          .single();

        if (usuarioErr) {
          console.error('Erro ao localizar usuario para exclusão:', usuarioErr);
          return { success: false, error: new AuthError('Usuário não encontrado', 404) };
        }
        // Se não tiver auth_user_id, seguimos apenas removendo da tabela usuarios
        targetAuthId = (usuario?.auth_user_id as string) || null;
      }

      // Excluir do Supabase Auth (se tivermos auth_user_id)
      if (targetAuthId) {
        const { error: deleteAuthErr } = await admin!.auth.admin.deleteUser(targetAuthId);
        if (deleteAuthErr) {
          console.warn('Falha ao excluir usuário no Auth, prosseguindo com remoção na tabela usuarios:', deleteAuthErr);
          // Não retornar erro aqui; seguimos para remover na tabela usuarios.
        }
      }

      // Remover também da tabela usuarios (obrigatório para sucesso)
      const deleteQuery = admin!
        .from('usuarios')
        .delete();

      if (uuidRegex.test(userId)) {
        // Se userId é um UUID, buscar pelo auth_user_id
        deleteQuery.eq('auth_user_id', userId);
      } else {
        const numericId = Number(userId);
        if (Number.isFinite(numericId)) {
          deleteQuery.eq('id', numericId);
        } else {
          return { success: false, error: new AuthError('Identificador do usuário ausente para remoção na base de dados', 400) };
        }
      }

      const { data: deletedRows, error: deleteUsuarioErr } = await deleteQuery.select('id');
      if (deleteUsuarioErr) {
        console.warn('Falha ao remover usuário da tabela usuarios:', deleteUsuarioErr);
        return { success: false, error: new AuthError('Falha ao remover usuário da base de dados', 500) };
      }
      if (!deletedRows || deletedRows.length === 0) {
        console.warn('Nenhum registro removido da tabela usuarios para o identificador:', userId);
        return { success: false, error: new AuthError('Usuário não encontrado na base de dados', 404) };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return { success: false, error: new AuthError('Erro interno do servidor', 500) };
    }
  }
}