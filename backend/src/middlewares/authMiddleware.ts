import { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../services/supabaseClient';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const user = await getUserFromToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Anexa o usuário ao request para uso posterior
  (req as any).user = user;
  next();
}