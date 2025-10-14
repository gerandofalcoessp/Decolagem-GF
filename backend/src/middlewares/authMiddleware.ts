import { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../services/supabaseClient.js';
import { AuthService } from '../services/authService.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log('🔍 [AuthMiddleware] Iniciando validação de autenticação');
  console.log('📋 [AuthMiddleware] Headers recebidos:', req.headers);
  
  const authHeader = req.headers.authorization;
  console.log('🔑 [AuthMiddleware] Authorization header:', authHeader);
  
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  console.log('🎫 [AuthMiddleware] Token extraído:', token ? `${token.substring(0, 20)}...` : 'NENHUM TOKEN');

  if (!token) {
    console.log('❌ [AuthMiddleware] Nenhum token fornecido');
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const user = await getUserFromToken(token);
  console.log('👤 [AuthMiddleware] Usuário obtido do token:', user ? `ID: ${user.id}, Email: ${user.email}` : 'NENHUM USUÁRIO');

  if (!user) {
    console.log('❌ [AuthMiddleware] Token inválido ou usuário não encontrado');
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Buscar dados do membro para incluir o role
  const memberData = await AuthService.getMemberData(user.id);
  console.log('👥 [AuthMiddleware] Dados do membro:', memberData);
  console.log('🔍 [AuthMiddleware] User metadata:', user.user_metadata);

  // Anexa o usuário com dados do membro ao request para uso posterior
  (req as any).user = {
    ...user,
    role: memberData?.role || user.user_metadata?.role || null,
    regional: memberData?.regional || user.user_metadata?.regional || null,
    funcao: memberData?.funcao || user.user_metadata?.funcao || null,
    memberData
  };
  
  console.log('🎯 [AuthMiddleware] User final com regional:', (req as any).user.regional);
  console.log('✅ [AuthMiddleware] Autenticação bem-sucedida, prosseguindo...');
  next();
}