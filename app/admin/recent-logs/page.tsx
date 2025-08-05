"use client"

import { useState, useEffect } from "react"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  RefreshCw,
  Search,
  Download,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  X
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface UsageLog {
  id: string
  code: string
  action: 'generated' | 'used' | 'expired' | 'revoked'
  timestamp: string
  details?: string
  ip_address?: string
  user_agent?: string
}

export default function RecentLogsPage() {
  const [adminToken, setAdminToken] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Get admin token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('admin-token')
    if (savedToken) {
      setAdminToken(savedToken)
    }
  }, [])

  const { adminData, loading, error, refreshData } = useRealtimeData({
    adminToken,
    autoRefresh: true,
    refreshInterval: 30000
  })

  const logs = adminData?.usageLogs || []

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  // Filter logs based on search
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true

    return log.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
  })

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

  // Export functionality
  const exportLogs = () => {
    try {
      const csvContent = [
        ['Timestamp', 'Code', 'Action', 'Details', 'IP Address'].join(','),
        ...filteredLogs.slice(0, 1000).map(log => [
          log.timestamp,
          log.code,
          log.action,
          log.details || '',
          log.ip_address || ''
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recent-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Recent logs exported successfully")
    } catch (error) {
      toast.error("Failed to export logs")
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View recent system activity and usage logs
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
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredLogs.length.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto Refresh</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">30s</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading recent logs...
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 dark:text-red-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Error loading logs</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent logs found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Action</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 50).map((log) => {
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
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {log.details || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {log.ip_address || 'N/A'}
                          </span>
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
    </div>
  )
}
