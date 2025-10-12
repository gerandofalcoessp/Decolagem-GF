import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestWithStartTime extends Request {
  startTime?: number;
}

export const requestLogger = (req: RequestWithStartTime, res: Response, next: NextFunction) => {
  // Capturar o tempo de início da requisição
  req.startTime = Date.now();

  // Capturar informações da requisição
  const { method, originalUrl, ip, headers } = req;
  const userAgent = headers['user-agent'] || 'Unknown';
  
  // Tentar extrair userId do token se disponível
  let userId: string | undefined;
  try {
    // Assumindo que o userId está disponível em req.user após autenticação
    userId = (req as any).user?.id;
  } catch (error) {
    // Ignorar erros na extração do userId
  }

  // Log da requisição inicial
  logger.debug(`Incoming request: ${method} ${originalUrl}`, {
    method,
    url: originalUrl,
    ip,
    userAgent,
    userId,
    action: 'request_start'
  });

  // Interceptar a resposta para logar quando ela for enviada
  const originalSend = res.send;
  res.send = function(body) {
    const duration = req.startTime ? `${Date.now() - req.startTime}ms` : 'unknown';
    const statusCode = res.statusCode;

    // Log da resposta
    if (statusCode >= 400) {
      logger.logHttpError(method, originalUrl, statusCode, new Error(`HTTP ${statusCode}`), userId, ip);
    } else {
      logger.logHttpRequest(method, originalUrl, statusCode, duration, userId, ip, userAgent);
    }

    return originalSend.call(this, body);
  };

  next();
};

export default requestLogger;