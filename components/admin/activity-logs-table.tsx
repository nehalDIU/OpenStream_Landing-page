"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { useTheme } from "@/contexts/theme-context"
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Copy,
  MoreHorizontal,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Globe,
  Calendar,
  Timer
} from "lucide-react"
import { toast } from "sonner"
import type { 
  ActivityLogEntry, 
  SortConfig,
  PaginationConfig 
} from "@/types/activity-logs"

interface ActivityLogsTableProps {
  logs: ActivityLogEntry[]
  loading?: boolean
  total: number
  sort: SortConfig
  pagination: PaginationConfig
  selectedLogs: string[]
  expandedRows: string[]
  onSort: (field: keyof ActivityLogEntry) => void
  onPaginationChange: (changes: Partial<PaginationConfig>) => void
  onRowSelection: (logId: string) => void
  onRowExpansion: (logId: string) => void
  onSelectAll: () => void
  onClearSelection: () => void
  className?: string
}

export function ActivityLogsTable({
  logs,
  loading = false,
  total,
  sort,
  pagination,
  selectedLogs,
  expandedRows,
  onSort,
  onPaginationChange,
  onRowSelection,
  onRowExpansion,
  onSelectAll,
  onClearSelection,
  className
}: ActivityLogsTableProps) {
  const { resolvedTheme } = useTheme()

  // Calculate pagination info
  const totalPages = Math.ceil(total / pagination.pageSize)
  const startItem = (pagination.page - 1) * pagination.pageSize + 1
  const endItem = Math.min(pagination.page * pagination.pageSize, total)

  // Get action display info
  const getActionDisplay = (action: string) => {
    switch (action) {
      case 'generated':
        return { 
          icon: Activity, 
          color: 'text-blue-600 dark:text-blue-400', 
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          label: 'Generated'
        }
      case 'used':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600 dark:text-green-400', 
          bg: 'bg-green-50 dark:bg-green-900/20',
          label: 'Used'
        }
      case 'expired':
        return { 
          icon: Clock, 
          color: 'text-orange-600 dark:text-orange-400', 
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          label: 'Expired'
        }
      case 'revoked':
        return { 
          icon: XCircle, 
          color: 'text-red-600 dark:text-red-400', 
          bg: 'bg-red-50 dark:bg-red-900/20',
          label: 'Revoked'
        }
      default:
        return { 
          icon: AlertCircle, 
          color: 'text-gray-600 dark:text-gray-400', 
          bg: 'bg-gray-50 dark:bg-gray-900/20',
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
      full: date.toLocaleString(),
      relative: getTimeAgo(date)
    }
  }

  // Get time ago
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

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`)
    }).catch(() => {
      toast.error('Failed to copy to clipboard')
    })
  }

  // Render sort icon
  const renderSortIcon = (field: keyof ActivityLogEntry) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />
    }
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  // Table columns configuration
  const columns = [
    {
      key: 'select' as const,
      label: '',
      sortable: false,
      width: '50px'
    },
    {
      key: 'action' as const,
      label: 'Action',
      sortable: true,
      width: '120px'
    },
    {
      key: 'code' as const,
      label: 'Code',
      sortable: true,
      width: '100px'
    },
    {
      key: 'timestamp' as const,
      label: 'Timestamp',
      sortable: true,
      width: '180px'
    },
    {
      key: 'ip_address' as const,
      label: 'IP Address',
      sortable: true,
      width: '130px'
    },
    {
      key: 'details' as const,
      label: 'Details',
      sortable: false,
      width: 'auto'
    },
    {
      key: 'actions' as const,
      label: 'Actions',
      sortable: false,
      width: '100px'
    }
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedLogs.length === logs.length && logs.length > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectAll()
                } else {
                  onClearSelection()
                }
              }}
            />
            <span className="text-sm theme-text-secondary">
              {selectedLogs.length > 0 ? `${selectedLogs.length} selected` : 'Select all'}
            </span>
          </div>
          
          {selectedLogs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="theme-button-secondary"
            >
              Clear Selection
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm theme-text-secondary">
            Showing {startItem}-{endItem} of {total}
          </span>
          
          <select
            value={pagination.pageSize}
            onChange={(e) => onPaginationChange({ pageSize: parseInt(e.target.value), page: 1 })}
            className="px-2 py-1 text-sm border rounded theme-input"
          >
            {pagination.sizeOptions.map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card className="theme-bg-card theme-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="theme-border">
                {columns.map((column) => (
                  <TableHead 
                    key={column.key}
                    className={`theme-text-secondary ${column.sortable ? 'cursor-pointer hover:theme-text-primary' : ''}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && column.key !== 'select' && column.key !== 'actions' && onSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && column.key !== 'select' && column.key !== 'actions' && renderSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Activity className="h-5 w-5 animate-spin theme-text-accent mr-2" />
                      <span className="theme-text-secondary">Loading activity logs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 theme-text-secondary" />
                      <span className="theme-text-secondary">No activity logs found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const actionDisplay = getActionDisplay(log.action)
                  const timestamp = formatTimestamp(log.timestamp)
                  const isSelected = selectedLogs.includes(log.id)
                  const isExpanded = expandedRows.includes(log.id)
                  const ActionIcon = actionDisplay.icon

                  return (
                    <React.Fragment key={log.id}>
                      <TableRow
                        className={`theme-border theme-table-row theme-transition ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        {/* Selection */}
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onRowSelection(log.id)}
                          />
                        </TableCell>

                        {/* Action */}
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`${actionDisplay.bg} ${actionDisplay.color} border-0`}
                          >
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {actionDisplay.label}
                          </Badge>
                        </TableCell>

                        {/* Code */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded font-mono">
                              {log.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(log.code, 'Code')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm theme-text-primary">
                              {timestamp.date} {timestamp.time}
                            </div>
                            <div className="text-xs theme-text-secondary">
                              {timestamp.relative}
                            </div>
                          </div>
                        </TableCell>

                        {/* IP Address */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 theme-text-secondary" />
                            <span className="text-sm font-mono">
                              {log.ip_address || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Details */}
                        <TableCell>
                          <div className="max-w-xs truncate text-sm theme-text-secondary">
                            {log.details || 'No details available'}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRowExpansion(log.id)}
                              className="h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <TableRow className="theme-border">
                          <TableCell colSpan={columns.length} className="bg-gray-50 dark:bg-gray-900/50">
                            <div className="p-4 space-y-4">
                              <h4 className="font-semibold theme-text-primary">Log Details</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <label className="text-sm font-medium theme-text-secondary">Full Timestamp</label>
                                  <p className="text-sm theme-text-primary">{timestamp.full}</p>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium theme-text-secondary">User Agent</label>
                                  <p className="text-sm theme-text-primary break-all">
                                    {log.user_agent || 'Not available'}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium theme-text-secondary">Log ID</label>
                                  <p className="text-sm font-mono theme-text-primary">{log.id}</p>
                                </div>
                              </div>

                              {log.details && (
                                <div>
                                  <label className="text-sm font-medium theme-text-secondary">Full Details</label>
                                  <p className="text-sm theme-text-primary mt-1">{log.details}</p>
                                </div>
                              )}

                              {log.metadata && (
                                <div>
                                  <label className="text-sm font-medium theme-text-secondary">Metadata</label>
                                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm theme-text-secondary">
          Showing {startItem} to {endItem} of {total} results
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange({ page: 1 })}
            disabled={pagination.page === 1}
            className="theme-button-secondary"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange({ page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="theme-button-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="px-3 py-1 text-sm theme-text-primary">
            Page {pagination.page} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange({ page: pagination.page + 1 })}
            disabled={pagination.page === totalPages}
            className="theme-button-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange({ page: totalPages })}
            disabled={pagination.page === totalPages}
            className="theme-button-secondary"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
