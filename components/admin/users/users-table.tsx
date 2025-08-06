"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/contexts/theme-context"
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserDetailModal } from "./user-detail-modal"

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

interface UsersTableProps {
  users: UserData[]
  loading?: boolean
  onRefresh: () => void
}

export function UsersTable({ users, loading, onRefresh }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDevice, setFilterDevice] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { resolvedTheme } = useTheme()

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.browser.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDevice = filterDevice === "all" || user.device_type === filterDevice
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && user.is_active) ||
                         (filterStatus === "inactive" && !user.is_active)
    
    return matchesSearch && matchesDevice && matchesStatus
  })

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      default: return Monitor
    }
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

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  if (loading) {
    return (
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users Activity
          </CardTitle>
          <CardDescription>Loading user data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="theme-bg-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users Activity
            </CardTitle>
            <CardDescription>
              {filteredUsers.length} of {users.length} users
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 theme-text-secondary" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Device Filter */}
            <select
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
              className="px-3 py-2 border rounded-md theme-bg-card theme-border theme-text-primary"
            >
              <option value="all">All Devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md theme-bg-card theme-border theme-text-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 theme-text-secondary">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b theme-border">
                    <th className="text-left py-3 px-4 font-medium theme-text-secondary">User</th>
                    <th className="text-left py-3 px-4 font-medium theme-text-secondary">Device</th>
                    <th className="text-left py-3 px-4 font-medium theme-text-secondary">Activity</th>
                    <th className="text-left py-3 px-4 font-medium theme-text-secondary">Success Rate</th>
                    <th className="text-left py-3 px-4 font-medium theme-text-secondary">Last Seen</th>
                    <th className="text-left py-3 px-4 font-medium theme-text-secondary">Status</th>
                    <th className="text-right py-3 px-4 font-medium theme-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 50).map((user) => {
                    const DeviceIcon = getDeviceIcon(user.device_type)
                    
                    return (
                      <tr key={user.id} className="border-b theme-border hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium theme-text-primary">{user.ip_address}</div>
                              <div className="text-sm theme-text-secondary">{user.browser}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <DeviceIcon className="h-4 w-4 theme-text-secondary" />
                            <span className="text-sm theme-text-primary capitalize">{user.device_type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="theme-text-primary">{user.total_sessions} sessions</div>
                            <div className="theme-text-secondary">{user.total_codes_used} codes used</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={user.success_rate >= 80 ? "default" : user.success_rate >= 50 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {user.success_rate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm theme-text-primary">
                            {formatTimeAgo(user.last_seen)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
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
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Card>
  )
}
