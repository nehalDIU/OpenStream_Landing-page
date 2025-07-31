"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Timer,
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalyticsOverviewProps {
  adminToken: string
}

interface OverviewStats {
  totalCodes: number
  activeCodes: number
  usedCodes: number
  expiredCodes: number
  successRate: number
  avgUsageTime: number
  peakHour: string
  totalUsers: number
  trends: {
    codesGenerated: { value: number; change: number }
    codesUsed: { value: number; change: number }
    successRate: { value: number; change: number }
    activeUsers: { value: number; change: number }
  }
}

export function AnalyticsOverview({ adminToken }: AnalyticsOverviewProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    fetchOverviewStats()
  }, [adminToken])

  const fetchOverviewStats = async () => {
    if (!adminToken) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
      green: "from-green-500/20 to-green-600/20 border-green-500/30",
      purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
      orange: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
      red: "from-red-500/20 to-red-600/20 border-red-500/30",
      indigo: "from-indigo-500/20 to-indigo-600/20 border-indigo-500/30"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const formatTrend = (change: number) => {
    const isPositive = change >= 0
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
      color: isPositive ? 'text-green-500' : 'text-red-500',
      icon: isPositive ? TrendingUp : TrendingDown
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="theme-bg-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-300 rounded mb-4"></div>
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="theme-bg-card">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">Failed to load analytics data</p>
          <p className="text-sm theme-text-secondary mt-2">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  const overviewCards = [
    {
      title: "Total Codes",
      value: stats.totalCodes,
      icon: Shield,
      description: "All time generated",
      trend: formatTrend(stats.trends.codesGenerated.change),
      color: "blue"
    },
    {
      title: "Active Codes",
      value: stats.activeCodes,
      icon: CheckCircle,
      description: "Currently valid",
      trend: null,
      color: "green"
    },
    {
      title: "Success Rate",
      value: `${stats.successRate.toFixed(1)}%`,
      icon: TrendingUp,
      description: "Successful validations",
      trend: formatTrend(stats.trends.successRate.change),
      color: "purple"
    },
    {
      title: "Active Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Last 24 hours",
      trend: formatTrend(stats.trends.activeUsers.change),
      color: "orange"
    },
    {
      title: "Used Codes",
      value: stats.usedCodes,
      icon: Activity,
      description: "Successfully used",
      trend: formatTrend(stats.trends.codesUsed.change),
      color: "indigo"
    },
    {
      title: "Expired Codes",
      value: stats.expiredCodes,
      icon: Timer,
      description: "Naturally expired",
      trend: null,
      color: "red"
    },
    {
      title: "Avg Usage Time",
      value: `${stats.avgUsageTime}min`,
      icon: Clock,
      description: "Time to use code",
      trend: null,
      color: "green"
    },
    {
      title: "Peak Hour",
      value: stats.peakHour,
      icon: BarChart3,
      description: "Highest activity",
      trend: null,
      color: "purple"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => {
          const Icon = card.icon
          const trend = card.trend
          const TrendIcon = trend?.icon
          
          return (
            <Card
              key={index}
              className={cn(
                "bg-gradient-to-br border theme-transition hover:scale-105",
                getColorClasses(card.color),
                resolvedTheme === 'light' && "shadow-sm hover:shadow-md"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8 theme-text-primary opacity-80" />
                  {trend && (
                    <div className={cn("flex items-center gap-1 text-sm", trend.color)}>
                      <TrendIcon className="h-3 w-3" />
                      {trend.value}
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm theme-text-secondary">{card.title}</p>
                  <p className="text-2xl font-bold theme-text-primary">{card.value}</p>
                  <p className="text-xs theme-text-secondary">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="theme-bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Code Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {stats.activeCodes} ({((stats.activeCodes / stats.totalCodes) * 100).toFixed(1)}%)
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Used</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {stats.usedCodes} ({((stats.usedCodes / stats.totalCodes) * 100).toFixed(1)}%)
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Expired</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {stats.expiredCodes} ({((stats.expiredCodes / stats.totalCodes) * 100).toFixed(1)}%)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.successRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.successRate.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="text-sm theme-text-secondary">
                <p>Peak activity occurs at {stats.peakHour}</p>
                <p>Average time to use: {stats.avgUsageTime} minutes</p>
                <p>Total unique users: {stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
