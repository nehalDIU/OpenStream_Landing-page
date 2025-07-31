import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

// Admin authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin2520'

function isValidAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${ADMIN_TOKEN}`
}

function getDateRange(range: string, customStart?: string, customEnd?: string) {
  const now = new Date()
  let startDate: Date
  let endDate = now

  if (range === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart)
    endDate = new Date(customEnd)
  } else {
    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  return { startDate, endDate }
}

async function generateOverviewReport(startDate: Date, endDate: Date, includeCharts: boolean, includeDetails: boolean) {
  const [activeCodes, totalCodes, usageLogs] = await Promise.all([
    DatabaseService.getActiveCodes(),
    DatabaseService.getTotalCodesCount(),
    DatabaseService.getUsageLogs(10000)
  ])

  const filteredLogs = usageLogs.filter(log => {
    const logDate = new Date(log.timestamp)
    return logDate >= startDate && logDate <= endDate
  })

  const report = {
    title: 'System Overview Report',
    generatedAt: new Date().toISOString(),
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    summary: {
      totalCodes,
      activeCodes: activeCodes.length,
      codesGenerated: filteredLogs.filter(log => log.action === 'generated').length,
      codesUsed: filteredLogs.filter(log => log.action === 'used').length,
      codesExpired: filteredLogs.filter(log => log.action === 'expired').length,
      uniqueUsers: new Set(filteredLogs.map(log => log.ip_address).filter(Boolean)).size
    },
    metrics: {
      successRate: calculateSuccessRate(filteredLogs),
      avgCodesPerDay: filteredLogs.length / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))),
      peakHour: calculatePeakHour(filteredLogs)
    }
  }

  if (includeDetails) {
    report.details = {
      activeCodes: activeCodes.map(code => ({
        code: code.code,
        createdAt: code.created_at,
        expiresAt: code.expires_at,
        prefix: code.prefix,
        maxUses: code.max_uses,
        currentUses: code.current_uses
      })),
      recentActivity: filteredLogs.slice(0, 100).map(log => ({
        action: log.action,
        code: log.code,
        timestamp: log.timestamp,
        details: log.details
      }))
    }
  }

  return report
}

async function generateUsageReport(startDate: Date, endDate: Date, includeCharts: boolean, includeDetails: boolean) {
  const usageLogs = await DatabaseService.getUsageLogs(10000)
  const filteredLogs = usageLogs.filter(log => {
    const logDate = new Date(log.timestamp)
    return logDate >= startDate && logDate <= endDate
  })

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: filteredLogs.filter(log => new Date(log.timestamp).getHours() === hour).length
  }))

  const dailyData = {}
  filteredLogs.forEach(log => {
    const date = new Date(log.timestamp).toISOString().split('T')[0]
    dailyData[date] = (dailyData[date] || 0) + 1
  })

  return {
    title: 'Usage Analytics Report',
    generatedAt: new Date().toISOString(),
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    analytics: {
      totalEvents: filteredLogs.length,
      hourlyDistribution: hourlyData,
      dailyDistribution: Object.entries(dailyData).map(([date, count]) => ({ date, count })),
      actionBreakdown: {
        generated: filteredLogs.filter(log => log.action === 'generated').length,
        used: filteredLogs.filter(log => log.action === 'used').length,
        expired: filteredLogs.filter(log => log.action === 'expired').length,
        revoked: filteredLogs.filter(log => log.action === 'revoked').length
      }
    }
  }
}

function calculateSuccessRate(logs: any[]): number {
  const validationAttempts = logs.filter(log => 
    log.action === 'used' || log.details?.includes('invalid') || log.details?.includes('expired')
  ).length
  const successful = logs.filter(log => log.action === 'used').length
  return validationAttempts > 0 ? (successful / validationAttempts) * 100 : 0
}

function calculatePeakHour(logs: any[]): number {
  const hourlyActivity = new Array(24).fill(0)
  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours()
    hourlyActivity[hour]++
  })
  return hourlyActivity.indexOf(Math.max(...hourlyActivity))
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      format,
      dateRange,
      customStartDate,
      customEndDate,
      includeCharts,
      includeDetails,
      emailDelivery,
      emailAddress
    } = body

    const { startDate, endDate } = getDateRange(dateRange, customStartDate, customEndDate)

    let reportData
    switch (type) {
      case 'overview':
        reportData = await generateOverviewReport(startDate, endDate, includeCharts, includeDetails)
        break
      case 'usage':
        reportData = await generateUsageReport(startDate, endDate, includeCharts, includeDetails)
        break
      case 'security':
        // Mock security report
        reportData = {
          title: 'Security Report',
          generatedAt: new Date().toISOString(),
          period: { start: startDate.toISOString(), end: endDate.toISOString() },
          security: {
            failedAttempts: Math.floor(Math.random() * 10),
            suspiciousActivity: Math.floor(Math.random() * 3),
            blockedIPs: []
          }
        }
        break
      case 'users':
        // Mock user report
        reportData = {
          title: 'User Activity Report',
          generatedAt: new Date().toISOString(),
          period: { start: startDate.toISOString(), end: endDate.toISOString() },
          users: {
            totalUsers: Math.floor(Math.random() * 100),
            activeUsers: Math.floor(Math.random() * 50),
            newUsers: Math.floor(Math.random() * 20)
          }
        }
        break
      case 'performance':
        // Mock performance report
        reportData = {
          title: 'Performance Report',
          generatedAt: new Date().toISOString(),
          period: { start: startDate.toISOString(), end: endDate.toISOString() },
          performance: {
            avgResponseTime: Math.floor(Math.random() * 100) + 50,
            uptime: 99.9,
            errorRate: Math.random() * 0.1
          }
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Handle different formats
    if (format === 'json') {
      return NextResponse.json(reportData)
    } else if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvData = convertToCSV(reportData)
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${type}-${Date.now()}.csv"`
        }
      })
    } else if (format === 'pdf' || format === 'excel') {
      // For PDF/Excel, return JSON data with appropriate headers
      // In a real implementation, you would use libraries like puppeteer or exceljs
      const blob = JSON.stringify(reportData, null, 2)
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="report-${type}-${Date.now()}.${format}"`
        }
      })
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate report'
    }, { status: 500 })
  }
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - in a real implementation, you'd want more sophisticated handling
  const headers = Object.keys(data).join(',')
  const values = Object.values(data).map(value => 
    typeof value === 'object' ? JSON.stringify(value) : value
  ).join(',')
  
  return `${headers}\n${values}`
}
