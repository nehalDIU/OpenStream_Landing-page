"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useTheme } from "@/contexts/theme-context"
import {
  Filter,
  Calendar as CalendarIcon,
  X,
  Search,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Globe,
  RotateCcw,
  ChevronDown
} from "lucide-react"
import { format } from "date-fns"
import type { 
  ActivityLogFilters, 
  DateRangeFilter,
  ActivityTypeFilter,
  StatusFilter,
  UserFilter 
} from "@/types/activity-logs"

interface ActivityLogsFiltersProps {
  filters: ActivityLogFilters
  onFiltersChange: (filters: ActivityLogFilters) => void
  onReset: () => void
  onClose?: () => void
  className?: string
}

export function ActivityLogsFilters({
  filters,
  onFiltersChange,
  onReset,
  onClose,
  className
}: ActivityLogsFiltersProps) {
  const { resolvedTheme } = useTheme()
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined,
    to: filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined
  })

  // Handle date range change
  const handleDateRangeChange = useCallback((range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)
    
    if (range.from && range.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: range.from,
          end: range.to,
          preset: 'custom'
        }
      })
    } else if (!range.from && !range.to) {
      const { dateRange: _, ...restFilters } = filters
      onFiltersChange(restFilters)
    }
  }, [filters, onFiltersChange])

  // Handle preset date ranges
  const handleDatePreset = useCallback((preset: string) => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
        break
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last90days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        return
    }

    setDateRange({ from: start, to: end })
    onFiltersChange({
      ...filters,
      dateRange: {
        start,
        end,
        preset: preset as any
      }
    })
  }, [filters, onFiltersChange])

  // Handle activity type filter
  const handleActivityTypeChange = useCallback((type: string, checked: boolean) => {
    const currentTypes = filters.activityTypes || {
      generated: false,
      used: false,
      expired: false,
      revoked: false
    }

    onFiltersChange({
      ...filters,
      activityTypes: {
        ...currentTypes,
        [type]: checked
      }
    })
  }, [filters, onFiltersChange])

  // Handle search term change
  const handleSearchChange = useCallback((searchTerm: string) => {
    if (searchTerm.trim()) {
      onFiltersChange({
        ...filters,
        searchTerm: searchTerm.trim()
      })
    } else {
      const { searchTerm: _, ...restFilters } = filters
      onFiltersChange(restFilters)
    }
  }, [filters, onFiltersChange])

  // Handle user filter change
  const handleUserFilterChange = useCallback((field: string, value: string) => {
    const currentUsers = filters.users || { userIds: [], ipAddresses: [], sessionIds: [] }
    
    if (value.trim()) {
      const values = value.split(',').map(v => v.trim()).filter(Boolean)
      onFiltersChange({
        ...filters,
        users: {
          ...currentUsers,
          [field]: values
        }
      })
    } else {
      const { [field]: _, ...restUsers } = currentUsers
      if (Object.keys(restUsers).length === 0 || Object.values(restUsers).every(arr => arr.length === 0)) {
        const { users: __, ...restFilters } = filters
        onFiltersChange(restFilters)
      } else {
        onFiltersChange({
          ...filters,
          users: restUsers
        })
      }
    }
  }, [filters, onFiltersChange])

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.dateRange) count++
    if (filters.activityTypes && Object.values(filters.activityTypes).some(Boolean)) count++
    if (filters.searchTerm) count++
    if (filters.users && Object.values(filters.users).some(arr => arr.length > 0)) count++
    if (filters.status) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <Card className={`theme-bg-card theme-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg theme-text-primary flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="theme-button-secondary"
            >
              Advanced
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="theme-button-secondary"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="theme-button-secondary"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium theme-text-secondary">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 theme-text-secondary" />
            <Input
              placeholder="Search by code, details, IP address..."
              defaultValue={filters.searchTerm || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 theme-input"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium theme-text-secondary">Date Range</Label>
          
          {/* Date Presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: 'last7days', label: 'Last 7 days' },
              { key: 'last30days', label: 'Last 30 days' },
              { key: 'last90days', label: 'Last 90 days' }
            ].map(preset => (
              <Button
                key={preset.key}
                variant={filters.dateRange?.preset === preset.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleDatePreset(preset.key)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 justify-start text-left font-normal theme-button-secondary"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => handleDateRangeChange({ ...dateRange, from: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 justify-start text-left font-normal theme-button-secondary"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => handleDateRangeChange({ ...dateRange, to: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {filters.dateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateRange({ from: undefined, to: undefined })
                const { dateRange: _, ...restFilters } = filters
                onFiltersChange(restFilters)
              }}
              className="text-xs theme-text-secondary hover:theme-text-primary"
            >
              <X className="h-3 w-3 mr-1" />
              Clear date range
            </Button>
          )}
        </div>

        {/* Activity Types */}
        <div className="space-y-2">
          <Label className="text-sm font-medium theme-text-secondary">Activity Types</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'generated', label: 'Generated', icon: Activity, color: 'text-blue-600' },
              { key: 'used', label: 'Used', icon: CheckCircle, color: 'text-green-600' },
              { key: 'expired', label: 'Expired', icon: Clock, color: 'text-orange-600' },
              { key: 'revoked', label: 'Revoked', icon: XCircle, color: 'text-red-600' }
            ].map(type => {
              const Icon = type.icon
              const isChecked = filters.activityTypes?.[type.key as keyof ActivityTypeFilter] || false
              
              return (
                <div key={type.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.key}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleActivityTypeChange(type.key, checked as boolean)}
                  />
                  <Label
                    htmlFor={type.key}
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <Icon className={`h-4 w-4 ${type.color}`} />
                    {type.label}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t theme-border">
            {/* User Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-medium theme-text-secondary">User Filters</Label>
              
              <div className="space-y-2">
                <Input
                  placeholder="IP addresses (comma-separated)"
                  defaultValue={filters.users?.ipAddresses?.join(', ') || ''}
                  onChange={(e) => handleUserFilterChange('ipAddresses', e.target.value)}
                  className="theme-input"
                />
                
                <Input
                  placeholder="User IDs (comma-separated)"
                  defaultValue={filters.users?.userIds?.join(', ') || ''}
                  onChange={(e) => handleUserFilterChange('userIds', e.target.value)}
                  className="theme-input"
                />
              </div>
            </div>

            {/* Code Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-medium theme-text-secondary">Code Filters</Label>
              <Input
                placeholder="Specific codes (comma-separated)"
                defaultValue={filters.codes?.join(', ') || ''}
                onChange={(e) => {
                  const codes = e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  if (codes.length > 0) {
                    onFiltersChange({ ...filters, codes })
                  } else {
                    const { codes: _, ...restFilters } = filters
                    onFiltersChange(restFilters)
                  }
                }}
                className="theme-input"
              />
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="pt-4 border-t theme-border">
            <div className="flex flex-wrap gap-2">
              {filters.dateRange && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Date Range
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined })
                      const { dateRange: _, ...restFilters } = filters
                      onFiltersChange(restFilters)
                    }}
                  />
                </Badge>
              )}
              
              {filters.searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Search
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      const { searchTerm: _, ...restFilters } = filters
                      onFiltersChange(restFilters)
                    }}
                  />
                </Badge>
              )}
              
              {filters.activityTypes && Object.values(filters.activityTypes).some(Boolean) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Activity Types
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      const { activityTypes: _, ...restFilters } = filters
                      onFiltersChange(restFilters)
                    }}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
