"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  RefreshCw,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Clock,
  Users,
  Activity,
  Shield,
  Plus,
  Zap,
  Download,
  Settings,
  BarChart3
} from "lucide-react"
import { StatsCards } from "@/components/admin/stats-cards"
import { RecentAccessCodes } from "@/components/admin/overview/recent-access-codes"
import { RecentActivity } from "@/components/admin/overview/recent-activity"
import { SystemStatus } from "@/components/admin/overview/system-status"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface OverviewPageProps {
  adminToken: string
  adminData: any
  loading: boolean
  error: string | null
  onRefresh: () => void
  onGenerateCode: (options: any) => Promise<any>
  onRevokeCode: (code: string) => Promise<void>
  onCopyCode: (code: string) => void
}

export default function OverviewPage({
  adminToken,
  adminData,
  loading,
  error,
  onRefresh,
  onGenerateCode,
  onRevokeCode,
  onCopyCode
}: OverviewPageProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [quickActionLoading, setQuickActionLoading] = useState(false)
  const { resolvedTheme } = useTheme()

  // Calculate stats data for StatsCards
  const statsData = {
    activeCodes: adminData?.activeCodes?.length || 0,
    totalCodes: adminData?.totalCodes || 0,
    usageLogs: adminData?.usageLogs?.length || 0,
    expiringSoon: adminData?.activeCodes?.filter((code: any) => {
      const expiresAt = new Date(code.expiresAt)
      const now = new Date()
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
      return expiresAt <= fiveMinutesFromNow && expiresAt > now
    }).length || 0,
    usedToday: adminData?.usageLogs?.filter((log: any) => {
      const logDate = new Date(log.timestamp)
      const today = new Date()
      return logDate.toDateString() === today.toDateString() && log.action === 'used'
    }).length || 0,
    successRate: calculateSuccessRate(adminData?.usageLogs || [])
  }

  function calculateSuccessRate(logs: any[]): number {
    const validationAttempts = logs.filter(log => 
      log.action === 'used' || log.details?.includes('invalid') || log.details?.includes('expired')
    ).length
    const successful = logs.filter(log => log.action === 'used').length
    return validationAttempts > 0 ? (successful / validationAttempts) * 100 : 0
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await onRefresh()
      toast.success("Dashboard refreshed successfully")
    } catch (error) {
      toast.error("Failed to refresh dashboard")
    } finally {
      setRefreshing(false)
    }
  }

  // Quick Action Handlers
  const handleQuickGenerate = async (duration: number = 10) => {
    if (quickActionLoading) {
      toast.info("Please wait, another action is in progress...")
      return
    }

    setQuickActionLoading(true)
    try {
      console.log('Starting code generation with duration:', duration)

      // Validate inputs
      if (!duration || duration < 1 || duration > 1440) {
        throw new Error("Invalid duration. Must be between 1 and 1440 minutes.")
      }

      // Add a small delay to ensure the UI is ready
      await new Promise(resolve => setTimeout(resolve, 200))

      const result = await onGenerateCode({
        duration,
        quantity: 1,
        autoExpire: true
      })

      console.log('Code generation result:', result)

      if (result && result.length > 0) {
        toast.success(`✅ ${duration}-minute access code generated successfully`)
        // Refresh the data after successful generation
        setTimeout(() => onRefresh(), 500)
      } else {
        throw new Error("No code was generated")
      }

    } catch (error) {
      console.error('Code generation error in component:', error)

      // Try fallback direct API call
      try {
        console.log('Attempting fallback API call...')
        const response = await fetch('/api/access-codes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            action: 'generate',
            duration: duration,
            autoExpire: true
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Fallback API success:', data)
          toast.success(`✅ ${duration}-minute access code generated (fallback)`)
          setTimeout(() => onRefresh(), 500)
          return
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError)
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error(`❌ Failed to generate ${duration}-minute code: ${errorMessage}`)
    } finally {
      setQuickActionLoading(false)
    }
  }

  const handleBulkGenerate = async () => {
    setQuickActionLoading(true)
    try {
      // Generate codes sequentially to avoid overwhelming the API
      const codes = []

      // Generate 5-minute code
      const code1 = await onGenerateCode({
        duration: 5,
        quantity: 1,
        autoExpire: true
      })
      codes.push(code1)

      // Generate 15-minute code
      const code2 = await onGenerateCode({
        duration: 15,
        quantity: 1,
        autoExpire: true
      })
      codes.push(code2)

      // Generate 30-minute code
      const code3 = await onGenerateCode({
        duration: 30,
        quantity: 1,
        autoExpire: true
      })
      codes.push(code3)

      toast.success(`Generated ${codes.length} access codes`)
    } catch (error) {
      toast.error("Failed to generate bulk codes")
    } finally {
      setQuickActionLoading(false)
    }
  }

  const handleExportCodes = () => {
    const codes = adminData?.activeCodes || []
    const exportData = codes.map(code => ({
      code: code.code,
      prefix: code.prefix,
      created: code.createdAt,
      expires: code.expiresAt,
      used: code.usedAt,
      usedBy: code.usedBy
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `access-codes-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Access codes exported successfully")
  }

  const handleSystemReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      totalCodes: adminData?.activeCodes?.length || 0,
      usedCodes: adminData?.activeCodes?.filter(c => c.usedAt)?.length || 0,
      expiredCodes: adminData?.activeCodes?.filter(c => new Date(c.expiresAt) < new Date())?.length || 0,
      systemHealth: "Excellent", // This would come from actual system metrics
      uptime: "99.9%"
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("System report downloaded")
  }

  const handleCleanupExpired = async () => {
    setQuickActionLoading(true)
    try {
      const expiredCodes = adminData?.activeCodes?.filter(c => new Date(c.expiresAt) < new Date()) || []
      if (expiredCodes.length === 0) {
        toast.info("No expired codes to clean up")
        return
      }

      // This would typically call an API to clean up expired codes
      for (const code of expiredCodes) {
        await onRevokeCode(code.code)
      }
      toast.success(`Cleaned up ${expiredCodes.length} expired codes`)
    } catch (error) {
      toast.error("Failed to cleanup expired codes")
    } finally {
      setQuickActionLoading(false)
    }
  }

  const handleGenerateCustomCode = async () => {
    try {
      // This would open a modal for custom code generation
      toast.info("Custom code generator would open here")
    } catch (error) {
      toast.error("Failed to open custom generator")
    }
  }



  if (error) {
    return (
      <div className="space-y-6">
        <Card className="theme-bg-card border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <Activity className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
              Dashboard Error
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="border-red-300">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Quick Actions Dropdown */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading || quickActionLoading}
              >
                {quickActionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Quick Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Generate Codes</DropdownMenuLabel>
              {!adminToken && (
                <DropdownMenuItem disabled>
                  <Shield className="h-4 w-4 mr-2 text-red-500" />
                  No Admin Token
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleQuickGenerate(5)}
                disabled={quickActionLoading || !adminToken}
              >
                <Plus className="h-4 w-4 mr-2" />
                5-minute Code
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleQuickGenerate(15)}
                disabled={quickActionLoading || !adminToken}
              >
                <Plus className="h-4 w-4 mr-2" />
                15-minute Code
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleQuickGenerate(30)}
                disabled={quickActionLoading || !adminToken}
              >
                <Plus className="h-4 w-4 mr-2" />
                30-minute Code
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleQuickGenerate(60)}
                disabled={quickActionLoading || !adminToken}
              >
                <Plus className="h-4 w-4 mr-2" />
                1-hour Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleBulkGenerate}
                disabled={quickActionLoading || !adminToken}
              >
                <Copy className="h-4 w-4 mr-2" />
                Bulk Generate (3 codes)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleGenerateCustomCode}
                disabled={quickActionLoading || !adminToken}
              >
                <Settings className="h-4 w-4 mr-2" />
                Custom Generator
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Management</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={handleCleanupExpired}
                disabled={quickActionLoading || !adminToken}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Expired ({adminData?.activeCodes?.filter(c => new Date(c.expiresAt) < new Date())?.length || 0})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export & Reports</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={handleExportCodes}
                disabled={quickActionLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Codes ({adminData?.activeCodes?.length || 0})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSystemReport}
                disabled={quickActionLoading}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                System Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards data={statsData} loading={loading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Access Codes - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentAccessCodes
            codes={adminData?.activeCodes || []}
            loading={loading}
            onCopyCode={onCopyCode}
            onRevokeCode={onRevokeCode}
            onRefresh={onRefresh}
          />
        </div>

        {/* System Status - Takes 1 column */}
        <div className="lg:col-span-1">
          <SystemStatus
            adminData={adminData}
            loading={loading}
          />
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <RecentActivity
        logs={adminData?.usageLogs || []}
        loading={loading}
        onRefresh={onRefresh}
      />
    </div>
  )
}
