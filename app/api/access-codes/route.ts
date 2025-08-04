import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'
import { ensureCleanup } from '@/lib/cleanup-service'

// Admin authentication (simple token-based for demo)
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    // Clean up expired codes before any operation
    await ensureCleanup()

    if (action === 'admin') {
      // Admin endpoint to get all codes and logs
      if (!isValidAdminToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const [activeCodes, totalCodes, usageLogs] = await Promise.all([
        DatabaseService.getActiveCodes(),
        DatabaseService.getTotalCodesCount(),
        DatabaseService.getUsageLogs(50)
      ])

      // Transform data to match frontend expectations
      const transformedCodes = activeCodes.map(code => ({
        code: code.code,
        expiresAt: code.expires_at,
        createdAt: code.created_at,
        usedAt: code.used_at,
        usedBy: code.used_by,
        prefix: code.prefix || null,
        auto_expire_on_use: code.auto_expire_on_use !== undefined ? code.auto_expire_on_use : true,
        max_uses: code.max_uses || null,
        current_uses: code.current_uses || 0
      }))

      const transformedLogs = usageLogs.map(log => ({
        id: log.id,
        code: log.code,
        action: log.action,
        timestamp: log.timestamp,
        details: log.details
      }))

      return NextResponse.json({
        activeCodes: transformedCodes,
        totalCodes,
        usageLogs: transformedLogs
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('GET /api/access-codes error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== API POST REQUEST DEBUG ===')
    const body = await request.json()
    console.log('Request body:', body)

    const { action, code, duration, prefix, autoExpire, maxUses } = body
    const clientIP = getClientIP(request)
    console.log('Action:', action, 'Client IP:', clientIP)

    // Clean up expired codes before any operation
    await ensureCleanup()

    if (action === 'generate') {
      console.log('Processing generate action...')

      // Admin endpoint to generate new code
      const authHeader = request.headers.get('authorization')
      console.log('Auth header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING')
      console.log('Expected token:', ADMIN_TOKEN ? `${ADMIN_TOKEN.substring(0, 8)}...` : 'MISSING')

      if (!isValidAdminToken(request)) {
        console.log('Authorization failed')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      console.log('Authorization successful')
      const expirationMinutes = duration || 10
      const codePrefix = prefix && prefix.trim() ? prefix.trim() : undefined
      const autoExpireOnUse = autoExpire !== false // Default to true if not specified
      const maxUsesLimit = maxUses && maxUses > 0 ? maxUses : undefined

      console.log('Generating code with params:', {
        expirationMinutes,
        codePrefix,
        autoExpireOnUse,
        maxUsesLimit
      })

      const accessCode = await DatabaseService.generateAccessCode(
        expirationMinutes,
        codePrefix,
        autoExpireOnUse,
        maxUsesLimit
      )

      console.log('Code generated successfully:', accessCode.code)

      return NextResponse.json({
        code: accessCode.code,
        expiresAt: accessCode.expires_at,
        expirationMinutes,
        prefix: codePrefix,
        autoExpire: autoExpireOnUse,
        maxUses: maxUsesLimit
      })
    }

    if (action === 'validate') {
      // Public endpoint to validate code
      if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 })
      }

      const result = await DatabaseService.validateAccessCode(code, clientIP)

      if (result.valid) {
        return NextResponse.json({
          valid: true,
          message: result.message
        })
      } else {
        return NextResponse.json({
          valid: false,
          error: result.message
        }, { status: 400 })
      }
    }

    if (action === 'revoke') {
      // Admin endpoint to revoke code
      if (!isValidAdminToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 })
      }

      await DatabaseService.revokeAccessCode(code)
      return NextResponse.json({ message: 'Code revoked successfully' })
    }

    console.log('Invalid action received:', action)
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('=== API ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error
    }, { status: 500 })
  }
}
