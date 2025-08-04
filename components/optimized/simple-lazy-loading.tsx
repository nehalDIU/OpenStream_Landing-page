// Simple Lazy Loading Implementation
// Use this when you want to implement lazy loading later

"use client"

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

// Simple loading skeleton
const LoadingSkeleton = () => (
  <Card className="theme-bg-card">
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    </CardContent>
  </Card>
)

// Example of how to implement lazy loading correctly
export const LazyExampleComponent = dynamic(
  () => import('@/components/admin/stats-cards').then(mod => ({
    default: mod.StatsCards
  })),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false
  }
)

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

// Memory optimization hook
export function useMemoryOptimization() {
  React.useEffect(() => {
    // Clean up unused components on route change
    const handleRouteChange = () => {
      // Force garbage collection if available (development only)
      if (process.env.NODE_ENV === 'development' && 'gc' in window && typeof window.gc === 'function') {
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

// Simple lazy wrapper for any component
export function SimpleLazyWrapper({
  children,
  fallback = <LoadingSkeleton />
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

// Instructions for implementing lazy loading:
/*
To implement lazy loading for a component:

1. Create the dynamic import:
   const LazyComponent = dynamic(
     () => import('@/path/to/component').then(mod => ({
       default: mod.ComponentName
     })),
     {
       loading: () => <LoadingSkeleton />,
       ssr: false
     }
   )

2. Use it in your JSX:
   <LazyComponent {...props} />

3. For intersection observer based loading:
   <PerformanceOptimized>
     <YourComponent />
   </PerformanceOptimized>

4. For performance tracking:
   useComponentPerformance('ComponentName')
*/
