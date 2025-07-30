// Test script for Advanced Settings functionality
// Run with: node test-advanced-settings.js

const BASE_URL = 'http://localhost:3001'
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

async function testGenerateCodeWithPrefix() {
  console.log('\n🔧 Testing code generation with prefix...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      action: 'generate',
      duration: 10,
      prefix: 'VIP',
      autoExpire: true
    })
  })

  if (result.success) {
    console.log('✅ Code with prefix generated successfully:', result.data.code)
    console.log('📝 Prefix:', result.data.prefix)
    console.log('🔄 Auto-expire:', result.data.autoExpire)
    console.log('⏰ Expires at:', new Date(result.data.expiresAt).toLocaleString())
    return result.data.code
  } else {
    console.log('❌ Failed to generate code with prefix:', result.data?.error || result.error)
    return null
  }
}

async function testGenerateReusableCode() {
  console.log('\n🔧 Testing reusable code generation...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      action: 'generate',
      duration: 10,
      prefix: 'TEST',
      autoExpire: false
    })
  })

  if (result.success) {
    console.log('✅ Reusable code generated successfully:', result.data.code)
    console.log('📝 Prefix:', result.data.prefix)
    console.log('🔄 Auto-expire:', result.data.autoExpire)
    console.log('⏰ Expires at:', new Date(result.data.expiresAt).toLocaleString())
    return result.data.code
  } else {
    console.log('❌ Failed to generate reusable code:', result.data?.error || result.error)
    return null
  }
}

async function testValidateCode(code, shouldWork = true) {
  console.log(`\n🔍 Testing code validation: ${code}`)
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'validate',
      code: code
    })
  })

  if (result.success && result.data.valid) {
    console.log('✅ Code validated successfully')
    console.log('📝 Message:', result.data.message)
    return true
  } else {
    console.log('❌ Code validation failed:', result.data?.error || result.error)
    return false
  }
}

async function testGetAdminData() {
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
    
    // Check if advanced settings are included
    const codesWithAdvancedSettings = result.data.activeCodes.filter(code => 
      code.hasOwnProperty('prefix') && code.hasOwnProperty('auto_expire_on_use')
    )
    console.log('🔧 Codes with advanced settings:', codesWithAdvancedSettings.length)
    
    if (codesWithAdvancedSettings.length > 0) {
      console.log('📝 Sample code with advanced settings:', {
        code: codesWithAdvancedSettings[0].code,
        prefix: codesWithAdvancedSettings[0].prefix,
        auto_expire_on_use: codesWithAdvancedSettings[0].auto_expire_on_use
      })
    }
    
    return result.data
  } else {
    console.log('❌ Failed to retrieve admin data:', result.data?.error || result.error)
    return null
  }
}

async function runTests() {
  console.log('🚀 Starting Advanced Settings Tests...')
  
  // Test 1: Generate code with prefix and auto-expire
  const prefixCode = await testGenerateCodeWithPrefix()
  
  // Test 2: Generate reusable code
  const reusableCode = await testGenerateReusableCode()
  
  // Test 3: Validate the prefix code
  if (prefixCode) {
    await testValidateCode(prefixCode)
    // Try to validate again (should fail for auto-expire codes)
    console.log('\n🔄 Testing auto-expire functionality...')
    await testValidateCode(prefixCode, false)
  }
  
  // Test 4: Validate the reusable code multiple times
  if (reusableCode) {
    await testValidateCode(reusableCode)
    // Try to validate again (should work for reusable codes)
    console.log('\n🔄 Testing reusable functionality...')
    await testValidateCode(reusableCode, true)
  }
  
  // Test 5: Check admin data includes advanced settings
  await testGetAdminData()
  
  console.log('\n✨ Advanced Settings Tests Complete!')
}

// Run the tests
runTests().catch(console.error)
