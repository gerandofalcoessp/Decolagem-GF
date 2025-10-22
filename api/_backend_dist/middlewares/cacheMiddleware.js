class MemoryCache {
    constructor() {
        this.cache = new Map();
        // Limpar cache expirado a cada 5 minutos
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    set(key, data, ttl) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl * 1000, // Converter para millisegundos
        });
    }
    get(key) {
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
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }
    destroy() {
        clearInterval(this.cleanupInterval);
        this.clear();
    }
}
// Instância global do cache
const memoryCache = new MemoryCache();
/**
 * Middleware de cache em memória para APIs
 */
export const cacheMiddleware = (options = {}) => {
    const { ttl = 300, // 5 minutos por padrão
    key = (req) => `${req.method}:${req.originalUrl}`, skipCache = () => false, } = options;
    return (req, res, next) => {
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
        res.json = function (data) {
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
export const invalidateCacheMiddleware = (patterns) => {
    return (req, res, next) => {
        // Interceptar resposta para invalidar cache após operações de escrita
        const originalJson = res.json;
        res.json = function (data) {
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
export const clearCache = (pattern) => {
    if (pattern) {
        for (const [key] of memoryCache['cache'].entries()) {
            if (key.includes(pattern)) {
                memoryCache.delete(key);
            }
        }
    }
    else {
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
