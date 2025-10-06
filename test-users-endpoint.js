// Script para testar o endpoint /auth/users e ver os dados retornados
const API_BASE_URL = 'http://localhost:4000';

// Token de exemplo - substitua por um token válido
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM3NzQ0NzI4LCJpYXQiOjE3Mzc3NDExMjgsImlzcyI6Imh0dHBzOi8vZGVjb2xhZ2VtLWdmLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5ZjJjMzNkNy1kNzY5LTRhNzgtOTJkNy1lNzJhNzJhNzJhNzIiLCJlbWFpbCI6InRlc3RlQGV4YW1wbGUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJub21lIjoiVGVzdGUgVXNlciIsInJvbGUiOiJzdXBlcl9hZG1pbiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzM3NzQxMTI4fV0sInNlc3Npb25faWQiOiI5ZjJjMzNkNy1kNzY5LTRhNzgtOTJkNy1lNzJhNzJhNzJhNzIifQ.test';

async function testUsersEndpoint() {
  try {
    console.log('🔍 Testando endpoint /auth/users...');
    
    const response = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Erro na resposta:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Detalhes do erro:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Dados recebidos do endpoint:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.users && Array.isArray(data.users)) {
      console.log(`\n📊 Total de usuários: ${data.users.length}`);
      
      data.users.forEach((user, index) => {
        console.log(`\n👤 Usuário ${index + 1}:`);
        console.log(`   Nome: ${user.nome || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Regional: ${user.regional || 'N/A'}`);
        console.log(`   Função: ${user.funcao || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Tipo: ${user.tipo || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error);
  }
}

testUsersEndpoint();