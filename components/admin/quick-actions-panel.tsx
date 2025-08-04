"use client"

import { useState, memo, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
  Plus,
  Download,
  RefreshCw,
  Trash2,
  Zap,
  Activity,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  variant?: "default" | "destructive" | "outline"
  onClick: () => void
  primary?: boolean
}

interface QuickActionsPanelProps {
  onGenerateCode?: () => void
  onExportData?: () => void
  onRefreshData?: () => void
  onCleanupExpired?: () => void
  className?: string
}

export const QuickActionsPanel = memo(function QuickActionsPanel({
  onGenerateCode,
  onExportData,
  onRefreshData,
  onCleanupExpired,
  className
}: QuickActionsPanelProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleAction = useCallback(async (actionId: string, action: () => void) => {
    if (!action || isLoading) return

    setIsLoading(actionId)
    try {
      await action()
      toast.success("Action completed successfully")
    } catch (error) {
      console.error(`Action ${actionId} failed:`, error)
      toast.error("Action failed. Please try again.")
    } finally {
      setTimeout(() => setIsLoading(null), 800)
    }
  }, [isLoading])

  const quickActions = useMemo<QuickAction[]>(() => [
    {
      id: "generate-code",
      label: "Generate Code",
      description: "Create new access code",
      icon: Plus,
      variant: "default",
      onClick: () => onGenerateCode?.(),
      primary: true
    },
    {
      id: "refresh-data",
      label: "Refresh",
      description: "Update all data",
      icon: RefreshCw,
      variant: "outline",
      onClick: () => onRefreshData?.(),
      primary: true
    },
    {
      id: "export-data",
      label: "Export",
      description: "Download report",
      icon: Download,
      variant: "outline",
      onClick: () => onExportData?.(),
      primary: false
    },
    {
      id: "cleanup-expired",
      label: "Cleanup",
      description: "Remove expired codes",
      icon: Trash2,
      variant: "destructive",
      onClick: () => onCleanupExpired?.(),
      primary: false
    }
  ], [onGenerateCode, onRefreshData, onExportData, onCleanupExpired])

  const { primaryActions, secondaryActions } = useMemo(() => ({
    primaryActions: quickActions.filter(action => action.primary),
    secondaryActions: quickActions.filter(action => !action.primary)
  }), [quickActions])

  return (
    <Card className={cn("theme-bg-card border-0 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold theme-text-primary flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Quick Actions
        </CardTitle>
        <p className="text-sm theme-text-secondary">
          Essential administrative tools
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="space-y-2">
          {primaryActions.map((action) => {
            const Icon = action.icon
            const isActionLoading = isLoading === action.id

            return (
              <Button
                key={action.id}
                variant={action.variant}
                size="sm"
                className={cn(
                  "w-full justify-start h-12 px-4 transition-all duration-200",
                  "hover:shadow-sm hover:scale-[1.01]",
                  action.variant === "default" && "bg-blue-600 hover:bg-blue-700 text-white",
                  action.variant === "outline" && "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                disabled={isActionLoading}
                onClick={() => handleAction(action.id, action.onClick)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    action.variant === "default"
                      ? "bg-white/20"
                      : "bg-blue-50 dark:bg-blue-900/30"
                  )}>
                    {isActionLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon className={cn(
                        "h-4 w-4",
                        action.variant === "default"
                          ? "text-white"
                          : "text-blue-600 dark:text-blue-400"
                      )} />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">
                      {action.label}
                    </div>
                    <div className="text-xs opacity-70">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        {/* Secondary Actions */}
        {secondaryActions.length > 0 && (
          <div className="pt-3 border-t theme-border">
            <div className="grid grid-cols-2 gap-2">
              {secondaryActions.map((action) => {
                const Icon = action.icon
                const isActionLoading = isLoading === action.id

                return (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    size="sm"
                    className={cn(
                      "h-10 px-3 transition-all duration-200",
                      "hover:shadow-sm hover:scale-[1.01]",
                      action.variant === "destructive" && "hover:bg-red-600"
                    )}
                    disabled={isActionLoading}
                    onClick={() => handleAction(action.id, action.onClick)}
                  >
                    <div className="flex items-center gap-2">
                      {isActionLoading ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium">
                        {action.label}
                      </span>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="pt-3 border-t theme-border">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-3 w-3 theme-text-secondary" />
            <span className="text-xs font-medium theme-text-secondary uppercase tracking-wide">
              Status
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="theme-text-secondary">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              <span className="theme-text-secondary">Real-time</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
