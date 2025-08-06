"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/contexts/theme-context"
import {
  User,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  Eye,
  X
} from "lucide-react"

interface UserData {
  id: string
  ip_address: string
  user_agent: string
  first_seen: string
  last_seen: string
  total_sessions: number
  total_codes_used: number
  success_rate: number
  device_type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  location?: string
  is_active: boolean
}

interface UserDetailModalProps {
  user: UserData | null
  isOpen: boolean
  onClose: () => void
}

export function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  const { resolvedTheme } = useTheme()

  if (!user) return null

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      default: return Monitor
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const DeviceIcon = getDeviceIcon(user.device_type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">{user.ip_address}</div>
              <div className="text-sm text-gray-500 font-normal">{user.browser}</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            User activity details and session information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={user.is_active ? "default" : "secondary"}
                  className={user.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : ""}
                >
                  {user.is_active ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Device</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DeviceIcon className="h-4 w-4 text-gray-500" />
                  <span className="capitalize">{user.device_type}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Activity Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.total_sessions}
                  </div>
                  <div className="text-sm text-gray-500">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {user.total_codes_used}
                  </div>
                  <div className="text-sm text-gray-500">Codes Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {user.success_rate}%
                  </div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">First Seen</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(user.first_seen)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Last Seen</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTimeAgo(user.last_seen)} ({formatDate(user.last_seen)})
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">{user.ip_address}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Browser</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{user.browser}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">User Agent</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 break-all bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {user.user_agent}
                  </div>
                </div>
                {user.location && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{user.location}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
