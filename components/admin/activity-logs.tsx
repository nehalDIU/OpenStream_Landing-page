"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import { exportActivityLogs } from "@/lib/export-utils"
import { DatabaseService } from "@/lib/supabase"
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  X
} from "lucide-react"
import { ActivityLogsTable } from "./activity-logs-table"
import { ActivityLogsFilters } from "./activity-logs-filters"
import {
  ActivityLogsSkeleton,
  ActivityLogsErrorBoundary,
  useScreenReaderAnnouncements,
  useKeyboardShortcuts,
  useDebounce,
  KEYBOARD_SHORTCUTS
} from "./activity-logs-accessibility"
import type { 
  ActivityLogEntry, 
  ActivityLogFilters, 
  ActivityLogQueryOptions,
  SortConfig,
  PaginationConfig 
} from "@/types/activity-logs"

interface ActivityLogsProps {
  adminToken: string
  className?: string
}

interface ActivityLogsState {
  logs: ActivityLogEntry[]
  loading: boolean
  error: string | null
  total: number
  filters: ActivityLogFilters
  search: string
  sort: SortConfig
  pagination: PaginationConfig
  selectedLogs: string[]
  expandedRows: string[]
}

export function ActivityLogs({ adminToken, className }: ActivityLogsProps) {
  const { resolvedTheme } = useTheme()
  const { announce, AnnouncementRegion } = useScreenReaderAnnouncements()

  // Debounce search to improve performance
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)

  // Filters visibility state
  const [showFilters, setShowFilters] = useState(false)
  
  const [state, setState] = useState<ActivityLogsState>({
    logs: [],
    loading: false,
    error: null,
    total: 0,
    filters: {},
    search: "",
    sort: { field: 'timestamp', direction: 'desc' },
    pagination: { 
      page: 1, 
      pageSize: 50, 
      showSizeOptions: true, 
      sizeOptions: [25, 50, 100, 200],
      showQuickJumper: true 
    },
    selectedLogs: [],
    expandedRows: []
  })

  // Fetch activity logs
  const fetchLogs = useCallback(async (showToast = false) => {
    if (!adminToken) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const queryParams = new URLSearchParams({
        page: state.pagination.page.toString(),
        limit: state.pagination.pageSize.toString(),
        sortBy: state.sort.field,
        sortOrder: state.sort.direction,
        includeAggregations: 'true'
      })

      // Add filters to query params
      if (state.filters.dateRange) {
        queryParams.append('startDate', state.filters.dateRange.start.toString())
        queryParams.append('endDate', state.filters.dateRange.end.toString())
      }

      if (state.filters.activityTypes) {
        const activeTypes = Object.entries(state.filters.activityTypes)
          .filter(([_, active]) => active)
          .map(([type, _]) => type)
        if (activeTypes.length > 0) {
          queryParams.append('actions', activeTypes.join(','))
        }
      }

      if (state.search) {
        queryParams.append('search', state.search)
      }

      const response = await fetch(`/api/activity-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        logs: data.data || [],
        total: data.pagination?.total || 0,
        loading: false
      }))

      if (showToast) {
        toast.success('Activity logs refreshed successfully')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activity logs'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      toast.error(errorMessage)
    }
  }, [adminToken, state.pagination.page, state.pagination.pageSize, state.sort, state.filters, state.search])

  // Initial load and refresh when dependencies change
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Real-time updates
  useEffect(() => {
    if (!adminToken) return

    // Subscribe to activity logs changes
    const subscription = DatabaseService.subscribeToActivityLogs((payload) => {
      console.log('Activity log change detected:', payload)

      const { eventType, new: newRecord, old: oldRecord } = payload

      if (eventType === 'INSERT' && newRecord) {
        // Add new log to the beginning of the list
        setState(prev => ({
          ...prev,
          logs: [newRecord, ...prev.logs].slice(0, prev.pagination.pageSize),
          total: prev.total + 1
        }))

        // Show toast notification for new activity
        const actionDisplay = getActionDisplay(newRecord.action)
        toast.info(`New activity: ${actionDisplay.label} for code ${newRecord.code}`, {
          duration: 3000,
          action: {
            label: 'View',
            onClick: () => {
              // Expand the new row
              setState(prev => ({
                ...prev,
                expandedRows: [...prev.expandedRows, newRecord.id]
              }))
            }
          }
        })
      } else if (eventType === 'UPDATE' && newRecord) {
        // Update existing log
        setState(prev => ({
          ...prev,
          logs: prev.logs.map(log =>
            log.id === newRecord.id ? { ...log, ...newRecord } : log
          )
        }))
      } else if (eventType === 'DELETE' && oldRecord) {
        // Remove deleted log
        setState(prev => ({
          ...prev,
          logs: prev.logs.filter(log => log.id !== oldRecord.id),
          total: Math.max(0, prev.total - 1)
        }))
      }
    }, state.filters)

    return () => {
      subscription.unsubscribe()
    }
  }, [adminToken, state.filters])

  // Auto-refresh every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchLogs])

  // Handle search with debouncing
  useEffect(() => {
    setState(prev => ({
      ...prev,
      search: debouncedSearch,
      pagination: { ...prev.pagination, page: 1 }
    }))
  }, [debouncedSearch])

  const handleSearchInput = useCallback((searchTerm: string) => {
    setSearchInput(searchTerm)
  }, [])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<ActivityLogFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, page: 1 }
    }))
  }, [])

  // Handle sort changes
  const handleSort = useCallback((field: keyof ActivityLogEntry) => {
    setState(prev => ({
      ...prev,
      sort: {
        field,
        direction: prev.sort.field === field && prev.sort.direction === 'asc' ? 'desc' : 'asc'
      },
      pagination: { ...prev.pagination, page: 1 }
    }))
  }, [])

  // Handle pagination changes
  const handlePaginationChange = useCallback((changes: Partial<PaginationConfig>) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, ...changes }
    }))
  }, [])

  // Handle row selection
  const handleRowSelection = useCallback((logId: string) => {
    setState(prev => ({
      ...prev,
      selectedLogs: prev.selectedLogs.includes(logId)
        ? prev.selectedLogs.filter(id => id !== logId)
        : [...prev.selectedLogs, logId]
    }))
  }, [])

  // Handle row expansion
  const handleRowExpansion = useCallback((logId: string) => {
    setState(prev => ({
      ...prev,
      expandedRows: prev.expandedRows.includes(logId)
        ? prev.expandedRows.filter(id => id !== logId)
        : [...prev.expandedRows, logId]
    }))
  }, [])

  // Handle select all
  const handleSelectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedLogs: state.logs.map(log => log.id)
    }))
  }, [state.logs])

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedLogs: []
    }))
  }, [])

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      search: "",
      pagination: { ...prev.pagination, page: 1 }
    }))
    setSearchInput("")
  }, [])

  // Toggle filters visibility
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])

  // Count active filters
  const getActiveFilterCount = useCallback(() => {
    let count = 0
    if (state.filters.dateRange) count++
    if (state.filters.activityTypes && Object.values(state.filters.activityTypes).some(Boolean)) count++
    if (state.filters.searchTerm) count++
    if (state.filters.users && Object.values(state.filters.users).some(arr => arr.length > 0)) count++
    if (state.filters.status) count++
    if (state.filters.codes && state.filters.codes.length > 0) count++
    return count
  }, [state.filters])

  const activeFilterCount = getActiveFilterCount()

  // Export functionality
  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      await exportActivityLogs(adminToken, format, state.filters, {
        includeMetadata: true,
        maxRows: 10000
      })

      toast.success(`Activity logs exported as ${format.toUpperCase()}`)

    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export activity logs')
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [adminToken, state.filters])

  // Get action icon and color
  const getActionDisplay = (action: string) => {
    switch (action) {
      case 'generated':
        return { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
      case 'used':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' }
      case 'expired':
        return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' }
      case 'revoked':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' }
      default:
        return { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' }
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getTimeAgo(date)
    }
  }

  // Get time ago helper
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    [KEYBOARD_SHORTCUTS.REFRESH]: () => fetchLogs(true),
    [KEYBOARD_SHORTCUTS.EXPORT_CSV]: () => handleExport('csv'),
    [KEYBOARD_SHORTCUTS.EXPORT_JSON]: () => handleExport('json'),
    [KEYBOARD_SHORTCUTS.TOGGLE_FILTERS]: toggleFilters,
    [`Ctrl+${KEYBOARD_SHORTCUTS.SELECT_ALL}`]: handleSelectAll,
    [KEYBOARD_SHORTCUTS.CLEAR_SELECTION]: handleClearSelection
  })

  return (
    <ActivityLogsErrorBoundary>
      <div className={`space-y-6 ${className}`} role="main" aria-label="Activity Logs">
        <AnnouncementRegion />

        {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold theme-text-primary">Activity Logs</h2>
          <p className="theme-text-secondary">
            Monitor and analyze system activity with advanced filtering and search
          </p>
        </div>

        {/* Quick Search Bar */}
        <div className="flex items-center gap-3 lg:min-w-96">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 theme-text-secondary" />
            <Input
              placeholder="Quick search logs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 theme-input"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchInput("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFilters}
            className={`theme-button-secondary ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={state.loading}
            className="theme-button-secondary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={state.loading}
            className="theme-button-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={state.loading}
            className="theme-button-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <ActivityLogsFilters
            filters={state.filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
            onClose={toggleFilters}
          />
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="theme-bg-card theme-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">
                  Total Logs
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Filtered
                    </Badge>
                  )}
                </p>
                <p className="text-2xl font-bold theme-text-primary">{state.total.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 theme-text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="theme-bg-card theme-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">Current Page</p>
                <p className="text-2xl font-bold theme-text-primary">{state.pagination.page}</p>
              </div>
              <Eye className="h-8 w-8 theme-text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="theme-bg-card theme-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">Page Size</p>
                <p className="text-2xl font-bold theme-text-primary">{state.pagination.pageSize}</p>
              </div>
              <User className="h-8 w-8 theme-text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="theme-bg-card theme-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">Selected</p>
                <p className="text-2xl font-bold theme-text-primary">{state.selectedLogs.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 theme-text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs Table */}
      <ActivityLogsTable
        logs={state.logs}
        loading={state.loading}
        total={state.total}
        sort={state.sort}
        pagination={state.pagination}
        selectedLogs={state.selectedLogs}
        expandedRows={state.expandedRows}
        onSort={handleSort}
        onPaginationChange={handlePaginationChange}
        onRowSelection={handleRowSelection}
        onRowExpansion={handleRowExpansion}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
      />
      </div>
    </ActivityLogsErrorBoundary>
  )
}
