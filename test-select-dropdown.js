// Simple test to verify the select dropdown functionality
// Run with: node test-select-dropdown.js

const BASE_URL = 'http://localhost:3003'
const ADMIN_TOKEN = 'admin2520'

async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    return { success: response.ok, data, status: response.status }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testBasicCodeGeneration() {
  console.log('\n🔧 Testing basic code generation (no advanced settings)...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      action: 'generate',
      duration: 10
    })
  })

  if (result.success) {
    console.log('✅ Basic code generated successfully:', result.data.code)
    console.log('⏰ Expires at:', new Date(result.data.expiresAt).toLocaleString())
    return result.data.code
  } else {
    console.log('❌ Failed to generate basic code:', result.data?.error || result.error)
    console.log('Status:', result.status)
    return null
  }
}

async function testCodeGenerationWithPrefix() {
  console.log('\n🔧 Testing code generation with prefix only...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      action: 'generate',
      duration: 10,
      prefix: 'TEST'
    })
  })

  if (result.success) {
    console.log('✅ Code with prefix generated successfully:', result.data.code)
    console.log('📝 Prefix:', result.data.prefix)
    return result.data.code
  } else {
    console.log('❌ Failed to generate code with prefix:', result.data?.error || result.error)
    console.log('Status:', result.status)
    return null
  }
}

async function testCodeGenerationWithUsageLimit() {
  console.log('\n🔧 Testing code generation with usage limit (5 uses)...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      action: 'generate',
      duration: 10,
      prefix: 'LIMIT',
      maxUses: 5
    })
  })

  if (result.success) {
    console.log('✅ Code with usage limit generated successfully:', result.data.code)
    console.log('📝 Prefix:', result.data.prefix)
    console.log('🎯 Max uses:', result.data.maxUses)
    return result.data.code
  } else {
    console.log('❌ Failed to generate code with usage limit:', result.data?.error || result.error)
    console.log('Status:', result.status)
    return null
  }
}

async function testAdminDataRetrieval() {
  console.log('\n📊 Testing admin data retrieval...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes?action=admin`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  })

  if (result.success) {
    console.log('✅ Admin data retrieved successfully')
    console.log('📈 Active codes:', result.data.activeCodes.length)
    console.log('📊 Total codes:', result.data.totalCodes)
    
    // Show sample codes
    if (result.data.activeCodes.length > 0) {
      console.log('📝 Sample codes:')
      result.data.activeCodes.slice(0, 3).forEach(code => {
        console.log(`   - ${code.code}: ${code.prefix ? `prefix: ${code.prefix}` : 'no prefix'}`)
      })
    }
    
    return result.data
  } else {
    console.log('❌ Failed to retrieve admin data:', result.data?.error || result.error)
    console.log('Status:', result.status)
    return null
  }
}

async function runSelectDropdownTests() {
  console.log('🚀 Starting Select Dropdown Tests...')
  console.log('📋 Testing if the backend can handle different usage limit values')
  
  // Test 1: Basic code generation (should work)
  await testBasicCodeGeneration()
  
  // Test 2: Code with prefix (should work)
  await testCodeGenerationWithPrefix()
  
  // Test 3: Code with usage limit (may fail if migration not run)
  await testCodeGenerationWithUsageLimit()
  
  // Test 4: Admin data retrieval
  await testAdminDataRetrieval()
  
  console.log('\n✨ Select Dropdown Tests Complete!')
  console.log('\n📋 Summary:')
  console.log('   - If basic generation works: Select dropdown backend is ready')
  console.log('   - If usage limit fails: Database migration needed')
  console.log('   - Check the admin page UI to verify dropdown is visible')
  console.log('   - The dropdown should show: Unlimited, 1 use, 3 uses, 5 uses, etc.')
}

// Run the tests
runSelectDropdownTests().catch(console.error)
