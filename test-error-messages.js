/**
 * Test script to verify error message implementation for access codes
 * This script tests the specific error messages for used and expired codes
 */

const API_BASE_URL = 'http://localhost:3002/api'

async function testErrorMessages() {
  console.log('🧪 Testing Access Code Error Messages\n')

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
    console.log(`   ✅ Expected: Invalid access code message\n`)
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
      console.log(`   ⚠️  Could not generate test code (admin token may be incorrect)`)
      console.log(`   Response: ${generateResponse.status} - ${await generateResponse.text()}`)
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  console.log('\n3. Testing expired code message...')
  try {
    // Generate a code with very short expiration (1 minute)
    const generateResponse = await fetch(`${API_BASE_URL}/access-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin2520'
      },
      body: JSON.stringify({
        action: 'generate',
        duration: 1, // 1 minute duration
        autoExpire: true
      })
    })

    if (generateResponse.ok) {
      const generateData = await generateResponse.json()
      const testCode = generateData.code
      console.log(`   Generated short-lived test code: ${testCode}`)

      // Wait for the code to expire (1 minute + buffer)
      console.log(`   Waiting for code to expire (65 seconds)...`)
      await new Promise(resolve => setTimeout(resolve, 65000)) // Wait 65 seconds

      // Try to use the expired code
      const expiredUse = await fetch(`${API_BASE_URL}/access-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          code: testCode
        })
      })

      const expiredUseData = await expiredUse.json()
      console.log(`   Status: ${expiredUse.status}`)
      console.log(`   Message: "${expiredUseData.error || expiredUseData.message}"`)
      
      if (expiredUseData.error && expiredUseData.error.includes('expired')) {
        console.log(`   ✅ Correct: "expired" message displayed`)
      } else {
        console.log(`   ❌ Expected "expired" message, got: "${expiredUseData.error}"`)
      }
    } else {
      console.log(`   ⚠️  Could not generate test code (admin token may be incorrect)`)
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  console.log('\n🏁 Error message testing completed!')
}

// Run the test
testErrorMessages().catch(console.error)
