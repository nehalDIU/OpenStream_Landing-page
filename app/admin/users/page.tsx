"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  Users,
  Activity,
  Clock,
  TrendingUp,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react"
import { UsersStatsCards } from "@/components/admin/users/users-stats-cards"
import { UsersTable } from "@/components/admin/users/users-table"
import { UserActivityCharts } from "@/components/admin/users/user-activity-charts"
import { useRealtimeData } from "@/hooks/use-realtime-data"

interface UserData {
  id: string
  ip_address: string
  user_agent: string
  first_seen: string
  last_seen: string
  total_sessions: number
  total_codes_used: number
  success_rate: number
  device_type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  location?: string
  is_active: boolean
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    avgSessionDuration: 0
  })
  const [timeRange, setTimeRange] = useState('7d')
  const { resolvedTheme } = useTheme()

  // Fetch users data
  const fetchUsersData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users data')
      }

      const data = await response.json()
      setUsers(data.users || [])
      setUserStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching users data:', error)
      toast.error('Failed to load users data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsersData()
  }, [timeRange])

  const handleRefresh = () => {
    fetchUsersData()
    toast.success('Users data refreshed')
  }

  const handleExportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export users data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Users data exported successfully')
    } catch (error) {
      console.error('Error exporting users:', error)
      toast.error('Failed to export users data')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-text-primary">Users</h1>
          <p className="theme-text-secondary mt-1">
            Track user activity and engagement metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md theme-bg-card theme-border theme-text-primary"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportUsers}
            className="theme-button-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="theme-button-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <UsersStatsCards
        stats={userStats}
        loading={loading}
        timeRange={timeRange}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Users Table - Takes 2/3 width */}
        <div className="xl:col-span-2">
          <UsersTable
            users={users}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </div>

        {/* User Activity Charts - Takes 1/3 width */}
        <div className="space-y-6">
          <UserActivityCharts
            users={users}
            loading={loading}
            timeRange={timeRange}
          />
        </div>
      </div>
    </div>
  )
}
