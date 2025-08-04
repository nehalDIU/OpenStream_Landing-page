"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/theme-context"
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Timer,
  BarChart3,
  Zap,
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface StatsCardsProps {
  data?: {
    activeCodes: number
    totalCodes: number
    recentActivity: number
    expiringSoon?: number
    usedToday?: number
    successRate?: number
    avgResponseTime?: number
    errorRate?: number
  }
  // Legacy props for backward compatibility
  activeCodes?: number
  totalCodes?: number
  recentActivity?: number
  loading?: boolean
  onRefresh?: () => void
}

export function StatsCards({ data, activeCodes, totalCodes, recentActivity, loading, onRefresh }: StatsCardsProps) {
  const { resolvedTheme } = useTheme()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Handle both data object and individual props for backward compatibility
  const safeData = data || {
    activeCodes: activeCodes || 0,
    totalCodes: totalCodes || 0,
    recentActivity: recentActivity || 0,
    expiringSoon: 0,
    successRate: 95,
    avgResponseTime: 120,
    errorRate: 2.1
  }

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  const stats = [
    {
      id: "activeCodes",
      title: "Active Codes",
      value: safeData.activeCodes,
      icon: Shield,
      description: "Currently valid codes",
      trend: "+12%",
      trendUp: true,
      color: "blue",
      category: "security",
      priority: "high"
    },
    {
      id: "totalCodes",
      title: "Total Generated",
      value: safeData.totalCodes,
      icon: BarChart3,
      description: "All time codes",
      trend: "+5%",
      trendUp: true,
      color: "green",
      category: "growth",
      priority: "medium"
    },
    {
      id: "recentActivity",
      title: "Recent Activity",
      value: safeData.recentActivity,
      icon: Activity,
      description: "Last 24 hours",
      trend: "+23%",
      trendUp: true,
      color: "purple",
      category: "activity",
      priority: "high"
    },
    {
      id: "expiringSoon",
      title: "Expiring Soon",
      value: safeData.expiringSoon || 0,
      icon: Timer,
      description: "Next 5 minutes",
      trend: "-8%",
      trendUp: false,
      color: "orange",
      category: "warning",
      priority: "critical"
    },
    {
      id: "successRate",
      title: "Success Rate",
      value: safeData.successRate || 95,
      icon: CheckCircle,
      description: "Authentication success",
      trend: "+2.1%",
      trendUp: true,
      color: "emerald",
      category: "performance",
      priority: "medium",
      suffix: "%"
    },
    {
      id: "avgResponseTime",
      title: "Avg Response",
      value: safeData.avgResponseTime || 120,
      icon: Zap,
      description: "Response time",
      trend: "-15ms",
      trendUp: true,
      color: "cyan",
      category: "performance",
      priority: "medium",
      suffix: "ms"
    }
  ]

  const getColorClasses = (color: string) => {
    const opacity = resolvedTheme === 'dark' ? '20' : '10'
    const borderOpacity = resolvedTheme === 'dark' ? '30' : '20'

    const colors = {
      blue: `from-blue-500/${opacity} to-blue-600/${opacity} border-blue-500/${borderOpacity}`,
      green: `from-green-500/${opacity} to-green-600/${opacity} border-green-500/${borderOpacity}`,
      purple: `from-purple-500/${opacity} to-purple-600/${opacity} border-purple-500/${borderOpacity}`,
      orange: `from-orange-500/${opacity} to-orange-600/${opacity} border-orange-500/${borderOpacity}`,
      emerald: `from-emerald-500/${opacity} to-emerald-600/${opacity} border-emerald-500/${borderOpacity}`,
      cyan: `from-cyan-500/${opacity} to-cyan-600/${opacity} border-cyan-500/${borderOpacity}`
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getIconColorClasses = (color: string) => {
    const bgOpacity = resolvedTheme === 'dark' ? '20' : '10'
    const textShade = resolvedTheme === 'dark' ? '400' : '600'

    const colors = {
      blue: `text-blue-${textShade} bg-blue-500/${bgOpacity}`,
      green: `text-green-${textShade} bg-green-500/${bgOpacity}`,
      purple: `text-purple-${textShade} bg-purple-500/${bgOpacity}`,
      orange: `text-orange-${textShade} bg-orange-500/${bgOpacity}`,
      emerald: `text-emerald-${textShade} bg-emerald-500/${bgOpacity}`,
      cyan: `text-cyan-${textShade} bg-cyan-500/${bgOpacity}`
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      case 'high':
        return <div className="w-2 h-2 bg-orange-500 rounded-full" />
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="theme-bg-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-2">
                <div className={`h-3 w-20 rounded animate-pulse ${
                  resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
                <div className={`h-2 w-16 rounded animate-pulse ${
                  resolvedTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
                }`} />
              </div>
              <div className={`h-10 w-10 rounded-xl animate-pulse ${
                resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`h-8 w-16 rounded animate-pulse ${
                resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
              <div className="flex items-center gap-2">
                <div className={`h-5 w-12 rounded animate-pulse ${
                  resolvedTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
                }`} />
                <div className={`h-3 w-16 rounded animate-pulse ${
                  resolvedTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold theme-text-primary">System Overview</h2>
          <p className="text-sm theme-text-secondary">Real-time metrics and performance indicators</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="theme-button-secondary"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.trendUp ? ArrowUpRight : ArrowDownRight

          return (
            <Card
              key={stat.id}
              className={cn(
                "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer",
                "bg-gradient-to-br",
                getColorClasses(stat.color),
                "hover:scale-[1.02] hover:-translate-y-1"
              )}
            >
              {/* Priority Indicator */}
              <div className="absolute top-3 right-3">
                {getPriorityIndicator(stat.priority)}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xs font-medium theme-text-secondary uppercase tracking-wide">
                      {stat.title}
                    </CardTitle>
                    <p className="text-xs theme-text-muted">
                      {stat.description}
                    </p>
                  </div>
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    getIconColorClasses(stat.color)
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold theme-text-primary transition-all duration-500 ease-out">
                    {stat.value.toLocaleString()}
                  </span>
                  {stat.suffix && (
                    <span className="text-sm theme-text-secondary font-medium">
                      {stat.suffix}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Badge
                    variant={stat.trendUp ? "default" : "destructive"}
                    className="text-xs px-2 py-1"
                  >
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View details"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Card>
          )
        })}
      </div>
    </div>
  )
}
