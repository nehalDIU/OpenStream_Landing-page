// Simple test script to create sample user data
const fetch = require('node-fetch');

async function createSampleData() {
  try {
    console.log('🚀 Creating sample user data...');
    
    const response = await fetch('http://localhost:3001/api/admin/test-data', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin2520',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Success:', result);
    
    // Now check the users API
    console.log('\n📊 Checking users data...');
    const usersResponse = await fetch('http://localhost:3001/api/admin/users?range=7d', {
      headers: {
        'Authorization': 'Bearer admin2520'
      }
    });

    if (!usersResponse.ok) {
      throw new Error(`HTTP error! status: ${usersResponse.status}`);
    }

    const usersData = await usersResponse.json();
    console.log('📈 Users data:', {
      totalUsers: usersData.stats?.totalUsers || 0,
      activeUsers: usersData.stats?.activeUsers || 0,
      usersCount: usersData.users?.length || 0
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createSampleData();
