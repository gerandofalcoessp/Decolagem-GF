import { logger } from '../utils/logger.js';
export const requestLogger = (req, res, next) => {
    // Capturar o tempo de início da requisição
    req.startTime = Date.now();
    // Capturar informações da requisição
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';
    // Tentar extrair userId do token se disponível
    let userId;
    try {
        // Assumindo que o userId está disponível em req.user após autenticação
        userId = req.user?.id;
    }
    catch (error) {
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
    // Logar quando a resposta for finalizada (não intercepta res.send/res.json)
    res.on('finish', () => {
        const duration = req.startTime ? `${Date.now() - req.startTime}ms` : 'unknown';
        const statusCode = res.statusCode;
        try {
            if (statusCode >= 400) {
                logger.logHttpError(method, originalUrl, statusCode, new Error(`HTTP ${statusCode}`), userId, ip);
            }
            else {
                logger.logHttpRequest(method, originalUrl, statusCode, duration, userId, ip, userAgent);
            }
        }
        catch (logErr) {
            // Nunca permitir que erros de logging quebrem a resposta
            const msg = logErr instanceof Error ? logErr.message : String(logErr);
            console.error('[requestLogger] Failed to log response:', msg);
        }
    });
    next();
};
export default requestLogger;
