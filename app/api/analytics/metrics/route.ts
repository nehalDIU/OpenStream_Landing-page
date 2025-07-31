import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

// Admin authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin2520'

function isValidAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${ADMIN_TOKEN}`
}

// Store system start time for uptime calculation
const systemStartTime = Date.now()

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current data
    const [activeCodes, usageLogs] = await Promise.all([
      DatabaseService.getActiveCodes(),
      DatabaseService.getUsageLogs(1000)
    ])

    // Calculate metrics for the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentLogs = usageLogs.filter(log => 
      new Date(log.timestamp) >= oneHourAgo
    )

    // Calculate active users (unique IPs in last hour)
    const activeUsers = new Set(recentLogs.map(log => log.ip_address).filter(Boolean)).size

    // Calculate requests per minute (based on recent activity)
    const requestsPerMinute = Math.round(recentLogs.length / 60)

    // Calculate success rate
    const validationAttempts = recentLogs.filter(log => 
      log.action === 'used' || log.details?.includes('invalid') || log.details?.includes('expired')
    ).length
    const successfulValidations = recentLogs.filter(log => log.action === 'used').length
    const successRate = validationAttempts > 0 ? (successfulValidations / validationAttempts) * 100 : 100

    // Mock average response time (in a real app, you'd track this)
    const avgResponseTime = Math.floor(Math.random() * 50) + 20 // 20-70ms

    // Mock system load (in a real app, you'd get this from system metrics)
    const systemLoad = Math.random() * 30 + 10 // 10-40%

    // Calculate uptime
    const uptimeMs = Date.now() - systemStartTime
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60))
    const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60))
    const uptime = `${uptimeHours}h ${uptimeMinutes}m`

    const metrics = {
      activeUsers,
      activeCodes: activeCodes.length,
      requestsPerMinute,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      avgResponseTime,
      systemLoad: Math.round(systemLoad * 10) / 10, // Round to 1 decimal
      uptime,
      lastUpdate: new Date().toISOString()
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json({
      error: 'Failed to fetch metrics'
    }, { status: 500 })
  }
}
