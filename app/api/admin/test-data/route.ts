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

// Sample test data
const sampleIPs = [
  '192.168.1.100',
  '10.0.0.50',
  '172.16.0.25',
  '203.0.113.10',
  '198.51.100.15',
  '192.0.2.30'
]

const sampleUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0'
]

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 Generating test user activity data...')

    // Generate some test access codes first
    const testCodes = []
    for (let i = 1; i <= 5; i++) {
      const code = `TEST${i.toString().padStart(3, '0')}X`
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      try {
        const generatedCode = await DatabaseService.generateAccessCode({
          durationMinutes: 60,
          prefix: 'TEST',
          autoExpireOnUse: false,
          maxUses: 10
        })
        testCodes.push(generatedCode.code)
        console.log(`✅ Generated test code: ${generatedCode.code}`)
      } catch (error) {
        console.log(`⚠️ Code generation failed (might already exist): ${code}`)
        testCodes.push(code)
      }
    }

    // Generate usage logs with different IPs and user agents
    const usageLogs = []
    const now = new Date()

    // Generate logs for the past 7 days
    for (let day = 0; day < 7; day++) {
      const date = new Date(now)
      date.setDate(date.getDate() - day)

      // Generate 3-8 logs per day
      const logsPerDay = Math.floor(Math.random() * 6) + 3

      for (let i = 0; i < logsPerDay; i++) {
        const randomIP = sampleIPs[Math.floor(Math.random() * sampleIPs.length)]
        const randomUA = sampleUserAgents[Math.floor(Math.random() * sampleUserAgents.length)]
        const randomCode = testCodes[Math.floor(Math.random() * testCodes.length)]

        // Random time during the day
        const logTime = new Date(date)
        logTime.setHours(Math.floor(Math.random() * 24))
        logTime.setMinutes(Math.floor(Math.random() * 60))

        // Create usage log entry
        const logEntry = {
          code: randomCode,
          action: 'used' as const,
          timestamp: logTime.toISOString(),
          details: 'Test user activity - code validated successfully',
          ip_address: randomIP,
          user_agent: randomUA
        }

        usageLogs.push(logEntry)
      }
    }

    // Insert usage logs directly into Supabase
    console.log(`📥 Creating ${usageLogs.length} test usage logs...`)

    let successCount = 0
    for (const log of usageLogs) {
      try {
        const { error } = await supabase
          .from('usage_logs')
          .insert({
            code: log.code,
            action: log.action,
            details: log.details,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            timestamp: log.timestamp
          })

        if (error) {
          console.error('Supabase error:', error)
        } else {
          successCount++
        }
      } catch (error) {
        console.error('Error creating usage log:', error)
      }
    }

    console.log(`✅ Successfully created ${successCount} usage logs`)

    return NextResponse.json({
      success: true,
      message: `Generated test data: ${testCodes.length} codes and ${successCount} usage logs`,
      testCodes,
      usageLogsCreated: successCount,
      totalAttempted: usageLogs.length
    })

  } catch (error) {
    console.error('Error generating test data:', error)
    return NextResponse.json(
      { error: 'Failed to generate test data', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current data counts
    const usageLogs = await DatabaseService.getUsageLogs(1000)
    const logsWithIP = usageLogs.filter(log => log.ip_address)
    
    const uniqueIPs = new Set(logsWithIP.map(log => log.ip_address)).size

    return NextResponse.json({
      totalUsageLogs: usageLogs.length,
      logsWithIP: logsWithIP.length,
      uniqueIPs,
      sampleLogs: logsWithIP.slice(0, 5).map(log => ({
        code: log.code,
        action: log.action,
        timestamp: log.timestamp,
        ip_address: log.ip_address,
        user_agent: log.user_agent?.substring(0, 50) + '...'
      }))
    })

  } catch (error) {
    console.error('Error getting test data info:', error)
    return NextResponse.json(
      { error: 'Failed to get test data info' },
      { status: 500 }
    )
  }
}
