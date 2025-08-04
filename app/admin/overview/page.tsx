"use client"

import { useState, useEffect } from "react"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { StatsCards } from "@/components/admin/stats-cards"
import { RecentAccessCodes } from "@/components/admin/access-codes/recent-access-codes"
import { QuickActionsPanel } from "@/components/admin/quick-actions-panel"
import { ActivityFeed } from "@/components/admin/activity-feed"
import { PerformanceOptimized, useComponentPerformance } from "@/components/optimized/lazy-components"
import { toast } from "sonner"

export default function OverviewPage() {
  // Get admin token from localStorage (set by the layout)
  const [adminToken, setAdminToken] = useState("")
  const [tokenLoaded, setTokenLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('admin-token')
      const isAuthenticated = localStorage.getItem('admin-authenticated')

      if (token && isAuthenticated === 'true') {
        setAdminToken(token)
      }
      setTokenLoaded(true)
    }

    // Check immediately
    checkToken()

    // Set up a single delayed check in case token is set after component mounts
    const timeoutId = setTimeout(checkToken, 2000)

    return () => clearTimeout(timeoutId)
  }, [])

  // Use the new realtime data hook only when token is loaded
  const {
    data: adminData,
    loading,
    error,
    generateCode,
    revokeCode,
    copyCode,
    refresh: refreshData
  } = useRealtimeData({
    adminToken: adminToken,
    autoRefresh: tokenLoaded && !!adminToken,
    refreshInterval: 30000
  })

  // Mock activity data for demonstration (using fixed timestamps to prevent hydration issues)
  const mockActivities = [
    {
      id: "1",
      type: "code_generated" as const,
      title: "New access code generated",
      description: "Access code ABC123 created for user authentication",
      timestamp: "2024-01-15T10:30:00.000Z",
      user: "admin",
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      severity: "low" as const
    },
    {
      id: "2",
      type: "code_used" as const,
      title: "Access code used successfully",
      description: "Code XYZ789 was used for authentication",
      timestamp: "2024-01-15T10:15:00.000Z",
      user: "user123",
      ip: "10.0.0.50",
      severity: "medium" as const
    },
    {
      id: "3",
      type: "login" as const,
      title: "Admin login",
      description: "Administrator logged into the system",
      timestamp: "2024-01-15T10:00:00.000Z",
      user: "admin",
      ip: "192.168.1.100",
      severity: "medium" as const
    }
  ]

  const handleGenerateCode = async () => {
    if (!adminToken) {
      toast.error("Admin token not available. Please refresh the page.")
      return
    }

    try {
      await generateCode({
        duration: 10, // 10 minutes default
        quantity: 1,
        prefix: undefined,
        autoExpire: true,
        maxUses: undefined
      })
      // Success toast is handled by the generateCode function
    } catch (error) {
      // Error toast is handled by the generateCode function
      console.error("Failed to generate code:", error)
    }
  }

  const handleExportData = () => {
    // Mock export functionality
    toast.success("Data export started")
  }

  const handleCleanupExpired = () => {
    // Mock cleanup functionality
    toast.success("Expired codes cleaned up")
  }



  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards
        data={{
          activeCodes: adminData?.activeCodes?.length || 0,
          totalCodes: adminData?.totalCodes || 0,
          recentActivity: adminData?.usageLogs?.length || 0,
          expiringSoon: mounted && adminData?.activeCodes ? adminData.activeCodes.filter(code => {
            const expiresAt = new Date(code.expiresAt)
            const now = new Date()
            const diff = expiresAt.getTime() - now.getTime()
            return diff > 0 && diff < 5 * 60 * 1000 // 5 minutes
          }).length : 0
        }}
        loading={loading}
        onRefresh={refreshData}
      />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Access Codes */}
          <RecentAccessCodes
            codes={adminData?.activeCodes || []}
            loading={loading}
            onCopyCode={copyCode}
            onRevokeCode={revokeCode}
            onRefresh={refreshData}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <PerformanceOptimized priority>
            <QuickActionsPanel
              onGenerateCode={handleGenerateCode}
              onExportData={handleExportData}
              onRefreshData={refreshData}
              onCleanupExpired={handleCleanupExpired}
            />
          </PerformanceOptimized>
        </div>
      </div>

      {/* Activity Feed Section - Bottom */}
      <div className="w-full mt-8">
        <PerformanceOptimized>
          <ActivityFeed
            activities={mockActivities}
            loading={loading}
            onRefresh={refreshData}
            maxItems={50}
            className="w-full"
            showFilters={true}
          />
        </PerformanceOptimized>
      </div>
    </div>
  )
}
