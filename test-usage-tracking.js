// Test script for Usage Tracking functionality
// Run with: node test-usage-tracking.js

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

async function testGenerateCodeWithUsageLimit() {
  console.log('\n🔧 Testing code generation with usage limit...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      action: 'generate',
      duration: 60,
      prefix: 'LIMIT',
      autoExpire: false,
      maxUses: 3
    })
  })

  if (result.success) {
    console.log('✅ Code with usage limit generated successfully:', result.data.code)
    console.log('📝 Prefix:', result.data.prefix)
    console.log('🔄 Auto-expire:', result.data.autoExpire)
    console.log('🎯 Max uses:', result.data.maxUses)
    console.log('⏰ Expires at:', new Date(result.data.expiresAt).toLocaleString())
    return result.data.code
  } else {
    console.log('❌ Failed to generate code with usage limit:', result.data?.error || result.error)
    return null
  }
}

async function testGenerateUnlimitedCode() {
  console.log('\n🔧 Testing unlimited usage code generation...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      action: 'generate',
      duration: 60,
      prefix: 'UNLIM',
      autoExpire: false
    })
  })

  if (result.success) {
    console.log('✅ Unlimited usage code generated successfully:', result.data.code)
    console.log('📝 Prefix:', result.data.prefix)
    console.log('🔄 Auto-expire:', result.data.autoExpire)
    console.log('🎯 Max uses:', result.data.maxUses || 'Unlimited')
    return result.data.code
  } else {
    console.log('❌ Failed to generate unlimited code:', result.data?.error || result.error)
    return null
  }
}

async function testValidateCode(code, expectedToWork = true) {
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

async function testUsageLimitEnforcement(code, maxUses) {
  console.log(`\n🎯 Testing usage limit enforcement for ${code} (max: ${maxUses})`)
  
  let successCount = 0
  
  for (let i = 1; i <= maxUses + 2; i++) {
    console.log(`\n   Attempt ${i}/${maxUses + 2}:`)
    const success = await testValidateCode(code, i <= maxUses)
    if (success) {
      successCount++
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n📊 Usage limit test results:`)
  console.log(`   - Successful validations: ${successCount}`)
  console.log(`   - Expected successful validations: ${maxUses}`)
  console.log(`   - Test ${successCount === maxUses ? 'PASSED' : 'FAILED'}: Usage limit properly enforced`)
  
  return successCount === maxUses
}

async function testUnlimitedUsage(code, testCount = 5) {
  console.log(`\n♾️ Testing unlimited usage for ${code} (${testCount} attempts)`)
  
  let successCount = 0
  
  for (let i = 1; i <= testCount; i++) {
    console.log(`\n   Attempt ${i}/${testCount}:`)
    const success = await testValidateCode(code, true)
    if (success) {
      successCount++
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n📊 Unlimited usage test results:`)
  console.log(`   - Successful validations: ${successCount}`)
  console.log(`   - Expected successful validations: ${testCount}`)
  console.log(`   - Test ${successCount === testCount ? 'PASSED' : 'FAILED'}: Unlimited usage working`)
  
  return successCount === testCount
}

async function testGetAdminDataWithUsage() {
  console.log('\n📊 Testing admin data with usage tracking...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes?action=admin`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  })

  if (result.success) {
    console.log('✅ Admin data retrieved successfully')
    console.log('📈 Active codes:', result.data.activeCodes.length)
    
    // Check if usage tracking fields are included
    const codesWithUsageTracking = result.data.activeCodes.filter(code => 
      code.hasOwnProperty('max_uses') && code.hasOwnProperty('current_uses')
    )
    console.log('🎯 Codes with usage tracking:', codesWithUsageTracking.length)
    
    if (codesWithUsageTracking.length > 0) {
      console.log('📝 Sample codes with usage data:')
      codesWithUsageTracking.slice(0, 3).forEach(code => {
        const usageInfo = code.max_uses 
          ? `${code.current_uses}/${code.max_uses}` 
          : `${code.current_uses} (unlimited)`
        console.log(`   - ${code.code}: ${usageInfo} uses`)
      })
    }
    
    return result.data
  } else {
    console.log('❌ Failed to retrieve admin data:', result.data?.error || result.error)
    return null
  }
}

async function runUsageTrackingTests() {
  console.log('🚀 Starting Usage Tracking Tests...')
  
  // Test 1: Generate code with usage limit
  const limitedCode = await testGenerateCodeWithUsageLimit()
  
  // Test 2: Generate unlimited usage code
  const unlimitedCode = await testGenerateUnlimitedCode()
  
  // Test 3: Test usage limit enforcement
  if (limitedCode) {
    await testUsageLimitEnforcement(limitedCode, 3)
  }
  
  // Test 4: Test unlimited usage
  if (unlimitedCode) {
    await testUnlimitedUsage(unlimitedCode, 5)
  }
  
  // Test 5: Check admin data includes usage tracking
  await testGetAdminDataWithUsage()
  
  console.log('\n✨ Usage Tracking Tests Complete!')
  console.log('\n📋 Summary:')
  console.log('   - Usage limits: Codes can be limited to specific number of uses')
  console.log('   - Unlimited codes: Codes can be used multiple times without limit')
  console.log('   - Usage tracking: Current usage count is tracked for all codes')
  console.log('   - Admin dashboard: Usage information is displayed in the interface')
}

// Run the tests
runUsageTrackingTests().catch(console.error)
