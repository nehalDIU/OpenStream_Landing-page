// Quick fix script for usage tracking issue
// This script will help diagnose and fix the "3 uses but only works once" problem

const BASE_URL = 'http://localhost:3000' // Update this to match your server port
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

async function checkDatabaseColumns() {
  console.log('\n🔍 Checking if database has usage tracking columns...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes?action=admin`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  })

  if (result.success && result.data.activeCodes.length > 0) {
    const sampleCode = result.data.activeCodes[0]
    const hasUsageTracking = sampleCode.hasOwnProperty('max_uses') && sampleCode.hasOwnProperty('current_uses')
    
    console.log('📊 Database schema check:')
    console.log(`   - Has max_uses column: ${sampleCode.hasOwnProperty('max_uses') ? '✅' : '❌'}`)
    console.log(`   - Has current_uses column: ${sampleCode.hasOwnProperty('current_uses') ? '✅' : '❌'}`)
    console.log(`   - Has prefix column: ${sampleCode.hasOwnProperty('prefix') ? '✅' : '❌'}`)
    console.log(`   - Has auto_expire_on_use column: ${sampleCode.hasOwnProperty('auto_expire_on_use') ? '✅' : '❌'}`)
    
    return hasUsageTracking
  } else {
    console.log('❌ Could not check database schema - no codes found or API error')
    return false
  }
}

async function generateTestCodeWithUsageLimit() {
  console.log('\n🧪 Testing code generation with 3 uses limit...')
  
  const result = await makeRequest(`${BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      action: 'generate',
      duration: 60, // 1 hour
      prefix: 'TEST',
      maxUses: 3,
      autoExpire: false
    })
  })

  if (result.success) {
    console.log('✅ Test code generated successfully:')
    console.log(`   - Code: ${result.data.code}`)
    console.log(`   - Max uses: ${result.data.maxUses || 'Not set (database issue)'}`)
    console.log(`   - Prefix: ${result.data.prefix || 'Not set'}`)
    console.log(`   - Auto expire: ${result.data.autoExpire}`)
    return result.data.code
  } else {
    console.log('❌ Failed to generate test code:', result.data?.error || result.error)
    return null
  }
}

async function testCodeUsage(code, expectedUses = 3) {
  console.log(`\n🔄 Testing code usage: ${code}`)
  console.log(`Expected to work ${expectedUses} times...`)
  
  let successCount = 0
  
  for (let i = 1; i <= expectedUses + 1; i++) {
    console.log(`\n   Attempt ${i}:`)
    
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
      console.log(`   ✅ Use ${i}: SUCCESS`)
      successCount++
    } else {
      console.log(`   ❌ Use ${i}: FAILED - ${result.data?.message || result.error}`)
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log(`\n📊 Usage test results:`)
  console.log(`   - Successful uses: ${successCount}`)
  console.log(`   - Expected uses: ${expectedUses}`)
  
  if (successCount === 1) {
    console.log(`   🔍 DIAGNOSIS: Code only worked once - this indicates:`)
    console.log(`      • Database migration not run (missing usage tracking columns)`)
    console.log(`      • System falling back to one-time use behavior`)
    console.log(`      • Need to run: database/migration-add-usage-tracking.sql`)
  } else if (successCount === expectedUses) {
    console.log(`   ✅ DIAGNOSIS: Usage tracking working correctly!`)
  } else {
    console.log(`   ⚠️ DIAGNOSIS: Unexpected behavior - needs investigation`)
  }
  
  return successCount
}

async function provideSolution() {
  console.log('\n🔧 SOLUTION:')
  console.log('To fix the "3 uses but only works once" issue:')
  console.log('')
  console.log('1. Open Supabase Dashboard (https://supabase.com/dashboard)')
  console.log('2. Select your project')
  console.log('3. Go to "SQL Editor"')
  console.log('4. Click "New Query"')
  console.log('5. Copy and paste this SQL:')
  console.log('')
  console.log('   -- Add usage tracking columns')
  console.log('   ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT NULL;')
  console.log('   ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;')
  console.log('   ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS prefix VARCHAR(4);')
  console.log('   ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS auto_expire_on_use BOOLEAN DEFAULT TRUE;')
  console.log('')
  console.log('   -- Update existing records')
  console.log('   UPDATE access_codes SET current_uses = 0 WHERE current_uses IS NULL;')
  console.log('   UPDATE access_codes SET auto_expire_on_use = TRUE WHERE auto_expire_on_use IS NULL;')
  console.log('')
  console.log('6. Click "Run" to execute the migration')
  console.log('7. Test the usage limits again')
  console.log('')
  console.log('📄 Full migration script available in: database/migration-add-usage-tracking.sql')
}

async function runDiagnostics() {
  console.log('🚀 Usage Tracking Diagnostics')
  console.log('============================')
  
  // Check database schema
  const hasUsageTracking = await checkDatabaseColumns()
  
  // Generate test code
  const testCode = await generateTestCodeWithUsageLimit()
  
  if (testCode) {
    // Test usage
    await testCodeUsage(testCode, 3)
  }
  
  // Provide solution
  await provideSolution()
  
  console.log('\n✨ Diagnostics complete!')
}

// Run diagnostics
runDiagnostics().catch(console.error)
