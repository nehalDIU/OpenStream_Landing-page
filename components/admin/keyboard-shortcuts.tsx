"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import {
  Keyboard,
  Command,
  Search,
  Plus,
  RefreshCw,
  Download,
  Settings,
  Home,
  Key,
  Activity,
  Users,
  BarChart3,
  HelpCircle,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface KeyboardShortcut {
  id: string
  keys: string[]
  description: string
  action: () => void
  category: "navigation" | "actions" | "general"
  icon?: React.ComponentType<{ className?: string }>
}

interface KeyboardShortcutsProps {
  onNavigateHome?: () => void
  onNavigateAccessCodes?: () => void
  onNavigateActivity?: () => void
  onNavigateUsers?: () => void
  onNavigateAnalytics?: () => void
  onGenerateCode?: () => void
  onRefreshData?: () => void
  onExportData?: () => void
  onOpenSettings?: () => void
  onOpenSearch?: () => void
}

export function KeyboardShortcuts({
  onNavigateHome,
  onNavigateAccessCodes,
  onNavigateActivity,
  onNavigateUsers,
  onNavigateAnalytics,
  onGenerateCode,
  onRefreshData,
  onExportData,
  onOpenSettings,
  onOpenSearch
}: KeyboardShortcutsProps) {
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      id: "nav-home",
      keys: ["g", "h"],
      description: "Go to Dashboard",
      action: () => onNavigateHome?.(),
      category: "navigation",
      icon: Home
    },
    {
      id: "nav-codes",
      keys: ["g", "c"],
      description: "Go to Access Codes",
      action: () => onNavigateAccessCodes?.(),
      category: "navigation",
      icon: Key
    },
    {
      id: "nav-activity",
      keys: ["g", "a"],
      description: "Go to Activity Logs",
      action: () => onNavigateActivity?.(),
      category: "navigation",
      icon: Activity
    },
    {
      id: "nav-users",
      keys: ["g", "u"],
      description: "Go to Users",
      action: () => onNavigateUsers?.(),
      category: "navigation",
      icon: Users
    },
    {
      id: "nav-analytics",
      keys: ["g", "n"],
      description: "Go to Analytics",
      action: () => onNavigateAnalytics?.(),
      category: "navigation",
      icon: BarChart3
    },
    
    // Actions
    {
      id: "generate-code",
      keys: ["n"],
      description: "Generate New Code",
      action: () => onGenerateCode?.(),
      category: "actions",
      icon: Plus
    },
    {
      id: "refresh",
      keys: ["r"],
      description: "Refresh Data",
      action: () => onRefreshData?.(),
      category: "actions",
      icon: RefreshCw
    },
    {
      id: "export",
      keys: ["e"],
      description: "Export Data",
      action: () => onExportData?.(),
      category: "actions",
      icon: Download
    },
    
    // General
    {
      id: "search",
      keys: ["/"],
      description: "Open Search",
      action: () => onOpenSearch?.(),
      category: "general",
      icon: Search
    },
    {
      id: "settings",
      keys: [","],
      description: "Open Settings",
      action: () => onOpenSettings?.(),
      category: "general",
      icon: Settings
    },
    {
      id: "help",
      keys: ["?"],
      description: "Show Keyboard Shortcuts",
      action: () => setIsOpen(true),
      category: "general",
      icon: HelpCircle
    }
  ]

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = event.key.toLowerCase()
      setPressedKeys(prev => new Set([...prev, key]))

      // Check for single key shortcuts
      const singleKeyShortcuts = shortcuts.filter(s => s.keys.length === 1)
      const matchingSingleKey = singleKeyShortcuts.find(s => s.keys[0] === key)
      
      if (matchingSingleKey) {
        event.preventDefault()
        matchingSingleKey.action()
        return
      }

      // Check for multi-key shortcuts (with a timeout)
      setTimeout(() => {
        const currentKeys = Array.from(pressedKeys).concat(key)
        const matchingShortcut = shortcuts.find(s => 
          s.keys.length > 1 && 
          s.keys.every((k, i) => currentKeys[currentKeys.length - s.keys.length + i] === k)
        )

        if (matchingShortcut) {
          event.preventDefault()
          matchingShortcut.action()
        }
      }, 100)
    }

    const handleKeyUp = () => {
      setPressedKeys(new Set())
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [shortcuts, pressedKeys])

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "navigation":
        return "Navigation"
      case "actions":
        return "Actions"
      case "general":
        return "General"
      default:
        return "Other"
    }
  }

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      switch (key) {
        case " ":
          return "Space"
        case "/":
          return "/"
        case ",":
          return ","
        case "?":
          return "?"
        default:
          return key.toUpperCase()
      }
    })
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="theme-button-secondary"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      {/* Shortcuts Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl theme-bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 theme-text-primary">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-medium theme-text-secondary uppercase tracking-wide mb-3">
                  {getCategoryTitle(category)}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryShortcuts.map((shortcut) => {
                    const Icon = shortcut.icon
                    const formattedKeys = formatKeys(shortcut.keys)
                    
                    return (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between p-3 rounded-lg theme-bg-secondary border theme-border"
                      >
                        <div className="flex items-center gap-3">
                          {Icon && (
                            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          <span className="text-sm theme-text-primary">
                            {shortcut.description}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {formattedKeys.map((key, index) => (
                            <div key={index} className="flex items-center">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono px-2 py-1 theme-border"
                              >
                                {key}
                              </Badge>
                              {index < formattedKeys.length - 1 && (
                                <span className="mx-1 text-xs theme-text-muted">+</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Tips */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Pro Tips
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Press <Badge variant="outline" className="text-xs mx-1">?</Badge> anytime to see this help</li>
                <li>• Use <Badge variant="outline" className="text-xs mx-1">g</Badge> + letter for quick navigation</li>
                <li>• Shortcuts work from anywhere in the admin panel</li>
                <li>• Press <Badge variant="outline" className="text-xs mx-1">Esc</Badge> to close dialogs</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="theme-button-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
