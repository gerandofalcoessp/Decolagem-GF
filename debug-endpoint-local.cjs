const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarEndpointLocal() {
  try {
    console.log('🔍 Testando consulta direta à tabela regional_activities...\n');
    
    // Simular exatamente o que o endpoint /api/atividades faz (sem o join que está causando erro)
    const { data, error } = await supabase
      .from('regional_activities')
      .select('*');
      
    if (error) {
      console.error('❌ Erro na consulta:', error.message);
      return;
    }

    console.log(`📊 Total de registros encontrados: ${data?.length || 0}\n`);

    if (data && data.length > 0) {
      // Mapear os dados exatamente como o endpoint faz (sem responsavel)
      const mappedData = data.map(activity => ({
        id: activity.id,
        titulo: activity.title,
        descricao: activity.description,
        activity_date: activity.activity_date,
        tipo: activity.type,
        atividade_label: activity.atividade_label,
        quantidade: activity.quantidade,
        regional: activity.regional,
        status: activity.status,
        created_at: activity.created_at
      }));

      // Filtrar apenas "Famílias Embarcadas Decolagem"
      const familiasEmbarcadas = mappedData.filter(activity => 
        activity.atividade_label === 'Famílias Embarcadas Decolagem'
      );

      console.log(`🎯 Registros "Famílias Embarcadas Decolagem": ${familiasEmbarcadas.length}`);
      
      if (familiasEmbarcadas.length > 0) {
        console.log('\n📋 Detalhes dos registros:');
        familiasEmbarcadas.forEach((activity, index) => {
          console.log(`\n--- Registro ${index + 1} ---`);
          console.log(`ID: ${activity.id}`);
          console.log(`Título: ${activity.titulo}`);
          console.log(`Quantidade: ${activity.quantidade}`);
          console.log(`Regional: ${activity.regional}`);
          console.log(`Status: ${activity.status}`);
          console.log(`Data: ${activity.activity_date}`);
        });

        // Calcular total
        const totalQuantidade = familiasEmbarcadas.reduce((sum, activity) => {
          const quantidade = parseFloat(activity.quantidade) || 0;
          return sum + quantidade;
        }, 0);

        console.log(`\n🧮 Total calculado: ${totalQuantidade}`);
      } else {
        console.log('\n⚠️ Nenhum registro "Famílias Embarcadas Decolagem" encontrado');
        
        // Mostrar alguns exemplos de atividade_label para debug
        const labels = [...new Set(mappedData.map(a => a.atividade_label).filter(Boolean))];
        console.log('\n📝 Labels disponíveis:');
        labels.slice(0, 10).forEach(label => {
          console.log(`  - ${label}`);
        });
      }

      // Verificar status dos registros
      const statusCount = {};
      mappedData.forEach(activity => {
        const status = activity.status || 'undefined';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      console.log('\n📊 Distribuição por status:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });

    } else {
      console.log('⚠️ Nenhum registro encontrado na tabela regional_activities');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

testarEndpointLocal();