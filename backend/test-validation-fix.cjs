// Using native fetch (Node.js 18+)

async function testValidation() {
  try {
    console.log('🧪 Testing backend validation for responsavel_id...');
    
    // Get auth token first
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste@decolagem.com',
        password: 'teste123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed, status:', loginResponse.status);
      const loginError = await loginResponse.json();
      console.log('Login error:', loginError);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Test with invalid responsavel_id (email)
    const testData = {
      title: 'Test Activity Validation',
      description: 'Testing responsavel_id validation',
      type: 'reuniao',
      activity_date: '2025-01-25',
      responsavel_id: 'invalid-email@example.com', // Invalid - should be converted to null
      regional: 'nacional'
    };
    
    console.log('📤 Testing with invalid responsavel_id:', testData.responsavel_id);
    
    const response = await fetch('http://localhost:3001/api/regional-activities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Request successful - validation working correctly');
      console.log('📊 Created activity:', result.data);
      console.log('🔍 responsavel_id in result:', result.data.responsavel_id);
      
      if (result.data.responsavel_id === null) {
        console.log('✅ Validation working: invalid responsavel_id was converted to null');
      } else {
        console.log('❌ Validation issue: responsavel_id should be null but is:', result.data.responsavel_id);
      }
    } else {
      console.log('❌ Request failed:', response.status);
      console.log('Error details:', result);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testValidation();