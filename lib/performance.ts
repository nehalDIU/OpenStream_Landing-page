// Performance optimization utilities for the admin dashboard

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'

// Debounce hook for search inputs and API calls
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

// Throttle hook for scroll events and frequent updates
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Memoized data processing for large datasets
export function useProcessedData<T, R>(
  data: T[],
  processor: (data: T[]) => R,
  dependencies: any[] = []
): R {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return processor([])
    }
    return processor(data)
  }, [data, ...dependencies])
}

// Virtual scrolling hook for large lists
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = useMemo(() => {
    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight
      })
    }
    return items
  }, [startIndex, endIndex, itemHeight])

  const totalHeight = itemCount * itemHeight

  return {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    setScrollTop
  }
}

// Cache management for API responses
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  size() {
    return this.cache.size
  }
}

export const cache = new CacheManager()

// Hook for cached API calls
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = cache.get(key)
      if (cached) {
        setData(cached)
        return cached
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      cache.set(key, result, ttl)
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    clearCache: () => cache.delete(key)
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics(label: string) {
    const values = this.metrics.get(label) || []
    if (values.length === 0) return null

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { avg, min, max, count: values.length }
  }

  getAllMetrics() {
    const result: Record<string, any> = {}
    for (const [label, values] of this.metrics.entries()) {
      result[label] = this.getMetrics(label)
    }
    return result
  }

  clear() {
    this.metrics.clear()
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Hook for performance monitoring
export function usePerformanceMonitor(label: string) {
  const endTiming = useRef<(() => void) | null>(null)

  const startTiming = useCallback(() => {
    endTiming.current = performanceMonitor.startTiming(label)
  }, [label])

  const stopTiming = useCallback(() => {
    if (endTiming.current) {
      endTiming.current()
      endTiming.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopTiming()
    }
  }, [stopTiming])

  return { startTiming, stopTiming }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

// Lazy loading component wrapper
export function LazyWrapper({
  children,
  fallback,
  className
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 })
  const [hasLoaded, setHasLoaded] = useState(false)

  // Default fallback if none provided
  const defaultFallback = React.createElement('div', null, 'Loading...')

  useEffect(() => {
    if (isVisible && !hasLoaded) {
      setHasLoaded(true)
    }
  }, [isVisible, hasLoaded])

  return React.createElement('div', { ref, className }, hasLoaded ? children : (fallback || defaultFallback))
}
