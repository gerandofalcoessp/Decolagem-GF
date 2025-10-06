const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkGoals() {
  try {
    console.log('Verificando conexão com Supabase...');
    
    // Verificar se conseguimos conectar ao Supabase
    const { data: testData, error: testError } = await supabase
      .from('goals')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('Erro de conexão:', testError);
      return;
    }
    
    console.log(`Conexão OK. Total de metas: ${testData || 0}`);
    
    // Listar todas as tabelas disponíveis (se possível)
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (!tablesError && tables) {
      console.log('Tabelas disponíveis:', tables);
    }
    
    // Tentar buscar metas
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Erro ao buscar metas:', error);
      return;
    }
    
    if (!goals || goals.length === 0) {
      console.log('Nenhuma meta encontrada na tabela goals.');
      
      // Tentar outras possíveis tabelas
      const possibleTables = ['metas', 'goal', 'meta'];
      for (const table of possibleTables) {
        try {
          const { data: altData, error: altError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!altError && altData && altData.length > 0) {
            console.log(`Encontradas metas na tabela: ${table}`);
            console.log('Primeira meta:', altData[0]);
          }
        } catch (e) {
          // Tabela não existe, continuar
        }
      }
      return;
    }
    
    console.log(`\nTotal de metas encontradas: ${goals.length}`);
    goals.forEach((goal, index) => {
      console.log(`\n${index + 1}. ID: ${goal.id}`);
      console.log(`   Nome: ${goal.nome}`);
      console.log(`   Descrição: ${goal.descricao}`);
      console.log(`   Campos completos:`, Object.keys(goal));
      
      // Extrair regionais da descrição
      const regionaisMatch = goal.descricao?.match(/(?:área|áreas):\s*([^|,\n]+)/i);
      if (regionaisMatch) {
        console.log(`   Regionais extraídas: "${regionaisMatch[1].trim()}"`);
      } else {
        console.log('   Nenhuma regional encontrada na descrição');
      }
    });
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

checkGoals();