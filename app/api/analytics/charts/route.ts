import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

// Admin authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin2520'

function isValidAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${ADMIN_TOKEN}`
}

function getTimeRangeDate(range: string): Date {
  const now = new Date()
  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    const startDate = getTimeRangeDate(range)

    // Fetch usage logs within the time range
    const usageLogs = await DatabaseService.getUsageLogs(10000) // Get more logs for analysis
    const filteredLogs = usageLogs.filter(log => 
      new Date(log.timestamp) >= startDate
    )

    // Generate hourly usage data
    const hourlyUsage = Array.from({ length: 24 }, (_, hour) => {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`
      const hourLogs = filteredLogs.filter(log => 
        new Date(log.timestamp).getHours() === hour
      )
      
      return {
        hour: hourStr,
        generated: hourLogs.filter(log => log.action === 'generated').length,
        used: hourLogs.filter(log => log.action === 'used').length,
        expired: hourLogs.filter(log => log.action === 'expired').length
      }
    })

    // Generate daily trends data
    const dailyTrends = []
    const daysToShow = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0]
        return logDate === dateStr
      })
      
      const validations = dayLogs.filter(log => 
        log.action === 'used' || log.details?.includes('invalid')
      ).length
      const successful = dayLogs.filter(log => log.action === 'used').length
      const successRate = validations > 0 ? (successful / validations) * 100 : 0
      
      const uniqueUsers = new Set(dayLogs.map(log => log.ip_address).filter(Boolean)).size
      
      dailyTrends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        codes: dayLogs.filter(log => log.action === 'generated').length,
        users: uniqueUsers,
        success_rate: successRate
      })
    }

    // Generate code type distribution
    const activeCodes = await DatabaseService.getActiveCodes()
    const codeTypes = {
      'Standard': activeCodes.filter(code => !code.prefix).length,
      'VIP': activeCodes.filter(code => code.prefix === 'VIP').length,
      'TEST': activeCodes.filter(code => code.prefix === 'TEST').length,
      'DEMO': activeCodes.filter(code => code.prefix === 'DEMO').length,
      'Other': activeCodes.filter(code => 
        code.prefix && !['VIP', 'TEST', 'DEMO'].includes(code.prefix)
      ).length
    }

    const codeTypeDistribution = Object.entries(codeTypes)
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({
        name,
        value,
        color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][index] || '#6b7280'
      }))

    // Generate user activity data (mock data for demonstration)
    const userActivity = Array.from({ length: 24 }, (_, hour) => {
      const hourLogs = filteredLogs.filter(log => 
        new Date(log.timestamp).getHours() === hour
      )
      const uniqueUsers = new Set(hourLogs.map(log => log.ip_address).filter(Boolean)).size
      
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        active_users: uniqueUsers,
        peak_hour: hour >= 9 && hour <= 17 // Business hours
      }
    })

    // Generate success rate history
    const successRateHistory = []
    const historyDays = Math.min(daysToShow, 30) // Max 30 days for success rate history
    
    for (let i = historyDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0]
        return logDate === dateStr
      })
      
      const totalAttempts = dayLogs.filter(log => 
        log.action === 'used' || log.details?.includes('invalid') || log.details?.includes('expired')
      ).length
      const successful = dayLogs.filter(log => log.action === 'used').length
      const rate = totalAttempts > 0 ? (successful / totalAttempts) * 100 : 0
      
      successRateHistory.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rate: Math.round(rate * 10) / 10, // Round to 1 decimal
        total_attempts: totalAttempts
      })
    }

    const chartData = {
      hourlyUsage,
      dailyTrends,
      codeTypeDistribution,
      userActivity,
      successRateHistory
    }

    return NextResponse.json(chartData)

  } catch (error) {
    console.error('Analytics charts error:', error)
    return NextResponse.json({
      error: 'Failed to fetch chart data'
    }, { status: 500 })
  }
}
