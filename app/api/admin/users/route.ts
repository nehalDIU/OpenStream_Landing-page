import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

// Admin authentication (using same token as existing system)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin2520'

function isValidAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${ADMIN_TOKEN}`
}

// Helper function to parse user agent
function parseUserAgent(userAgent: string): { browser: string; device_type: 'desktop' | 'mobile' | 'tablet' } {
  const ua = userAgent.toLowerCase()
  
  let browser = 'Unknown'
  if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('edge')) browser = 'Edge'
  else if (ua.includes('opera')) browser = 'Opera'
  
  let device_type: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  if (ua.includes('mobile')) device_type = 'mobile'
  else if (ua.includes('tablet') || ua.includes('ipad')) device_type = 'tablet'
  
  return { browser, device_type }
}

// Helper function to get time range date
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
      console.log('Admin authentication failed for users API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    const startDate = getTimeRangeDate(range)

    // Fetch usage logs to analyze user activity
    const usageLogs = await DatabaseService.getUsageLogs(10000)

    if (!usageLogs || usageLogs.length === 0) {
      // Return empty data if no logs exist
      return NextResponse.json({
        users: [],
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          newUsersToday: 0,
          avgSessionDuration: 0
        },
        success: true
      })
    }

    const filteredLogs = usageLogs.filter(log =>
      new Date(log.timestamp) >= startDate && log.ip_address
    )

    // Group logs by IP address to create user profiles
    const userMap = new Map()
    
    filteredLogs.forEach(log => {
      const ip = log.ip_address!
      if (!userMap.has(ip)) {
        const { browser, device_type } = parseUserAgent(log.user_agent || '')
        userMap.set(ip, {
          id: ip,
          ip_address: ip,
          user_agent: log.user_agent || 'Unknown',
          browser,
          device_type,
          first_seen: log.timestamp,
          last_seen: log.timestamp,
          total_sessions: 1,
          total_codes_used: 0,
          successful_validations: 0,
          failed_validations: 0,
          logs: [log]
        })
      } else {
        const user = userMap.get(ip)
        user.last_seen = log.timestamp
        user.logs.push(log)
        
        // Update session count (simplified - count unique days)
        const uniqueDays = new Set(user.logs.map((l: any) => 
          new Date(l.timestamp).toDateString()
        ))
        user.total_sessions = uniqueDays.size
      }
    })

    // Calculate user statistics
    const users = Array.from(userMap.values()).map(user => {
      // Count successful and failed validations
      user.logs.forEach((log: any) => {
        if (log.action === 'used') {
          user.successful_validations++
          user.total_codes_used++
        } else if (log.details?.includes('invalid') || log.details?.includes('expired')) {
          user.failed_validations++
        }
      })

      // Calculate success rate
      const totalAttempts = user.successful_validations + user.failed_validations
      user.success_rate = totalAttempts > 0 ? (user.successful_validations / totalAttempts) * 100 : 0

      // Determine if user is active (activity in last 24 hours)
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
      user.is_active = new Date(user.last_seen) >= last24h

      return {
        id: user.id,
        ip_address: user.ip_address,
        user_agent: user.user_agent,
        browser: user.browser,
        device_type: user.device_type,
        first_seen: user.first_seen,
        last_seen: user.last_seen,
        total_sessions: user.total_sessions,
        total_codes_used: user.total_codes_used,
        success_rate: Math.round(user.success_rate),
        is_active: user.is_active,
        location: 'Unknown' // Could be enhanced with IP geolocation
      }
    })

    // Sort users by last activity
    users.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())

    // Calculate overall statistics
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.is_active).length
    
    // New users today
    const today = new Date().toDateString()
    const newUsersToday = users.filter(u => 
      new Date(u.first_seen).toDateString() === today
    ).length

    // Average session duration (simplified calculation)
    const avgSessionDuration = users.length > 0 
      ? Math.round(users.reduce((sum, u) => sum + u.total_sessions, 0) / users.length * 15) // Assume 15 min per session
      : 0

    const stats = {
      totalUsers,
      activeUsers,
      newUsersToday,
      avgSessionDuration
    }

    return NextResponse.json({
      users: users.slice(0, 100), // Limit to 100 users for performance
      stats,
      success: true
    })

  } catch (error) {
    console.error('Error fetching users data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users data' },
      { status: 500 }
    )
  }
}
