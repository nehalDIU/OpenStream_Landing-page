"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Clock,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { AnalyticsOverview } from "@/components/admin/analytics/analytics-overview"
import { UsageCharts } from "@/components/admin/analytics/usage-charts"
import { ReportsPanel } from "@/components/admin/analytics/reports-panel"
import { RealTimeMonitor } from "@/components/admin/analytics/real-time-monitor"

export default function AnalyticsPage() {
  const [adminToken, setAdminToken] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const { resolvedTheme } = useTheme()

  // Get admin token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('admin-token')
    if (savedToken) {
      setAdminToken(savedToken)
    }
  }, [])

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      description: "Key metrics and insights"
    },
    {
      id: "usage",
      label: "Usage Analytics",
      icon: TrendingUp,
      description: "Detailed usage patterns"
    },
    {
      id: "reports",
      label: "Reports",
      icon: Download,
      description: "Generate and export reports"
    },
    {
      id: "realtime",
      label: "Real-time",
      icon: Activity,
      description: "Live monitoring dashboard"
    }
  ]

  const refreshData = async () => {
    setLoading(true)
    try {
      // Trigger refresh across all components
      toast.success("Analytics data refreshed")
    } catch (error) {
      toast.error("Failed to refresh data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold theme-text-primary">Analytics Dashboard</h1>
            <p className="text-sm theme-text-secondary">
              Comprehensive insights into access code usage and system performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={refreshData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="theme-bg-card rounded-lg p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b theme-border pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            )
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <AnalyticsOverview adminToken={adminToken} />
          )}
          
          {activeTab === "usage" && (
            <UsageCharts adminToken={adminToken} />
          )}
          
          {activeTab === "reports" && (
            <ReportsPanel adminToken={adminToken} />
          )}
          
          {activeTab === "realtime" && (
            <RealTimeMonitor adminToken={adminToken} />
          )}
        </div>
      </div>
    </div>
  )
}
