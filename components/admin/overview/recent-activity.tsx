"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  Search,
  Filter,
  RefreshCw,
  Activity,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  MoreHorizontal,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  Download
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

interface RecentActivityProps {
  logs: UsageLog[]
  loading?: boolean
  onRefresh: () => void
}

export function RecentActivity({
  logs,
  loading = false,
  onRefresh
}: RecentActivityProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof UsageLog>("timestamp")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set(['generated', 'used', 'expired', 'revoked']))
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const { resolvedTheme } = useTheme()

  // Filter and sort logs
  const filteredLogs = logs
    .filter(log => {
      const matchesSearch = log.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.ip_address?.includes(searchTerm)
      
      const matchesAction = selectedActions.has(log.action)
      
      const logDate = new Date(log.timestamp)
      const now = new Date()
      let matchesTime = true
      
      switch (timeFilter) {
        case "1h":
          matchesTime = (now.getTime() - logDate.getTime()) <= (60 * 60 * 1000)
          break
        case "24h":
          matchesTime = (now.getTime() - logDate.getTime()) <= (24 * 60 * 60 * 1000)
          break
        case "7d":
          matchesTime = (now.getTime() - logDate.getTime()) <= (7 * 24 * 60 * 60 * 1000)
          break
        default:
          matchesTime = true
      }
      
      return matchesSearch && matchesAction && matchesTime
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return 1
      if (bValue === undefined) return -1
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortDirection === "asc" ? comparison : -comparison
    })
    .slice(0, 20) // Show only recent 20 activities

  const handleSort = (field: keyof UsageLog) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const toggleActionFilter = (action: string) => {
    const newSelected = new Set(selectedActions)
    if (newSelected.has(action)) {
      newSelected.delete(action)
    } else {
      newSelected.add(action)
    }
    setSelectedActions(newSelected)
  }

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
      generated: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      used: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      revoked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
    
    return (
      <Badge className={cn("text-xs", variants[action as keyof typeof variants] || "bg-gray-100 text-gray-800")}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const exportActivity = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Code', 'Details', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.action,
        log.code,
        log.details || '',
        log.ip_address || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast.success("Activity log exported successfully")
  }

  return (
    <Card className="theme-bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Recent Activity
              <Badge variant="secondary" className="ml-2">
                {filteredLogs.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Latest system activity and usage logs
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={exportActivity}
              variant="outline"
              size="sm"
              disabled={filteredLogs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {['generated', 'used', 'expired', 'revoked'].map((action) => (
                  <DropdownMenuCheckboxItem
                    key={action}
                    checked={selectedActions.has(action)}
                    onCheckedChange={() => toggleActionFilter(action)}
                  >
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search activity logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-4 bg-gray-300 rounded w-32"></div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activity found</p>
            <p className="text-sm mt-1">Activity will appear here as users interact with the system</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("timestamp")}
                  >
                    <div className="flex items-center gap-2">
                      Time
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("action")}
                  >
                    <div className="flex items-center gap-2">
                      Action
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center gap-2">
                      Code
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {getActionBadge(log.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {log.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {log.details || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.ip_address && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          {log.ip_address}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
