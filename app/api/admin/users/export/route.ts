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

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = [
    'IP Address',
    'Browser',
    'Device Type',
    'First Seen',
    'Last Seen',
    'Total Sessions',
    'Codes Used',
    'Success Rate (%)',
    'Active Status',
    'User Agent'
  ]
  
  const csvRows = [
    headers.join(','),
    ...data.map(user => [
      user.ip_address,
      user.browser,
      user.device_type,
      new Date(user.first_seen).toLocaleString(),
      new Date(user.last_seen).toLocaleString(),
      user.total_sessions,
      user.total_codes_used,
      user.success_rate,
      user.is_active ? 'Active' : 'Inactive',
      `"${user.user_agent.replace(/"/g, '""')}"`
    ].join(','))
  ]
  
  return csvRows.join('\n')
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all usage logs for comprehensive export
    const usageLogs = await DatabaseService.getUsageLogs(50000)
    const logsWithIP = usageLogs.filter(log => log.ip_address)

    // Group logs by IP address to create user profiles
    const userMap = new Map()
    
    logsWithIP.forEach(log => {
      const ip = log.ip_address!
      if (!userMap.has(ip)) {
        const { browser, device_type } = parseUserAgent(log.user_agent || '')
        userMap.set(ip, {
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
        ip_address: user.ip_address,
        user_agent: user.user_agent,
        browser: user.browser,
        device_type: user.device_type,
        first_seen: user.first_seen,
        last_seen: user.last_seen,
        total_sessions: user.total_sessions,
        total_codes_used: user.total_codes_used,
        success_rate: Math.round(user.success_rate),
        is_active: user.is_active
      }
    })

    // Sort users by last activity
    users.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())

    // Convert to CSV
    const csvData = convertToCSV(users)
    
    // Create response with CSV data
    const response = new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

    return response

  } catch (error) {
    console.error('Error exporting users data:', error)
    return NextResponse.json(
      { error: 'Failed to export users data' },
      { status: 500 }
    )
  }
}
