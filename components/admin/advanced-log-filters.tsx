"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Filter,
  Calendar as CalendarIcon,
  X,
  RotateCcw,
  Search,
  Clock,
  User,
  MapPin,
  Monitor,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface LogFilters {
  search: string
  actions: Set<string>
  timeRange: string
  dateFrom?: Date
  dateTo?: Date
  ipAddress?: string
  userId?: string
  deviceType?: string
  status?: 'all' | 'success' | 'error'
}

interface AdvancedLogFiltersProps {
  filters: LogFilters
  onFiltersChange: (filters: LogFilters) => void
  totalLogs: number
  filteredLogs: number
  className?: string
}

export function AdvancedLogFilters({
  filters,
  onFiltersChange,
  totalLogs,
  filteredLogs,
  className
}: AdvancedLogFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tempFilters, setTempFilters] = useState<LogFilters>(filters)

  useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const updateFilter = (key: keyof LogFilters, value: any) => {
    const newFilters = { ...tempFilters, [key]: value }
    setTempFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const toggleAction = (action: string) => {
    const newActions = new Set(tempFilters.actions)
    if (newActions.has(action)) {
      newActions.delete(action)
    } else {
      newActions.add(action)
    }
    updateFilter('actions', newActions)
  }

  const clearFilters = () => {
    const defaultFilters: LogFilters = {
      search: "",
      actions: new Set(['generated', 'used', 'expired', 'revoked']),
      timeRange: "24h",
      status: "all"
    }
    setTempFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const hasActiveFilters = 
    filters.search !== "" ||
    filters.actions.size !== 4 ||
    filters.timeRange !== "24h" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.ipAddress ||
    filters.userId ||
    filters.deviceType ||
    filters.status !== "all"

  const actionOptions = [
    { value: 'generated', label: 'Generated', icon: Zap, color: 'text-blue-500' },
    { value: 'used', label: 'Used', icon: CheckCircle, color: 'text-green-500' },
    { value: 'expired', label: 'Expired', icon: Clock, color: 'text-orange-500' },
    { value: 'revoked', label: 'Revoked', icon: XCircle, color: 'text-red-500' }
  ]

  return (
    <Card className={cn("theme-bg-card", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            <Badge variant="secondary" className="ml-2">
              {filteredLogs} of {totalLogs}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by code, action, IP, user ID, or details..."
              value={tempFilters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Action Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Actions</Label>
          <div className="flex flex-wrap gap-2">
            {actionOptions.map((action) => {
              const Icon = action.icon
              const isSelected = tempFilters.actions.has(action.value)
              
              return (
                <Button
                  key={action.value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAction(action.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className={cn("h-4 w-4", action.color)} />
                  {action.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Quick Time Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Time Range</Label>
            <Select value={tempFilters.timeRange} onValueChange={(value) => updateFilter('timeRange', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={tempFilters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success Only</SelectItem>
                <SelectItem value="error">Errors Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Device Type</Label>
            <Select value={tempFilters.deviceType || ""} onValueChange={(value) => updateFilter('deviceType', value || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="All Devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Range */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Custom Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !tempFilters.dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.dateFrom ? format(tempFilters.dateFrom, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={tempFilters.dateFrom}
                          onSelect={(date) => updateFilter('dateFrom', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !tempFilters.dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.dateTo ? format(tempFilters.dateTo, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={tempFilters.dateTo}
                          onSelect={(date) => updateFilter('dateTo', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {(tempFilters.dateFrom || tempFilters.dateTo) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateFilter('dateFrom', undefined)
                      updateFilter('dateTo', undefined)
                    }}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Date Range
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Advanced Filters</Label>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="ipAddress" className="text-xs text-gray-500">
                      IP Address
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="ipAddress"
                        placeholder="Filter by IP address..."
                        value={tempFilters.ipAddress || ""}
                        onChange={(e) => updateFilter('ipAddress', e.target.value || undefined)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="userId" className="text-xs text-gray-500">
                      User ID
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="userId"
                        placeholder="Filter by user ID..."
                        value={tempFilters.userId || ""}
                        onChange={(e) => updateFilter('userId', e.target.value || undefined)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: "{filters.search}"
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('search', "")}
                    />
                  </Badge>
                )}
                
                {filters.timeRange !== "24h" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Time: {filters.timeRange === "all" ? "All Time" : 
                           filters.timeRange === "1h" ? "Last Hour" :
                           filters.timeRange === "7d" ? "Last 7 Days" : 
                           filters.timeRange === "30d" ? "Last 30 Days" : "Last 24h"}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('timeRange', "24h")}
                    />
                  </Badge>
                )}
                
                {filters.status !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {filters.status}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('status', "all")}
                    />
                  </Badge>
                )}
                
                {filters.ipAddress && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    IP: {filters.ipAddress}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('ipAddress', undefined)}
                    />
                  </Badge>
                )}
                
                {filters.userId && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    User: {filters.userId}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('userId', undefined)}
                    />
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
