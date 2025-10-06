const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:4000';

async function testCalendarAPIs() {
  try {
    console.log('🧪 Testando APIs de calendário...');
    console.log('');
    
    // Fazer login para obter token
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'flavia.ferreira@example.com',
        password: 'senha123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Erro no login');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', loginData.user.nome, 'da regional', loginData.user.regional);
    console.log('');
    
    // Testar API regional (sem parâmetro global)
    console.log('📅 Testando API regional (sem parâmetro global)...');
    const regionalResponse = await fetch(`${API_BASE_URL}/api/calendar-events`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!regionalResponse.ok) {
      throw new Error('Erro na API regional');
    }
    
    const regionalData = await regionalResponse.json();
    console.log(`📊 API Regional retornou ${regionalData.data.length} eventos:`);
    regionalData.data.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.titulo} - Regional: ${event.regional}`);
    });
    console.log('');
    
    // Testar API global (com parâmetro global=true)
    console.log('🌍 Testando API global (com parâmetro global=true)...');
    const globalResponse = await fetch(`${API_BASE_URL}/api/calendar-events?global=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!globalResponse.ok) {
      throw new Error('Erro na API global');
    }
    
    const globalData = await globalResponse.json();
    console.log(`📊 API Global retornou ${globalData.data.length} eventos:`);
    globalData.data.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.titulo} - Regional: ${event.regional}`);
    });
    console.log('');
    
    // Comparar resultados
    console.log('🔍 Comparação:');
    console.log(`- API Regional: ${regionalData.data.length} eventos`);
    console.log(`- API Global: ${globalData.data.length} eventos`);
    
    if (globalData.data.length > regionalData.data.length) {
      console.log('✅ API Global retorna mais eventos que a regional (correto!)');
    } else if (globalData.data.length === regionalData.data.length) {
      console.log('⚠️  APIs retornam o mesmo número de eventos');
    } else {
      console.log('❌ API Global retorna menos eventos que a regional (erro!)');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testCalendarAPIs();