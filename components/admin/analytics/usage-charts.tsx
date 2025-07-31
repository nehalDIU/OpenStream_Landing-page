"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "@/contexts/theme-context"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"
import {
  Calendar,
  TrendingUp,
  Clock,
  Users,
  Activity,
  Filter
} from "lucide-react"

interface UsageChartsProps {
  adminToken: string
}

interface ChartData {
  hourlyUsage: Array<{ hour: string; generated: number; used: number; expired: number }>
  dailyTrends: Array<{ date: string; codes: number; users: number; success_rate: number }>
  codeTypeDistribution: Array<{ name: string; value: number; color: string }>
  userActivity: Array<{ time: string; active_users: number; peak_hour: boolean }>
  successRateHistory: Array<{ date: string; rate: number; total_attempts: number }>
}

export function UsageCharts({ adminToken }: UsageChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    fetchChartData()
  }, [adminToken, timeRange])

  const fetchChartData = async () => {
    if (!adminToken) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics/charts?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }

      const data = await response.json()
      setChartData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const chartTheme = {
    background: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
    text: resolvedTheme === 'dark' ? '#f3f4f6' : '#374151',
    grid: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
    tooltip: resolvedTheme === 'dark' ? '#374151' : '#ffffff'
  }

  const colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#8b5cf6',
    warning: '#f59e0b',
    danger: '#ef4444'
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="theme-bg-card animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-300 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !chartData) {
    return (
      <Card className="theme-bg-card">
        <CardContent className="p-6 text-center">
          <p className="text-red-500">Failed to load chart data</p>
          {error && <p className="text-sm theme-text-secondary mt-2">{error}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold theme-text-primary">Usage Analytics</h2>
          <p className="text-sm theme-text-secondary">Detailed insights into code usage patterns</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchChartData} variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Usage Pattern */}
        <Card className="theme-bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hourly Usage Pattern
            </CardTitle>
            <CardDescription>Code generation and usage by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.hourlyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis 
                  dataKey="hour" 
                  stroke={chartTheme.text}
                  fontSize={12}
                />
                <YAxis stroke={chartTheme.text} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip,
                    border: `1px solid ${chartTheme.grid}`,
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar dataKey="generated" fill={colors.primary} name="Generated" />
                <Bar dataKey="used" fill={colors.secondary} name="Used" />
                <Bar dataKey="expired" fill={colors.danger} name="Expired" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Trends */}
        <Card className="theme-bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Trends
            </CardTitle>
            <CardDescription>Code activity and user engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis 
                  dataKey="date" 
                  stroke={chartTheme.text}
                  fontSize={12}
                />
                <YAxis stroke={chartTheme.text} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip,
                    border: `1px solid ${chartTheme.grid}`,
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="codes" 
                  stroke={colors.primary} 
                  strokeWidth={2}
                  name="Total Codes"
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke={colors.secondary} 
                  strokeWidth={2}
                  name="Active Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Code Type Distribution */}
        <Card className="theme-bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Code Type Distribution
            </CardTitle>
            <CardDescription>Breakdown of code types and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.codeTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.codeTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success Rate History */}
        <Card className="theme-bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Success Rate History
            </CardTitle>
            <CardDescription>Code validation success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.successRateHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis 
                  dataKey="date" 
                  stroke={chartTheme.text}
                  fontSize={12}
                />
                <YAxis 
                  stroke={chartTheme.text} 
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip,
                    border: `1px solid ${chartTheme.grid}`,
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={colors.secondary}
                  fill={colors.secondary}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
