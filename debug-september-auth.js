import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Carregar variáveis de ambiente do backend/.env
const envPath = path.join(process.cwd(), 'backend', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSeptemberFilter() {
  try {
    console.log('🔍 INVESTIGANDO PROBLEMA DO FILTRO DE SETEMBRO');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    // 1. Buscar todas as atividades regionais
    console.log('📊 1. Buscando todas as atividades regionais...');
    const { data: allActivities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError);
      return;
    }

    console.log(`✅ Total de atividades encontradas: ${allActivities?.length || 0}\n`);

    // 2. Filtrar atividades de setembro
    const septemberActivities = allActivities?.filter(activity => {
      const activityDate = activity.activity_date;
      const dataInicio = activity.data_inicio;
      const createdAt = activity.created_at;
      
      // Verificar se alguma das datas é de setembro de 2024
      const checkSeptember = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getMonth() === 8 && date.getFullYear() === 2024; // setembro = mês 8
      };
      
      return checkSeptember(activityDate) || checkSeptember(dataInicio) || checkSeptember(createdAt);
    });

    console.log(`📅 2. Atividades de setembro encontradas: ${septemberActivities?.length || 0}`);
    
    if (septemberActivities && septemberActivities.length > 0) {
      septemberActivities.forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.title || 'Sem título'}`);
        console.log(`      - activity_date: ${activity.activity_date}`);
        console.log(`      - data_inicio: ${activity.data_inicio}`);
        console.log(`      - created_at: ${activity.created_at}`);
        console.log(`      - regional: ${activity.regional}`);
        console.log(`      - status: ${activity.status}`);
        console.log('');
      });
    }

    // 3. Buscar todas as metas (tabela goals)
    console.log('🎯 3. Buscando todas as metas...');
    const { data: allMetas, error: metasError } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (metasError) {
      console.error('❌ Erro ao buscar metas:', metasError);
      return;
    }

    console.log(`✅ Total de metas encontradas: ${allMetas?.length || 0}\n`);

    // 4. Verificar metas para 2025
    const metas2025 = allMetas?.filter(meta => {
      const dataInicio = meta.data_inicio || meta.created_at;
      if (!dataInicio) return false;
      const date = new Date(dataInicio);
      return date.getFullYear() === 2025;
    });

    console.log(`📈 4. Metas para 2025: ${metas2025?.length || 0}`);
    
    if (metas2025 && metas2025.length > 0) {
      metas2025.forEach((meta, index) => {
        console.log(`   ${index + 1}. ${meta.nome || meta.title || 'Sem título'}`);
        console.log(`      - data_inicio: ${meta.data_inicio}`);
        console.log(`      - created_at: ${meta.created_at}`);
        console.log(`      - regional: ${meta.regional}`);
        console.log(`      - valor_meta: ${meta.valor_meta || meta.target_value}`);
        console.log('');
      });
    }

    // 5. Simular a lógica mesComDados
    console.log('🔄 5. Simulando lógica mesComDados para setembro...');
    
    const filtroMes = 9; // setembro
    const filtroAno = 2024;
    
    // Verificar se há metas para setembro
    const metasDoMes = allMetas?.filter(meta => {
      if (!meta.data_inicio && !meta.created_at) return false;
      const date = new Date(meta.data_inicio || meta.created_at);
      const mesMatch = date.getMonth() + 1 === filtroMes;
      const anoMatch = !filtroAno || date.getFullYear() === filtroAno;
      return mesMatch && anoMatch;
    });

    // Verificar se há atividades para setembro
    const atividadesDoMes = allActivities?.filter(activity => {
      const checkDate = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const mesMatch = date.getMonth() + 1 === filtroMes;
        const anoMatch = !filtroAno || date.getFullYear() === filtroAno;
        return mesMatch && anoMatch;
      };
      
      return checkDate(activity.activity_date) || 
             checkDate(activity.data_inicio) || 
             checkDate(activity.created_at);
    });

    console.log(`   - Metas do mês (setembro): ${metasDoMes?.length || 0}`);
    console.log(`   - Atividades do mês (setembro): ${atividadesDoMes?.length || 0}`);
    
    const temDados = (metasDoMes && metasDoMes.length > 0) || (atividadesDoMes && atividadesDoMes.length > 0);
    console.log(`   - mesComDados resultado: ${temDados}`);

    console.log('\n🎯 CONCLUSÃO:');
    if (!temDados) {
      console.log('❌ O problema está na lógica mesComDados - ela retorna false para setembro');
      console.log('   Isso faz com que as estatísticas retornem zeros');
    } else {
      console.log('✅ mesComDados deveria retornar true para setembro');
      console.log('   O problema pode estar em outro lugar da lógica de filtragem');
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugSeptemberFilter();