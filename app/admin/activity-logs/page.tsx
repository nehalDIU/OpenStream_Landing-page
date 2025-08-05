"use client"

import { useState, useEffect } from "react"
import { ActivityLogs } from "@/components/admin/activity-logs"
import { Card, CardContent } from "@/components/ui/card"
import { Activity } from "lucide-react"

export default function ActivityLogsPage() {
  const [adminToken, setAdminToken] = useState("")

  // Get admin token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('admin-token')
    if (savedToken) {
      setAdminToken(savedToken)
    }
  }, [])

  return (
    <div className="p-6">
      {/* Activity Logs Component */}
      {adminToken ? (
        <ActivityLogs
          adminToken={adminToken}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please authenticate to view activity logs
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
