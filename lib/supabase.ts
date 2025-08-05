import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
  console.error('Required variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')

  // Don't throw error during build/import, only when actually using the client
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types
export interface AccessCode {
  id: string
  code: string
  expires_at: string
  created_at: string
  is_active: boolean
  used_at?: string
  used_by?: string
  duration_minutes: number
  created_by?: string
  prefix?: string
  auto_expire_on_use?: boolean
  max_uses?: number
  current_uses?: number
}

export interface UsageLog {
  id: string
  code: string
  action: 'generated' | 'used' | 'expired' | 'revoked'
  timestamp: string
  details?: string
  ip_address?: string
  user_agent?: string
}

// Enhanced Activity Log Types for comprehensive logging
export interface ActivityLog extends UsageLog {
  user_id?: string
  session_id?: string
  browser_info?: string
  location?: string
  success: boolean
  error_message?: string
  duration_ms?: number
  metadata?: Record<string, any>
}

// Activity Log Filtering Options
export interface ActivityLogFilters {
  dateRange?: {
    start: string
    end: string
  }
  actions?: Array<'generated' | 'used' | 'expired' | 'revoked' | 'all'>
  users?: string[]
  codes?: string[]
  success?: boolean
  ipAddresses?: string[]
  searchTerm?: string
}

// Pagination Options
export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Activity Log Query Options
export interface ActivityLogQueryOptions extends PaginationOptions {
  filters?: ActivityLogFilters
  includeMetadata?: boolean
  groupBy?: 'date' | 'action' | 'user' | 'code'
}

// Activity Log Response
export interface ActivityLogResponse {
  logs: ActivityLog[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  aggregations?: {
    totalByAction: Record<string, number>
    totalByDate: Record<string, number>
    totalByUser: Record<string, number>
    successRate: number
    averageDuration: number
  }
}

// Export Options
export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  filters?: ActivityLogFilters
  columns?: string[]
  includeHeaders?: boolean
  dateFormat?: string
}

// Real-time Activity Log Event
export interface ActivityLogEvent {
  type: 'new_activity' | 'bulk_update' | 'cleanup'
  data: ActivityLog | ActivityLog[]
  timestamp: string
  source: string
}

// Database utility functions
export class DatabaseService {

  private static checkSupabaseClient() {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your environment variables.')
    }
  }

  // Access Codes Operations
  static async generateAccessCode(
    duration: number = 10,
    prefix?: string,
    autoExpireOnUse: boolean = true,
    maxUses?: number
  ): Promise<AccessCode> {
    this.checkSupabaseClient()

    const code = this.generateSecureCode(prefix)
    const expiresAt = new Date(Date.now() + duration * 60 * 1000)

    // Check if advanced settings columns exist by trying to insert with them first
    let insertData: any = {
      code,
      expires_at: expiresAt.toISOString(),
      duration_minutes: duration,
      is_active: true
    }

    // Try to add advanced settings if they exist in the database
    try {
      // First attempt with advanced settings including usage tracking
      const { data, error } = await supabase!
        .from('access_codes')
        .insert({
          ...insertData,
          prefix: prefix || null,
          auto_expire_on_use: autoExpireOnUse,
          max_uses: maxUses || null,
          current_uses: 0
        })
        .select()
        .single()

      if (error) {
        // If error is about missing columns, fall back to basic insert
        if (error.message.includes('auto_expire_on_use') ||
            error.message.includes('prefix') ||
            error.message.includes('max_uses') ||
            error.message.includes('current_uses')) {
          console.warn('Advanced settings columns not found, falling back to basic code generation')
          const { data: fallbackData, error: fallbackError } = await supabase!
            .from('access_codes')
            .insert(insertData)
            .select()
            .single()

          if (fallbackError) {
            throw new Error(`Failed to generate access code: ${fallbackError.message}`)
          }

          // Log the generation with note about missing advanced settings
          await this.addUsageLog(code, 'generated', `Expires in ${duration} minutes (advanced settings not available)`)
          return fallbackData
        } else {
          throw new Error(`Failed to generate access code: ${error.message}`)
        }
      }

      // Log the generation with advanced settings info
      const settingsInfo = []
      if (prefix) settingsInfo.push(`prefix: ${prefix}`)
      if (!autoExpireOnUse) settingsInfo.push('reusable')
      if (maxUses) settingsInfo.push(`max uses: ${maxUses}`)
      const settingsStr = settingsInfo.length > 0 ? ` (${settingsInfo.join(', ')})` : ''

      await this.addUsageLog(code, 'generated', `Expires in ${duration} minutes${settingsStr}`)
      return data

    } catch (error) {
      throw new Error(`Failed to generate access code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async validateAccessCode(code: string, ipAddress?: string): Promise<{ valid: boolean; message: string; accessCode?: AccessCode }> {
    this.checkSupabaseClient()

    // First, check if the code exists at all (regardless of active status)
    const { data: existingCode, error: existingError } = await supabase!
      .from('access_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (existingError || !existingCode) {
      return { valid: false, message: 'Invalid access code' }
    }

    // If code exists but is not active, check why
    if (!existingCode.is_active) {
      // Check if it was used before
      if (existingCode.used_at) {
        return { valid: false, message: 'This Access code already used' }
      }
      // If not used but inactive, it might have been revoked or expired
      return { valid: false, message: 'This Access code has expired' }
    }

    // Code exists and is active, proceed with normal validation
    const accessCode = existingCode

    // Check usage limits
    const hasAdvancedSettings = accessCode.hasOwnProperty('auto_expire_on_use')
    const hasUsageTracking = accessCode.hasOwnProperty('max_uses') && accessCode.hasOwnProperty('current_uses')

    // Check if max uses exceeded
    if (hasUsageTracking && accessCode.max_uses && accessCode.current_uses >= accessCode.max_uses) {
      return { valid: false, message: 'This Access code already used' }
    }

    // Check if already used (only for auto-expire codes or if advanced settings not available)
    const shouldCheckReuse = hasAdvancedSettings ? accessCode.auto_expire_on_use !== false : true // Default to one-time use

    if (accessCode.used_at && shouldCheckReuse && !hasUsageTracking) {
      return { valid: false, message: 'This Access code already used' }
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(accessCode.expires_at)

    if (expiresAt < now) {
      // Mark as expired
      await this.deactivateAccessCode(code, 'expired')
      return { valid: false, message: 'This Access code has expired' }
    }

    // Determine if code should be deactivated after use
    let shouldDeactivate = hasAdvancedSettings ? (accessCode.auto_expire_on_use !== false) : true // Default to true

    // If using usage tracking, check if this will be the last use
    if (hasUsageTracking && accessCode.max_uses) {
      const newUsageCount = (accessCode.current_uses || 0) + 1
      shouldDeactivate = newUsageCount >= accessCode.max_uses
    }

    // Prepare update data
    const updateData: any = {
      used_at: now.toISOString(),
      used_by: ipAddress || 'unknown',
      is_active: !shouldDeactivate
    }

    // Add usage tracking if available
    if (hasUsageTracking) {
      updateData.current_uses = (accessCode.current_uses || 0) + 1
    }

    // Mark as used and optionally deactivate
    await supabase!
      .from('access_codes')
      .update(updateData)
      .eq('code', code.toUpperCase())

    // Log the usage with appropriate message
    let usageInfo = ''
    if (hasUsageTracking && accessCode.max_uses) {
      const newUsageCount = (accessCode.current_uses || 0) + 1
      usageInfo = `Use ${newUsageCount}/${accessCode.max_uses}`
      if (shouldDeactivate) usageInfo += ' (limit reached)'
    } else {
      usageInfo = shouldDeactivate ? 'One-time use' : 'Reusable'
    }

    const advancedNote = hasAdvancedSettings ? '' : ' (legacy mode)'
    await this.addUsageLog(code, 'used', `Used by ${ipAddress || 'unknown'} - ${usageInfo}${advancedNote}`)

    return { valid: true, message: 'Access code validated successfully', accessCode }
  }

  static async revokeAccessCode(code: string): Promise<void> {
    await this.deactivateAccessCode(code, 'revoked')
  }

  static async deactivateAccessCode(code: string, reason: 'expired' | 'revoked'): Promise<void> {
    this.checkSupabaseClient()
    
    const { error } = await supabase!
      .from('access_codes')
      .update({ is_active: false })
      .eq('code', code.toUpperCase())

    if (error) {
      throw new Error(`Failed to deactivate access code: ${error.message}`)
    }

    await this.addUsageLog(code, reason, `Manually ${reason} by admin`)
  }

  static async getActiveCodes(): Promise<AccessCode[]> {
    this.checkSupabaseClient()
    
    const { data, error } = await supabase!
      .from('access_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch active codes: ${error.message}`)
    }

    return data || []
  }

  static async getTotalCodesCount(): Promise<number> {
    this.checkSupabaseClient()

    const { count, error } = await supabase!
      .from('access_codes')
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw new Error(`Failed to count codes: ${error.message}`)
    }

    return count || 0
  }

  // Usage Statistics Methods
  static async getUsageStatistics(): Promise<{
    totalCodes: number
    activeCodes: number
    usedCodes: number
    expiredCodes: number
    codesWithUsageLimit: number
    averageUsagePerCode: number
    topUsedCodes: Array<{code: string, uses: number, maxUses?: number}>
  }> {
    this.checkSupabaseClient()

    try {
      // Get all codes with usage data
      const { data: codes, error } = await supabase!
        .from('access_codes')
        .select('code, is_active, used_at, expires_at, current_uses, max_uses')

      if (error) {
        throw new Error(`Failed to get usage statistics: ${error.message}`)
      }

      const now = new Date()
      const totalCodes = codes?.length || 0
      const activeCodes = codes?.filter(c => c.is_active).length || 0
      const usedCodes = codes?.filter(c => c.used_at).length || 0
      const expiredCodes = codes?.filter(c => new Date(c.expires_at) < now).length || 0
      const codesWithUsageLimit = codes?.filter(c => c.max_uses).length || 0

      // Calculate average usage
      const totalUsage = codes?.reduce((sum, c) => sum + (c.current_uses || 0), 0) || 0
      const averageUsagePerCode = totalCodes > 0 ? totalUsage / totalCodes : 0

      // Get top used codes
      const topUsedCodes = codes
        ?.filter(c => c.current_uses && c.current_uses > 0)
        .sort((a, b) => (b.current_uses || 0) - (a.current_uses || 0))
        .slice(0, 10)
        .map(c => ({
          code: c.code,
          uses: c.current_uses || 0,
          maxUses: c.max_uses || undefined
        })) || []

      return {
        totalCodes,
        activeCodes,
        usedCodes,
        expiredCodes,
        codesWithUsageLimit,
        averageUsagePerCode: Math.round(averageUsagePerCode * 100) / 100,
        topUsedCodes
      }
    } catch (error) {
      throw new Error(`Failed to get usage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async getCodeUsageHistory(code: string): Promise<Array<{
    timestamp: string
    action: string
    details: string
    usageCount?: number
  }>> {
    this.checkSupabaseClient()

    const { data: logs, error } = await supabase!
      .from('usage_logs')
      .select('*')
      .eq('code', code.toUpperCase())
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error(`Failed to get code usage history: ${error.message}`)
    }

    return logs?.map(log => ({
      timestamp: log.timestamp,
      action: log.action,
      details: log.details || '',
      usageCount: log.details?.match(/Use (\d+)\//) ? parseInt(log.details.match(/Use (\d+)\//)?.[1] || '0') : undefined
    })) || []
  }

  // Usage Logs Operations
  static async addUsageLog(code: string, action: UsageLog['action'], details?: string, ipAddress?: string): Promise<void> {
    this.checkSupabaseClient()
    
    const { error } = await supabase!
      .from('usage_logs')
      .insert({
        code: code.toUpperCase(),
        action,
        details,
        ip_address: ipAddress,
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to add usage log:', error)
      // Don't throw error for logging failures to avoid breaking main functionality
    }
  }

  static async getUsageLogs(limit: number = 50): Promise<UsageLog[]> {
    this.checkSupabaseClient()

    const { data, error } = await supabase!
      .from('usage_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch usage logs: ${error.message}`)
    }

    return data || []
  }

  // Enhanced Activity Logs Methods
  static async getActivityLogs(options: ActivityLogQueryOptions = {}): Promise<ActivityLogResponse> {
    this.checkSupabaseClient()

    const {
      filters = {},
      pagination = { page: 1, limit: 50 },
      sortBy = 'timestamp',
      sortOrder = 'desc',
      includeMetadata = false,
      groupBy
    } = options

    let query = supabase!.from('usage_logs').select('*', { count: 'exact' })

    // Apply filters
    if (filters.dateRange) {
      query = query
        .gte('timestamp', filters.dateRange.start)
        .lte('timestamp', filters.dateRange.end)
    }

    if (filters.actions && filters.actions.length > 0 && !filters.actions.includes('all')) {
      query = query.in('action', filters.actions)
    }

    if (filters.searchTerm) {
      query = query.or(`code.ilike.%${filters.searchTerm}%,details.ilike.%${filters.searchTerm}%,ip_address.ilike.%${filters.searchTerm}%`)
    }

    if (filters.users && filters.users.length > 0) {
      query = query.in('ip_address', filters.users)
    }

    if (filters.codes && filters.codes.length > 0) {
      query = query.in('code', filters.codes)
    }

    if (filters.ipAddresses && filters.ipAddresses.length > 0) {
      query = query.in('ip_address', filters.ipAddresses)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit
    query = query.range(offset, offset + pagination.limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch activity logs: ${error.message}`)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      logs: data || [],
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
      aggregations: groupBy ? await this.getActivityLogAggregations(filters) : undefined
    }
  }

  static async getActivityLogAggregations(filters: ActivityLogFilters = {}): Promise<any> {
    this.checkSupabaseClient()

    let query = supabase!.from('usage_logs').select('action, timestamp, details')

    // Apply same filters as main query
    if (filters.dateRange) {
      query = query
        .gte('timestamp', filters.dateRange.start)
        .lte('timestamp', filters.dateRange.end)
    }

    if (filters.actions && filters.actions.length > 0 && !filters.actions.includes('all')) {
      query = query.in('action', filters.actions)
    }

    if (filters.searchTerm) {
      query = query.or(`code.ilike.%${filters.searchTerm}%,details.ilike.%${filters.searchTerm}%,ip_address.ilike.%${filters.searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch aggregations:', error)
      return {}
    }

    if (!data) return {}

    // Calculate aggregations
    const totalByAction = data.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalByDate = data.reduce((acc, log) => {
      const date = new Date(log.timestamp).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalByAction,
      totalByDate,
      totalByUser: {},
      successRate: 0,
      averageDuration: 0
    }
  }

  // Cleanup Operations
  static async cleanupExpiredCodes(): Promise<number> {
    this.checkSupabaseClient()
    
    const now = new Date().toISOString()
    
    // Get expired codes that are still active
    const { data: expiredCodes, error: fetchError } = await supabase!
      .from('access_codes')
      .select('code')
      .eq('is_active', true)
      .lt('expires_at', now)

    if (fetchError) {
      throw new Error(`Failed to fetch expired codes: ${fetchError.message}`)
    }

    if (!expiredCodes || expiredCodes.length === 0) {
      return 0
    }

    // Deactivate expired codes
    const { error: updateError } = await supabase!
      .from('access_codes')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('expires_at', now)

    if (updateError) {
      throw new Error(`Failed to cleanup expired codes: ${updateError.message}`)
    }

    // Log the cleanup
    for (const expiredCode of expiredCodes) {
      await this.addUsageLog(expiredCode.code, 'expired', 'Automatically expired by cleanup')
    }

    return expiredCodes.length
  }

  // Utility Functions
  static generateSecureCode(prefix?: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''

    // If prefix is provided, use it and generate remaining characters
    if (prefix && prefix.length > 0) {
      const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
      result = cleanPrefix

      // Generate remaining characters to make total length 8
      const remainingLength = 8 - cleanPrefix.length
      if (remainingLength > 0) {
        const array = new Uint8Array(remainingLength)
        crypto.getRandomValues(array)

        for (let i = 0; i < remainingLength; i++) {
          result += chars.charAt(array[i] % chars.length)
        }
      }
    } else {
      // Generate full 8-character code without prefix
      const array = new Uint8Array(8)
      crypto.getRandomValues(array)

      for (let i = 0; i < 8; i++) {
        result += chars.charAt(array[i] % chars.length)
      }
    }

    return result
  }

  // Advanced Activity Log Search
  static async searchActivityLogs(searchTerm: string, options: {
    fields?: string[]
    caseSensitive?: boolean
    exactMatch?: boolean
    limit?: number
  } = {}): Promise<ActivityLog[]> {
    this.checkSupabaseClient()

    const { fields = ['code', 'details', 'ip_address'], caseSensitive = false, exactMatch = false, limit = 100 } = options

    let query = supabase!.from('usage_logs').select('*')

    if (exactMatch) {
      const orConditions = fields.map(field => `${field}.eq.${searchTerm}`).join(',')
      query = query.or(orConditions)
    } else {
      const operator = caseSensitive ? 'like' : 'ilike'
      const searchPattern = `%${searchTerm}%`
      const orConditions = fields.map(field => `${field}.${operator}.${searchPattern}`).join(',')
      query = query.or(orConditions)
    }

    query = query.order('timestamp', { ascending: false }).limit(limit)

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to search activity logs: ${error.message}`)
    }

    return data || []
  }

  // Bulk Activity Log Operations
  static async bulkDeleteActivityLogs(logIds: string[]): Promise<number> {
    this.checkSupabaseClient()

    const { error, count } = await supabase!
      .from('usage_logs')
      .delete({ count: 'exact' })
      .in('id', logIds)

    if (error) {
      throw new Error(`Failed to delete activity logs: ${error.message}`)
    }

    return count || 0
  }

  static async bulkUpdateActivityLogs(updates: Array<{ id: string; updates: Partial<UsageLog> }>): Promise<void> {
    this.checkSupabaseClient()

    const promises = updates.map(({ id, updates: logUpdates }) =>
      supabase!
        .from('usage_logs')
        .update(logUpdates)
        .eq('id', id)
    )

    const results = await Promise.allSettled(promises)
    const failures = results.filter(result => result.status === 'rejected')

    if (failures.length > 0) {
      throw new Error(`Failed to update ${failures.length} activity logs`)
    }
  }

  // Activity Log Analytics
  static async getActivityLogStats(dateRange?: { start: string; end: string }): Promise<{
    totalLogs: number
    logsByAction: Record<string, number>
    logsByHour: Record<string, number>
    uniqueUsers: number
    uniqueIPs: number
    averageLogsPerDay: number
  }> {
    this.checkSupabaseClient()

    let query = supabase!.from('usage_logs').select('*')

    if (dateRange) {
      query = query
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch activity log stats: ${error.message}`)
    }

    if (!data) {
      return {
        totalLogs: 0,
        logsByAction: {},
        logsByHour: {},
        uniqueUsers: 0,
        uniqueIPs: 0,
        averageLogsPerDay: 0
      }
    }

    const logsByAction = data.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const logsByHour = data.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours().toString().padStart(2, '0')
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const uniqueIPs = new Set(data.map(log => log.ip_address).filter(Boolean)).size
    const uniqueUsers = new Set(data.map(log => log.ip_address).filter(Boolean)).size // Using IP as user proxy

    const dateSpan = dateRange
      ? Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
      : 1
    const averageLogsPerDay = data.length / Math.max(dateSpan, 1)

    return {
      totalLogs: data.length,
      logsByAction,
      logsByHour,
      uniqueUsers,
      uniqueIPs,
      averageLogsPerDay
    }
  }

  // Export Activity Logs
  static async exportActivityLogs(filters: ActivityLogFilters = {}, format: 'csv' | 'json' = 'csv'): Promise<string> {
    this.checkSupabaseClient()

    const { logs } = await this.getActivityLogs({ filters, pagination: { page: 1, limit: 10000 } })

    if (format === 'json') {
      return JSON.stringify(logs, null, 2)
    }

    // CSV format
    if (logs.length === 0) {
      return 'No data to export'
    }

    const headers = ['ID', 'Code', 'Action', 'Timestamp', 'Details', 'IP Address', 'User Agent']
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.code,
        log.action,
        log.timestamp,
        `"${(log.details || '').replace(/"/g, '""')}"`,
        log.ip_address || '',
        `"${(log.user_agent || '').replace(/"/g, '""')}"`
      ].join(','))
    ]

    return csvRows.join('\n')
  }

  // Real-time subscriptions
  static subscribeToAccessCodes(callback: (payload: any) => void) {
    this.checkSupabaseClient()

    return supabase!
      .channel('access_codes_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'access_codes' },
        callback
      )
      .subscribe()
  }

  static subscribeToUsageLogs(callback: (payload: any) => void) {
    this.checkSupabaseClient()

    return supabase!
      .channel('usage_logs_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'usage_logs' },
        callback
      )
      .subscribe()
  }

  // Enhanced real-time subscription for activity logs
  static subscribeToActivityLogs(callback: (payload: any) => void, filters?: ActivityLogFilters) {
    this.checkSupabaseClient()

    const channel = supabase!.channel('activity_logs_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'usage_logs' },
        (payload) => {
          // Apply client-side filtering if needed
          if (filters) {
            // Basic filtering logic - can be enhanced
            const { new: newRecord, old: oldRecord } = payload
            const record = newRecord || oldRecord

            if (filters.actions && filters.actions.length > 0 && !filters.actions.includes('all')) {
              if (!filters.actions.includes(record?.action)) {
                return
              }
            }

            if (filters.searchTerm) {
              const searchLower = filters.searchTerm.toLowerCase()
              const matchesSearch =
                record?.code?.toLowerCase().includes(searchLower) ||
                record?.details?.toLowerCase().includes(searchLower) ||
                record?.ip_address?.toLowerCase().includes(searchLower)

              if (!matchesSearch) {
                return
              }
            }
          }

          callback(payload)
        }
      )
      .subscribe()

    return channel
  }
}
