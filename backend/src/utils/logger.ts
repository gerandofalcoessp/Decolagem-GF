const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
export type LogLevel = typeof LOG_LEVELS[number];

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  action?: string;
  resource?: string;
  duration?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';

  private constructor() {
    // Definir nível de log baseado no ambiente
    const env = process.env.NODE_ENV || 'development';
    this.logLevel = env === 'production' ? 'warn' : 'debug';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    return levels[level] <= levels[this.logLevel];
  }

  private formatLog(entry: LogEntry): string {
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

  private log(level: LogLevel, message: string, meta?: Partial<LogEntry>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
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

  public error(message: string, meta?: Partial<LogEntry>): void {
    this.log('error', message, meta);
  }

  public warn(message: string, meta?: Partial<LogEntry>): void {
    this.log('warn', message, meta);
  }

  public info(message: string, meta?: Partial<LogEntry>): void {
    this.log('info', message, meta);
  }

  public debug(message: string, meta?: Partial<LogEntry>): void {
    this.log('debug', message, meta);
  }

  // Métodos específicos para ações de negócio
  public logMemberAction(action: string, userId: string, context?: Record<string, any>, error?: Error): void {
    const meta: Partial<LogEntry> = {
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
    } else {
      this.info(`Member action completed: ${action}`, meta);
    }
  }

  public logDuplicateAttempt(userId: string, resource: string, context?: Record<string, any>): void {
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

  public logSecurityEvent(event: string, userId?: string, context?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      userId,
      action: 'security_event',
      context
    });
  }

  // Novos métodos para logging de requisições HTTP
  public logHttpRequest(method: string, url: string, statusCode: number, duration: string, userId?: string, ip?: string, userAgent?: string): void {
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

  public logHttpError(method: string, url: string, statusCode: number, error: Error, userId?: string, ip?: string): void {
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
  public logDatabaseOperation(operation: string, table: string, duration?: string, userId?: string, context?: Record<string, any>): void {
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

  public logDatabaseError(operation: string, table: string, error: Error, userId?: string): void {
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
  public logAuthEvent(event: 'login' | 'logout' | 'token_refresh' | 'auth_failure', userId?: string, ip?: string, context?: Record<string, any>): void {
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
  public logCacheOperation(operation: 'hit' | 'miss' | 'set' | 'invalidate', key: string, duration?: string): void {
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