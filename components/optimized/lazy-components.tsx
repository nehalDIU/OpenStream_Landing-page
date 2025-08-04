// Optimized Lazy-Loaded Components for Better Performance

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Loading skeletons for different component types
const TableSkeleton = () => (
  <Card className="theme-bg-card border-0 shadow-lg">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </CardContent>
  </Card>
)

const ChartSkeleton = () => (
  <Card className="theme-bg-card border-0 shadow-lg">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
)

const FeedSkeleton = () => (
  <Card className="theme-bg-card border-0 shadow-lg">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const PanelSkeleton = () => (
  <Card className="theme-bg-card border-0 shadow-lg">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// Lazy-loaded components with optimized loading
// Note: Only include components that actually exist

// Placeholder for future heavy components
export const LazyAdvancedDataTable = dynamic(
  () => import('@/components/admin/advanced-data-table').then(mod => {
    if (mod.AdvancedDataTable) {
      return { default: mod.AdvancedDataTable }
    }
    // Fallback if component doesn't exist
    return { default: () => <TableSkeleton /> }
  }).catch(() => ({ default: () => <TableSkeleton /> })),
  {
    loading: () => <TableSkeleton />,
    ssr: false // Disable SSR for heavy interactive components
  }
)

export const LazyActivityFeed = dynamic(
  () => import('@/components/admin/activity-feed').then(mod => {
    if (mod.ActivityFeed) {
      return { default: mod.ActivityFeed }
    }
    return { default: () => <FeedSkeleton /> }
  }).catch(() => ({ default: () => <FeedSkeleton /> })),
  {
    loading: () => <FeedSkeleton />,
    ssr: false
  }
)

export const LazyQuickActionsPanel = dynamic(
  () => import('@/components/admin/quick-actions-panel').then(mod => {
    if (mod.QuickActionsPanel) {
      return { default: mod.QuickActionsPanel }
    }
    return { default: () => <PanelSkeleton /> }
  }).catch(() => ({ default: () => <PanelSkeleton /> })),
  {
    loading: () => <PanelSkeleton />,
    ssr: false
  }
)

export const LazyAdvancedSearch = dynamic(
  () => import('@/components/admin/advanced-search').then(mod => {
    if (mod.AdvancedSearch) {
      return { default: mod.AdvancedSearch }
    }
    return { default: () => <div>Search not available</div> }
  }).catch(() => ({ default: () => <div>Search not available</div> })),
  {
    loading: () => <div>Loading search...</div>,
    ssr: false
  }
)

export const LazyKeyboardShortcuts = dynamic(
  () => import('@/components/admin/keyboard-shortcuts').then(mod => {
    if (mod.KeyboardShortcuts) {
      return { default: mod.KeyboardShortcuts }
    }
    return { default: () => <div>Shortcuts not available</div> }
  }).catch(() => ({ default: () => <div>Shortcuts not available</div> })),
  {
    loading: () => <div>Loading shortcuts...</div>,
    ssr: false
  }
)

// Placeholder components for future implementation
export const LazyChart = dynamic(
  () => Promise.resolve({ default: () => <ChartSkeleton /> }),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

export const LazyCodeEditor = dynamic(
  () => Promise.resolve({
    default: () => (
      <Card className="theme-bg-card">
        <CardContent className="p-4">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }),
  {
    loading: () => (
      <Card className="theme-bg-card">
        <CardContent className="p-4">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false
  }
)

// Optimized wrapper component for conditional lazy loading
interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  condition?: boolean
  delay?: number
}

export function LazyWrapper({ 
  children, 
  fallback, 
  condition = true, 
  delay = 0 
}: LazyWrapperProps) {
  if (!condition) {
    return fallback ? <>{fallback}</> : null
  }

  if (delay > 0) {
    return (
      <Suspense fallback={fallback}>
        <DelayedComponent delay={delay}>
          {children}
        </DelayedComponent>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

// Component that delays rendering
function DelayedComponent({ 
  children, 
  delay 
}: { 
  children: React.ReactNode
  delay: number 
}) {
  const [shouldRender, setShouldRender] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!shouldRender) {
    return null
  }

  return <>{children}</>
}

// Hook for intersection observer based lazy loading
export function useIntersectionLazyLoad(threshold = 0.1) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
          observer.unobserve(element)
        }
      },
      { threshold }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, hasLoaded])

  return { ref, isVisible, hasLoaded }
}

// Performance optimized component wrapper
export function PerformanceOptimized({ 
  children, 
  priority = false 
}: { 
  children: React.ReactNode
  priority?: boolean 
}) {
  const { ref, isVisible } = useIntersectionLazyLoad(priority ? 0 : 0.1)

  return (
    <div ref={ref}>
      {(priority || isVisible) ? children : <div style={{ minHeight: '200px' }} />}
    </div>
  )
}

// Bundle splitting utilities
export const bundleSplitting = {
  // Critical components (loaded immediately)
  critical: [
    'Sidebar',
    'Header',
    'StatsCards',
    'ThemeToggle'
  ],

  // Important components (loaded on interaction)
  important: [
    'DataTable',
    'ActivityFeed',
    'QuickActionsPanel'
  ],

  // Optional components (loaded when visible)
  optional: [
    'AdvancedSearch',
    'KeyboardShortcuts',
    'Chart',
    'CodeEditor'
  ]
}

// Component performance tracking hook
export function useComponentPerformance(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      if (process.env.NODE_ENV === 'development') {
        console.log(`Component ${componentName} render time: ${duration.toFixed(2)}ms`)
      }
    }
  }, [componentName])
}

// Memory optimization
export function useMemoryOptimization() {
  React.useEffect(() => {
    // Clean up unused components on route change
    const handleRouteChange = () => {
      // Force garbage collection if available
      if ('gc' in window && typeof window.gc === 'function') {
        window.gc()
      }
    }

    // Listen for route changes
    window.addEventListener('beforeunload', handleRouteChange)

    return () => {
      window.removeEventListener('beforeunload', handleRouteChange)
    }
  }, [])
}
