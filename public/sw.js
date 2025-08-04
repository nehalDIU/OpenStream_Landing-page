// Service Worker for OpenStream Admin Dashboard
// Provides caching, offline support, and performance optimizations

const CACHE_NAME = 'openstream-admin-v1'
const STATIC_CACHE_NAME = 'openstream-static-v1'
const DYNAMIC_CACHE_NAME = 'openstream-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/admin',
  '/admin/overview',
  '/admin/access-codes',
  '/admin/analytics',
  '/admin/activity-logs',
  '/admin/settings',
  '/fonts/inter-var.woff2',
  '/images/logo.svg',
  '/manifest.json'
]

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/api/access-codes',
  '/api/admin/stats',
  '/api/admin/logs'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    // Cache-first strategy for static assets
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME))
  } else if (isAPIRequest(request)) {
    // Network-first strategy for API requests
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME))
  } else if (isPageRequest(request)) {
    // Stale-while-revalidate for pages
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE_NAME))
  } else {
    // Default network-first for everything else
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME))
  }
})

// Cache-first strategy (good for static assets)
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Cache-first strategy failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network-first strategy (good for API requests)
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', error)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    return new Response('Offline', { status: 503 })
  }
}

// Stale-while-revalidate strategy (good for pages)
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // Network failed, return cached version if available
    return cachedResponse
  })

  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url)
  return (
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp')
  )
}

function isAPIRequest(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/api/')
}

function isPageRequest(request) {
  const url = new URL(request.url)
  return (
    request.headers.get('accept')?.includes('text/html') ||
    url.pathname.startsWith('/admin')
  )
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle offline actions when connection is restored
  console.log('Service Worker: Background sync triggered')
  
  // You can implement offline action queuing here
  // For example, sync pending form submissions, analytics events, etc.
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.data
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/admin')
  )
})

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ cacheSize: size })
    })
  }
})

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }
  
  return totalSize
}

console.log('Service Worker: Loaded')
