"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Search,
  RefreshCw,
  Activity,
  Clock,
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

  // Filter logs based on search
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true

    return log.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
  })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10) // Show only recent 10 activities

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
  return (
    <Card>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-48"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading recent activity...
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity found</p>
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
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
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
                            {timestamp.time}
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
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
