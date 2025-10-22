const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];
class Logger {
    constructor() {
        this.logLevel = 'info';
        // Definir nível de log baseado no ambiente
        const env = process.env.NODE_ENV || 'development';
        this.logLevel = env === 'production' ? 'warn' : 'debug';
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    shouldLog(level) {
        const levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        return levels[level] <= levels[this.logLevel];
    }
    formatLog(entry) {
        const { timestamp, level, message, context, userId, action, resource, error, duration, ip, userAgent, method, url, statusCode } = entry;
        const logData = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...(userId && { userId }),
            ...(action && { action }),
            ...(resource && { resource }),
            ...(duration && { duration }),
            ...(ip && { ip }),
            ...(userAgent && { userAgent }),
            ...(method && { method }),
            ...(url && { url }),
            ...(statusCode && { statusCode }),
            ...(context && { context }),
            ...(error && { error })
        };
        return JSON.stringify(logData);
    }
    log(level, message, meta) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta
        };
        const formattedLog = this.formatLog(entry);
        // Em produção, você pode enviar para um serviço de logging como Winston, Pino, etc.
        // Por enquanto, vamos usar console com diferentes níveis
        switch (level) {
            case 'error':
                console.error(formattedLog);
                break;
            case 'warn':
                console.warn(formattedLog);
                break;
            case 'info':
                console.info(formattedLog);
                break;
            case 'debug':
                console.debug(formattedLog);
                break;
        }
    }
    error(message, meta) {
        this.log('error', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    // Métodos específicos para ações de negócio
    logMemberAction(action, userId, context, error) {
        const meta = {
            userId,
            action,
            resource: 'member',
            context,
            ...(error && {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            })
        };
        if (error) {
            this.error(`Member action failed: ${action}`, meta);
        }
        else {
            this.info(`Member action completed: ${action}`, meta);
        }
    }
    logDuplicateAttempt(userId, resource, context) {
        this.warn('Duplicate creation attempt detected', {
            userId,
            action: 'create_duplicate',
            resource,
            context: {
                ...context,
                reason: 'unique_constraint_violation'
            }
        });
    }
    logSecurityEvent(event, userId, context) {
        this.warn(`Security event: ${event}`, {
            userId,
            action: 'security_event',
            context
        });
    }
    // Novos métodos para logging de requisições HTTP
    logHttpRequest(method, url, statusCode, duration, userId, ip, userAgent) {
        this.info(`HTTP ${method} ${url}`, {
            method,
            url,
            statusCode,
            duration,
            userId,
            ip,
            userAgent,
            action: 'http_request'
        });
    }
    logHttpError(method, url, statusCode, error, userId, ip) {
        this.error(`HTTP ${method} ${url} failed`, {
            method,
            url,
            statusCode,
            userId,
            ip,
            action: 'http_error',
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        });
    }
    // Métodos para logging de operações de banco de dados
    logDatabaseOperation(operation, table, duration, userId, context) {
        this.debug(`Database ${operation} on ${table}`, {
            action: 'database_operation',
            resource: table,
            duration,
            userId,
            context: {
                operation,
                ...context
            }
        });
    }
    logDatabaseError(operation, table, error, userId) {
        this.error(`Database ${operation} on ${table} failed`, {
            action: 'database_error',
            resource: table,
            userId,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        });
    }
    // Métodos para logging de autenticação
    logAuthEvent(event, userId, ip, context) {
        const level = event === 'auth_failure' ? 'warn' : 'info';
        this.log(level, `Authentication event: ${event}`, {
            action: 'auth_event',
            userId,
            ip,
            context: {
                event,
                ...context
            }
        });
    }
    // Métodos para logging de cache
    logCacheOperation(operation, key, duration) {
        this.debug(`Cache ${operation}: ${key}`, {
            action: 'cache_operation',
            resource: 'cache',
            duration,
            context: {
                operation,
                key
            }
        });
    }
}
export const logger = Logger.getInstance();
export default logger;
