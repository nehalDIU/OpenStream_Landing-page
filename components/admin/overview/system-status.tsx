"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTheme } from "@/contexts/theme-context"
import {
  Activity,
  Clock,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SystemStatusProps {
  adminData: any
  loading?: boolean
}

export function SystemStatus({
  adminData,
  loading = false
}: SystemStatusProps) {
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: "2h 45m",
    responseTime: 45,
    memoryUsage: 68,
    cpuUsage: 32,
    diskUsage: 45,
    activeConnections: 12,
    lastBackup: "2 hours ago",
    databaseStatus: "healthy"
  })
  const { resolvedTheme } = useTheme()

  // Calculate system health metrics
  const calculateSystemHealth = () => {
    if (!adminData) return { score: 0, status: "unknown", issues: [] }

    const issues = []
    let score = 100

    // Check for expiring codes
    const expiringSoon = adminData.activeCodes?.filter((code: any) => {
      const expiresAt = new Date(code.expiresAt)
      const now = new Date()
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
      return expiresAt <= fiveMinutesFromNow && expiresAt > now
    }).length || 0

    if (expiringSoon > 5) {
      issues.push("Many codes expiring soon")
      score -= 15
    }

    // Check recent errors
    const recentErrors = adminData.usageLogs?.filter((log: any) => {
      const logDate = new Date(log.timestamp)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return logDate >= oneHourAgo && (log.details?.includes('error') || log.details?.includes('failed'))
    }).length || 0

    if (recentErrors > 10) {
      issues.push("High error rate detected")
      score -= 20
    }

    // Check system resources
    if (systemMetrics.memoryUsage > 85) {
      issues.push("High memory usage")
      score -= 10
    }

    if (systemMetrics.cpuUsage > 80) {
      issues.push("High CPU usage")
      score -= 10
    }

    if (systemMetrics.diskUsage > 90) {
      issues.push("Low disk space")
      score -= 15
    }

    let status = "excellent"
    if (score < 95) status = "good"
    if (score < 80) status = "warning"
    if (score < 60) status = "critical"

    return { score: Math.max(0, score), status, issues }
  }

  const systemHealth = calculateSystemHealth()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-500"
      case "good":
        return "text-blue-500"
      case "warning":
        return "text-orange-500"
      case "critical":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
      case "good":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getProgressColor = (value: number, thresholds = { warning: 70, critical: 85 }) => {
    if (value >= thresholds.critical) return "bg-red-500"
    if (value >= thresholds.warning) return "bg-orange-500"
    return "bg-green-500"
  }

  if (loading) {
    return (
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>
            Overall system performance and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(systemHealth.status)}
              <span className={cn("font-medium", getStatusColor(systemHealth.status))}>
                {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
              </span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {systemHealth.score}%
            </Badge>
          </div>

          <Progress 
            value={systemHealth.score} 
            className="h-2"
          />

          {systemHealth.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Issues Detected:
              </h4>
              {systemHealth.issues.map((issue, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-3 w-3" />
                  {issue}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resource Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4" />
                <span>Memory</span>
              </div>
              <span className="font-medium">{systemMetrics.memoryUsage}%</span>
            </div>
            <Progress 
              value={systemMetrics.memoryUsage} 
              className="h-2"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                <span>CPU</span>
              </div>
              <span className="font-medium">{systemMetrics.cpuUsage}%</span>
            </div>
            <Progress 
              value={systemMetrics.cpuUsage} 
              className="h-2"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span>Disk</span>
              </div>
              <span className="font-medium">{systemMetrics.diskUsage}%</span>
            </div>
            <Progress 
              value={systemMetrics.diskUsage} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Uptime</span>
            </div>
            <span className="font-medium">{systemMetrics.uptime}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span>Response Time</span>
            </div>
            <span className="font-medium">{systemMetrics.responseTime}ms</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Active Connections</span>
            </div>
            <span className="font-medium">{systemMetrics.activeConnections}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Database</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {systemMetrics.databaseStatus}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Last Backup</span>
            </div>
            <span className="font-medium">{systemMetrics.lastBackup}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
