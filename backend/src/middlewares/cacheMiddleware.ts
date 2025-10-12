import { Request, Response, NextFunction } from 'express';

interface CacheOptions {
  ttl?: number; // Time to live em segundos
  key?: (req: Request) => string; // Função para gerar chave personalizada
  skipCache?: (req: Request) => boolean; // Função para pular cache
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpar cache expirado a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Converter para millisegundos
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Instância global do cache
const memoryCache = new MemoryCache();

/**
 * Middleware de cache em memória para APIs
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutos por padrão
    key = (req: Request) => `${req.method}:${req.originalUrl}`,
    skipCache = () => false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Pular cache se especificado
    if (skipCache(req)) {
      return next();
    }

    // Apenas cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = key(req);
    const cachedData = memoryCache.get(cacheKey);

    if (cachedData) {
      console.log(`🎯 Cache hit para: ${cacheKey}`);
      return res.json(cachedData);
    }

    // Interceptar a resposta para cachear
    const originalJson = res.json;
    res.json = function(data: any) {
      // Apenas cachear respostas de sucesso
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`💾 Cacheando resposta para: ${cacheKey}`);
        memoryCache.set(cacheKey, data, ttl);
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware para invalidar cache baseado em padrões
 */
export const invalidateCacheMiddleware = (patterns: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Interceptar resposta para invalidar cache após operações de escrita
    const originalJson = res.json;
    res.json = function(data: any) {
      // Apenas invalidar em operações de sucesso
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          // Invalidar entradas que correspondem ao padrão
          for (const [key] of memoryCache['cache'].entries()) {
            if (key.includes(pattern)) {
              console.log(`🗑️ Invalidando cache: ${key}`);
              memoryCache.delete(key);
            }
          }
        });
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Utilitário para limpar cache manualmente
 */
export const clearCache = (pattern?: string): void => {
  if (pattern) {
    for (const [key] of memoryCache['cache'].entries()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }
  } else {
    memoryCache.clear();
  }
};

// Limpar cache ao encerrar aplicação
process.on('SIGINT', () => {
  memoryCache.destroy();
});

process.on('SIGTERM', () => {
  memoryCache.destroy();
});