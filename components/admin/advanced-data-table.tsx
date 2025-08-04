"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/contexts/theme-context"
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  title?: string
  description?: string
  searchable?: boolean
  filterable?: boolean
  exportable?: boolean
  selectable?: boolean
  actions?: {
    view?: (row: T) => void
    edit?: (row: T) => void
    delete?: (row: T) => void
  }
  bulkActions?: {
    label: string
    action: (selectedRows: T[]) => void
    icon?: React.ComponentType<{ className?: string }>
    variant?: "default" | "destructive"
  }[]
  onRefresh?: () => void
  pageSize?: number
  emptyState?: {
    title: string
    description: string
    icon?: React.ComponentType<{ className?: string }>
  }
}

export function AdvancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  title,
  description,
  searchable = true,
  filterable = true,
  exportable = true,
  selectable = false,
  actions,
  bulkActions = [],
  onRefresh,
  pageSize = 10,
  emptyState
}: DataTableProps<T>) {
  const { resolvedTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: "asc" | "desc"
  }>({ key: null, direction: "asc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchQuery) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        )
      }
    })

    return result
  }, [data, searchQuery, filters])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((_, index) => index)))
    } else {
      setSelectedRows(new Set())
    }
  }, [paginatedData])

  const handleSelectRow = useCallback((index: number, checked: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(index)
      } else {
        newSet.delete(index)
      }
      return newSet
    })
  }, [])

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  const exportData = useCallback(() => {
    const csv = [
      columns.map(col => col.label).join(","),
      ...sortedData.map(row =>
        columns.map(col => String(row[col.key])).join(",")
      )
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title || "data"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [sortedData, columns, title])

  const getSortIcon = (key: keyof T) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.direction === "asc" 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card className="theme-bg-card border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className={`h-6 w-32 rounded animate-pulse ${
                resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
              <div className={`h-4 w-48 rounded animate-pulse ${
                resolvedTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
              }`} />
            </div>
            <div className={`h-10 w-24 rounded animate-pulse ${
              resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-12 w-full rounded animate-pulse ${
                resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="theme-bg-card border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <CardTitle className="text-lg font-semibold theme-text-primary">
                {title}
              </CardTitle>
            )}
            {description && (
              <p className="text-sm theme-text-secondary mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="theme-button-secondary"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            )}
            
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                className="theme-button-secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        {(searchable || filterable) && (
          <div className="flex items-center gap-4 mt-4">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 theme-text-muted" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 theme-input"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            {filterable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="theme-button-secondary">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {Object.values(filters).some(v => v) && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {Object.values(filters).filter(v => v).length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columns.filter(col => col.filterable).map(column => (
                    <div key={String(column.key)} className="p-2">
                      <Input
                        placeholder={`Filter ${column.label}...`}
                        value={filters[String(column.key)] || ""}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [String(column.key)]: e.target.value
                        }))}
                        className="h-8"
                      />
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Bulk Actions */}
        {selectable && selectedRows.size > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <span className="text-sm theme-text-secondary">
              {selectedRows.size} item(s) selected
            </span>
            {bulkActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={() => {
                    const selectedData = Array.from(selectedRows).map(index => paginatedData[index])
                    action.action(selectedData)
                    setSelectedRows(new Set())
                  }}
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              )
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b theme-border">
                {selectable && (
                  <th className="w-12 p-4">
                    <Checkbox
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "text-left p-4 font-medium theme-text-secondary",
                      column.width && `w-${column.width}`,
                      column.sortable && "cursor-pointer hover:theme-text-primary"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th className="w-20 p-4 text-right font-medium theme-text-secondary">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="p-8">
                    <div className="text-center space-y-3">
                      {emptyState?.icon && (
                        <div className="flex justify-center">
                          <emptyState.icon className="h-12 w-12 theme-text-muted" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium theme-text-primary">
                          {emptyState?.title || "No data found"}
                        </h3>
                        <p className="text-sm theme-text-secondary mt-1">
                          {emptyState?.description || "There are no items to display."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b theme-border hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {selectable && (
                      <td className="p-4">
                        <Checkbox
                          checked={selectedRows.has(index)}
                          onCheckedChange={(checked) => handleSelectRow(index, checked as boolean)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={String(column.key)} className="p-4 theme-text-primary">
                        {column.render ? column.render(row[column.key], row) : String(row[column.key])}
                      </td>
                    ))}
                    {actions && (
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.view && (
                              <DropdownMenuItem onClick={() => actions.view!(row)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                            )}
                            {actions.edit && (
                              <DropdownMenuItem onClick={() => actions.edit!(row)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {actions.delete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => actions.delete!(row)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t theme-border">
            <div className="text-sm theme-text-secondary">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="theme-button-secondary"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="theme-button-secondary"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="theme-button-secondary"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="theme-button-secondary"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
