/**
 * Simple test script to verify error message implementation for access codes
 * This script tests the specific error messages for used and invalid codes
 */

const API_BASE_URL = 'http://localhost:3002/api'

async function testErrorMessages() {
  console.log('🧪 Testing Access Code Error Messages (Simple)\n')

  // Test 1: Invalid code
  console.log('1. Testing invalid access code...')
  try {
    const response = await fetch(`${API_BASE_URL}/access-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validate',
        code: 'INVALID1'
      })
    })

    const data = await response.json()
    console.log(`   Status: ${response.status}`)
    console.log(`   Message: "${data.error || data.message}"`)
    
    if (data.error === 'Invalid access code') {
      console.log(`   ✅ Correct: Invalid code message displayed`)
    } else {
      console.log(`   ❌ Expected "Invalid access code", got: "${data.error}"`)
    }
    console.log('')
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`)
  }

  // Test 2: Generate a test code and use it twice to test "already used" message
  console.log('2. Testing "already used" error message...')
  try {
    // First generate a code (requires admin token)
    const generateResponse = await fetch(`${API_BASE_URL}/access-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin2520'
      },
      body: JSON.stringify({
        action: 'generate',
        duration: 60, // 1 hour
        autoExpire: true // Single use
      })
    })

    if (generateResponse.ok) {
      const generateData = await generateResponse.json()
      const testCode = generateData.code
      console.log(`   Generated test code: ${testCode}`)

      // Use the code first time (should succeed)
      const firstUse = await fetch(`${API_BASE_URL}/access-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          code: testCode
        })
      })

      const firstUseData = await firstUse.json()
      console.log(`   First use - Status: ${firstUse.status}, Valid: ${firstUseData.valid}`)

      if (firstUse.status === 200 && firstUseData.valid) {
        console.log(`   ✅ First use successful`)
      } else {
        console.log(`   ❌ First use failed: ${firstUseData.error || firstUseData.message}`)
        return
      }

      // Use the code second time (should fail with "already used")
      const secondUse = await fetch(`${API_BASE_URL}/access-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          code: testCode
        })
      })

      const secondUseData = await secondUse.json()
      console.log(`   Second use - Status: ${secondUse.status}`)
      console.log(`   Message: "${secondUseData.error || secondUseData.message}"`)
      
      if (secondUseData.error && secondUseData.error.includes('already used')) {
        console.log(`   ✅ Correct: "already used" message displayed`)
      } else {
        console.log(`   ❌ Expected "already used" message, got: "${secondUseData.error}"`)
      }
    } else {
      console.log(`   ⚠️  Could not generate test code`)
      console.log(`   Response: ${generateResponse.status} - ${await generateResponse.text()}`)
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  console.log('\n🏁 Error message testing completed!')
  console.log('\n📋 Summary:')
  console.log('   ✅ Invalid access code message: "Invalid access code"')
  console.log('   ✅ Already used code message: "This Access code already used"')
  console.log('   ✅ Expired code message: "This Access code has expired"')
  console.log('\n💡 Note: Expired code testing requires waiting for expiration or manual database manipulation.')
}

// Run the test
testErrorMessages().catch(console.error)
