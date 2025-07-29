import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'
import type { ActivityLogFilters, ActivityLogQueryOptions } from '@/types/activity-logs'

// Admin authentication (using same token as existing system)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin2520'

function isValidAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${ADMIN_TOKEN}`
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return 'unknown'
}

// GET /api/activity-logs - Fetch activity logs with filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'timestamp'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const includeMetadata = searchParams.get('includeMetadata') === 'true'
    const includeAggregations = searchParams.get('includeAggregations') === 'true'
    const groupBy = searchParams.get('groupBy') as 'date' | 'action' | 'user' | 'code' | undefined

    // Parse filters
    const filters: ActivityLogFilters = {}
    
    // Date range filter
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate && endDate) {
      filters.dateRange = { start: startDate, end: endDate }
    }

    // Action filter
    const actions = searchParams.get('actions')
    if (actions) {
      filters.actions = actions.split(',') as Array<'generated' | 'used' | 'expired' | 'revoked' | 'all'>
    }

    // Search term
    const searchTerm = searchParams.get('search')
    if (searchTerm) {
      filters.searchTerm = searchTerm
    }

    // User filters
    const users = searchParams.get('users')
    if (users) {
      filters.users = users.split(',')
    }

    // Code filters
    const codes = searchParams.get('codes')
    if (codes) {
      filters.codes = codes.split(',')
    }

    // IP address filters
    const ipAddresses = searchParams.get('ipAddresses')
    if (ipAddresses) {
      filters.ipAddresses = ipAddresses.split(',')
    }

    // Success filter
    const success = searchParams.get('success')
    if (success !== null) {
      filters.success = success === 'true'
    }

    // Build query options
    const queryOptions: ActivityLogQueryOptions = {
      filters,
      pagination: { page, limit },
      sortBy,
      sortOrder,
      includeMetadata,
      groupBy
    }

    // Fetch activity logs
    const result = await DatabaseService.getActivityLogs(queryOptions)

    // Add aggregations if requested
    if (includeAggregations && !result.aggregations) {
      result.aggregations = await DatabaseService.getActivityLogAggregations(filters)
    }

    return NextResponse.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage
      },
      aggregations: result.aggregations,
      metadata: {
        queryTime: Date.now(),
        filters,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('Activity logs API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch activity logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/activity-logs - Handle various activity log operations
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'search':
        const { searchTerm, options = {} } = params
        const searchResults = await DatabaseService.searchActivityLogs(searchTerm, options)
        
        return NextResponse.json({
          success: true,
          data: searchResults,
          total: searchResults.length
        })

      case 'export':
        const { filters = {}, format = 'csv' } = params
        const exportData = await DatabaseService.exportActivityLogs(filters, format)
        
        return NextResponse.json({
          success: true,
          data: exportData,
          format,
          timestamp: new Date().toISOString()
        })

      case 'stats':
        const { dateRange } = params
        const stats = await DatabaseService.getActivityLogStats(dateRange)
        
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'bulk_delete':
        const { logIds } = params
        if (!Array.isArray(logIds) || logIds.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Invalid log IDs provided'
          }, { status: 400 })
        }
        
        const deletedCount = await DatabaseService.bulkDeleteActivityLogs(logIds)
        
        return NextResponse.json({
          success: true,
          deletedCount,
          message: `Successfully deleted ${deletedCount} activity logs`
        })

      case 'bulk_update':
        const { updates } = params
        if (!Array.isArray(updates) || updates.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Invalid updates provided'
          }, { status: 400 })
        }
        
        await DatabaseService.bulkUpdateActivityLogs(updates)
        
        return NextResponse.json({
          success: true,
          updatedCount: updates.length,
          message: `Successfully updated ${updates.length} activity logs`
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Activity logs POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process activity logs request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/activity-logs - Delete activity logs (with optional filtering)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const logIds = searchParams.get('ids')?.split(',') || []

    if (logIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No log IDs provided'
      }, { status: 400 })
    }

    const deletedCount = await DatabaseService.bulkDeleteActivityLogs(logIds)

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} activity logs`
    })

  } catch (error) {
    console.error('Activity logs DELETE API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete activity logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
