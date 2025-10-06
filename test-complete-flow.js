const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testCompleteFlow() {
  console.log('🧪 Testando fluxo completo de criação e exibição de metas...\n');
  
  try {
    // 1. Primeiro, limpar metas existentes para teste limpo
    console.log('1️⃣ Limpando metas existentes...');
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.log('⚠️ Erro ao limpar metas (pode ser normal se não houver metas):', deleteError.message);
    } else {
      console.log('✅ Metas limpas com sucesso');
    }
    
    // 2. Criar uma meta para todas as regionais
    console.log('\n2️⃣ Criando meta para todas as regionais...');
    const newGoal = {
      nome: 'Meta Teste - Todas as Regionais',
      descricao: 'Meta de teste | Período: Todo o ano/2025 | Área: Centro-Oeste, MG/ES, Nordeste 1, Nordeste 2, Norte, Rio de Janeiro, São Paulo, Sul, Nacional, Comercial',
      valor_meta: 1000,
      valor_atual: 0,
      status: 'pending',
      due_date: '2025-12-31'
    };
    
    const { data: createdGoal, error: createError } = await supabase
      .from('goals')
      .insert([newGoal])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar meta:', createError);
      return;
    }
    
    console.log('✅ Meta criada com sucesso:');
    console.log('   ID:', createdGoal.id);
    console.log('   Nome:', createdGoal.nome);
    console.log('   Descrição:', createdGoal.descricao);
    
    // 3. Verificar como a meta foi salva no banco
    console.log('\n3️⃣ Verificando como a meta foi salva no banco...');
    const { data: savedGoal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', createdGoal.id)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar meta salva:', fetchError);
      return;
    }
    
    console.log('📊 Meta salva no banco:');
    console.log('   Campos disponíveis:', Object.keys(savedGoal));
    console.log('   Descrição completa:', savedGoal.descricao);
    
    // 4. Simular o processamento do goalService.ts
    console.log('\n4️⃣ Simulando processamento do goalService.ts...');
    
    // Extrair regionais da descrição (como faz o goalService.ts)
    const regionaisMatch = savedGoal.descricao.match(/(?:área|áreas):\s*([^|,\n]+)/i);
    let regionais = [];
    
    if (regionaisMatch) {
      const regionaisStr = regionaisMatch[1].trim();
      console.log('   Regionais extraídas da descrição:', regionaisStr);
      
      // Mapear os valores encontrados para as chaves corretas
      const mapeamentoAreas = {
        'nacional': 'nacional',
        'comercial': 'comercial',
        'centro-oeste': 'centro_oeste',
        'centro oeste': 'centro_oeste',
        'mg/es': 'mg_es',
        'mg es': 'mg_es',
        'nordeste 1': 'nordeste_1',
        'nordeste1': 'nordeste_1',
        'nordeste 2': 'nordeste_2',
        'nordeste2': 'nordeste_2',
        'norte': 'norte',
        'rj': 'rj',
        'rio de janeiro': 'rj',
        'sp': 'sp',
        'são paulo': 'sp',
        'sao paulo': 'sp',
        'sul': 'sul'
      };
      
      if (regionaisStr.toLowerCase().includes('todas') || regionaisStr.toLowerCase().includes('nacional')) {
        regionais = ['nacional'];
      } else {
        // Processar múltiplas regionais separadas por vírgula
        const areasArray = regionaisStr.split(',').map(area => area.trim());
        regionais = areasArray.map(area => {
          const areaLimpa = area.toLowerCase().trim();
          return mapeamentoAreas[areaLimpa] || areaLimpa;
        }).filter(area => area);
      }
    }
    
    console.log('   Regionais processadas:', regionais);
    console.log('   Número de regionais:', regionais.length);
    
    // 5. Simular o objeto que seria enviado para o frontend
    const frontendGoal = {
      id: savedGoal.id,
      nome: savedGoal.nome,
      descricao: savedGoal.descricao,
      regionais: regionais,
      regional: regionais.join(', ') // Campo usado no DashboardMetasPage
    };
    
    console.log('\n5️⃣ Objeto que seria enviado para o frontend:');
    console.log(JSON.stringify(frontendGoal, null, 2));
    
    // 6. Simular a lógica de exibição do MetasTab.tsx
    console.log('\n6️⃣ Simulando lógica de exibição do MetasTab.tsx...');
    
    const regionaisDisponiveis = [
      'Centro-Oeste',
      'MG/ES', 
      'Nordeste 1',
      'Nordeste 2',
      'Norte',
      'Rio de Janeiro',
      'São Paulo',
      'Sul',
      'Nacional',
      'Comercial'
    ];
    
    console.log('   Regionais disponíveis:', regionaisDisponiveis.length);
    
    // Lógica atual do MetasTab.tsx
    const regionaisArray = Array.isArray(frontendGoal.regionais) 
      ? frontendGoal.regionais 
      : (typeof frontendGoal.regionais === 'string' && frontendGoal.regionais.includes(','))
        ? frontendGoal.regionais.split(',').map(r => r.trim())
        : frontendGoal.regionais ? [frontendGoal.regionais] : [];
    
    console.log('   Regionais processadas para exibição:', regionaisArray);
    console.log('   Número de regionais processadas:', regionaisArray.length);
    
    let displayText;
    if (regionaisArray.length === regionaisDisponiveis.length) {
      displayText = 'Todas';
    } else {
      displayText = regionaisArray.join(', ');
    }
    
    console.log('   Texto que seria exibido no card:', displayText);
    
    // 7. Diagnóstico do problema
    console.log('\n7️⃣ Diagnóstico do problema:');
    if (displayText !== 'Todas') {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   - Esperado: "Todas" (quando todas as 10 regionais estão selecionadas)');
      console.log('   - Atual:', displayText);
      console.log('   - Regionais encontradas:', regionaisArray.length, 'de', regionaisDisponiveis.length);
      console.log('   - Diferença:', regionaisDisponiveis.length - regionaisArray.length);
      
      console.log('\n🔍 Análise detalhada:');
      console.log('   Regionais disponíveis:', regionaisDisponiveis);
      console.log('   Regionais processadas:', regionaisArray);
      
      // Encontrar quais regionais estão faltando
      const faltando = regionaisDisponiveis.filter(r => !regionaisArray.includes(r));
      const extras = regionaisArray.filter(r => !regionaisDisponiveis.includes(r));
      
      if (faltando.length > 0) {
        console.log('   Regionais faltando:', faltando);
      }
      if (extras.length > 0) {
        console.log('   Regionais extras/não reconhecidas:', extras);
      }
    } else {
      console.log('✅ Funcionando corretamente! Exibiria "Todas"');
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testCompleteFlow();