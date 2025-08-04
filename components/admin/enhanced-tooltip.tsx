"use client"

import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

interface EnhancedTooltipProps {
  children: React.ReactNode
  content: string
  description?: string
  shortcut?: string[]
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  disabled?: boolean
  className?: string
  variant?: "default" | "info" | "warning" | "error" | "success"
}

export function EnhancedTooltip({
  children,
  content,
  description,
  shortcut,
  side = "top",
  align = "center",
  delayDuration = 300,
  disabled = false,
  className,
  variant = "default"
}: EnhancedTooltipProps) {
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  if (disabled) {
    return <>{children}</>
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "info":
        return "bg-blue-900 text-blue-100 border-blue-700"
      case "warning":
        return "bg-orange-900 text-orange-100 border-orange-700"
      case "error":
        return "bg-red-900 text-red-100 border-red-700"
      case "success":
        return "bg-green-900 text-green-100 border-green-700"
      default:
        return "theme-bg-card theme-text-primary theme-border"
    }
  }

  const formatShortcut = (keys: string[]) => {
    return keys.map(key => {
      switch (key) {
        case " ":
          return "Space"
        case "cmd":
        case "meta":
          return "⌘"
        case "ctrl":
          return "Ctrl"
        case "alt":
          return "Alt"
        case "shift":
          return "Shift"
        case "enter":
          return "↵"
        case "escape":
        case "esc":
          return "Esc"
        case "tab":
          return "Tab"
        case "backspace":
          return "⌫"
        case "delete":
          return "Del"
        case "arrowup":
          return "↑"
        case "arrowdown":
          return "↓"
        case "arrowleft":
          return "←"
        case "arrowright":
          return "→"
        default:
          return key.toUpperCase()
      }
    })
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            "max-w-xs p-3 shadow-lg border",
            getVariantStyles(),
            className
          )}
          sideOffset={8}
        >
          <div className="space-y-2">
            {/* Main content */}
            <div className="font-medium text-sm">
              {content}
            </div>

            {/* Description */}
            {description && (
              <div className="text-xs opacity-80">
                {description}
              </div>
            )}

            {/* Keyboard shortcut */}
            {shortcut && shortcut.length > 0 && (
              <div className="flex items-center gap-1 pt-1">
                <span className="text-xs opacity-60">Shortcut:</span>
                <div className="flex items-center gap-1">
                  {formatShortcut(shortcut).map((key, index) => (
                    <div key={index} className="flex items-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-mono px-1.5 py-0.5 h-auto",
                          variant === "default" 
                            ? "border-gray-600 dark:border-gray-400" 
                            : "border-current opacity-60"
                        )}
                      >
                        {key}
                      </Badge>
                      {index < formatShortcut(shortcut).length - 1 && (
                        <span className="mx-1 text-xs opacity-60">+</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Arrow indicator */}
          <div
            className={cn(
              "absolute w-2 h-2 rotate-45 border",
              getVariantStyles(),
              {
                "top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-0 border-l-0": side === "top",
                "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-b-0 border-r-0": side === "bottom",
                "top-1/2 left-full -translate-x-1/2 -translate-y-1/2 border-t-0 border-r-0": side === "left",
                "top-1/2 right-full translate-x-1/2 -translate-y-1/2 border-b-0 border-l-0": side === "right"
              }
            )}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Convenience components for common tooltip variants
export function InfoTooltip(props: Omit<EnhancedTooltipProps, "variant">) {
  return <EnhancedTooltip {...props} variant="info" />
}

export function WarningTooltip(props: Omit<EnhancedTooltipProps, "variant">) {
  return <EnhancedTooltip {...props} variant="warning" />
}

export function ErrorTooltip(props: Omit<EnhancedTooltipProps, "variant">) {
  return <EnhancedTooltip {...props} variant="error" />
}

export function SuccessTooltip(props: Omit<EnhancedTooltipProps, "variant">) {
  return <EnhancedTooltip {...props} variant="success" />
}

// Hook for programmatic tooltip management
export function useTooltip() {
  const [isVisible, setIsVisible] = useState(false)
  const [content, setContent] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const show = (newContent: string, x: number, y: number) => {
    setContent(newContent)
    setPosition({ x, y })
    setIsVisible(true)
  }

  const hide = () => {
    setIsVisible(false)
  }

  const toggle = (newContent?: string, x?: number, y?: number) => {
    if (isVisible) {
      hide()
    } else if (newContent && x !== undefined && y !== undefined) {
      show(newContent, x, y)
    }
  }

  return {
    isVisible,
    content,
    position,
    show,
    hide,
    toggle
  }
}
