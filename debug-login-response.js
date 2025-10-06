async function debugLoginResponse() {
  try {
    console.log("🔍 Debugando resposta do login...");
    
    // Fazer login
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "teste@teste.com",
        password: "123456"
      })
    });
    
    console.log("📊 Status da resposta:", loginResponse.status);
    console.log("📊 Headers da resposta:", Object.fromEntries(loginResponse.headers.entries()));
    
    const loginData = await loginResponse.json();
    console.log("📦 Dados completos do login:");
    console.log(JSON.stringify(loginData, null, 2));
    
    // Verificar estrutura do token
    if (loginData.success) {
      console.log("✅ Login bem-sucedido");
      
      if (loginData.data && loginData.data.token) {
        console.log("🔑 Token encontrado em data.token:", loginData.data.token.substring(0, 50) + "...");
      }
      
      if (loginData.session && loginData.session.access_token) {
        console.log("🔑 Token encontrado em session.access_token:", loginData.session.access_token.substring(0, 50) + "...");
      }
      
      if (loginData.token) {
        console.log("🔑 Token encontrado diretamente:", loginData.token.substring(0, 50) + "...");
      }
      
      // Testar qual token funciona
      const possibleTokens = [
        loginData.data?.token,
        loginData.session?.access_token,
        loginData.token
      ].filter(Boolean);
      
      console.log("🧪 Testando tokens possíveis...");
      
      for (let i = 0; i < possibleTokens.length; i++) {
        const token = possibleTokens[i];
        console.log(`\n🔍 Testando token ${i + 1}: ${token.substring(0, 30)}...`);
        
        try {
          const testResponse = await fetch("http://localhost:3000/api/goals", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          
          console.log(`📊 Status com token ${i + 1}:`, testResponse.status);
          
          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log(`✅ Token ${i + 1} funciona! Metas encontradas:`, testData.data?.length || 0);
          } else {
            const errorData = await testResponse.json();
            console.log(`❌ Token ${i + 1} falhou:`, errorData);
          }
        } catch (error) {
          console.log(`❌ Erro ao testar token ${i + 1}:`, error.message);
        }
      }
    } else {
      console.log("❌ Login falhou:", loginData);
    }
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

debugLoginResponse();