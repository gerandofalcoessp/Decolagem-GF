// Debug script to test the actual API response
const fetch = require('node-fetch');

async function testApiResponse() {
    try {
        console.log('🔍 Testing API response from /api/atividades...\n');
        
        // Test the API endpoint directly
        const response = await fetch('http://localhost:3000/api/atividades', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add any required auth headers if needed
            }
        });
        
        if (!response.ok) {
            console.error('❌ API request failed:', response.status, response.statusText);
            return;
        }
        
        const data = await response.json();
        console.log('📊 API Response Structure:');
        console.log('- Type:', typeof data);
        console.log('- Is Array:', Array.isArray(data));
        console.log('- Keys:', Object.keys(data));
        
        if (data.data) {
            console.log('- data.data type:', typeof data.data);
            console.log('- data.data is Array:', Array.isArray(data.data));
            console.log('- data.data length:', data.data?.length || 0);
        }
        
        // Look for activities with "Famílias Embarcadas Decolagem" in any field
        let activities = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        
        console.log('\n🔍 Searching for "Famílias Embarcadas Decolagem" activities:');
        console.log('Total activities to search:', activities.length);
        
        const familiesActivities = activities.filter(activity => {
            const searchTerm = 'Famílias Embarcadas Decolagem';
            return (
                activity.atividade_label?.includes(searchTerm) ||
                activity.titulo?.includes(searchTerm) ||
                activity.tipo?.includes(searchTerm) ||
                activity.categoria?.includes(searchTerm)
            );
        });
        
        console.log('Found activities:', familiesActivities.length);
        
        if (familiesActivities.length > 0) {
            console.log('\n📋 Sample activities found:');
            familiesActivities.slice(0, 3).forEach((activity, index) => {
                console.log(`Activity ${index + 1}:`, {
                    id: activity.id,
                    titulo: activity.titulo,
                    atividade_label: activity.atividade_label,
                    tipo: activity.tipo,
                    quantidade: activity.quantidade,
                    regional: activity.regional
                });
            });
            
            // Calculate total
            const total = familiesActivities.reduce((sum, activity) => {
                const quantidade = parseInt(activity.quantidade) || 0;
                return sum + quantidade;
            }, 0);
            
            console.log('\n🧮 Total calculation:');
            console.log('Sum of quantities:', total);
        } else {
            console.log('\n❌ No activities found matching "Famílias Embarcadas Decolagem"');
            
            // Show sample of all activities to understand the data structure
            console.log('\n📋 Sample of all activities (first 3):');
            activities.slice(0, 3).forEach((activity, index) => {
                console.log(`Activity ${index + 1}:`, {
                    id: activity.id,
                    titulo: activity.titulo,
                    atividade_label: activity.atividade_label,
                    tipo: activity.tipo,
                    quantidade: activity.quantidade,
                    regional: activity.regional
                });
            });
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

testApiResponse();