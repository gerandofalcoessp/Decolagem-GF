async function testAuth() {
  try {
    console.log('Testando autenticação...');
    
    // Simular login para obter token
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'eduardo.neto@gerandofalcoes.com',
        password: 'senha123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login bem-sucedido:', data);
      
      if (data.session && data.session.access_token) {
        console.log('Token obtido:', data.session.access_token.substring(0, 20) + '...');
        
        // Testar API de atividades regionais
        const activitiesResponse = await fetch('http://localhost:4000/api/regional-activities', {
          headers: {
            'Authorization': 'Bearer ' + data.session.access_token,
            'Content-Type': 'application/json',
          },
        });
        
        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json();
          console.log('Atividades carregadas:', activities);
        } else {
          console.log('Erro ao carregar atividades:', activitiesResponse.status, await activitiesResponse.text());
        }
      }
    } else {
      console.log('Erro no login:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testAuth();