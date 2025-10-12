const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarCentroOeste() {
  try {
    console.log('=== INVESTIGANDO DADOS DA REGIONAL CENTRO-OESTE ===\n');
    
    // 1. Buscar usuários da regional Centro-Oeste
    console.log('1. USUÁRIOS DA REGIONAL CENTRO-OESTE:');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, nome, email, regional, equipe, funcao, status, ativo')
      .or('regional.ilike.%centro-oeste%,regional.ilike.%centro oeste%,regional.ilike.%centrooeste%');
    
    if (usuariosError) {
      console.error('Erro ao buscar usuários:', usuariosError);
    } else {
      console.log('Total de usuários Centro-Oeste:', usuarios?.length || 0);
      usuarios?.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id} | Nome: "${user.nome}" | Email: ${user.email} | Regional: ${user.regional}`);
      });
    }
    
    // 2. Buscar especificamente Flávio e Deise
    console.log('\n2. BUSCA ESPECÍFICA POR FLÁVIO E DEISE:');
    const { data: flavioDeise, error: flavioDeiseError } = await supabase
      .from('usuarios')
      .select('*')
      .or('nome.ilike.%flávio%,nome.ilike.%flavio%,nome.ilike.%deise%');
    
    if (flavioDeiseError) {
      console.error('Erro ao buscar Flávio e Deise:', flavioDeiseError);
    } else {
      console.log('Usuários encontrados:');
      flavioDeise?.forEach((user, index) => {
        console.log(`  ${index + 1}. Nome: "${user.nome}" | Email: ${user.email} | Regional: ${user.regional} | ID: ${user.id}`);
      });
    }
    
    // 3. Buscar atividades regionais do Centro-Oeste
    console.log('\n3. ATIVIDADES REGIONAIS DO CENTRO-OESTE:');
    const { data: atividades, error: atividadesError } = await supabase
      .from('regional_activities')
      .select('id, titulo, responsavel_id, regional, status, atividade_label, quantidade')
      .or('regional.ilike.%centro-oeste%,regional.ilike.%centro oeste%,regional.ilike.%centrooeste%')
      .eq('status', 'ativo');
    
    if (atividadesError) {
      console.error('Erro ao buscar atividades:', atividadesError);
    } else {
      console.log('Total de atividades Centro-Oeste:', atividades?.length || 0);
      
      // Para cada atividade, buscar o responsável
      for (const atividade of atividades || []) {
        const { data: responsavel } = await supabase
          .from('usuarios')
          .select('nome, email')
          .eq('id', atividade.responsavel_id)
          .single();
        
        console.log(`  - Atividade: ${atividade.titulo || atividade.atividade_label}`);
        console.log(`    Responsável ID: ${atividade.responsavel_id}`);
        console.log(`    Responsável Nome: "${responsavel?.nome || 'N/A'}"`);
        console.log(`    Regional: ${atividade.regional}`);
        console.log(`    Quantidade: ${atividade.quantidade || 0}`);
        console.log('');
      }
    }
    
    // 4. Verificar se há atividades com responsável Flávio ou Deise
    console.log('4. ATIVIDADES COM RESPONSÁVEL FLÁVIO OU DEISE:');
    if (flavioDeise && flavioDeise.length > 0) {
      const ids = flavioDeise.map(u => u.id);
      
      const { data: atividadesFlavioDeise, error: atividadesFDError } = await supabase
        .from('regional_activities')
        .select('*')
        .in('responsavel_id', ids)
        .eq('status', 'ativo');
      
      if (atividadesFDError) {
        console.error('Erro ao buscar atividades de Flávio/Deise:', atividadesFDError);
      } else {
        console.log('Total de atividades de Flávio/Deise:', atividadesFlavioDeise?.length || 0);
        
        for (const atividade of atividadesFlavioDeise || []) {
          const responsavel = flavioDeise.find(u => u.id === atividade.responsavel_id);
          console.log(`  - Atividade: ${atividade.titulo || atividade.atividade_label}`);
          console.log(`    Responsável: "${responsavel?.nome}" (ID: ${atividade.responsavel_id})`);
          console.log(`    Regional: ${atividade.regional}`);
          console.log('');
        }
      }
    }
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

investigarCentroOeste();