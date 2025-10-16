const { createClient } = require('@supabase/supabase-js');

async function debugRegionalFilter() {
  console.log('🔍 Investigando filtro por regional...');
  
  // Configuração do Supabase com service role key
  const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('👤 1. Verificando dados do usuário Erika Miranda...');
    
    // Buscar dados do usuário que estamos usando para teste
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'coord.regional.sp@gerandofalcoes.com')
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    console.log('📋 Dados do usuário:');
    console.log(`  - Nome: ${userData.nome}`);
    console.log(`  - Email: ${userData.email}`);
    console.log(`  - Role: ${userData.role}`);
    console.log(`  - Regional: ${userData.regional}`);
    console.log(`  - Status: ${userData.status}`);

    // Função de mapeamento regional (copiada da API)
    const mapUserRegionalToActivityFormat = (regional) => {
      if (!regional) return '';
      
      const mapping = {
        'R. Norte': 'norte',
        'R. Centro-Oeste': 'centro_oeste',
        'R. Nordeste': 'nordeste',
        'R. Sudeste': 'sudeste',
        'R. Sul': 'sul',
        'R. MG/ES': 'mg_es',
        'R. Rio de Janeiro': 'rj',
        'R. São Paulo': 'sp',
        'R. Nordeste 1': 'nordeste_1',
        'R. Nordeste 2': 'nordeste_2',
        'Nacional': 'nacional',
        'Comercial': 'comercial',
        // Casos já no formato correto
        'norte': 'norte',
        'centro_oeste': 'centro_oeste',
        'nordeste': 'nordeste',
        'sudeste': 'sudeste',
        'sul': 'sul',
        'mg_es': 'mg_es',
        'rj': 'rj',
        'sp': 'sp',
        'nordeste_1': 'nordeste_1',
        'nordeste_2': 'nordeste_2',
        'nacional': 'nacional',
        'comercial': 'comercial'
      };
      
      return mapping[regional] || regional.toLowerCase();
    };

    const mappedUserRegional = mapUserRegionalToActivityFormat(userData.regional);
    console.log(`🔄 Mapeamento regional: "${userData.regional}" -> "${mappedUserRegional}"`);

    console.log('\n📊 2. Verificando todas as atividades "Famílias Embarcadas Decolagem"...');
    
    // Buscar todas as atividades de famílias embarcadas
    const { data: allFamilias, error: allError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erro ao buscar todas as famílias:', allError);
    } else {
      console.log(`✅ Total de atividades "Famílias Embarcadas Decolagem": ${allFamilias?.length || 0}`);
      
      if (allFamilias && allFamilias.length > 0) {
        console.log('\n📋 Distribuição por regional:');
        const regionalCount = {};
        let totalQuantidade = 0;
        
        allFamilias.forEach(activity => {
          const regional = activity.regional;
          if (!regionalCount[regional]) {
            regionalCount[regional] = { count: 0, quantidade: 0 };
          }
          regionalCount[regional].count++;
          regionalCount[regional].quantidade += activity.quantidade || 0;
          totalQuantidade += activity.quantidade || 0;
        });
        
        Object.entries(regionalCount).forEach(([regional, data]) => {
          console.log(`  - ${regional}: ${data.count} atividades, ${data.quantidade} famílias`);
        });
        
        console.log(`\n🎯 Total geral: ${totalQuantidade} famílias`);
      }
    }

    console.log('\n🔍 3. Aplicando filtro do usuário...');
    
    let query = supabase
      .from('regional_activities')
      .select('*')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem')
      .order('created_at', { ascending: false });

    // Aplicar o mesmo filtro da API
    if (userData.role !== 'super_admin' && mappedUserRegional !== 'nacional') {
      console.log(`👤 Usuário comum - filtrando por regional: "${mappedUserRegional}"`);
      query = query.eq('regional', mappedUserRegional);
    } else {
      console.log('👑 Super admin ou usuário nacional - buscando todas as atividades');
    }

    const { data: filteredFamilias, error: filteredError } = await query;

    if (filteredError) {
      console.error('❌ Erro ao buscar famílias filtradas:', filteredError);
    } else {
      console.log(`✅ Atividades após filtro: ${filteredFamilias?.length || 0}`);
      
      if (filteredFamilias && filteredFamilias.length > 0) {
        let totalFiltrado = 0;
        console.log('\n📋 Atividades encontradas:');
        filteredFamilias.forEach((activity, index) => {
          console.log(`${index + 1}. ID: ${activity.id}`);
          console.log(`   Regional: ${activity.regional}`);
          console.log(`   Quantidade: ${activity.quantidade}`);
          console.log(`   Status: ${activity.status}`);
          totalFiltrado += activity.quantidade || 0;
        });
        
        console.log(`\n🎯 Total filtrado: ${totalFiltrado} famílias`);
      } else {
        console.log('❌ Nenhuma atividade encontrada após aplicar o filtro!');
        
        // Verificar se existem atividades com regionais similares
        console.log('\n🔍 Verificando regionais similares...');
        const { data: similarRegionals } = await supabase
          .from('regional_activities')
          .select('regional')
          .eq('atividade_label', 'Famílias Embarcadas Decolagem');
        
        const uniqueRegionals = [...new Set(similarRegionals?.map(item => item.regional))];
        console.log('📋 Regionais disponíveis nas atividades:');
        uniqueRegionals.forEach((regional, index) => {
          console.log(`${index + 1}. "${regional}"`);
        });
        
        console.log(`\n🎯 Regional do usuário mapeado: "${mappedUserRegional}"`);
        console.log(`🎯 Regional do usuário original: "${userData.regional}"`);
      }
    }
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

debugRegionalFilter();