// Activity Logs Feature Types
// Comprehensive type definitions for the Activity Logs system

import { UsageLog } from '@/lib/supabase'

// Enhanced Activity Log Entry
export interface ActivityLogEntry extends UsageLog {
  // User identification
  user_id?: string
  session_id?: string
  
  // Technical details
  browser_info?: string
  location?: string
  success: boolean
  error_message?: string
  duration_ms?: number
  
  // Additional metadata
  metadata?: {
    code_type?: string
    expiration_time?: string
    generation_method?: 'manual' | 'bulk' | 'api'
    validation_attempts?: number
    referrer?: string
    device_type?: 'desktop' | 'mobile' | 'tablet'
    [key: string]: any
  }
  
  // Computed fields
  formatted_timestamp?: string
  time_ago?: string
  status_color?: string
  action_icon?: string
}

// Filter Types
export interface DateRangeFilter {
  start: Date | string
  end: Date | string
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'custom'
}

export interface ActivityTypeFilter {
  generated: boolean
  used: boolean
  expired: boolean
  revoked: boolean
}

export interface StatusFilter {
  success: boolean
  error: boolean
  pending?: boolean
}

export interface UserFilter {
  userIds: string[]
  ipAddresses: string[]
  sessionIds: string[]
}

// Comprehensive Filter Options
export interface ActivityLogFilters {
  dateRange?: DateRangeFilter
  activityTypes?: ActivityTypeFilter
  status?: StatusFilter
  users?: UserFilter
  codes?: string[]
  searchTerm?: string
  
  // Advanced filters
  minDuration?: number
  maxDuration?: number
  hasErrors?: boolean
  location?: string[]
  browserTypes?: string[]
  deviceTypes?: Array<'desktop' | 'mobile' | 'tablet'>
}

// Search Configuration
export interface SearchConfig {
  term: string
  fields: Array<'code' | 'details' | 'ip_address' | 'user_agent' | 'metadata'>
  caseSensitive: boolean
  exactMatch: boolean
  regex?: boolean
}

// Sorting Options
export interface SortConfig {
  field: keyof ActivityLogEntry
  direction: 'asc' | 'desc'
  secondary?: {
    field: keyof ActivityLogEntry
    direction: 'asc' | 'desc'
  }
}

// Pagination Configuration
export interface PaginationConfig {
  page: number
  pageSize: number
  showSizeOptions: boolean
  sizeOptions: number[]
  showQuickJumper: boolean
}

// Query Options for API
export interface ActivityLogQueryOptions {
  filters?: ActivityLogFilters
  search?: SearchConfig
  sort?: SortConfig
  pagination?: PaginationConfig
  
  // Data options
  includeMetadata?: boolean
  includeAggregations?: boolean
  groupBy?: 'date' | 'action' | 'user' | 'code' | 'hour'
  
  // Performance options
  useCache?: boolean
  cacheTimeout?: number
}

// API Response Types
export interface ActivityLogResponse {
  data: ActivityLogEntry[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
  aggregations?: ActivityLogAggregations
  metadata: {
    queryTime: number
    cached: boolean
    filters: ActivityLogFilters
    sort: SortConfig
  }
}

// Aggregation Data
export interface ActivityLogAggregations {
  totalByAction: Record<string, number>
  totalByDate: Record<string, number>
  totalByUser: Record<string, number>
  totalByStatus: Record<string, number>
  
  // Performance metrics
  successRate: number
  errorRate: number
  averageDuration: number
  medianDuration: number
  
  // Time-based metrics
  activityByHour: Record<string, number>
  activityByDay: Record<string, number>
  peakHours: string[]
  
  // User metrics
  uniqueUsers: number
  uniqueIPs: number
  topUsers: Array<{ user: string; count: number }>
  topIPs: Array<{ ip: string; count: number }>
}

// Export Configuration
export interface ExportConfig {
  format: 'csv' | 'json' | 'xlsx' | 'pdf'
  filename?: string
  
  // Data options
  includeHeaders: boolean
  includeMetadata: boolean
  includeAggregations: boolean
  
  // Formatting options
  dateFormat: string
  timezone: string
  delimiter?: string // for CSV
  
  // Column selection
  columns: Array<{
    key: keyof ActivityLogEntry
    label: string
    include: boolean
    format?: (value: any) => string
  }>
  
  // Filters to apply
  filters?: ActivityLogFilters
  maxRows?: number
}

// Real-time Event Types
export interface ActivityLogRealtimeEvent {
  type: 'activity_created' | 'activity_updated' | 'bulk_cleanup' | 'system_event'
  data: ActivityLogEntry | ActivityLogEntry[]
  timestamp: string
  source: 'user' | 'system' | 'api' | 'cleanup'
  metadata?: Record<string, any>
}

// Component State Types
export interface ActivityLogState {
  logs: ActivityLogEntry[]
  loading: boolean
  error: string | null
  
  // UI state
  selectedLogs: string[]
  expandedRows: string[]
  filters: ActivityLogFilters
  search: SearchConfig
  sort: SortConfig
  pagination: PaginationConfig
  
  // Feature flags
  realTimeEnabled: boolean
  exportEnabled: boolean
  bulkActionsEnabled: boolean
}

// Action Types for State Management
export type ActivityLogAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOGS'; payload: ActivityLogEntry[] }
  | { type: 'ADD_LOG'; payload: ActivityLogEntry }
  | { type: 'UPDATE_LOG'; payload: { id: string; updates: Partial<ActivityLogEntry> } }
  | { type: 'REMOVE_LOGS'; payload: string[] }
  | { type: 'SET_FILTERS'; payload: ActivityLogFilters }
  | { type: 'SET_SEARCH'; payload: SearchConfig }
  | { type: 'SET_SORT'; payload: SortConfig }
  | { type: 'SET_PAGINATION'; payload: Partial<PaginationConfig> }
  | { type: 'TOGGLE_ROW_SELECTION'; payload: string }
  | { type: 'TOGGLE_ROW_EXPANSION'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SELECT_ALL' }

// UI Component Props Types
export interface ActivityLogTableProps {
  logs: ActivityLogEntry[]
  loading?: boolean
  error?: string | null
  onFiltersChange?: (filters: ActivityLogFilters) => void
  onSortChange?: (sort: SortConfig) => void
  onPaginationChange?: (pagination: Partial<PaginationConfig>) => void
  onExport?: (config: ExportConfig) => void
  onRefresh?: () => void
  className?: string
}

export interface ActivityLogFiltersProps {
  filters: ActivityLogFilters
  onFiltersChange: (filters: ActivityLogFilters) => void
  onReset: () => void
  className?: string
}

export interface ActivityLogSearchProps {
  search: SearchConfig
  onSearchChange: (search: SearchConfig) => void
  placeholder?: string
  className?: string
}

// Utility Types
export type ActivityLogColumn = {
  key: keyof ActivityLogEntry
  label: string
  sortable: boolean
  filterable: boolean
  width?: number
  render?: (value: any, log: ActivityLogEntry) => React.ReactNode
}

export type ActivityLogTheme = {
  colors: {
    success: string
    error: string
    warning: string
    info: string
    neutral: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
}
