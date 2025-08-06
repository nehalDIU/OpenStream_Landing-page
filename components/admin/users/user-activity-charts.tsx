"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/contexts/theme-context"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  Users
} from "lucide-react"

interface UserData {
  id: string
  ip_address: string
  device_type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  total_sessions: number
  total_codes_used: number
  success_rate: number
  is_active: boolean
  last_seen: string
}

interface UserActivityChartsProps {
  users: UserData[]
  loading?: boolean
  timeRange: string
}

export function UserActivityCharts({ users, loading, timeRange }: UserActivityChartsProps) {
  const { resolvedTheme } = useTheme()

  // Prepare device distribution data
  const deviceData = users.reduce((acc, user) => {
    acc[user.device_type] = (acc[user.device_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const deviceChartData = [
    { name: 'Desktop', value: deviceData.desktop || 0, color: '#3b82f6' },
    { name: 'Mobile', value: deviceData.mobile || 0, color: '#10b981' },
    { name: 'Tablet', value: deviceData.tablet || 0, color: '#f59e0b' }
  ].filter(item => item.value > 0)

  // Prepare browser distribution data
  const browserData = users.reduce((acc, user) => {
    acc[user.browser] = (acc[user.browser] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const browserChartData = Object.entries(browserData)
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Prepare activity distribution data
  const activityRanges = [
    { range: '1 session', min: 1, max: 1 },
    { range: '2-5 sessions', min: 2, max: 5 },
    { range: '6-10 sessions', min: 6, max: 10 },
    { range: '11+ sessions', min: 11, max: Infinity }
  ]

  const activityData = activityRanges.map(range => ({
    range: range.range,
    count: users.filter(user => 
      user.total_sessions >= range.min && user.total_sessions <= range.max
    ).length
  }))

  const chartTheme = {
    grid: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
    text: resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
    tooltip: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="theme-bg-card animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
              <div className="h-3 bg-gray-300 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-300 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Device Distribution */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5" />
            Device Types
          </CardTitle>
          <CardDescription>User distribution by device type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={deviceChartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {deviceChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartTheme.tooltip,
                  border: `1px solid ${chartTheme.grid}`,
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {deviceChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm theme-text-secondary">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Browser Distribution */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Top Browsers
          </CardTitle>
          <CardDescription>Most popular browsers used</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={browserChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis type="number" stroke={chartTheme.text} fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="browser" 
                stroke={chartTheme.text} 
                fontSize={12}
                width={60}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartTheme.tooltip,
                  border: `1px solid ${chartTheme.grid}`,
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Distribution */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            User Engagement
          </CardTitle>
          <CardDescription>Distribution by session count</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis 
                dataKey="range" 
                stroke={chartTheme.text} 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke={chartTheme.text} fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartTheme.tooltip,
                  border: `1px solid ${chartTheme.grid}`,
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="theme-text-secondary">Most Active User</span>
              <span className="theme-text-primary font-medium">
                {users.length > 0 
                  ? users.reduce((max, user) => user.total_sessions > max.total_sessions ? user : max).total_sessions + ' sessions'
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="theme-text-secondary">Average Sessions</span>
              <span className="theme-text-primary font-medium">
                {users.length > 0 
                  ? Math.round(users.reduce((sum, user) => sum + user.total_sessions, 0) / users.length)
                  : 0
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="theme-text-secondary">Success Rate</span>
              <span className="theme-text-primary font-medium">
                {users.length > 0 
                  ? Math.round(users.reduce((sum, user) => sum + user.success_rate, 0) / users.length) + '%'
                  : '0%'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
