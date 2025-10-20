const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queries: [],
      connections: 0,
      errors: 0,
      slowQueries: [],
      startTime: Date.now()
    };
    this.thresholds = {
      slowQueryMs: 1000, // Queries acima de 1s são consideradas lentas
      maxConnections: 100,
      errorRate: 0.05 // 5% de taxa de erro
    };
  }

  async startMonitoring(intervalMs = 30000) {
    console.log('🔍 Iniciando monitoramento de performance...');
    console.log(`📊 Intervalo de verificação: ${intervalMs/1000}s`);
    console.log(`⚠️ Threshold para queries lentas: ${this.thresholds.slowQueryMs}ms\n`);

    setInterval(async () => {
      await this.collectMetrics();
      this.displayMetrics();
    }, intervalMs);

    // Primeira coleta imediata
    await this.collectMetrics();
    this.displayMetrics();
  }

  async collectMetrics() {
    const startTime = Date.now();
    
    try {
      // 1. Verificar conexões ativas
      await this.checkActiveConnections();
      
      // 2. Verificar queries lentas
      await this.checkSlowQueries();
      
      // 3. Testar performance de queries comuns
      await this.testCommonQueries();
      
      // 4. Verificar status do RLS
      await this.checkRLSStatus();
      
    } catch (error) {
      this.metrics.errors++;
      console.error('❌ Erro durante coleta de métricas:', error.message);
    }
  }

  async checkActiveConnections() {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections,
            count(*) FILTER (WHERE state = 'idle') as idle_connections
          FROM pg_stat_activity 
          WHERE datname = current_database();
        `
      });

      if (!error && data) {
        this.metrics.connections = data.total_connections || 0;
      }
    } catch (err) {
      console.warn('⚠️ Não foi possível verificar conexões:', err.message);
    }
  }

  async checkSlowQueries() {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            query,
            mean_exec_time,
            calls,
            total_exec_time
          FROM pg_stat_statements 
          WHERE mean_exec_time > ${this.thresholds.slowQueryMs}
          ORDER BY mean_exec_time DESC 
          LIMIT 5;
        `
      });

      if (!error && data) {
        this.metrics.slowQueries = data || [];
      }
    } catch (err) {
      // pg_stat_statements pode não estar habilitado
      console.warn('⚠️ pg_stat_statements não disponível');
    }
  }

  async testCommonQueries() {
    const queries = [
      {
        name: 'regional_activities_select',
        query: () => supabase.from('regional_activities').select('*').limit(10)
      },
      {
        name: 'members_select',
        query: () => supabase.from('members').select('*').limit(10)
      },
      {
        name: 'calendar_events_select',
        query: () => supabase.from('calendar_events').select('*').limit(10)
      },
      {
        name: 'goals_select',
        query: () => supabase.from('goals').select('*').limit(10)
      }
    ];

    for (const test of queries) {
      const startTime = Date.now();
      try {
        const { data, error } = await test.query();
        const duration = Date.now() - startTime;
        
        this.metrics.queries.push({
          name: test.name,
          duration,
          success: !error,
          timestamp: new Date(),
          recordCount: data?.length || 0
        });

        if (duration > this.thresholds.slowQueryMs) {
          this.metrics.slowQueries.push({
            name: test.name,
            duration,
            timestamp: new Date()
          });
        }

      } catch (err) {
        this.metrics.errors++;
        this.metrics.queries.push({
          name: test.name,
          duration: Date.now() - startTime,
          success: false,
          error: err.message,
          timestamp: new Date()
        });
      }
    }

    // Manter apenas os últimos 100 registros
    if (this.metrics.queries.length > 100) {
      this.metrics.queries = this.metrics.queries.slice(-100);
    }
  }

  async checkRLSStatus() {
    try {
      const tables = ['regional_activities', 'members', 'calendar_events', 'goals'];
      
      for (const table of tables) {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: `
            SELECT 
              schemaname,
              tablename,
              rowsecurity as rls_enabled
            FROM pg_tables 
            WHERE tablename = '${table}' AND schemaname = 'public';
          `
        });

        if (error) {
          console.warn(`⚠️ Erro ao verificar RLS para ${table}:`, error.message);
        }
      }
    } catch (err) {
      console.warn('⚠️ Erro ao verificar status do RLS:', err.message);
    }
  }

  displayMetrics() {
    const now = new Date();
    const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);
    
    console.clear();
    console.log('🔍 MONITOR DE PERFORMANCE - SUPABASE');
    console.log('=' .repeat(60));
    console.log(`⏰ ${now.toLocaleString('pt-BR')}`);
    console.log(`🕐 Uptime: ${uptime}s`);
    console.log('');

    // Métricas gerais
    console.log('📊 MÉTRICAS GERAIS:');
    console.log(`   Conexões ativas: ${this.metrics.connections}`);
    console.log(`   Total de queries: ${this.metrics.queries.length}`);
    console.log(`   Erros: ${this.metrics.errors}`);
    console.log('');

    // Queries recentes
    const recentQueries = this.metrics.queries.slice(-5);
    if (recentQueries.length > 0) {
      console.log('🔄 QUERIES RECENTES:');
      recentQueries.forEach(q => {
        const status = q.success ? '✅' : '❌';
        const duration = q.duration.toString().padStart(4, ' ');
        console.log(`   ${status} ${q.name.padEnd(25, ' ')} ${duration}ms ${q.recordCount || 0} registros`);
      });
      console.log('');
    }

    // Queries lentas
    const recentSlowQueries = this.metrics.slowQueries.slice(-3);
    if (recentSlowQueries.length > 0) {
      console.log('🐌 QUERIES LENTAS:');
      recentSlowQueries.forEach(q => {
        console.log(`   ⚠️ ${q.name}: ${q.duration}ms`);
      });
      console.log('');
    }

    // Performance média
    if (this.metrics.queries.length > 0) {
      const avgDuration = this.metrics.queries
        .filter(q => q.success)
        .reduce((sum, q) => sum + q.duration, 0) / 
        this.metrics.queries.filter(q => q.success).length;
      
      const successRate = this.metrics.queries.filter(q => q.success).length / 
        this.metrics.queries.length;

      console.log('📈 PERFORMANCE MÉDIA:');
      console.log(`   Tempo médio: ${Math.round(avgDuration)}ms`);
      console.log(`   Taxa de sucesso: ${Math.round(successRate * 100)}%`);
      console.log('');
    }

    // Alertas
    this.checkAlerts();
  }

  checkAlerts() {
    const alerts = [];

    if (this.metrics.connections > this.thresholds.maxConnections) {
      alerts.push(`🚨 Muitas conexões ativas: ${this.metrics.connections}`);
    }

    const recentQueries = this.metrics.queries.slice(-10);
    const errorRate = recentQueries.filter(q => !q.success).length / recentQueries.length;
    if (errorRate > this.thresholds.errorRate) {
      alerts.push(`🚨 Alta taxa de erro: ${Math.round(errorRate * 100)}%`);
    }

    const recentSlowQueries = this.metrics.slowQueries.filter(
      q => Date.now() - q.timestamp.getTime() < 60000 // últimos 60s
    );
    if (recentSlowQueries.length > 3) {
      alerts.push(`🚨 Muitas queries lentas recentes: ${recentSlowQueries.length}`);
    }

    if (alerts.length > 0) {
      console.log('🚨 ALERTAS:');
      alerts.forEach(alert => console.log(`   ${alert}`));
      console.log('');
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date(),
      uptime: Math.floor((Date.now() - this.metrics.startTime) / 1000),
      totalQueries: this.metrics.queries.length,
      errors: this.metrics.errors,
      connections: this.metrics.connections,
      slowQueries: this.metrics.slowQueries.length,
      averageResponseTime: this.metrics.queries.length > 0 ? 
        this.metrics.queries.reduce((sum, q) => sum + q.duration, 0) / this.metrics.queries.length : 0
    };

    console.log('\n📋 RELATÓRIO DE PERFORMANCE:');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  }
}

// Iniciar monitoramento se executado diretamente
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  
  // Capturar Ctrl+C para gerar relatório final
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Parando monitoramento...');
    await monitor.generateReport();
    process.exit(0);
  });

  // Iniciar monitoramento (verificar a cada 30 segundos)
  monitor.startMonitoring(30000);
}

module.exports = PerformanceMonitor;