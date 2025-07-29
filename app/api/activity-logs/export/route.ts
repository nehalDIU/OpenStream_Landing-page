import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'
import type { ActivityLogFilters } from '@/types/activity-logs'

// Admin authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin2520'

function isValidAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${ADMIN_TOKEN}`
}

// Helper function to format data for CSV
function formatCSV(logs: any[]): string {
  if (logs.length === 0) {
    return 'No data to export'
  }

  const headers = [
    'ID',
    'Code',
    'Action',
    'Timestamp',
    'Details',
    'IP Address',
    'User Agent',
    'Success',
    'Duration (ms)'
  ]

  const csvRows = [
    headers.join(','),
    ...logs.map(log => [
      log.id,
      log.code,
      log.action,
      new Date(log.timestamp).toISOString(),
      `"${(log.details || '').replace(/"/g, '""')}"`,
      log.ip_address || '',
      `"${(log.user_agent || '').replace(/"/g, '""')}"`,
      log.success !== undefined ? log.success : 'N/A',
      log.duration_ms || ''
    ].join(','))
  ]

  return csvRows.join('\n')
}

// Helper function to format data for JSON
function formatJSON(logs: any[], includeMetadata: boolean = false): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalRecords: logs.length,
    data: logs
  }

  if (includeMetadata) {
    exportData.data = logs.map(log => ({
      ...log,
      formatted_timestamp: new Date(log.timestamp).toLocaleString(),
      time_ago: getTimeAgo(new Date(log.timestamp))
    }))
  }

  return JSON.stringify(exportData, null, 2)
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

// POST /api/activity-logs/export - Export activity logs in various formats
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      format = 'csv', 
      filters = {}, 
      includeMetadata = false,
      maxRows = 10000,
      filename 
    } = body

    // Validate format
    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid format. Supported formats: csv, json'
      }, { status: 400 })
    }

    // Fetch activity logs with filters
    const result = await DatabaseService.getActivityLogs({
      filters,
      pagination: { page: 1, limit: maxRows }
    })

    let exportData: string
    let contentType: string
    let fileExtension: string

    // Format data based on requested format
    switch (format) {
      case 'csv':
        exportData = formatCSV(result.logs)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      
      case 'json':
        exportData = formatJSON(result.logs, includeMetadata)
        contentType = 'application/json'
        fileExtension = 'json'
        break
      
      default:
        throw new Error('Unsupported format')
    }

    // Generate filename if not provided
    const timestamp = new Date().toISOString().split('T')[0]
    const defaultFilename = `activity-logs-${timestamp}.${fileExtension}`
    const finalFilename = filename || defaultFilename

    // Return the export data with appropriate headers
    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Cache-Control': 'no-cache',
        'X-Export-Stats': JSON.stringify({
          totalRecords: result.logs.length,
          exportedAt: new Date().toISOString(),
          format,
          filters: Object.keys(filters).length > 0 ? filters : 'none'
        })
      }
    })

  } catch (error) {
    console.error('Activity logs export API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to export activity logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/activity-logs/export - Get export preview or download
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const preview = searchParams.get('preview') === 'true'
    const maxRows = preview ? 10 : parseInt(searchParams.get('maxRows') || '10000')

    // Parse filters from query parameters
    const filters: ActivityLogFilters = {}
    
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate && endDate) {
      filters.dateRange = { start: startDate, end: endDate }
    }

    const actions = searchParams.get('actions')
    if (actions) {
      filters.actions = actions.split(',') as Array<'generated' | 'used' | 'expired' | 'revoked' | 'all'>
    }

    const searchTerm = searchParams.get('search')
    if (searchTerm) {
      filters.searchTerm = searchTerm
    }

    // Fetch data
    const result = await DatabaseService.getActivityLogs({
      filters,
      pagination: { page: 1, limit: maxRows }
    })

    if (preview) {
      // Return preview data
      return NextResponse.json({
        success: true,
        preview: true,
        data: result.logs.slice(0, 10),
        totalRecords: result.total,
        format,
        estimatedFileSize: format === 'csv' 
          ? `${Math.round(result.total * 150 / 1024)} KB` 
          : `${Math.round(result.total * 300 / 1024)} KB`
      })
    }

    // Generate export data
    let exportData: string
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'csv':
        exportData = formatCSV(result.logs)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      
      case 'json':
        exportData = formatJSON(result.logs, true)
        contentType = 'application/json'
        fileExtension = 'json'
        break
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid format. Supported formats: csv, json'
        }, { status: 400 })
    }

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `activity-logs-${timestamp}.${fileExtension}`

    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Activity logs export GET API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to export activity logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
