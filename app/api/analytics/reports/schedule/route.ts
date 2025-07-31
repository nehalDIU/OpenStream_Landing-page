import { NextRequest, NextResponse } from 'next/server'

// Admin authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin2520'

function isValidAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${ADMIN_TOKEN}`
}

// In a real implementation, you would store scheduled reports in a database
// and use a job scheduler like node-cron or a queue system
const scheduledReports: Array<{
  id: string
  config: any
  nextRun: Date
  frequency: string
  active: boolean
}> = []

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
      emailAddress,
      scheduleFrequency = 'weekly'
    } = body

    if (!emailAddress) {
      return NextResponse.json({ 
        error: 'Email address is required for scheduled reports' 
      }, { status: 400 })
    }

    // Calculate next run time based on frequency
    const now = new Date()
    let nextRun = new Date()

    switch (scheduleFrequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1)
        break
      case 'weekly':
        nextRun.setDate(now.getDate() + 7)
        break
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1)
        break
      default:
        nextRun.setDate(now.getDate() + 7) // Default to weekly
    }

    // Create scheduled report entry
    const scheduledReport = {
      id: `scheduled_${Date.now()}`,
      config: {
        type,
        format,
        dateRange,
        emailAddress,
        includeCharts: true,
        includeDetails: true
      },
      nextRun,
      frequency: scheduleFrequency,
      active: true,
      createdAt: now.toISOString()
    }

    scheduledReports.push(scheduledReport)

    // In a real implementation, you would:
    // 1. Store this in a database
    // 2. Set up a cron job or queue job
    // 3. Send confirmation email

    return NextResponse.json({
      message: 'Report scheduled successfully',
      scheduledReport: {
        id: scheduledReport.id,
        nextRun: scheduledReport.nextRun,
        frequency: scheduledReport.frequency
      }
    })

  } catch (error) {
    console.error('Report scheduling error:', error)
    return NextResponse.json({
      error: 'Failed to schedule report'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return list of scheduled reports
    const activeReports = scheduledReports
      .filter(report => report.active)
      .map(report => ({
        id: report.id,
        type: report.config.type,
        format: report.config.format,
        emailAddress: report.config.emailAddress,
        frequency: report.frequency,
        nextRun: report.nextRun,
        createdAt: report.createdAt
      }))

    return NextResponse.json({
      scheduledReports: activeReports
    })

  } catch (error) {
    console.error('Scheduled reports fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch scheduled reports'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('id')

    if (!reportId) {
      return NextResponse.json({ 
        error: 'Report ID is required' 
      }, { status: 400 })
    }

    // Find and deactivate the scheduled report
    const reportIndex = scheduledReports.findIndex(report => report.id === reportId)
    
    if (reportIndex === -1) {
      return NextResponse.json({ 
        error: 'Scheduled report not found' 
      }, { status: 404 })
    }

    scheduledReports[reportIndex].active = false

    return NextResponse.json({
      message: 'Scheduled report cancelled successfully'
    })

  } catch (error) {
    console.error('Report cancellation error:', error)
    return NextResponse.json({
      error: 'Failed to cancel scheduled report'
    }, { status: 500 })
  }
}
