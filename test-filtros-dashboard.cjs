const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixqjqhqxqhqxqhqx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHF4cWhxeHFocXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MzIwMCwiZXhwIjoyMDUzMTI5MjAwfQ.abc123';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analisarDadosParaFiltros() {
  try {
    console.log('=== ANÁLISE DE DADOS PARA FILTROS ===\n');
    
    // 1. Verificar metas por regional
    console.log('1. METAS POR REGIONAL:');
    const { data: metas, error: metasError } = await supabase
      .from('goals')
      .select('*');
    
    if (metasError) {
      console.error('Erro ao buscar metas:', metasError);
    } else {
      const metasPorRegional = {};
      metas?.forEach(meta => {
        if (meta.regional) {
          if (!metasPorRegional[meta.regional]) {
            metasPorRegional[meta.regional] = 0;
          }
          metasPorRegional[meta.regional]++;
        }
      });
      
      console.log('Metas por regional:');
      Object.entries(metasPorRegional).forEach(([regional, count]) => {
        console.log(`  - ${regional}: ${count} metas`);
      });
    }
    
    // 2. Verificar atividades regionais
    console.log('\n2. ATIVIDADES REGIONAIS:');
    const { data: atividades, error: atividadesError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('status', 'ativo');
    
    if (atividadesError) {
      console.error('Erro ao buscar atividades:', atividadesError);
    } else {
      const atividadesPorRegional = {};
      const atividadesPorTipo = {};
      
      atividades?.forEach(atividade => {
        // Por regional
        if (!atividadesPorRegional[atividade.regional]) {
          atividadesPorRegional[atividade.regional] = 0;
        }
        atividadesPorRegional[atividade.regional]++;
        
        // Por tipo
        const tipo = atividade.atividade_label || atividade.titulo || 'Outros';
        if (!atividadesPorTipo[tipo]) {
          atividadesPorTipo[tipo] = 0;
        }
        atividadesPorTipo[tipo]++;
      });
      
      console.log('Atividades por regional:');
      Object.entries(atividadesPorRegional).forEach(([regional, count]) => {
        console.log(`  - ${regional}: ${count} atividades`);
      });
      
      console.log('\nAtividades por tipo:');
      Object.entries(atividadesPorTipo).forEach(([tipo, count]) => {
        console.log(`  - ${tipo}: ${count} atividades`);
      });
    }
    
    // 3. Verificar usuários por equipe
    console.log('\n3. USUÁRIOS POR EQUIPE:');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('equipe, regional');
    
    if (usuariosError) {
      console.error('Erro ao buscar usuários:', usuariosError);
    } else {
      const usuariosPorEquipe = {};
      const usuariosPorRegional = {};
      
      usuarios?.forEach(usuario => {
        // Por equipe
        if (usuario.equipe) {
          if (!usuariosPorEquipe[usuario.equipe]) {
            usuariosPorEquipe[usuario.equipe] = 0;
          }
          usuariosPorEquipe[usuario.equipe]++;
        }
        
        // Por regional
        if (usuario.regional) {
          if (!usuariosPorRegional[usuario.regional]) {
            usuariosPorRegional[usuario.regional] = 0;
          }
          usuariosPorRegional[usuario.regional]++;
        }
      });
      
      console.log('Usuários por equipe:');
      Object.entries(usuariosPorEquipe).forEach(([equipe, count]) => {
        console.log(`  - ${equipe}: ${count} usuários`);
      });
      
      console.log('\nUsuários por regional:');
      Object.entries(usuariosPorRegional).forEach(([regional, count]) => {
        console.log(`  - ${regional}: ${count} usuários`);
      });
    }
    
    // 4. Verificar dados por mês/ano
    console.log('\n4. DADOS POR PERÍODO:');
    const metasPorMes = {};
    const metasPorAno = {};
    
    metas?.forEach(meta => {
      if (meta.created_at) {
        const data = new Date(meta.created_at);
        const mes = data.getMonth() + 1;
        const ano = data.getFullYear();
        
        if (!metasPorMes[mes]) metasPorMes[mes] = 0;
        if (!metasPorAno[ano]) metasPorAno[ano] = 0;
        
        metasPorMes[mes]++;
        metasPorAno[ano]++;
      }
    });
    
    console.log('Metas por mês:');
    Object.entries(metasPorMes).forEach(([mes, count]) => {
      const nomesMeses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      console.log(`  - ${nomesMeses[mes]}: ${count} metas`);
    });
    
    console.log('\nMetas por ano:');
    Object.entries(metasPorAno).forEach(([ano, count]) => {
      console.log(`  - ${ano}: ${count} metas`);
    });
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

analisarDadosParaFiltros();