"use client"

import { useState, useEffect } from "react"
import { ActivityLogs } from "@/components/admin/activity-logs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Shield, Clock, Users } from "lucide-react"

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
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold theme-text-primary">Activity Logs</h1>
            <p className="text-sm theme-text-secondary">
              Advanced activity monitoring and detailed log analysis
            </p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="theme-bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm theme-text-secondary">Total Events</p>
                <p className="text-lg font-semibold theme-text-primary">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm theme-text-secondary">Security Events</p>
                <p className="text-lg font-semibold theme-text-primary">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm theme-text-secondary">Last 24h</p>
                <p className="text-lg font-semibold theme-text-primary">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="theme-bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm theme-text-secondary">Unique IPs</p>
                <p className="text-lg font-semibold theme-text-primary">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs Component */}
      {adminToken && (
        <ActivityLogs
          adminToken={adminToken}
          className="space-y-6"
        />
      )}

      {!adminToken && (
        <Card className="theme-bg-card">
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 theme-text-secondary opacity-50" />
            <h3 className="text-lg font-semibold theme-text-primary mb-2">
              Authentication Required
            </h3>
            <p className="theme-text-secondary">
              Please authenticate to view activity logs
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
