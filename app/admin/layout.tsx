"use client"

import React, { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/admin/sidebar"
import { Breadcrumb } from "@/components/admin/breadcrumb"
import { EnhancedTooltip } from "@/components/admin/enhanced-tooltip"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import { initializePerformanceTracking } from "@/lib/seo-optimization"
import { KeyboardShortcuts } from "@/components/admin/keyboard-shortcuts"
import { AdvancedSearch } from "@/components/admin/advanced-search"
import { useMemoryOptimization } from "@/components/optimized/lazy-components"
import {
  User,
  BarChart3,
  Key,
  Clock,
  Activity,
  TrendingUp,
  Settings,
  Shield,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  RefreshCw,
  Download
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [adminToken, setAdminToken] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize performance tracking and memory optimization
  useMemoryOptimization()

  useEffect(() => {
    initializePerformanceTracking()
  }, [])

  // Get real-time data for sidebar stats
  const { adminData, loading } = useRealtimeData({
    adminToken: isAuthenticated ? adminToken : "",
    autoRefresh: isAuthenticated,
    refreshInterval: 30000
  })

  // Session persistence - restore authentication state on page load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = localStorage.getItem('admin-token')
        const savedAuth = localStorage.getItem('admin-authenticated')
        const sessionTimestamp = localStorage.getItem('admin-session-timestamp')

        if (savedToken && savedAuth === 'true' && sessionTimestamp) {
          const sessionAge = Date.now() - parseInt(sessionTimestamp || '0')
          const maxSessionAge = 24 * 60 * 60 * 1000 // 24 hours

          if (sessionAge > maxSessionAge) {
            // Session expired, clear saved data
            localStorage.removeItem('admin-token')
            localStorage.removeItem('admin-authenticated')
            localStorage.removeItem('admin-session-timestamp')
            toast.info("Session expired. Please login again.")
          } else {
            // Verify the saved token is still valid
            const response = await fetch('/api/access-codes?action=admin', {
              headers: {
                'Authorization': `Bearer ${savedToken}`
              }
            })

            if (response.ok) {
              setAdminToken(savedToken)
              setIsAuthenticated(true)
              // Update session timestamp
              localStorage.setItem('admin-session-timestamp', Date.now().toString())
            } else {
              // Token is invalid, clear saved data
              localStorage.removeItem('admin-token')
              localStorage.removeItem('admin-authenticated')
              localStorage.removeItem('admin-session-timestamp')
            }
          }
        }
      } catch (error) {
        console.error('Session restoration failed:', error)
        // Clear invalid session data
        localStorage.removeItem('admin-token')
        localStorage.removeItem('admin-authenticated')
        localStorage.removeItem('admin-session-timestamp')
      } finally {
        setIsInitializing(false)
      }
    }

    restoreSession()
  }, [])

  const handleLogin = async (token: string) => {
    if (!token.trim()) {
      toast.error("Please enter an admin token")
      return false
    }

    try {
      const response = await fetch('/api/access-codes?action=admin', {
        headers: {
          'Authorization': `Bearer ${token.trim()}`
        }
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setAdminToken(token.trim())
        // Save authentication state to localStorage with timestamp
        localStorage.setItem('admin-token', token.trim())
        localStorage.setItem('admin-authenticated', 'true')
        localStorage.setItem('admin-session-timestamp', Date.now().toString())
        toast.success("Authentication successful")
        return true
      } else {
        toast.error("Invalid admin token")
        return false
      }
    } catch (error) {
      toast.error("Authentication failed")
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setAdminToken("")
    // Clear saved authentication data
    localStorage.removeItem('admin-token')
    localStorage.removeItem('admin-authenticated')
    localStorage.removeItem('admin-session-timestamp')
    localStorage.removeItem('admin-active-tab')
    toast.success("Logged out successfully")
    router.push('/admin')
  }

  // Navigation handlers for keyboard shortcuts
  const handleNavigateHome = () => router.push('/admin/overview')
  const handleNavigateAccessCodes = () => router.push('/admin/access-codes')
  const handleNavigateActivity = () => router.push('/admin/activity-logs')
  const handleNavigateAnalytics = () => router.push('/admin/analytics')
  const handleOpenSearch = () => setSearchOpen(true)
  const handleOpenSettings = () => router.push('/admin/settings')
  const handleGenerateCode = () => toast.info("Generate code functionality")
  const handleRefreshData = () => {
    window.location.reload()
    toast.success("Data refreshed")
  }
  const handleExportData = () => toast.info("Export functionality coming soon")

  // Handle search navigation
  const handleSearchNavigate = (url: string) => {
    router.push(url)
    setSearchOpen(false)
  }

  // Calculate stats for sidebar
  const statsData = {
    activeCodes: adminData?.activeCodes?.length || 0,
    totalCodes: adminData?.totalCodes || 0,
    recentActivity: adminData?.usageLogs?.length || 0
  }

  // Get active tab from pathname
  const getActiveTab = () => {
    if (pathname.includes('/overview')) return 'overview'
    if (pathname.includes('/access-codes')) return 'access-codes'
    if (pathname.includes('/recent-logs')) return 'recent-logs'
    if (pathname.includes('/activity-logs')) return 'activity-logs'
    if (pathname.includes('/analytics')) return 'analytics'
    if (pathname.includes('/settings')) return 'settings'
    return 'overview'
  }

  const getPageInfo = () => {
    const activeTab = getActiveTab()
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Dashboard Overview',
          description: 'Monitor system performance and recent activity',
          icon: BarChart3
        }
      case 'access-codes':
        return {
          title: 'Access Codes',
          description: 'Generate and manage access codes for the platform',
          icon: Key
        }
      case 'recent-logs':
        return {
          title: 'Recent Logs',
          description: 'View recent access and activity logs',
          icon: Clock
        }
      case 'activity-logs':
        return {
          title: 'Activity Logs',
          description: 'Advanced monitoring and detailed activity logs',
          icon: Activity
        }
      case 'analytics':
        return {
          title: 'Analytics',
          description: 'System analytics and performance metrics',
          icon: TrendingUp
        }
      case 'settings':
        return {
          title: 'Settings',
          description: 'System configuration and preferences',
          icon: Settings
        }
      default:
        return {
          title: 'Admin Panel',
          description: 'Access Management',
          icon: Shield
        }
    }
  }

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center p-4">
        <LoginForm onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      <div className="flex h-screen">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
        `}>
          <Sidebar
            activeTab={getActiveTab()}
            stats={statsData}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 lg:px-6 theme-bg-card theme-border border-b theme-transition shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden theme-button-secondary h-8 w-8 p-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              {/* Page Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  {React.createElement(getPageInfo().icon, { className: "h-4 w-4 text-white" })}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold theme-text-primary truncate">
                      {getPageInfo().title}
                    </h1>
                    <div className="hidden lg:block">
                      <Breadcrumb />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
              {/* Quick Actions - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-1">
                <EnhancedTooltip
                  content="Generate New Code"
                  shortcut={["n"]}
                  description="Create a new access code"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="theme-button-secondary"
                    onClick={handleGenerateCode}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </EnhancedTooltip>

                <EnhancedTooltip
                  content="Refresh Data"
                  shortcut={["r"]}
                  description="Reload all dashboard data"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="theme-button-secondary"
                    onClick={handleRefreshData}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </EnhancedTooltip>

                <EnhancedTooltip
                  content="Search"
                  shortcut={["/"]}
                  description="Search across all data"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="theme-button-secondary"
                    onClick={handleOpenSearch}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </EnhancedTooltip>
              </div>

              {/* Notifications */}
              <EnhancedTooltip
                content="Notifications"
                description="System alerts and updates"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="theme-button-secondary relative"
                >
                  <Bell className="h-4 w-4" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </Button>
              </EnhancedTooltip>

              {/* Keyboard Shortcuts */}
              <KeyboardShortcuts
                onNavigateHome={handleNavigateHome}
                onNavigateAccessCodes={handleNavigateAccessCodes}
                onNavigateActivity={handleNavigateActivity}
                onNavigateAnalytics={handleNavigateAnalytics}
                onGenerateCode={handleGenerateCode}
                onRefreshData={handleRefreshData}
                onExportData={handleExportData}
                onOpenSettings={handleOpenSettings}
                onOpenSearch={handleOpenSearch}
              />

              <ThemeToggle variant="dropdown" size="sm" />

              <div className="hidden lg:flex items-center gap-2 text-sm theme-text-secondary">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Live
              </div>

              <EnhancedTooltip
                content="Logout"
                description="Sign out of admin panel"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="theme-button-secondary theme-transition"
                >
                  <User className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </EnhancedTooltip>
            </div>
          </header>

          {/* Content Area */}
          <main className={`flex-1 overflow-auto ${
            resolvedTheme === 'dark' ? '' : 'bg-slate-50/30'
          }`}>
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Advanced Search Dialog */}
      <AdvancedSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />
    </div>
  )
}

// Professional login form component
function LoginForm({ onLogin }: { onLogin: (token: string) => Promise<boolean> }) {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onLogin(token)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <div className="theme-bg-card rounded-xl shadow-2xl p-8 border theme-border">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold theme-text-primary mb-2">Admin Access</h1>
          <p className="theme-text-secondary">Enter your admin token to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium theme-text-primary mb-2">
              Admin Token
            </label>
            <div className="relative">
              <input
                id="token"
                type={showPassword ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 border theme-border rounded-lg theme-bg-secondary theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                placeholder="Enter admin token..."
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            disabled={loading || !token.trim()}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </div>
            ) : (
              "Access Dashboard"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs theme-text-muted">
            Need access? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  )
}
