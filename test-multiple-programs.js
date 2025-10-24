const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "./backend/.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMultipleProgramCounting() {
  console.log("🧪 Testando contabilização múltipla de programas...\n");
  
  try {
    // 1. Buscar instituições com múltiplos programas
    const { data: instituicoes, error } = await supabase
      .from("instituicoes")
      .select("id, nome, programa, programas, status")
      .eq("status", "ativa");
      
    if (error) {
      console.log("❌ Erro ao buscar instituições:", error.message);
      return;
    }
    
    console.log(`📊 Total de instituições ativas: ${instituicoes.length}\n`);
    
    // 2. Analisar instituições com múltiplos programas
    const instituicoesMultiplos = instituicoes.filter(inst => 
      inst.programas && Array.isArray(inst.programas) && inst.programas.length > 1
    );
    
    console.log(`🔄 Instituições com múltiplos programas: ${instituicoesMultiplos.length}`);
    
    if (instituicoesMultiplos.length > 0) {
      console.log("\nDetalhes das instituições com múltiplos programas:");
      instituicoesMultiplos.forEach((inst, i) => {
        console.log(`  ${i+1}. ${inst.nome}`);
        console.log(`     Programa único: ${inst.programa || "null"}`);
        console.log(`     Programas array: [${inst.programas.join(", ")}]`);
      });
    }
    
    // 3. Testar o endpoint de estatísticas
    console.log("\n📈 Testando endpoint /api/instituicoes/stats...");
    
    const response = await fetch("http://localhost:4000/api/instituicoes/stats", {
      headers: {
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!response.ok) {
      console.log("❌ Erro na requisição:", response.status, response.statusText);
      return;
    }
    
    const stats = await response.json();
    
    console.log("✅ Estatísticas obtidas:");
    console.log(`   ONGs Maras: ${stats.resumo?.ongsMaras || 0}`);
    console.log(`   ONGs Decolagem: ${stats.resumo?.ongsDecolagem || 0}`);
    console.log(`   ONGs Microcrédito: ${stats.resumo?.ongsMicrocredito || 0}`);
    
    // 4. Contagem manual para comparação
    console.log("\n🔍 Contagem manual para comparação:");
    
    let marasCount = 0;
    let decolagemCount = 0;
    let microcreditoCount = 0;
    
    instituicoes.forEach(inst => {
      const programasArray = inst.programas && Array.isArray(inst.programas) && inst.programas.length > 0 
        ? inst.programas 
        : (inst.programa ? [inst.programa] : []);
      
      if (programasArray.includes("as_maras")) marasCount++;
      if (programasArray.includes("decolagem")) decolagemCount++;
      if (programasArray.includes("microcredito")) microcreditoCount++;
    });
    
    console.log(`   Contagem manual - ONGs Maras: ${marasCount}`);
    console.log(`   Contagem manual - ONGs Decolagem: ${decolagemCount}`);
    console.log(`   Contagem manual - ONGs Microcrédito: ${microcreditoCount}`);
    
    // 5. Verificar se as contagens coincidem
    console.log("\n✅ Verificação:");
    console.log(`   Maras: API=${stats.resumo?.ongsMaras || 0}, Manual=${marasCount} ${(stats.resumo?.ongsMaras || 0) === marasCount ? "✅" : "❌"}`);
    console.log(`   Decolagem: API=${stats.resumo?.ongsDecolagem || 0}, Manual=${decolagemCount} ${(stats.resumo?.ongsDecolagem || 0) === decolagemCount ? "✅" : "❌"}`);
    console.log(`   Microcrédito: API=${stats.resumo?.ongsMicrocredito || 0}, Manual=${microcreditoCount} ${(stats.resumo?.ongsMicrocredito || 0) === microcreditoCount ? "✅" : "❌"}`);
    
  } catch (error) {
    console.log("❌ Erro no teste:", error.message);
  }
}

testMultipleProgramCounting();