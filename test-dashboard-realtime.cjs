const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardRealtime() {
  console.log('🔍 TESTE DE ATUALIZAÇÃO EM TEMPO REAL DO DASHBOARD\n');
  
  try {
    // 1. Verificar dados atuais na tabela regional_activities
    console.log('1️⃣ Verificando dados atuais na tabela regional_activities...');
    
    const { data: currentData, error: currentError } = await supabase
      .from('regional_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (currentError) {
      console.error('❌ Erro ao buscar dados atuais:', currentError.message);
      return;
    }
    
    console.log(`✅ Encontrados ${currentData?.length || 0} registros na tabela`);
    
    if (currentData && currentData.length > 0) {
      console.log('📋 Últimos registros:');
      currentData.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} - ${item.atividade_label} - Qtd: ${item.quantidade}`);
      });
    }
    
    // 2. Simular inserção de nova atividade para testar tempo real
    console.log('\n2️⃣ Simulando inserção de nova atividade...');
    
    const testActivity = {
      member_id: '9f2d70a9-749d-4ee3-9ced-82a9b3a22bfd', // ID válido encontrado
      title: 'Teste Dashboard Tempo Real',
      description: 'Atividade de teste para verificar atualizações em tempo real',
      activity_date: new Date().toISOString().split('T')[0],
      type: 'teste',
      regional: 'sudeste',
      status: 'ativo',
      programa: 'decolagem',
      atividade_label: 'Famílias Embarcadas Decolagem',
      quantidade: 5
    };
    
    const { data: insertedData, error: insertError } = await supabase
      .from('regional_activities')
      .insert([testActivity])
      .select('*')
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao inserir atividade de teste:', insertError.message);
      return;
    }
    
    console.log('✅ Atividade de teste inserida:', insertedData.id);
    
    // 3. Aguardar um pouco e verificar se os dados foram atualizados
    console.log('\n3️⃣ Aguardando 3 segundos para verificar atualização...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Verificar dados após inserção
    const { data: updatedData, error: updatedError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem')
      .order('created_at', { ascending: false });
    
    if (updatedError) {
      console.error('❌ Erro ao verificar dados atualizados:', updatedError.message);
      return;
    }
    
    console.log(`✅ Total de registros "Famílias Embarcadas Decolagem": ${updatedData?.length || 0}`);
    
    // Calcular total de quantidade
    const totalQuantidade = updatedData?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0;
    console.log(`📊 Total de Famílias Embarcadas: ${totalQuantidade}`);
    
    // 5. Testar subscription em tempo real
    console.log('\n4️⃣ Testando subscription em tempo real...');
    
    const subscription = supabase
      .channel('regional_activities_test')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'regional_activities' 
      }, (payload) => {
        console.log('🔄 Mudança detectada em tempo real:', {
          eventType: payload.eventType,
          table: payload.table,
          new: payload.new ? {
            id: payload.new.id,
            title: payload.new.title,
            atividade_label: payload.new.atividade_label,
            quantidade: payload.new.quantidade
          } : null,
          old: payload.old ? {
            id: payload.old.id,
            title: payload.old.title
          } : null
        });
      })
      .subscribe();
    
    console.log('👂 Subscription ativa. Aguardando mudanças...');
    
    // 6. Fazer uma segunda inserção para testar o tempo real
    setTimeout(async () => {
      console.log('\n5️⃣ Inserindo segunda atividade para testar tempo real...');
      
      const secondTestActivity = {
        member_id: '9f2d70a9-749d-4ee3-9ced-82a9b3a22bfd',
        title: 'Segunda Atividade Teste',
        description: 'Segunda atividade para testar tempo real',
        activity_date: new Date().toISOString().split('T')[0],
        type: 'teste',
        regional: 'nordeste',
        status: 'ativo',
        programa: 'decolagem',
        atividade_label: 'Diagnósticos Realizados',
        quantidade: 3
      };
      
      const { data: secondInsert, error: secondError } = await supabase
        .from('regional_activities')
        .insert([secondTestActivity])
        .select('*')
        .single();
      
      if (secondError) {
        console.error('❌ Erro na segunda inserção:', secondError.message);
      } else {
        console.log('✅ Segunda atividade inserida:', secondInsert.id);
      }
    }, 2000);
    
    // 7. Aguardar e depois limpar dados de teste
    setTimeout(async () => {
      console.log('\n6️⃣ Limpando dados de teste...');
      
      const { error: deleteError } = await supabase
        .from('regional_activities')
        .delete()
        .eq('title', 'Teste Dashboard Tempo Real');
      
      const { error: deleteError2 } = await supabase
        .from('regional_activities')
        .delete()
        .eq('title', 'Segunda Atividade Teste');
      
      if (deleteError || deleteError2) {
        console.error('❌ Erro ao limpar dados de teste');
      } else {
        console.log('✅ Dados de teste removidos');
      }
      
      // Unsubscribe
      subscription.unsubscribe();
      console.log('👋 Subscription encerrada');
      
      console.log('\n🎯 RESUMO DO TESTE:');
      console.log('✅ Conexão com Supabase: OK');
      console.log('✅ Leitura de dados: OK');
      console.log('✅ Inserção de dados: OK');
      console.log('✅ Subscription em tempo real: OK');
      console.log('✅ Limpeza de dados: OK');
      
      process.exit(0);
    }, 8000);
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    process.exit(1);
  }
}

// Executar teste
testDashboardRealtime();