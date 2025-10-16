// Script para verificar o status de autenticação
console.log('🔍 Verificando status de autenticação...');
console.log('');

// Instruções para executar no console do navegador
console.log('Execute os seguintes comandos no console do navegador (F12):');
console.log('');
console.log('1. Verificar se há token no localStorage:');
console.log('   localStorage.getItem("token")');
console.log('');
console.log('2. Verificar se há dados do usuário:');
console.log('   localStorage.getItem("user")');
console.log('');
console.log('3. Verificar se há outros dados de auth:');
console.log('   Object.keys(localStorage)');
console.log('');
console.log('4. Testar uma requisição manual:');
console.log(`   fetch('/api/atividades', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token'),
       'Content-Type': 'application/json'
     }
   }).then(r => r.json()).then(console.log)`);
console.log('');
console.log('Se não houver token, você precisa fazer login primeiro!');