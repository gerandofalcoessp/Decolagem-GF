const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAuthenticatedGoalFlow() {
  console.log('🧪 Testando fluxo completo com autenticação...\n');
  
  try {
    // 1. Fazer login com usuário de teste
    console.log('1️⃣ Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'teste@decolagem.com',
      password: 'teste123'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    
    // 2. Buscar o member associado
    console.log('\n2️⃣ Buscando member associado...');
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    if (memberError) {
      console.error('❌ Erro ao buscar member:', memberError.message);
      return;
    }
    
    console.log('✅ Member encontrado:');
    console.log('   Member ID:', member.id);
    console.log('   Nome:', member.name);
    console.log('   Email:', member.email);
    
    // 3. Limpar metas existentes do usuário
    console.log('\n3️⃣ Limpando metas existentes...');
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('member_id', member.id);
    
    if (deleteError) {
      console.log('⚠️ Erro ao limpar metas (pode ser normal):', deleteError.message);
    } else {
      console.log('✅ Metas limpas com sucesso');
    }
    
    // 4. Criar uma meta para todas as regionais
    console.log('\n4️⃣ Criando meta para todas as regionais...');
    const newGoal = {
      nome: 'Meta Teste - Todas as Regionais',
      descricao: 'Meta de teste | Período: Todo o ano/2025 | Área: Centro-Oeste, MG/ES, Nordeste 1, Nordeste 2, Norte, Rio de Janeiro, São Paulo, Sul, Nacional, Comercial',
      valor_meta: 1000,
      valor_atual: 0,
      status: 'pending',
      due_date: '2025-12-31',
      member_id: member.id
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
    
    // 5. Verificar como a meta foi salva
    console.log('\n5️⃣ Verificando meta salva no banco...');
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
    console.log('   Nome:', savedGoal.nome);
    console.log('   Descrição completa:', savedGoal.descricao);
    console.log('   Member ID:', savedGoal.member_id);
    console.log('   Status:', savedGoal.status);
    
    // 6. Simular o processamento do goalService.ts
    console.log('\n6️⃣ Simulando processamento do goalService.ts...');
    
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
      
      // Processar múltiplas regionais separadas por vírgula
      const areasArray = regionaisStr.split(',').map(area => area.trim());
      console.log('   Áreas separadas por vírgula:', areasArray);
      
      regionais = areasArray.map(area => {
        const areaLimpa = area.toLowerCase().trim();
        const mapped = mapeamentoAreas[areaLimpa] || areaLimpa;
        console.log(`     "${area}" -> "${areaLimpa}" -> "${mapped}"`);
        return mapped;
      }).filter(area => area);
      
      // Se todas as 10 regionais estão presentes, usar ['nacional']
      if (regionais.length >= 10) {
        console.log('   Todas as regionais detectadas, usando ["nacional"]');
        regionais = ['nacional'];
      }
    }
    
    console.log('   Regionais processadas:', regionais);
    console.log('   Número de regionais:', regionais.length);
    
    // 7. Simular o objeto que seria enviado para o frontend
    const frontendGoal = {
      id: savedGoal.id,
      nome: savedGoal.nome,
      descricao: savedGoal.descricao,
      regionais: regionais,
      regional: regionais.join(', ') // Campo usado no DashboardMetasPage
    };
    
    console.log('\n7️⃣ Objeto que seria enviado para o frontend:');
    console.log(JSON.stringify(frontendGoal, null, 2));
    
    // 8. Simular a lógica de exibição do MetasTab.tsx
    console.log('\n8️⃣ Simulando lógica de exibição do MetasTab.tsx...');
    
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
    
    // Lógica atual do MetasTab.tsx (após a correção)
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
    } else if (regionaisArray.includes('nacional')) {
      displayText = 'Todas';
    } else {
      displayText = regionaisArray.join(', ');
    }
    
    console.log('   Texto que seria exibido no card:', displayText);
    
    // 9. Diagnóstico final
    console.log('\n9️⃣ Diagnóstico final:');
    if (displayText === 'Todas') {
      console.log('✅ FUNCIONANDO CORRETAMENTE! Exibiria "Todas"');
    } else {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   - Esperado: "Todas"');
      console.log('   - Atual:', displayText);
      console.log('   - Regionais processadas:', regionaisArray);
    }
    
    // 10. Fazer logout
    console.log('\n🔚 Fazendo logout...');
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testAuthenticatedGoalFlow();