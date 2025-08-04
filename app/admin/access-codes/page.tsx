"use client"

import { useState, useEffect } from "react"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeGenerator } from "@/components/admin/access-codes/code-generator"
import { DataTable } from "@/components/admin/access-codes/data-table"
import { RecentAccessCodes } from "@/components/admin/access-codes/recent-access-codes"
import { useComponentPerformance } from "@/components/optimized/lazy-components"
import {
  Clock,
  Users,
  Activity,
  CheckCircle,
  Copy,
  Eye,
  Timer,
  TrendingUp,
  Key,
  Trash2
} from "lucide-react"

interface AccessCode {
  code: string
  expiresAt: string
  createdAt: string
  usedAt?: string
  usedBy?: string
  prefix?: string
  auto_expire_on_use?: boolean
  max_uses?: number
  current_uses?: number
}

interface UsageLog {
  id: string
  code: string
  action: 'generated' | 'used' | 'expired' | 'revoked'
  timestamp: string
  details?: string
}

interface AdminData {
  activeCodes: AccessCode[]
  totalCodes: number
  usageLogs: UsageLog[]
}

export default function AccessCodesPage() {
  // Performance tracking
  useComponentPerformance('AccessCodesPage')

  // Get admin token from localStorage (set by the layout)
  const [adminToken, setAdminToken] = useState("")
  const [tokenLoaded, setTokenLoaded] = useState(false)

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('admin-token')
      const isAuthenticated = localStorage.getItem('admin-authenticated')

      if (token && isAuthenticated === 'true') {
        console.log('Access Codes Page: Setting admin token:', token ? `${token.substring(0, 8)}...` : 'EMPTY')
        setAdminToken(token)
      } else {
        console.log('Access Codes Page: No valid token found in localStorage')
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



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return "Expired"
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }



  // Define table columns for access codes
  const accessCodeColumns = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-blue-400">{value}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyCode(value)}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value: string) => formatDate(value)
    },
    {
      key: "expiresAt",
      label: "Expires",
      sortable: true,
      render: (value: string) => formatDate(value)
    },
    {
      key: "timeRemaining",
      label: "Time Left",
      render: (_: any, row: any) => (
        <Badge variant={new Date(row.expiresAt) > new Date() ? "default" : "destructive"}>
          {getTimeRemaining(row.expiresAt)}
        </Badge>
      )
    },
    {
      key: "prefix",
      label: "Prefix",
      render: (value: string) => (
        value ? (
          <Badge variant="outline" className="font-mono">
            {value}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">None</span>
        )
      )
    },
    {
      key: "auto_expire_on_use",
      label: "Reusable",
      render: (value: boolean) => (
        <Badge variant={value === false ? "default" : "secondary"}>
          {value === false ? "Yes" : "No"}
        </Badge>
      )
    },
    {
      key: "usage",
      label: "Usage",
      render: (_: any, row: any) => {
        if (row.max_uses) {
          const percentage = (row.current_uses / row.max_uses) * 100
          const variant = percentage >= 100 ? "destructive" : percentage >= 80 ? "secondary" : "default"
          return (
            <Badge variant={variant} className="font-mono">
              {row.current_uses}/{row.max_uses}
            </Badge>
          )
        } else if (row.current_uses > 0) {
          return (
            <Badge variant="outline" className="font-mono">
              {row.current_uses}
            </Badge>
          )
        } else {
          return (
            <span className="text-gray-400 text-sm">Unused</span>
          )
        }
      }
    },
    {
      key: "status",
      label: "Status",
      render: (_: any, row: any) => (
        row.usedAt ? (
          <Badge variant="secondary">
            <CheckCircle className="h-3 w-3 mr-1" />
            Used
          </Badge>
        ) : (
          <Badge variant="default">
            <Clock className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      )
    }
  ]

  // Calculate stats for sidebar
  const statsData = {
    activeCodes: adminData?.activeCodes?.length || 0,
    totalCodes: adminData?.totalCodes || 0,
    recentActivity: adminData?.usageLogs?.length || 0
  }

  return (
    <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="theme-bg-card theme-transition">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium theme-text-secondary">
                  Active Codes
                </CardTitle>
                <Key className="h-4 w-4 theme-text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold theme-text-primary">
                  {adminData?.activeCodes?.length || 0}
                </div>
                <p className="text-xs theme-text-muted">
                  Currently valid access codes
                </p>
              </CardContent>
            </Card>

            <Card className="theme-bg-card theme-transition">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium theme-text-secondary">
                  Total Generated
                </CardTitle>
                <TrendingUp className="h-4 w-4 theme-text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold theme-text-primary">
                  {adminData?.totalCodes || 0}
                </div>
                <p className="text-xs theme-text-muted">
                  All-time code generation count
                </p>
              </CardContent>
            </Card>

            <Card className="theme-bg-card theme-transition">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium theme-text-secondary">
                  Recent Activity
                </CardTitle>
                <Activity className="h-4 w-4 theme-text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold theme-text-primary">
                  {adminData?.usageLogs?.length || 0}
                </div>
                <p className="text-xs theme-text-muted">
                  Recent usage events
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Code Generator */}
          <CodeGenerator onGenerate={generateCode} loading={loading} />

          {/* Recent Access Codes */}
          <RecentAccessCodes
            codes={adminData?.activeCodes || []}
            loading={loading}
            onCopyCode={copyCode}
            onRevokeCode={revokeCode}
            onRefresh={refreshData}
          />

          {/* All Access Codes Table */}
          <DataTable
            title="All Access Codes"
            description="Complete list of all access codes with advanced filtering and management"
            data={adminData?.activeCodes || []}
            columns={accessCodeColumns}
            loading={loading}
            searchPlaceholder="Search access codes..."
            actions={[
              {
                label: "Copy",
                icon: Copy,
                onClick: (row) => copyCode(row.code),
                variant: "outline"
              },
              {
                label: "Revoke",
                icon: Trash2,
                onClick: (row) => revokeCode(row.code),
                variant: "destructive"
              }
            ]}
          />
    </div>
  )
}
