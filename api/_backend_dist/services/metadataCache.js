import { supabaseAdmin } from './supabaseClient';
class MetadataCache {
    constructor() {
        this.tableCache = new Map();
        this.columnCache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutos em produção
        this.DEV_CACHE_TTL = 30 * 1000; // 30 segundos em desenvolvimento
    }
    getCacheTTL() {
        return process.env.NODE_ENV === 'production' ? this.CACHE_TTL : this.DEV_CACHE_TTL;
    }
    isExpired(lastChecked) {
        return Date.now() - lastChecked > this.getCacheTTL();
    }
    /**
     * Verifica se uma tabela existe, usando cache quando possível
     */
    async tableExists(tableName) {
        const cacheKey = tableName.toLowerCase();
        const cached = this.tableCache.get(cacheKey);
        if (cached && !this.isExpired(cached.lastChecked)) {
            return cached.exists;
        }
        try {
            if (!supabaseAdmin) {
                console.warn('[MetadataCache] supabaseAdmin não disponível');
                return false;
            }
            const { data, error } = await supabaseAdmin
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .eq('table_name', tableName)
                .single();
            const exists = !error && !!data;
            // Atualiza o cache
            this.tableCache.set(cacheKey, {
                tableName,
                columns: [],
                exists,
                lastChecked: Date.now()
            });
            return exists;
        }
        catch (error) {
            console.error(`[MetadataCache] Erro ao verificar tabela ${tableName}:`, error);
            return false;
        }
    }
    /**
     * Verifica se uma coluna existe em uma tabela, usando cache quando possível
     */
    async columnExists(tableName, columnName) {
        const cacheKey = `${tableName.toLowerCase()}.${columnName.toLowerCase()}`;
        const cached = this.columnCache.get(cacheKey);
        if (cached && !this.isExpired(cached.lastChecked)) {
            return cached.exists;
        }
        try {
            if (!supabaseAdmin) {
                console.warn('[MetadataCache] supabaseAdmin não disponível');
                return false;
            }
            const { data, error } = await supabaseAdmin
                .from('information_schema.columns')
                .select('column_name, data_type')
                .eq('table_schema', 'public')
                .eq('table_name', tableName)
                .eq('column_name', columnName)
                .single();
            const exists = !error && !!data;
            // Atualiza o cache
            this.columnCache.set(cacheKey, {
                tableName,
                columnName,
                dataType: data?.data_type || '',
                exists,
                lastChecked: Date.now()
            });
            return exists;
        }
        catch (error) {
            console.error(`[MetadataCache] Erro ao verificar coluna ${tableName}.${columnName}:`, error);
            return false;
        }
    }
    /**
     * Obtém todas as colunas de uma tabela, usando cache quando possível
     */
    async getTableColumns(tableName) {
        const cacheKey = tableName.toLowerCase();
        const cached = this.tableCache.get(cacheKey);
        if (cached && cached.columns.length > 0 && !this.isExpired(cached.lastChecked)) {
            return cached.columns;
        }
        try {
            if (!supabaseAdmin) {
                console.warn('[MetadataCache] supabaseAdmin não disponível');
                return [];
            }
            const { data, error } = await supabaseAdmin
                .from('information_schema.columns')
                .select('column_name')
                .eq('table_schema', 'public')
                .eq('table_name', tableName)
                .order('ordinal_position');
            if (error || !data) {
                console.error(`[MetadataCache] Erro ao obter colunas da tabela ${tableName}:`, error);
                return [];
            }
            const columns = data.map(row => row.column_name);
            // Atualiza o cache
            this.tableCache.set(cacheKey, {
                tableName,
                columns,
                exists: columns.length > 0,
                lastChecked: Date.now()
            });
            return columns;
        }
        catch (error) {
            console.error(`[MetadataCache] Erro ao obter colunas da tabela ${tableName}:`, error);
            return [];
        }
    }
    /**
     * Limpa o cache (útil para testes ou quando há mudanças no schema)
     */
    clearCache() {
        this.tableCache.clear();
        this.columnCache.clear();
        console.log('[MetadataCache] Cache limpo');
    }
    /**
     * Obtém estatísticas do cache
     */
    getCacheStats() {
        return {
            tables: this.tableCache.size,
            columns: this.columnCache.size,
            ttl: this.getCacheTTL()
        };
    }
    /**
     * Pré-carrega metadados das tabelas principais
     */
    async preloadMainTables() {
        const mainTables = [
            'regional_activities',
            'instituicoes',
            'goals',
            'usuarios',
            'members'
        ];
        console.log('[MetadataCache] Pré-carregando metadados das tabelas principais...');
        const promises = mainTables.map(async (tableName) => {
            try {
                await this.tableExists(tableName);
                await this.getTableColumns(tableName);
            }
            catch (error) {
                console.error(`[MetadataCache] Erro ao pré-carregar ${tableName}:`, error);
            }
        });
        await Promise.allSettled(promises);
        console.log('[MetadataCache] Pré-carregamento concluído');
    }
}
// Instância singleton do cache
export const metadataCache = new MetadataCache();
// Pré-carrega os metadados na inicialização (apenas em produção)
if (process.env.NODE_ENV === 'production') {
    metadataCache.preloadMainTables().catch(error => {
        console.error('[MetadataCache] Erro no pré-carregamento:', error);
    });
}
