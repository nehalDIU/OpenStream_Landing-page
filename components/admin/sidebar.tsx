"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/contexts/theme-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  BarChart3,
  Key,
  Activity,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
  Home,
  Users,
  Clock,
  TrendingUp,
  Database,
  Server
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  stats?: {
    activeCodes: number
    totalCodes: number
    recentActivity: number
  }
}

export function Sidebar({ activeTab, onTabChange, stats }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()

  const menuItems = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      href: "/admin/overview",
      badge: stats?.activeCodes,
      description: "Dashboard overview",
      useRouting: true
    },
    {
      id: "access-codes",
      label: "Access Codes",
      icon: Key,
      href: "/admin/access-codes",
      badge: stats?.activeCodes,
      description: "Manage access codes",
      useRouting: true
    },
    {
      id: "recent-logs",
      label: "Recent Logs",
      icon: Clock,
      href: "/admin/recent-logs",
      badge: stats?.recentActivity,
      description: "View recent logs",
      useRouting: true
    },
    {
      id: "activity-logs",
      label: "Activity Logs",
      icon: Activity,
      href: "/admin/activity-logs",
      badge: stats?.recentActivity,
      description: "Advanced activity monitoring",
      useRouting: true
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      href: "/admin/users",
      description: "Track user activity and engagement",
      useRouting: true
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      href: "/admin/analytics",
      description: "Advanced analytics and reporting",
      useRouting: true
    },
    {
      id: "test-data",
      label: "Test Data",
      icon: Database,
      href: "/admin/test-data",
      description: "Generate test user activity data",
      useRouting: true
    },
    {
      id: "database-status",
      label: "Database Status",
      icon: Server,
      href: "/admin/database-status",
      description: "Check Supabase connection and data",
      useRouting: true
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/admin/settings",
      description: "System settings",
      useRouting: true
    }
  ]

  return (
    <div className={cn(
      "flex flex-col h-screen theme-bg-sidebar border-r theme-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header - Match main header height */}
      <div className="h-16 flex items-center justify-between px-4 theme-border border-b shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold theme-text-primary text-sm truncate">Admin Panel</h2>
              <p className="text-xs theme-text-secondary truncate">Access Management</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
            <Shield className="h-4 w-4 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "theme-text-secondary hover:theme-text-primary theme-transition h-8 w-8 p-0 flex-shrink-0",
            isCollapsed && "hidden"
          )}
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (activeTab && activeTab === item.id)

          // Use routing for dedicated pages, tab navigation for embedded content
          if (item.useRouting) {
            return (
              <Link key={item.id} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10 theme-transition text-sm",
                    isActive
                      ? "theme-interactive-active"
                      : "theme-text-secondary hover:theme-text-primary theme-interactive-hover",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            )
          }

          // Use tab-based navigation for embedded content
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10 theme-transition text-sm",
                isActive
                  ? "theme-interactive-active"
                  : "theme-text-secondary hover:theme-text-primary theme-interactive-hover",
                isCollapsed && "justify-center px-2"
              )}
              onClick={() => onTabChange?.(item.id)}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          )
        })}
      </nav>

      <Separator className="theme-border" />

      {/* Stats Summary */}
      {!isCollapsed && stats && (
        <div className="p-3 space-y-3">
          <h3 className="text-xs font-medium theme-text-secondary uppercase tracking-wide">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="theme-text-secondary">Active Codes</span>
              <span className="theme-text-primary font-medium">{stats.activeCodes}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="theme-text-secondary">Total Generated</span>
              <span className="theme-text-primary font-medium">{stats.totalCodes}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="theme-text-secondary">Recent Activity</span>
              <span className="theme-text-primary font-medium">{stats.recentActivity}</span>
            </div>
          </div>
        </div>
      )}

      <Separator className="theme-border" />

      {/* Footer */}
      <div className="p-3 space-y-1 mt-auto">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-9 text-sm theme-text-secondary hover:theme-text-primary theme-transition",
            isCollapsed && "justify-center px-2"
          )}
        >
          <HelpCircle className="h-4 w-4" />
          {!isCollapsed && "Help & Support"}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-9 text-sm theme-text-secondary hover:text-red-500 theme-transition",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && "Sign Out"}
        </Button>
      </div>
    </div>
  )
}
