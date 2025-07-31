// Simple test script to verify admin authentication
const testAdminAuth = async () => {
  const adminToken = 'admin2520';
  
  try {
    console.log('Testing admin authentication...');
    console.log('Admin token:', adminToken);
    
    const response = await fetch('http://localhost:3001/api/access-codes?action=admin', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Authentication successful!');
      console.log('Data received:', Object.keys(data));
    } else {
      const errorText = await response.text();
      console.log('Authentication failed!');
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error during authentication test:', error);
  }
};

// Run the test
testAdminAuth();
