"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// Keyboard navigation hook
export function useKeyboardNavigation(
  itemCount: number,
  onSelect: (index: number) => void,
  onActivate: (index: number) => void
) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => Math.min(prev + 1, itemCount - 1))
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          event.preventDefault()
          setFocusedIndex(itemCount - 1)
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (focusedIndex >= 0) {
            onActivate(focusedIndex)
          }
          break
        case 'Escape':
          event.preventDefault()
          setFocusedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [itemCount, focusedIndex, onActivate])

  return { focusedIndex, setFocusedIndex, containerRef }
}

// Screen reader announcements
export function useScreenReaderAnnouncements() {
  const [announcement, setAnnouncement] = useState('')

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('')
    setTimeout(() => setAnnouncement(message), 100)
    
    // Also use toast for visual feedback
    if (priority === 'assertive') {
      toast.info(message, { duration: 3000 })
    }
  }

  const AnnouncementRegion = () => (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  )

  return { announce, AnnouncementRegion }
}

// Focus management
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement | null>(null)

  const setFocus = (element: HTMLElement | null) => {
    focusRef.current = element
    if (element) {
      element.focus()
    }
  }

  const restoreFocus = () => {
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }

  return { setFocus, restoreFocus }
}

// Loading skeleton component
export function ActivityLogsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading activity logs">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="border rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b">
            <div className="grid grid-cols-6 gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>

          {/* Table rows */}
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="p-4 border-b last:border-b-0">
              <div className="grid grid-cols-6 gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between mt-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading activity logs, please wait...</span>
    </div>
  )
}

// Error boundary component
export function ActivityLogsErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true)
      setError(new Error(event.message))
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true)
      setError(new Error(event.reason))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (hasError) {
    return fallback || (
      <div 
        className="p-6 text-center border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20"
        role="alert"
        aria-live="assertive"
      >
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Something went wrong
        </h3>
        <p className="text-red-600 dark:text-red-300 mb-4">
          {error?.message || 'An unexpected error occurred while loading activity logs.'}
        </p>
        <button
          onClick={() => {
            setHasError(false)
            setError(null)
            window.location.reload()
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Reload Page
        </button>
      </div>
    )
  }

  return <>{children}</>
}

// Performance optimization hooks
export function useVirtualization(
  items: any[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  const visibleItems = items.slice(visibleStart, visibleEnd)
  const totalHeight = items.length * itemHeight
  const offsetY = visibleStart * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Accessibility helpers
export function getAriaLabel(action: string, code: string, timestamp: string): string {
  const actionLabels = {
    generated: 'generated',
    used: 'used',
    expired: 'expired',
    revoked: 'revoked'
  }
  
  const actionLabel = actionLabels[action as keyof typeof actionLabels] || 'unknown action'
  const date = new Date(timestamp).toLocaleDateString()
  const time = new Date(timestamp).toLocaleTimeString()
  
  return `Activity log: Code ${code} was ${actionLabel} on ${date} at ${time}`
}

export function getTableAriaLabel(
  totalItems: number,
  currentPage: number,
  pageSize: number,
  sortBy?: string,
  sortOrder?: string
): string {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  
  let label = `Activity logs table showing ${start} to ${end} of ${totalItems} entries`
  
  if (sortBy && sortOrder) {
    label += `, sorted by ${sortBy} in ${sortOrder}ending order`
  }
  
  return label
}

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  REFRESH: 'r',
  EXPORT_CSV: 'c',
  EXPORT_JSON: 'j',
  TOGGLE_FILTERS: 'f',
  CLEAR_FILTERS: 'Escape',
  SELECT_ALL: 'a',
  CLEAR_SELECTION: 'Escape'
} as const

export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      const key = event.ctrlKey || event.metaKey 
        ? `${event.ctrlKey ? 'Ctrl+' : 'Cmd+'}${event.key}`
        : event.key

      if (handlers[key]) {
        event.preventDefault()
        handlers[key]()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
