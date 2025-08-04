"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTheme } from "@/contexts/theme-context"
import {
  Activity,
  User,
  Shield,
  Key,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  type: "code_generated" | "code_used" | "code_revoked" | "login" | "export" | "system" | "error"
  title: string
  description: string
  timestamp: string
  user?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, any>
  severity: "low" | "medium" | "high" | "critical"
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  loading?: boolean
  onRefresh?: () => void
  maxItems?: number
  showFilters?: boolean
  className?: string
}

export function ActivityFeed({
  activities,
  loading = false,
  onRefresh,
  maxItems = 50,
  showFilters = true,
  className
}: ActivityFeedProps) {
  const { resolvedTheme } = useTheme()
  const [filter, setFilter] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "code_generated":
        return Key
      case "code_used":
        return CheckCircle
      case "code_revoked":
        return Trash2
      case "login":
        return User
      case "export":
        return Download
      case "system":
        return Monitor
      case "error":
        return AlertTriangle
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string, severity: string) => {
    if (severity === "critical") return "text-red-600 dark:text-red-400"
    if (severity === "high") return "text-orange-600 dark:text-orange-400"
    
    switch (type) {
      case "code_generated":
        return "text-green-600 dark:text-green-400"
      case "code_used":
        return "text-blue-600 dark:text-blue-400"
      case "code_revoked":
        return "text-red-600 dark:text-red-400"
      case "login":
        return "text-purple-600 dark:text-purple-400"
      case "export":
        return "text-cyan-600 dark:text-cyan-400"
      case "system":
        return "text-gray-600 dark:text-gray-400"
      case "error":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive" className="text-xs">Critical</Badge>
      case "high":
        return <Badge variant="destructive" className="text-xs bg-orange-500">High</Badge>
      case "medium":
        return <Badge variant="secondary" className="text-xs">Medium</Badge>
      case "low":
        return <Badge variant="outline" className="text-xs">Low</Badge>
      default:
        return null
    }
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return Globe
    
    if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
      return Smartphone
    }
    return Monitor
  }

  const formatTimeAgo = (timestamp: string) => {
    // Prevent hydration mismatch by only calculating on client
    if (!mounted) return "Loading..."

    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const filteredActivities = activities
    .filter(activity => filter === "all" || activity.type === filter)
    .slice(0, maxItems)

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  const filterOptions = [
    { value: "all", label: "All Activities", count: activities.length },
    { value: "code_generated", label: "Code Generated", count: activities.filter(a => a.type === "code_generated").length },
    { value: "code_used", label: "Code Used", count: activities.filter(a => a.type === "code_used").length },
    { value: "login", label: "Logins", count: activities.filter(a => a.type === "login").length },
    { value: "error", label: "Errors", count: activities.filter(a => a.type === "error").length }
  ]

  if (loading) {
    return (
      <Card className={cn("theme-bg-card border-0 shadow-lg", className)}>
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
            <div className={`h-8 w-8 rounded animate-pulse ${
              resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-full animate-pulse ${
                  resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-3/4 rounded animate-pulse ${
                    resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`} />
                  <div className={`h-3 w-1/2 rounded animate-pulse ${
                    resolvedTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("theme-bg-card border-0 shadow-lg", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold theme-text-primary flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Feed
            </CardTitle>
            <p className="text-sm theme-text-secondary">
              Real-time system activity and events
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="theme-button-secondary"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(option.value)}
                className="text-xs h-7"
              >
                {option.label}
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-6 space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 theme-text-muted mx-auto mb-3" />
                <h3 className="font-medium theme-text-primary mb-1">No activities found</h3>
                <p className="text-sm theme-text-secondary">
                  {filter === "all" ? "No recent activity to display." : `No ${filter.replace('_', ' ')} activities found.`}
                </p>
              </div>
            ) : (
              filteredActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type)
                const DeviceIcon = getDeviceIcon(activity.userAgent)
                
                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors",
                      "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      index === 0 && "bg-blue-50/50 dark:bg-blue-900/10"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                      "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <Icon className={cn("h-4 w-4", getActivityColor(activity.type, activity.severity))} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium theme-text-primary">
                            {activity.title}
                          </h4>
                          <p className="text-xs theme-text-secondary mt-1">
                            {activity.description}
                          </p>
                          
                          {/* Metadata */}
                          <div className="flex items-center gap-3 mt-2 text-xs theme-text-muted">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(activity.timestamp)}
                            </div>
                            
                            {activity.user && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {activity.user}
                              </div>
                            )}
                            
                            {activity.ip && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {activity.ip}
                              </div>
                            )}
                            
                            {activity.userAgent && (
                              <div className="flex items-center gap-1">
                                <DeviceIcon className="h-3 w-3" />
                                Device
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(activity.severity)}
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
