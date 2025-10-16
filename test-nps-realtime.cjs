const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNPSRealtime() {
  console.log('🔍 TESTE DE ATUALIZAÇÃO EM TEMPO REAL DO NPS\n');
  
  try {
    // 1. Verificar dados atuais relacionados ao NPS
    console.log('1️⃣ Verificando dados atuais relacionados ao NPS...');
    
    const { data: npsData, error: npsError } = await supabase
      .from('regional_activities')
      .select('*')
      .or('title.ilike.%nps%,type.ilike.%nps%,description.ilike.%nps%')
      .order('created_at', { ascending: false });
    
    if (npsError) {
      console.error('❌ Erro ao buscar dados NPS:', npsError.message);
      return;
    }
    
    console.log(`✅ Encontrados ${npsData?.length || 0} registros relacionados ao NPS`);
    
    if (npsData && npsData.length > 0) {
      console.log('📋 Registros NPS encontrados:');
      npsData.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} - Qtd: ${item.quantidade} - Regional: ${item.regional}`);
      });
      
      const totalNPS = npsData.reduce((sum, item) => {
        const quantidade = parseInt(item.quantidade) || 0;
        return sum + quantidade;
      }, 0);
      
      console.log(`\n📊 Total NPS atual: ${totalNPS}`);
    } else {
      console.log('⚠️ Nenhum dado NPS encontrado na tabela regional_activities');
    }
    
    // 2. Simular inserção de nova atividade NPS para testar tempo real
    console.log('\n2️⃣ Simulando inserção de nova atividade NPS...');
    
    const testNPSActivity = {
      member_id: '9f2d70a9-749d-4ee3-9ced-82a9b3a22bfd', // ID válido
      title: 'Teste NPS Dashboard Tempo Real',
      description: 'Atividade de teste NPS para verificar atualizações em tempo real',
      activity_date: new Date().toISOString().split('T')[0],
      type: 'nps',
      regional: 'nacional',
      status: 'ativo',
      quantidade: 50,
      programa: 'decolagem'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('regional_activities')
      .insert([testNPSActivity])
      .select();
    
    if (insertError) {
      console.error('❌ Erro ao inserir atividade NPS de teste:', insertError.message);
      return;
    }
    
    console.log('✅ Atividade NPS de teste inserida com sucesso:', insertData[0].id);
    
    // 3. Aguardar um pouco e verificar se o dashboard foi atualizado
    console.log('\n3️⃣ Aguardando 5 segundos para verificar atualização...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 4. Verificar dados atualizados
    console.log('4️⃣ Verificando dados atualizados...');
    
    const { data: updatedNpsData, error: updatedError } = await supabase
      .from('regional_activities')
      .select('*')
      .or('title.ilike.%nps%,type.ilike.%nps%,description.ilike.%nps%')
      .order('created_at', { ascending: false });
    
    if (updatedError) {
      console.error('❌ Erro ao buscar dados atualizados:', updatedError.message);
      return;
    }
    
    const updatedTotalNPS = updatedNpsData.reduce((sum, item) => {
      const quantidade = parseInt(item.quantidade) || 0;
      return sum + quantidade;
    }, 0);
    
    console.log(`📊 Total NPS atualizado: ${updatedTotalNPS}`);
    
    // 5. Limpar dados de teste
    console.log('\n5️⃣ Limpando dados de teste...');
    
    const { error: deleteError } = await supabase
      .from('regional_activities')
      .delete()
      .eq('id', insertData[0].id);
    
    if (deleteError) {
      console.error('❌ Erro ao deletar dados de teste:', deleteError.message);
    } else {
      console.log('✅ Dados de teste removidos com sucesso');
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO');
    console.log('📝 Verifique se o card NPS no Dashboard foi atualizado em tempo real');
    console.log('💡 Se não foi atualizado, pode ser necessário verificar:');
    console.log('   - Conexão com Supabase');
    console.log('   - Assinatura em tempo real no frontend');
    console.log('   - Cache do React Query');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testNPSRealtime();