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

async function debugSeptemberDetailed() {
  try {
    console.log('🔍 ANÁLISE DETALHADA DAS ATIVIDADES - PROCURANDO SETEMBRO');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    // 1. Buscar todas as atividades com todos os campos de data
    console.log('📊 1. Analisando TODAS as atividades regionais...');
    const { data: allActivities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError);
      return;
    }

    console.log(`✅ Total de atividades: ${allActivities?.length || 0}\n`);

    // 2. Analisar cada atividade em detalhes
    console.log('🔍 2. Analisando cada atividade em detalhes...\n');
    
    let septemberCount = 0;
    const potentialSeptemberActivities = [];

    allActivities?.forEach((activity, index) => {
      console.log(`📋 Atividade ${index + 1}: ${activity.title || 'Sem título'}`);
      console.log(`   ID: ${activity.id}`);
      console.log(`   Regional: ${activity.regional}`);
      console.log(`   Status: ${activity.status}`);
      
      // Analisar todos os campos de data
      const dateFields = ['activity_date', 'data_inicio', 'created_at', 'updated_at'];
      let hasSeptemberDate = false;
      
      dateFields.forEach(field => {
        const dateValue = activity[field];
        if (dateValue) {
          const date = new Date(dateValue);
          const month = date.getMonth() + 1;
          const year = date.getFullYear();
          
          console.log(`   ${field}: ${dateValue} (${month}/${year})`);
          
          if (month === 9) { // setembro
            hasSeptemberDate = true;
            console.log(`   ⭐ SETEMBRO ENCONTRADO em ${field}!`);
          }
        } else {
          console.log(`   ${field}: null/undefined`);
        }
      });
      
      if (hasSeptemberDate) {
        septemberCount++;
        potentialSeptemberActivities.push(activity);
      }
      
      console.log(''); // linha em branco
    });

    console.log(`\n📅 3. RESUMO DAS ATIVIDADES DE SETEMBRO:`);
    console.log(`   Total encontradas: ${septemberCount}`);
    
    if (potentialSeptemberActivities.length > 0) {
      console.log('\n   Detalhes das atividades de setembro:');
      potentialSeptemberActivities.forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.title}`);
        console.log(`      - Regional: ${activity.regional}`);
        console.log(`      - Status: ${activity.status}`);
        console.log(`      - activity_date: ${activity.activity_date}`);
        console.log(`      - data_inicio: ${activity.data_inicio}`);
        console.log(`      - created_at: ${activity.created_at}`);
        console.log('');
      });
    }

    // 4. Verificar se o problema é com o ano
    console.log('🗓️ 4. Verificando atividades por ano...');
    const activitiesByYear = {};
    
    allActivities?.forEach(activity => {
      const dates = [activity.activity_date, activity.data_inicio, activity.created_at];
      dates.forEach(dateStr => {
        if (dateStr) {
          const year = new Date(dateStr).getFullYear();
          if (!activitiesByYear[year]) activitiesByYear[year] = 0;
          activitiesByYear[year]++;
        }
      });
    });
    
    Object.keys(activitiesByYear).sort().forEach(year => {
      console.log(`   ${year}: ${activitiesByYear[year]} referências de data`);
    });

    // 5. Verificar especificamente setembro de 2024
    console.log('\n📅 5. Procurando especificamente setembro de 2024...');
    const september2024Activities = allActivities?.filter(activity => {
      const checkSeptember2024 = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getMonth() === 8 && date.getFullYear() === 2024; // setembro = mês 8
      };
      
      return checkSeptember2024(activity.activity_date) || 
             checkSeptember2024(activity.data_inicio) || 
             checkSeptember2024(activity.created_at);
    });

    console.log(`   Atividades de setembro/2024: ${september2024Activities?.length || 0}`);
    
    if (september2024Activities && september2024Activities.length > 0) {
      september2024Activities.forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.title}`);
        console.log(`      - activity_date: ${activity.activity_date}`);
        console.log(`      - data_inicio: ${activity.data_inicio}`);
        console.log(`      - created_at: ${activity.created_at}`);
      });
    }

    console.log('\n🎯 CONCLUSÃO:');
    if (septemberCount === 0) {
      console.log('❌ Não há atividades de setembro no banco de dados');
      console.log('   As 4 atividades mencionadas pelo usuário podem:');
      console.log('   1. Não ter sido salvas no banco');
      console.log('   2. Estar em outra tabela');
      console.log('   3. Ter datas em formato diferente');
      console.log('   4. Estar com status inativo');
    } else {
      console.log(`✅ Encontradas ${septemberCount} atividades de setembro`);
      console.log('   O problema pode estar na lógica de filtragem do frontend');
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugSeptemberDetailed();