const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Replicar as funções do regionalService para debug
let regionalsCache = null;

async function getRegionals() {
  if (regionalsCache) return regionalsCache;
  
  const { data, error } = await supabase
    .from('regionals')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Erro ao buscar regionais:', error);
    throw new Error('Falha ao buscar regionais do banco de dados');
  }
  
  regionalsCache = data;
  return data;
}

async function getUserRegionalId(userRegional) {
  try {
    const regionals = await getRegionals();
    
    // Remover prefixo "R. " se existir
    const cleanRegional = userRegional.replace(/^R\.\s*/, '');
    
    console.log(`🔍 Buscando regional do usuário: "${userRegional}" -> "${cleanRegional}"`);
    
    // Buscar regional correspondente
    const regional = regionals.find(r => 
      r.name.toLowerCase() === cleanRegional.toLowerCase()
    );
    
    console.log(`📍 Regional encontrada:`, regional ? `${regional.name} (${regional.id})` : 'Não encontrada');
    
    return regional?.id || null;
  } catch (error) {
    console.error('Erro ao buscar ID da regional:', error);
    return null;
  }
}

async function getEventRegionalId(eventRegional) {
  try {
    const regionals = await getRegionals();
    
    // Mapeamento de nomes de eventos para nomes de regionais
    const eventToRegionalMapping = {
      'norte': 'Norte',
      'nordeste_1': 'Nordeste 1',
      'nordeste_2': 'Nordeste 2',
      'centro_oeste': 'Centro-Oeste',
      'sao_paulo': 'São Paulo',
      'rio_de_janeiro': 'Rio de Janeiro',
      'rj': 'Rio de Janeiro',
      'mg_es': 'MG/ES',
      'sul': 'Sul',
      'nacional': 'Nacional',
      'comercial': 'Comercial'
    };
    
    console.log(`🔍 Buscando regional do evento: "${eventRegional}"`);
    
    const regionalName = eventToRegionalMapping[eventRegional.toLowerCase()];
    console.log(`📍 Mapeamento encontrado: "${eventRegional}" -> "${regionalName}"`);
    
    if (!regionalName) {
      // Se não encontrar no mapeamento, tentar busca direta
      const regional = regionals.find(r => 
        r.name.toLowerCase() === eventRegional.toLowerCase()
      );
      console.log(`📍 Busca direta:`, regional ? `${regional.name} (${regional.id})` : 'Não encontrada');
      return regional?.id || null;
    }
    
    const regional = regionals.find(r => 
      r.name.toLowerCase() === regionalName.toLowerCase()
    );
    
    console.log(`📍 Regional final encontrada:`, regional ? `${regional.name} (${regional.id})` : 'Não encontrada');
    
    return regional?.id || null;
  } catch (error) {
    console.error('Erro ao buscar ID da regional do evento:', error);
    return null;
  }
}

async function debugRegionalMapping() {
  try {
    console.log('🔍 Debugando mapeamento de regionais...\n');
    
    // Testar o usuário Rio de Janeiro
    const userRegional = 'R. Rio de Janeiro';
    const userRegionalId = await getUserRegionalId(userRegional);
    
    console.log('\n---\n');
    
    // Testar os eventos
    const eventRegionals = ['rj', 'norte', 'nordeste_2'];
    
    for (const eventRegional of eventRegionals) {
      console.log(`\n🎯 Testando evento regional: "${eventRegional}"`);
      const eventRegionalId = await getEventRegionalId(eventRegional);
      
      const canSee = userRegionalId && eventRegionalId && userRegionalId === eventRegionalId;
      console.log(`✅ Pode ver evento? ${canSee ? 'SIM' : 'NÃO'}`);
      console.log(`   User ID: ${userRegionalId}`);
      console.log(`   Event ID: ${eventRegionalId}`);
      console.log('---');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugRegionalMapping();