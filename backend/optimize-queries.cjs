const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class QueryOptimizer {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Cache para metadados de tabelas (evita queries repetitivas em information_schema)
  async getTableStructure(tableName, useCache = true) {
    const cacheKey = `table_structure_${tableName}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📋 Usando cache para estrutura da tabela ${tableName}`);
        return cached.data;
      }
    }

    console.log(`🔍 Buscando estrutura da tabela ${tableName}...`);
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position;
      `,
      params: [tableName]
    });

    if (error) {
      console.error(`❌ Erro ao buscar estrutura da tabela ${tableName}:`, error);
      return null;
    }

    // Armazenar no cache
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Cache para lista de tabelas
  async getAllTables(useCache = true) {
    const cacheKey = 'all_tables';
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📋 Usando cache para lista de tabelas');
        return cached.data;
      }
    }

    console.log('🔍 Buscando lista de todas as tabelas...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });

    if (error) {
      console.error('❌ Erro ao buscar lista de tabelas:', error);
      return null;
    }

    // Armazenar no cache
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Otimização: usar SELECT com LIMIT 0 para detectar estrutura sem dados
  async getTableStructureFromSelect(tableName) {
    console.log(`🔍 Detectando estrutura da tabela ${tableName} via SELECT...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error) {
      console.error(`❌ Erro ao detectar estrutura via SELECT para ${tableName}:`, error);
      return null;
    }

    // Retorna apenas os nomes das colunas (mais rápido que information_schema)
    return data ? Object.keys(data[0] || {}) : [];
  }

  // Verificar se uma coluna existe sem fazer query completa
  async columnExists(tableName, columnName, useCache = true) {
    const structure = await this.getTableStructure(tableName, useCache);
    if (!structure) return false;
    
    return structure.some(col => col.column_name === columnName);
  }

  // Batch de verificações de colunas
  async checkMultipleColumns(tableName, columnNames, useCache = true) {
    const structure = await this.getTableStructure(tableName, useCache);
    if (!structure) return {};
    
    const existingColumns = structure.map(col => col.column_name);
    const result = {};
    
    columnNames.forEach(colName => {
      result[colName] = existingColumns.includes(colName);
    });
    
    return result;
  }

  // Otimização para verificar existência de tabela
  async tableExists(tableName, useCache = true) {
    const tables = await this.getAllTables(useCache);
    if (!tables) return false;
    
    return tables.some(table => table.table_name === tableName);
  }

  // Limpar cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache limpo');
  }

  // Estatísticas do cache
  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      entries: []
    };

    this.cache.forEach((value, key) => {
      const age = Date.now() - value.timestamp;
      stats.entries.push({
        key,
        age: Math.round(age / 1000), // em segundos
        expired: age > this.cacheTimeout
      });
    });

    return stats;
  }

  // Demonstração de otimizações
  async demonstrateOptimizations() {
    console.log('🚀 DEMONSTRAÇÃO DE OTIMIZAÇÕES DE QUERIES\n');

    // 1. Comparar busca de estrutura com e sem cache
    console.log('1️⃣ Teste de cache para estrutura de tabela:');
    
    const startTime1 = Date.now();
    await this.getTableStructure('regional_activities', false); // sem cache
    const timeWithoutCache = Date.now() - startTime1;
    
    const startTime2 = Date.now();
    await this.getTableStructure('regional_activities', true); // com cache
    const timeWithCache = Date.now() - startTime2;
    
    console.log(`   Sem cache: ${timeWithoutCache}ms`);
    console.log(`   Com cache: ${timeWithCache}ms`);
    console.log(`   Economia: ${Math.round(((timeWithoutCache - timeWithCache) / timeWithoutCache) * 100)}%\n`);

    // 2. Verificação batch de colunas
    console.log('2️⃣ Verificação batch de colunas:');
    const columnsToCheck = ['id', 'title', 'description', 'activity_date', 'regional', 'nonexistent_column'];
    
    const startTime3 = Date.now();
    const columnResults = await this.checkMultipleColumns('regional_activities', columnsToCheck);
    const batchTime = Date.now() - startTime3;
    
    console.log(`   Verificação de ${columnsToCheck.length} colunas: ${batchTime}ms`);
    console.log('   Resultados:', columnResults);
    console.log('');

    // 3. Comparar detecção de estrutura via SELECT vs information_schema
    console.log('3️⃣ Comparação de métodos para detectar estrutura:');
    
    const startTime4 = Date.now();
    const structureViaSchema = await this.getTableStructure('regional_activities', false);
    const schemaTime = Date.now() - startTime4;
    
    const startTime5 = Date.now();
    const structureViaSelect = await this.getTableStructureFromSelect('regional_activities');
    const selectTime = Date.now() - startTime5;
    
    console.log(`   Via information_schema: ${schemaTime}ms (${structureViaSchema?.length || 0} colunas)`);
    console.log(`   Via SELECT LIMIT 0: ${selectTime}ms (${structureViaSelect?.length || 0} colunas)`);
    console.log(`   SELECT é ${Math.round(schemaTime / selectTime)}x mais rápido\n`);

    // 4. Estatísticas do cache
    console.log('4️⃣ Estatísticas do cache:');
    const cacheStats = this.getCacheStats();
    console.log(`   Entradas no cache: ${cacheStats.totalEntries}`);
    cacheStats.entries.forEach(entry => {
      const status = entry.expired ? '❌ expirado' : '✅ válido';
      console.log(`   - ${entry.key}: ${entry.age}s ${status}`);
    });
  }

  // Recomendações de otimização
  async generateOptimizationRecommendations() {
    console.log('\n📋 RECOMENDAÇÕES DE OTIMIZAÇÃO:\n');

    const recommendations = [
      {
        title: 'Connection Pooling',
        description: 'Implementar connection pooling no Supabase client',
        implementation: `
// No supabaseClient.ts, adicionar configurações de pool:
export const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});`,
        impact: 'Alto - Reduz latência e melhora throughput'
      },
      {
        title: 'Cache de Metadados',
        description: 'Implementar cache para queries de information_schema',
        implementation: `
// Usar este QueryOptimizer em produção
const optimizer = new QueryOptimizer();
const structure = await optimizer.getTableStructure('tableName'); // usa cache automaticamente`,
        impact: 'Médio - Reduz queries repetitivas de metadados'
      },
      {
        title: 'Índices Otimizados',
        description: 'Criar índices para queries frequentes',
        implementation: `
-- Para regional_activities
CREATE INDEX IF NOT EXISTS idx_regional_activities_date_regional 
ON regional_activities(activity_date, regional);

-- Para members
CREATE INDEX IF NOT EXISTS idx_members_auth_id 
ON members(auth_user_id) WHERE auth_user_id IS NOT NULL;`,
        impact: 'Alto - Acelera queries de filtro e join'
      },
      {
        title: 'Prepared Statements',
        description: 'Usar prepared statements para queries repetitivas',
        implementation: `
// Em vez de concatenar SQL, usar parâmetros
const { data } = await supabase.rpc('get_activities_by_date_range', {
  start_date: startDate,
  end_date: endDate,
  regional_filter: regional
});`,
        impact: 'Médio - Melhora performance e segurança'
      },
      {
        title: 'Lazy Loading',
        description: 'Implementar carregamento sob demanda para dados grandes',
        implementation: `
// Carregar apenas campos necessários inicialmente
const { data } = await supabase
  .from('regional_activities')
  .select('id, title, activity_date, regional')
  .range(0, 49); // paginação

// Carregar detalhes apenas quando necessário
const { data: details } = await supabase
  .from('regional_activities')
  .select('description, evidencias, documentos')
  .eq('id', activityId)
  .single();`,
        impact: 'Alto - Reduz tempo de carregamento inicial'
      }
    ];

    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}️⃣ ${rec.title}`);
      console.log(`   📝 ${rec.description}`);
      console.log(`   📈 Impacto: ${rec.impact}`);
      console.log(`   💻 Implementação:${rec.implementation}`);
      console.log('');
    });
  }
}

// Executar demonstração se chamado diretamente
if (require.main === module) {
  const optimizer = new QueryOptimizer();
  
  optimizer.demonstrateOptimizations()
    .then(() => optimizer.generateOptimizationRecommendations())
    .catch(console.error);
}

module.exports = QueryOptimizer;