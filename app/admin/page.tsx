"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to overview page
    router.replace('/admin/overview')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center theme-bg-primary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="theme-text-secondary">Redirecting to admin dashboard...</p>
      </div>
    </div>
  )
}
