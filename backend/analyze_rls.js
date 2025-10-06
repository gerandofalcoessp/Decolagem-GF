import { createClient } from '@supabase/supabase-js';

async function analyzeDatabase() {
  try {
    console.log('🔍 Analisando estrutura do banco e políticas RLS...');
    
    const supabase = createClient(
      'https://ldfldwfvspclsnpgjgmv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE'
    );
    
    // Verificar tabelas conhecidas
    console.log('\n🔄 Verificando tabelas conhecidas...');
    const knownTables = ['goals', 'members', 'usuarios', 'activities'];
    const existingTables = [];
    
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log('✅ Tabela encontrada:', tableName);
          existingTables.push(tableName);
        } else {
          console.log('❌ Erro na tabela', tableName, ':', error.message);
        }
      } catch (err) {
        console.log('❌ Tabela não encontrada:', tableName);
      }
    }
    
    console.log('\n📋 Tabelas existentes:', existingTables);
    
    // Verificar estrutura da tabela members para entender roles
    console.log('\n👥 Verificando estrutura da tabela members...');
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(5);
    
    if (!membersError && membersData) {
      console.log('Primeiros 5 registros da tabela members:');
      membersData.forEach((member, index) => {
        console.log(`Member ${index + 1}:`, {
          id: member.id,
          role: member.role,
          email: member.email || 'N/A',
          name: member.name || 'N/A'
        });
      });
    } else {
      console.log('Erro ao buscar members:', membersError?.message);
    }
    
    // Verificar estrutura da tabela goals
    console.log('\n🎯 Verificando estrutura da tabela goals...');
    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .limit(3);
    
    if (!goalsError && goalsData) {
      console.log('Primeiros 3 registros da tabela goals:');
      goalsData.forEach((goal, index) => {
        console.log(`Goal ${index + 1}:`, {
          id: goal.id,
          member_id: goal.member_id,
          title: goal.title,
          created_at: goal.created_at
        });
      });
    } else {
      console.log('Erro ao buscar goals:', goalsError?.message);
    }
    
    console.log('\n✅ Análise concluída!');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  }
}

analyzeDatabase();