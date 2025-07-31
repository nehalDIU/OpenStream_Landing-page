"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import {
  Activity,
  Users,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Wifi,
  WifiOff
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RealTimeMonitorProps {
  adminToken: string
}

interface RealTimeEvent {
  id: string
  type: 'code_generated' | 'code_used' | 'code_expired' | 'user_connected' | 'error'
  timestamp: string
  data: {
    code?: string
    user?: string
    ip?: string
    details?: string
    success?: boolean
  }
}

interface SystemMetrics {
  activeUsers: number
  activeCodes: number
  requestsPerMinute: number
  successRate: number
  avgResponseTime: number
  systemLoad: number
  uptime: string
  lastUpdate: string
}

export function RealTimeMonitor({ adminToken }: RealTimeMonitorProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [events, setEvents] = useState<RealTimeEvent[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    activeCodes: 0,
    requestsPerMinute: 0,
    successRate: 0,
    avgResponseTime: 0,
    systemLoad: 0,
    uptime: "0h 0m",
    lastUpdate: new Date().toISOString()
  })
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const eventSourceRef = useRef<EventSource | null>(null)
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (adminToken && !isPaused) {
      connectToRealTimeStream()
      startMetricsPolling()
    }

    return () => {
      disconnectFromRealTimeStream()
      stopMetricsPolling()
    }
  }, [adminToken, isPaused])

  const connectToRealTimeStream = () => {
    try {
      // Create EventSource connection for real-time events
      eventSourceRef.current = new EventSource(`/api/analytics/realtime?token=${adminToken}`)
      
      eventSourceRef.current.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      eventSourceRef.current.onmessage = (event) => {
        try {
          const newEvent: RealTimeEvent = JSON.parse(event.data)
          setEvents(prev => [newEvent, ...prev.slice(0, 49)]) // Keep last 50 events
        } catch (err) {
          console.error('Failed to parse real-time event:', err)
        }
      }

      eventSourceRef.current.onerror = () => {
        setIsConnected(false)
        setError('Connection lost. Attempting to reconnect...')
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!isPaused) {
            connectToRealTimeStream()
          }
        }, 5000)
      }
    } catch (err) {
      setError('Failed to establish real-time connection')
      setIsConnected(false)
    }
  }

  const disconnectFromRealTimeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }

  const startMetricsPolling = () => {
    const pollMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/metrics', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        })

        if (response.ok) {
          const newMetrics = await response.json()
          setMetrics(newMetrics)
        }
      } catch (err) {
        console.error('Failed to fetch metrics:', err)
      }
    }

    // Poll metrics every 5 seconds
    metricsIntervalRef.current = setInterval(pollMetrics, 5000)
    pollMetrics() // Initial fetch
  }

  const stopMetricsPolling = () => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current)
      metricsIntervalRef.current = null
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      connectToRealTimeStream()
      startMetricsPolling()
    } else {
      disconnectFromRealTimeStream()
      stopMetricsPolling()
    }
  }

  const clearEvents = () => {
    setEvents([])
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'code_generated':
        return <Zap className="h-4 w-4 text-blue-500" />
      case 'code_used':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'code_expired':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'user_connected':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'code_generated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'code_used':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'code_expired':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'user_connected':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatEventType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-500'
    if (value >= thresholds.warning) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isConnected ? "text-green-500" : "text-red-500"
            )}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          
          {error && (
            <Badge variant="destructive" className="text-xs">
              {error}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={togglePause}
            variant="outline"
            size="sm"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
          
          <Button
            onClick={clearEvents}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="theme-bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold theme-text-primary">{metrics.activeUsers}</div>
            <div className="text-xs theme-text-secondary">Active Users</div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold theme-text-primary">{metrics.activeCodes}</div>
            <div className="text-xs theme-text-secondary">Active Codes</div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold theme-text-primary">{metrics.requestsPerMinute}</div>
            <div className="text-xs theme-text-secondary">Req/Min</div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardContent className="p-4 text-center">
            <div className={cn(
              "text-2xl font-bold",
              getMetricColor(metrics.successRate, { good: 95, warning: 90 })
            )}>
              {metrics.successRate.toFixed(1)}%
            </div>
            <div className="text-xs theme-text-secondary">Success Rate</div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardContent className="p-4 text-center">
            <div className={cn(
              "text-2xl font-bold",
              getMetricColor(100 - metrics.avgResponseTime, { good: 80, warning: 60 })
            )}>
              {metrics.avgResponseTime}ms
            </div>
            <div className="text-xs theme-text-secondary">Avg Response</div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardContent className="p-4 text-center">
            <div className={cn(
              "text-2xl font-bold",
              getMetricColor(100 - metrics.systemLoad, { good: 70, warning: 50 })
            )}>
              {metrics.systemLoad.toFixed(1)}%
            </div>
            <div className="text-xs theme-text-secondary">System Load</div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold theme-text-primary">{metrics.uptime}</div>
            <div className="text-xs theme-text-secondary">Uptime</div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Events */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity Feed
          </CardTitle>
          <CardDescription>
            Real-time system events and user activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-8 theme-text-secondary">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-xs mt-1">Events will appear here in real-time</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border theme-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("text-xs", getEventColor(event.type))}>
                        {formatEventType(event.type)}
                      </Badge>
                      <span className="text-xs theme-text-secondary">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="text-sm theme-text-primary">
                      {event.data.code && (
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {event.data.code}
                        </span>
                      )}
                      {event.data.user && (
                        <span className="ml-2">User: {event.data.user}</span>
                      )}
                      {event.data.ip && (
                        <span className="ml-2 text-xs theme-text-secondary">
                          ({event.data.ip})
                        </span>
                      )}
                    </div>
                    
                    {event.data.details && (
                      <p className="text-xs theme-text-secondary mt-1">
                        {event.data.details}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
