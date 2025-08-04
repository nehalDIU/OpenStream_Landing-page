"use client"

import { useEffect } from 'react'

// Simple performance monitoring class
class SimplePerformanceTracker {
  private static instance: SimplePerformanceTracker
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): SimplePerformanceTracker {
    if (!SimplePerformanceTracker.instance) {
      SimplePerformanceTracker.instance = new SimplePerformanceTracker()
    }
    return SimplePerformanceTracker.instance
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} = ${value.toFixed(2)}ms`)
    }
  }

  getMetrics() {
    const result: Record<string, any> = {}
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length
        const min = Math.min(...values)
        const max = Math.max(...values)
        result[name] = { avg, min, max, count: values.length }
      }
    }
    return result
  }
}

// Web Vitals monitoring component
export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance tracking
    const tracker = SimplePerformanceTracker.getInstance()
    
    // Track page load performance
    const trackPageLoad = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          // Track key metrics
          tracker.recordMetric('TTFB', navigation.responseStart - navigation.requestStart)
          tracker.recordMetric('DOMContentLoaded', navigation.domContentLoadedEventEnd - navigation.navigationStart)
          tracker.recordMetric('LoadComplete', navigation.loadEventEnd - navigation.navigationStart)
          
          // Track resource loading
          const resources = performance.getEntriesByType('resource')
          const totalResourceTime = resources.reduce((total, resource) => {
            return total + (resource.responseEnd - resource.startTime)
          }, 0)
          tracker.recordMetric('ResourceLoadTime', totalResourceTime)
        }
      }
    }

    // Track Core Web Vitals
    const trackWebVitals = () => {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            tracker.recordMetric('LCP', lastEntry.startTime)
          })
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

          // First Input Delay (FID)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              tracker.recordMetric('FID', entry.processingStart - entry.startTime)
            })
          })
          fidObserver.observe({ entryTypes: ['first-input'] })

          // Cumulative Layout Shift (CLS)
          let clsValue = 0
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            })
            tracker.recordMetric('CLS', clsValue)
          })
          clsObserver.observe({ entryTypes: ['layout-shift'] })

          // Time to First Byte (TTFB)
          const ttfbObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              tracker.recordMetric('TTFB', entry.responseStart - entry.requestStart)
            })
          })
          ttfbObserver.observe({ entryTypes: ['navigation'] })

        } catch (error) {
          console.warn('Performance monitoring not supported:', error)
        }
      }
    }

    // Track memory usage
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        tracker.recordMetric('JSHeapSize', memory.usedJSHeapSize)
        tracker.recordMetric('JSHeapSizeLimit', memory.jsHeapSizeLimit)
      }
    }

    // Track network information
    const trackNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        if (connection) {
          tracker.recordMetric('NetworkDownlink', connection.downlink)
          tracker.recordMetric('NetworkRTT', connection.rtt)
        }
      }
    }

    // Initialize tracking
    trackPageLoad()
    trackWebVitals()
    trackMemoryUsage()
    trackNetworkInfo()

    // Set up periodic monitoring
    const memoryInterval = setInterval(trackMemoryUsage, 30000) // Every 30 seconds
    
    // Track route changes
    const handleRouteChange = () => {
      trackPageLoad()
      trackMemoryUsage()
    }

    // Listen for route changes (Next.js specific)
    window.addEventListener('beforeunload', handleRouteChange)

    // Cleanup
    return () => {
      clearInterval(memoryInterval)
      window.removeEventListener('beforeunload', handleRouteChange)
    }
  }, [])

  // This component doesn't render anything
  return null
}

// Hook for component-level performance tracking
export function useComponentPerformance(componentName: string) {
  useEffect(() => {
    const tracker = SimplePerformanceTracker.getInstance()
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      tracker.recordMetric(`Component_${componentName}`, endTime - startTime)
    }
  }, [componentName])
}

// Performance debugging component (only in development)
export function PerformanceDebugger() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const tracker = SimplePerformanceTracker.getInstance()
      
      // Log performance metrics every 10 seconds
      const debugInterval = setInterval(() => {
        const metrics = tracker.getMetrics()
        console.group('🚀 Performance Metrics')
        Object.entries(metrics).forEach(([name, data]) => {
          console.log(`${name}:`, {
            avg: `${data.avg.toFixed(2)}ms`,
            min: `${data.min.toFixed(2)}ms`,
            max: `${data.max.toFixed(2)}ms`,
            count: data.count
          })
        })
        console.groupEnd()
      }, 10000)

      return () => clearInterval(debugInterval)
    }
  }, [])

  return null
}

// Resource preloading component
export function ResourcePreloader() {
  useEffect(() => {
    // Preload critical resources
    const preloadResources = [
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
      { href: '/images/logo.svg', as: 'image' },
    ]

    preloadResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.href
      link.as = resource.as
      if (resource.type) {
        link.type = resource.type
      }
      if (resource.as === 'font') {
        link.crossOrigin = 'anonymous'
      }
      document.head.appendChild(link)
    })

    // Prefetch next likely pages
    const prefetchPages = [
      '/admin/access-codes',
      '/admin/analytics',
      '/admin/activity-logs'
    ]

    prefetchPages.forEach(page => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = page
      document.head.appendChild(link)
    })
  }, [])

  return null
}

// Service Worker registration for caching
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  return null
}

// Combined performance optimization component
export function PerformanceOptimizations() {
  return (
    <>
      <PerformanceMonitor />
      <ResourcePreloader />
      <ServiceWorkerRegistration />
      {process.env.NODE_ENV === 'development' && <PerformanceDebugger />}
    </>
  )
}
