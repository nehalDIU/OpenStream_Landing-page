"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react"

interface UsersStatsCardsProps {
  stats: {
    totalUsers: number
    activeUsers: number
    newUsersToday: number
    avgSessionDuration: number
  }
  loading?: boolean
  timeRange: string
}

export function UsersStatsCards({ stats, loading, timeRange }: UsersStatsCardsProps) {
  const { resolvedTheme } = useTheme()

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '24h': return 'last 24 hours'
      case '7d': return 'last 7 days'
      case '30d': return 'last 30 days'
      case '90d': return 'last 90 days'
      default: return 'selected period'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: `Unique users in ${getTimeRangeLabel(timeRange)}`,
      icon: Users,
      color: "blue",
      trend: null
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      description: "Users active in last 24 hours",
      icon: UserCheck,
      color: "green",
      trend: stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0
    },
    {
      title: "New Users Today",
      value: stats.newUsersToday,
      description: "First-time users today",
      icon: UserPlus,
      color: "purple",
      trend: null
    },
    {
      title: "Avg Session Duration",
      value: formatDuration(stats.avgSessionDuration),
      description: "Average time per session",
      icon: Clock,
      color: "orange",
      trend: null
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="theme-bg-card animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-300 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-300 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon
        const isNumericValue = typeof stat.value === 'number'
        
        return (
          <Card key={index} className="theme-bg-card theme-border hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium theme-text-secondary">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                'bg-orange-100 dark:bg-orange-900/20'
              }`}>
                <Icon className={`h-4 w-4 ${
                  stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                  stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                  'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold theme-text-primary">
                    {isNumericValue ? stat.value.toLocaleString() : stat.value}
                  </div>
                  <p className="text-xs theme-text-secondary mt-1">
                    {stat.description}
                  </p>
                </div>
                {stat.trend !== null && (
                  <div className="flex items-center">
                    <Badge 
                      variant={stat.trend >= 50 ? "default" : "secondary"}
                      className={`text-xs ${
                        stat.trend >= 50 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}
                    >
                      {stat.trend >= 50 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <Activity className="h-3 w-3 mr-1" />
                      )}
                      {stat.trend}%
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
