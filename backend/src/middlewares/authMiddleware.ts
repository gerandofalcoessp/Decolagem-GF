import { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../services/supabaseClient.js';
import { AuthService } from '../services/authService.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'unauthorized', details: 'token_missing' });
  }

  const user = await getUserFromToken(token);

  if (!user) {
    return res.status(401).json({ error: 'unauthorized', details: 'invalid_token' });
  }

  // Buscar dados do membro para incluir o role
  const memberData = await AuthService.getMemberData(user.id);

  // Anexa o usuário com dados do membro ao request para uso posterior
  (req as any).user = {
    ...user,
    role: memberData?.role || user.user_metadata?.role || 'user',
    regional: memberData?.regional || user.user_metadata?.regional || null,
    funcao: memberData?.funcao || user.user_metadata?.funcao || null,
    memberData
  };
  
  next();
}

// Middleware de autorização por papel
export function requireRole(required: string | string[]) {
  const allowed = Array.isArray(required) ? required : [required];
  return (req: Request, res: Response, next: NextFunction) => {
    const user: any = (req as any).user;
    const role = user?.role;
    if (!role) {
      return res.status(403).json({ error: 'forbidden', details: 'role_not_defined' });
    }
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: 'forbidden', details: 'insufficient_permissions' });
    }
    next();
  };
}