import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

// Admin authentication
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

    // Get current date and calculate time ranges
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch basic statistics
    const [activeCodes, totalCodes, usageLogs] = await Promise.all([
      DatabaseService.getActiveCodes(),
      DatabaseService.getTotalCodesCount(),
      DatabaseService.getUsageLogs(1000) // Get more logs for analysis
    ])

    // Calculate metrics
    const usedCodes = usageLogs.filter(log => log.action === 'used').length
    const expiredCodes = usageLogs.filter(log => log.action === 'expired').length
    const generatedCodes = usageLogs.filter(log => log.action === 'generated').length

    // Calculate success rate
    const validationAttempts = usageLogs.filter(log => 
      log.action === 'used' || log.details?.includes('invalid') || log.details?.includes('expired')
    ).length
    const successfulValidations = usageLogs.filter(log => log.action === 'used').length
    const successRate = validationAttempts > 0 ? (successfulValidations / validationAttempts) * 100 : 0

    // Calculate average usage time (mock calculation)
    const avgUsageTime = Math.round(Math.random() * 15 + 5) // 5-20 minutes mock

    // Find peak hour
    const hourlyActivity = new Array(24).fill(0)
    usageLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours()
      hourlyActivity[hour]++
    })
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity))
    const peakHourFormatted = `${peakHour.toString().padStart(2, '0')}:00`

    // Calculate unique users (based on IP addresses in logs)
    const uniqueIPs = new Set(usageLogs.map(log => log.ip_address).filter(Boolean))
    const totalUsers = uniqueIPs.size

    // Calculate trends (comparing with previous period)
    const recentLogs = usageLogs.filter(log => 
      new Date(log.timestamp) >= yesterday
    )
    const oldLogs = usageLogs.filter(log => {
      const logDate = new Date(log.timestamp)
      return logDate >= lastWeek && logDate < yesterday
    })

    const recentGenerated = recentLogs.filter(log => log.action === 'generated').length
    const oldGenerated = oldLogs.filter(log => log.action === 'generated').length
    const generatedChange = oldGenerated > 0 ? ((recentGenerated - oldGenerated) / oldGenerated) * 100 : 0

    const recentUsed = recentLogs.filter(log => log.action === 'used').length
    const oldUsed = oldLogs.filter(log => log.action === 'used').length
    const usedChange = oldUsed > 0 ? ((recentUsed - oldUsed) / oldUsed) * 100 : 0

    const recentValidations = recentLogs.filter(log => 
      log.action === 'used' || log.details?.includes('invalid')
    ).length
    const recentSuccessful = recentLogs.filter(log => log.action === 'used').length
    const recentSuccessRate = recentValidations > 0 ? (recentSuccessful / recentValidations) * 100 : 0

    const oldValidations = oldLogs.filter(log => 
      log.action === 'used' || log.details?.includes('invalid')
    ).length
    const oldSuccessful = oldLogs.filter(log => log.action === 'used').length
    const oldSuccessRate = oldValidations > 0 ? (oldSuccessful / oldValidations) * 100 : 0
    const successRateChange = oldSuccessRate > 0 ? ((recentSuccessRate - oldSuccessRate) / oldSuccessRate) * 100 : 0

    const recentUniqueIPs = new Set(recentLogs.map(log => log.ip_address).filter(Boolean))
    const oldUniqueIPs = new Set(oldLogs.map(log => log.ip_address).filter(Boolean))
    const activeUsersChange = oldUniqueIPs.size > 0 ? ((recentUniqueIPs.size - oldUniqueIPs.size) / oldUniqueIPs.size) * 100 : 0

    const overviewStats = {
      totalCodes,
      activeCodes: activeCodes.length,
      usedCodes,
      expiredCodes,
      successRate,
      avgUsageTime,
      peakHour: peakHourFormatted,
      totalUsers,
      trends: {
        codesGenerated: {
          value: recentGenerated,
          change: generatedChange
        },
        codesUsed: {
          value: recentUsed,
          change: usedChange
        },
        successRate: {
          value: recentSuccessRate,
          change: successRateChange
        },
        activeUsers: {
          value: recentUniqueIPs.size,
          change: activeUsersChange
        }
      }
    }

    return NextResponse.json(overviewStats)

  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json({
      error: 'Failed to fetch analytics overview'
    }, { status: 500 })
  }
}
