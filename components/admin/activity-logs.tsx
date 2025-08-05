"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  Search,
  Download,
  RefreshCw,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"

interface ActivityLogsProps {
  adminToken: string
  className?: string
}

interface ActivityLog {
  id: string
  action: string
  code: string
  timestamp: string
  ip_address?: string
  user_agent?: string
  details?: string
  success?: boolean
}

interface ActivityLogsState {
  logs: ActivityLog[]
  loading: boolean
  error: string | null
  total: number
  search: string
  currentPage: number
  pageSize: number
}

export function ActivityLogs({ adminToken, className }: ActivityLogsProps) {
  const [searchInput, setSearchInput] = useState("")

  const [state, setState] = useState<ActivityLogsState>({
    logs: [],
    loading: false,
    error: null,
    total: 0,
    search: "",
    currentPage: 1,
    pageSize: 25
  })

  // Fetch activity logs
  const fetchLogs = useCallback(async (showToast = false) => {
    if (!adminToken) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const queryParams = new URLSearchParams({
        page: state.currentPage.toString(),
        limit: state.pageSize.toString(),
        sortBy: 'timestamp',
        sortOrder: 'desc'
      })

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
        toast.success('Activity logs refreshed')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activity logs'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      toast.error(errorMessage)
    }
  }, [adminToken, state.currentPage, state.pageSize, state.search])

  // Initial load and refresh when dependencies change
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setState(prev => ({
        ...prev,
        search: searchInput,
        currentPage: 1
      }))
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    setState(prev => ({
      ...prev,
      currentPage: newPage
    }))
  }, [])

  // Export functionality
  const handleExport = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      const queryParams = new URLSearchParams({
        format: 'csv',
        limit: '1000'
      })

      if (state.search) {
        queryParams.append('search', state.search)
      }

      const response = await fetch(`/api/activity-logs/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Activity logs exported successfully')

    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export activity logs')
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [adminToken, state.search])

  // Get action display info
  const getActionDisplay = (action: string) => {
    switch (action) {
      case 'generated':
        return {
          icon: Activity,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          label: 'Generated'
        }
      case 'used':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          label: 'Used'
        }
      case 'expired':
        return {
          icon: Clock,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          label: 'Expired'
        }
      case 'revoked':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          label: 'Revoked'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          label: 'Unknown'
        }
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  // Calculate pagination
  const totalPages = Math.ceil(state.total / state.pageSize)
  const startItem = (state.currentPage - 1) * state.pageSize + 1
  const endItem = Math.min(state.currentPage * state.pageSize, state.total)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor system activity and access codes usage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-64"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchInput("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={state.loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={state.loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{state.total.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Page</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{state.currentPage} of {totalPages}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{state.currentPage}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Showing</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{startItem}-{endItem}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {state.loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading activity logs...
              </div>
            </div>
          ) : state.error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 dark:text-red-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Error loading logs</p>
                <p className="text-sm">{state.error}</p>
              </div>
            </div>
          ) : state.logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activity logs found</p>
              {state.search && <p className="text-sm">Try adjusting your search terms</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Action</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.logs.map((log) => {
                    const actionDisplay = getActionDisplay(log.action)
                    const timestamp = formatTimestamp(log.timestamp)
                    const IconComponent = actionDisplay.icon

                    return (
                      <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${actionDisplay.bg}`}>
                              <IconComponent className={`h-4 w-4 ${actionDisplay.color}`} />
                            </div>
                            <span className="font-medium text-sm">{actionDisplay.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                            {log.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {timestamp.date} {timestamp.time}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {timestamp.relative}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {log.ip_address || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={log.success === false ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {log.success === false ? 'Failed' : 'Success'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {state.total > state.pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startItem} to {endItem} of {state.total.toLocaleString()} results
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(state.currentPage - 1)}
              disabled={state.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (state.currentPage <= 3) {
                  pageNum = i + 1
                } else if (state.currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = state.currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === state.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(state.currentPage + 1)}
              disabled={state.currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
