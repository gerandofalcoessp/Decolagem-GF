// Script para testar a API de exclusão de atividades regionais
const https = require('https');
const http = require('http');

async function testDeleteAPI() {
  try {
    // Primeiro, vamos buscar uma atividade para testar
    console.log('🔍 Buscando atividades para teste...');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW4iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDB9.test'; // Token de teste
    
    const listResponse = await fetch('http://localhost:3000/api/regional-activities', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      console.error('❌ Erro ao buscar atividades:', listResponse.status, listResponse.statusText);
      return;
    }

    const activities = await listResponse.json();
    console.log('📋 Atividades encontradas:', activities.length);

    if (activities.length === 0) {
      console.log('⚠️ Nenhuma atividade encontrada para testar');
      return;
    }

    // Pegar a primeira atividade para teste
    const testActivity = activities[0];
    console.log('🎯 Testando exclusão da atividade:', testActivity.id);

    // Testar a exclusão
    const deleteResponse = await fetch(`http://localhost:3000/api/regional-activities/${testActivity.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Status da resposta DELETE:', deleteResponse.status);
    
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error('❌ Erro na exclusão:', errorText);
      return;
    }

    const deleteResult = await deleteResponse.json();
    console.log('✅ Resultado da exclusão:', deleteResult);

    // Verificar se a atividade foi realmente excluída
    const verifyResponse = await fetch(`http://localhost:3000/api/regional-activities/${testActivity.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (verifyResponse.status === 404) {
      console.log('✅ Atividade foi excluída com sucesso do banco de dados');
    } else {
      console.log('⚠️ Atividade ainda existe no banco de dados');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testDeleteAPI();