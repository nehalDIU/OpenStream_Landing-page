// SEO and Performance Optimization Utilities

import { Metadata } from 'next'

// SEO Configuration
export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
  ogImage?: string
  twitterImage?: string
  structuredData?: any
}

// Generate optimized metadata for pages
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    noindex = false,
    nofollow = false,
    ogImage = '/images/og-image.jpg',
    twitterImage = '/images/twitter-card.jpg',
    structuredData
  } = config

  return {
    title,
    description,
    keywords: keywords.join(', '),
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      type: 'website',
      siteName: 'OpenStream',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [twitterImage],
    },
    ...(structuredData && {
      other: {
        'application/ld+json': JSON.stringify(structuredData)
      }
    })
  }
}

// Admin Dashboard SEO Configuration
export const adminSEOConfig = {
  overview: {
    title: 'Admin Dashboard - Overview | OpenStream',
    description: 'OpenStream admin dashboard overview with real-time analytics, access code management, and system monitoring.',
    keywords: ['admin dashboard', 'analytics', 'system monitoring', 'access codes'],
    noindex: true, // Admin pages should not be indexed
    nofollow: true
  },
  accessCodes: {
    title: 'Access Code Management | OpenStream Admin',
    description: 'Manage access codes, generate new codes, and monitor usage statistics in the OpenStream admin panel.',
    keywords: ['access codes', 'code management', 'admin panel'],
    noindex: true,
    nofollow: true
  },
  analytics: {
    title: 'Analytics Dashboard | OpenStream Admin',
    description: 'View detailed analytics, user statistics, and performance metrics for OpenStream platform.',
    keywords: ['analytics', 'statistics', 'performance metrics'],
    noindex: true,
    nofollow: true
  },
  activityLogs: {
    title: 'Activity Logs | OpenStream Admin',
    description: 'Monitor system activity, user actions, and security events in real-time.',
    keywords: ['activity logs', 'system monitoring', 'security'],
    noindex: true,
    nofollow: true
  },
  settings: {
    title: 'System Settings | OpenStream Admin',
    description: 'Configure system settings, manage preferences, and control platform features.',
    keywords: ['system settings', 'configuration', 'admin settings'],
    noindex: true,
    nofollow: true
  }
}

// Structured Data Schemas
export const structuredDataSchemas = {
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OpenStream',
    url: 'https://openstream.app',
    description: 'Free streaming platform for movies, TV shows, and anime',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://openstream.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  },
  
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'OpenStream',
    url: 'https://openstream.app',
    logo: 'https://openstream.app/images/logo.png',
    description: 'Free streaming platform for movies, TV shows, and anime',
    sameAs: [
      'https://twitter.com/OpenStreamApp',
      'https://github.com/OpenStreamApp'
    ]
  },

  softwareApplication: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'OpenStream',
    applicationCategory: 'Entertainment',
    operatingSystem: 'Android, iOS, Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '10000'
    }
  }
}

// Performance Monitoring
export class PerformanceTracker {
  private static instance: PerformanceTracker
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker()
    }
    return PerformanceTracker.instance
  }

  // Track Core Web Vitals
  trackCoreWebVitals() {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('LCP', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.recordMetric('FID', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.recordMetric('CLS', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }

  // Track custom metrics
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

    // Send to analytics if in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(name, value)
    }
  }

  private sendToAnalytics(metric: string, value: number) {
    // Send to Google Analytics, Vercel Analytics, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        metric_name: metric,
        metric_value: value,
        custom_parameter: true
      })
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

// Image Optimization Utilities
export const imageOptimization = {
  // Generate responsive image props
  getResponsiveImageProps: (src: string, alt: string, priority = false) => ({
    src,
    alt,
    priority,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    style: {
      width: '100%',
      height: 'auto',
    },
  }),

  // Generate blur placeholder
  getBlurDataURL: (width = 8, height = 8) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, width, height)
    return canvas.toDataURL()
  }
}

// Font Optimization
export const fontOptimization = {
  preloadFonts: [
    {
      href: '/fonts/inter-var.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous'
    }
  ],

  fontDisplay: 'swap' as const,
  
  // Critical CSS for font loading
  criticalFontCSS: `
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url('/fonts/inter-var.woff2') format('woff2');
    }
  `
}

// Bundle Size Optimization
export const bundleOptimization = {
  // Dynamic imports for heavy components
  dynamicImports: {
    // Add actual heavy components here when they exist
    // Chart: () => import('@/components/ui/chart'),
    // DataTable: () => import('@/components/admin/advanced-data-table'),
    // CodeEditor: () => import('@/components/ui/code-editor'),
  },

  // Lazy load non-critical components
  lazyComponents: [
    'ActivityFeed',
    'AdvancedSearch',
    'KeyboardShortcuts',
    'QuickActionsPanel'
  ]
}

// Initialize performance tracking
export function initializePerformanceTracking() {
  if (typeof window !== 'undefined') {
    const tracker = PerformanceTracker.getInstance()
    tracker.trackCoreWebVitals()
    
    // Track page load time
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
      tracker.recordMetric('PageLoad', loadTime)
    })
  }
}
