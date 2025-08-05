/**
 * Test script to demonstrate enhanced duration options for access codes
 * This script shows the new long-term duration options and custom duration feature
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here'

// Enhanced duration presets (in minutes)
const ENHANCED_DURATIONS = [
  { label: "5 minutes", value: 5 },
  { label: "10 minutes", value: 10 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "12 hours", value: 720 },
  { label: "24 hours", value: 1440 },
  { label: "3 days", value: 4320 },
  { label: "1 week", value: 10080 },
  { label: "2 weeks", value: 20160 },
  { label: "1 month", value: 43200 },
  { label: "3 months", value: 129600 },
  { label: "6 months", value: 259200 },
  { label: "1 year", value: 525600 }
]

// Custom duration calculation function
function calculateCustomDuration(value, unit) {
  const multipliers = {
    'minutes': 1,
    'hours': 60,
    'days': 1440,
    'weeks': 10080,
    'months': 43200,
    'years': 525600
  }
  return value * (multipliers[unit] || 1)
}

// Format duration for display
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  } else if (minutes < 10080) {
    const days = Math.floor(minutes / 1440)
    return `${days} day${days !== 1 ? 's' : ''}`
  } else if (minutes < 43200) {
    const weeks = Math.floor(minutes / 10080)
    return `${weeks} week${weeks !== 1 ? 's' : ''}`
  } else if (minutes < 525600) {
    const months = Math.floor(minutes / 43200)
    return `${months} month${months !== 1 ? 's' : ''}`
  } else {
    const years = Math.floor(minutes / 525600)
    return `${years} year${years !== 1 ? 's' : ''}`
  }
}

// Test function to generate access code with enhanced duration
async function testEnhancedDuration(duration, description) {
  console.log(`\n🧪 Testing ${description} (${formatDuration(duration)})...`)
  
  try {
    const response = await fetch(`${BASE_URL}/api/access-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        action: 'generate',
        duration: duration,
        prefix: 'TEST',
        autoExpire: false // For long-term codes, make them reusable
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log(`✅ Generated code: ${data.code}`)
      console.log(`⏰ Expires: ${new Date(data.expiresAt).toLocaleString()}`)
      console.log(`📅 Duration: ${formatDuration(duration)}`)
      return data.code
    } else {
      console.log(`❌ Failed: ${data.error || 'Unknown error'}`)
      return null
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`)
    return null
  }
}

// Main test function
async function runEnhancedDurationTests() {
  console.log('🚀 Testing Enhanced Duration Options for Access Codes')
  console.log('=' .repeat(60))

  // Test preset long-term durations
  console.log('\n📋 Testing Preset Long-term Durations:')
  const longTermPresets = ENHANCED_DURATIONS.filter(d => d.value >= 1440) // 1 day or more
  
  for (const preset of longTermPresets.slice(0, 5)) { // Test first 5 long-term presets
    await testEnhancedDuration(preset.value, preset.label)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second between tests
  }

  // Test custom durations
  console.log('\n🎛️ Testing Custom Duration Examples:')
  
  const customTests = [
    { value: 15, unit: 'minutes', description: '15 minutes custom' },
    { value: 6, unit: 'hours', description: '6 hours custom' },
    { value: 10, unit: 'days', description: '10 days custom' },
    { value: 3, unit: 'weeks', description: '3 weeks custom' },
    { value: 2, unit: 'months', description: '2 months custom' }
  ]

  for (const test of customTests) {
    const duration = calculateCustomDuration(test.value, test.unit)
    await testEnhancedDuration(duration, test.description)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Display duration calculation examples
  console.log('\n📊 Duration Calculation Examples:')
  console.log('Custom Input → Minutes → Display Format')
  console.log('-'.repeat(50))
  
  const examples = [
    { input: '2 hours', minutes: 120 },
    { input: '5 days', minutes: 7200 },
    { input: '2 weeks', minutes: 20160 },
    { input: '6 months', minutes: 259200 },
    { input: '1 year', minutes: 525600 }
  ]

  examples.forEach(example => {
    console.log(`${example.input.padEnd(15)} → ${example.minutes.toString().padEnd(8)} → ${formatDuration(example.minutes)}`)
  })

  console.log('\n✨ Enhanced Duration Testing Complete!')
  console.log('\nNew Features Added:')
  console.log('• Extended preset durations up to 1 year')
  console.log('• Custom duration input with unit selection')
  console.log('• Improved duration display formatting')
  console.log('• Long-term access code support')
  console.log('• Better UX for duration selection')
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runEnhancedDurationTests().catch(console.error)
}

module.exports = {
  calculateCustomDuration,
  formatDuration,
  ENHANCED_DURATIONS,
  testEnhancedDuration
}
