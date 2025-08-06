import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Direct Supabase client for bypassing DatabaseService
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Admin authentication (using same token as existing system)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin2520'

function isValidAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${ADMIN_TOKEN}`
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Checking database connection and data...')

    // Test database connection and get data
    const results = {
      supabaseConfig: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      },
      connectionTest: null,
      accessCodes: null,
      usageLogs: null,
      error: null
    }

    try {
      // Test 1: Get access codes
      console.log('📝 Fetching access codes...')
      const accessCodes = await DatabaseService.getActiveCodes()
      results.accessCodes = {
        count: accessCodes.length,
        sample: accessCodes.slice(0, 3).map(code => ({
          code: code.code,
          created_at: code.created_at,
          expires_at: code.expires_at,
          is_active: code.is_active
        }))
      }
      console.log(`✅ Found ${accessCodes.length} access codes`)

      // Test 2: Get usage logs
      console.log('📊 Fetching usage logs...')
      const usageLogs = await DatabaseService.getUsageLogs(100)
      const logsWithIP = usageLogs.filter(log => log.ip_address && log.ip_address.trim() !== '')
      
      results.usageLogs = {
        total: usageLogs.length,
        withIP: logsWithIP.length,
        uniqueIPs: new Set(logsWithIP.map(log => log.ip_address)).size,
        sample: logsWithIP.slice(0, 5).map(log => ({
          code: log.code,
          action: log.action,
          timestamp: log.timestamp,
          ip_address: log.ip_address,
          user_agent: log.user_agent ? log.user_agent.substring(0, 50) + '...' : null
        }))
      }
      console.log(`✅ Found ${usageLogs.length} usage logs (${logsWithIP.length} with IP)`)

      results.connectionTest = 'Success'

    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      results.error = dbError.message
      results.connectionTest = 'Failed'
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check database status', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'create-sample-data') {
      console.log('🚀 Creating sample data directly in Supabase...')

      // Create sample access codes and usage logs
      const sampleData = []
      const now = new Date()

      // Sample IPs and user agents
      const sampleIPs = [
        '192.168.1.100',
        '10.0.0.50', 
        '172.16.0.25',
        '203.0.113.10',
        '198.51.100.15'
      ]

      const sampleUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0'
      ]

      // First, create some access codes
      const createdCodes = []
      for (let i = 1; i <= 3; i++) {
        try {
          const code = await DatabaseService.generateAccessCode({
            durationMinutes: 60,
            prefix: 'DEMO'
          })
          createdCodes.push(code.code)
          console.log(`✅ Created access code: ${code.code}`)
        } catch (error) {
          console.log(`⚠️ Code creation failed: ${error.message}`)
        }
      }

      // Create usage logs for the past few days
      let logsCreated = 0
      for (let day = 0; day < 5; day++) {
        const date = new Date(now)
        date.setDate(date.getDate() - day)

        for (let i = 0; i < 3; i++) {
          const randomIP = sampleIPs[Math.floor(Math.random() * sampleIPs.length)]
          const randomUA = sampleUserAgents[Math.floor(Math.random() * sampleUserAgents.length)]
          const randomCode = createdCodes[Math.floor(Math.random() * createdCodes.length)] || 'DEMO001'

          const logTime = new Date(date)
          logTime.setHours(Math.floor(Math.random() * 24))

          try {
            const { error } = await supabase
              .from('usage_logs')
              .insert({
                code: randomCode,
                action: 'used',
                details: 'Sample user activity - code validated',
                ip_address: randomIP,
                user_agent: randomUA,
                timestamp: logTime.toISOString()
              })

            if (error) {
              console.error('Supabase error:', error)
            } else {
              logsCreated++
            }
          } catch (error) {
            console.error('Error creating usage log:', error)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdCodes.length} access codes and ${logsCreated} usage logs`,
        createdCodes,
        logsCreated
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
}
