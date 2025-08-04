"use client"

import { useState, useEffect } from "react"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { useTheme } from "@/contexts/theme-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  RefreshCw,
  Search,
  Filter,
  Download,
  Clock,
  Activity,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set(['generated', 'used', 'expired', 'revoked']))
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const { resolvedTheme } = useTheme()

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

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAction = selectedActions.has(log.action)
    
    let matchesTime = true
    if (timeFilter !== "all") {
      const logTime = new Date(log.timestamp)
      const now = new Date()
      const diffHours = (now.getTime() - logTime.getTime()) / (1000 * 60 * 60)
      
      switch (timeFilter) {
        case "1h":
          matchesTime = diffHours <= 1
          break
        case "24h":
          matchesTime = diffHours <= 24
          break
        case "7d":
          matchesTime = diffHours <= 168
          break
      }
    }
    
    return matchesSearch && matchesAction && matchesTime
  })

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'generated':
        return <Zap className="h-4 w-4 text-blue-500" />
      case 'used':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expired':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'revoked':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionBadge = (action: string) => {
    const variants = {
      generated: "default",
      used: "default",
      expired: "secondary",
      revoked: "destructive"
    } as const
    
    return (
      <Badge variant={variants[action as keyof typeof variants] || "secondary"}>
        {action}
      </Badge>
    )
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Code', 'Action', 'Details', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
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
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Logs exported successfully")
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const logTime = new Date(timestamp)
    const diffMs = now.getTime() - logTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold theme-text-primary">Recent Logs</h1>
            <p className="text-sm theme-text-secondary">
              View and filter recent system activity
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="ml-2">
            {filteredLogs.length} logs
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 theme-text-secondary" />
                <Input
                  placeholder="Search logs by code, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Time Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">
                  <Clock className="h-4 w-4 mr-2" />
                  {timeFilter === "all" ? "All Time" : 
                   timeFilter === "1h" ? "Last Hour" :
                   timeFilter === "24h" ? "Last 24h" : "Last 7 days"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Time Range</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTimeFilter("all")}>
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("1h")}>
                  Last Hour
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("24h")}>
                  Last 24 Hours
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("7d")}>
                  Last 7 Days
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Action Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Actions ({selectedActions.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Action</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {['generated', 'used', 'expired', 'revoked'].map((action) => (
                  <DropdownMenuCheckboxItem
                    key={action}
                    checked={selectedActions.has(action)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedActions)
                      if (checked) {
                        newSelected.add(action)
                      } else {
                        newSelected.delete(action)
                      }
                      setSelectedActions(newSelected)
                    }}
                  >
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Export Button */}
            <Button
              onClick={exportLogs}
              variant="outline"
              disabled={filteredLogs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            {/* Refresh Button */}
            <Button
              onClick={refreshData}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent Activity Logs
            <Badge variant="secondary" className="ml-2">
              {filteredLogs.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Latest system activity and usage logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin theme-text-secondary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 theme-text-secondary">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No logs found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 100).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {formatTimeAgo(log.timestamp)}
                          </span>
                          <span className="text-xs theme-text-secondary">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                          {log.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm theme-text-secondary">
                          {log.details || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm theme-text-secondary font-mono">
                          {log.ip_address || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
