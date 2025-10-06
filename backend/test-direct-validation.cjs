const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDirectValidation() {
  try {
    console.log('🧪 Testing responsavel_id validation directly...');
    
    // Get a member_id first
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .limit(1)
      .single();
    
    if (memberError || !member) {
      console.error('❌ Could not find a member:', memberError);
      return;
    }
    
    console.log('✅ Found member_id:', member.id);
    
    // Test 1: Invalid responsavel_id (email) - should be converted to null
    console.log('\n📤 Test 1: Invalid responsavel_id (email)');
    
    let testData = {
      title: 'Test Activity 1',
      description: 'Testing validation with invalid responsavel_id',
      type: 'reuniao',
      activity_date: '2025-01-25',
      responsavel_id: 'invalid-email@example.com', // Invalid - should be converted to null
      regional: 'nacional',
      member_id: member.id
    };
    
    // Apply the same validation logic as the backend
    if (testData.responsavel_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(testData.responsavel_id)) {
        console.log('🔄 Converting invalid responsavel_id to null');
        testData.responsavel_id = null;
      }
    }
    
    const { data: result1, error: error1 } = await supabase
      .from('regional_activities')
      .insert(testData)
      .select('*')
      .single();
    
    if (error1) {
      console.error('❌ Test 1 failed:', error1.message);
    } else {
      console.log('✅ Test 1 successful');
      console.log('📊 responsavel_id in result:', result1.responsavel_id);
    }
    
    // Test 2: Valid UUID responsavel_id
    console.log('\n📤 Test 2: Valid UUID responsavel_id');
    
    // Get a valid user UUID
    const { data: validUser, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1)
      .single();
    
    if (userError || !validUser) {
      console.log('⚠️ No valid user found for Test 2');
    } else {
      testData = {
        title: 'Test Activity 2',
        description: 'Testing validation with valid responsavel_id',
        type: 'reuniao',
        activity_date: '2025-01-25',
        responsavel_id: validUser.id, // Valid UUID
        regional: 'nacional',
        member_id: member.id
      };
      
      // Apply validation
      if (testData.responsavel_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(testData.responsavel_id)) {
          testData.responsavel_id = null;
        }
      }
      
      const { data: result2, error: error2 } = await supabase
        .from('regional_activities')
        .insert(testData)
        .select('*')
        .single();
      
      if (error2) {
        console.error('❌ Test 2 failed:', error2.message);
      } else {
        console.log('✅ Test 2 successful');
        console.log('📊 responsavel_id in result:', result2.responsavel_id);
      }
    }
    
    console.log('\n🎯 Validation tests completed');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testDirectValidation();