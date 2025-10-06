const fetch = require("node-fetch");

async function testGoalsAPI() {
  try {
    console.log("🔍 Testando API de metas...");
    
    // Fazer login primeiro
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "teste@teste.com",
        password: "123456"
      })
    });
    
    const loginData = await loginResponse.json();
    console.log("✅ Login realizado:", loginData.success);
    
    if (!loginData.success) {
      console.log("❌ Falha no login:", loginData);
      return;
    }
    
    const token = loginData.data.token;
    console.log("🔑 Token obtido");
    
    // Buscar metas
    const goalsResponse = await fetch("http://localhost:3000/api/goals", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    const goalsData = await goalsResponse.json();
    console.log("📊 Resposta da API de metas:", JSON.stringify(goalsData, null, 2));
    
    if (goalsData.data && goalsData.data.length > 0) {
      console.log("🎯 Primeira meta (dados brutos):");
      console.log(JSON.stringify(goalsData.data[0], null, 2));
      
      console.log("📋 Campos disponíveis na primeira meta:");
      Object.keys(goalsData.data[0]).forEach(key => {
        console.log(`  - ${key}: ${goalsData.data[0][key]}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

testGoalsAPI();