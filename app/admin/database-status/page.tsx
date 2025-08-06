"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Info,
  Server,
  Key,
  Activity
} from "lucide-react"

export default function DatabaseStatusPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const { resolvedTheme } = useTheme()

  const checkDatabaseStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/database-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to check database status')
      }

      const data = await response.json()
      setStatus(data)
      
      if (data.connectionTest === 'Success') {
        toast.success('Database connection successful')
      } else {
        toast.error('Database connection failed')
      }
    } catch (error) {
      console.error('Error checking database:', error)
      toast.error('Failed to check database status')
    } finally {
      setLoading(false)
    }
  }

  const createSampleData = async () => {
    try {
      setCreating(true)
      const response = await fetch('/api/admin/database-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'create-sample-data' })
      })

      if (!response.ok) {
        throw new Error('Failed to create sample data')
      }

      const result = await response.json()
      toast.success(`Created ${result.createdCodes?.length || 0} codes and ${result.logsCreated || 0} logs`)
      
      // Refresh status
      setTimeout(() => {
        checkDatabaseStatus()
      }, 1000)
    } catch (error) {
      console.error('Error creating sample data:', error)
      toast.error('Failed to create sample data')
    } finally {
      setCreating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'Failed': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-text-primary">Database Status</h1>
          <p className="theme-text-secondary mt-1">
            Check Supabase connection and database content
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkDatabaseStatus}
            disabled={loading}
            className="theme-button-secondary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Check Status
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={createSampleData}
            disabled={creating || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Create Sample Data
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Database Diagnostics</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                This page helps diagnose why the Users section might be empty. It checks your Supabase connection, 
                existing data, and can create sample data directly in the database.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Results */}
      {status && (
        <div className="space-y-6">
          {/* Connection Status */}
          <Card className="theme-bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Supabase URL</span>
                  <Badge variant={status.supabaseConfig.url === 'Set' ? 'default' : 'destructive'}>
                    {status.supabaseConfig.url}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Supabase Key</span>
                  <Badge variant={status.supabaseConfig.key === 'Set' ? 'default' : 'destructive'}>
                    {status.supabaseConfig.key}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Database Connection</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.connectionTest)}
                    <span>{status.connectionTest}</span>
                  </div>
                </div>
                {status.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Error:</strong> {status.error}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Access Codes Status */}
          <Card className="theme-bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Access Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status.accessCodes ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {status.accessCodes.count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Access Codes</div>
                  </div>
                  
                  {status.accessCodes.sample.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Sample Codes</h4>
                      <div className="space-y-2">
                        {status.accessCodes.sample.map((code: any, index: number) => (
                          <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold">{code.code}</span>
                              <Badge variant={code.is_active ? 'default' : 'secondary'}>
                                {code.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                              Created: {new Date(code.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No access codes data available</p>
              )}
            </CardContent>
          </Card>

          {/* Usage Logs Status */}
          <Card className="theme-bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Usage Logs (User Activity Source)
              </CardTitle>
              <CardDescription>
                This is where user activity data comes from for the Users section
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status.usageLogs ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {status.usageLogs.total}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Logs</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {status.usageLogs.withIP}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Logs with IP</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {status.usageLogs.uniqueIPs}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Unique Users</div>
                    </div>
                  </div>

                  {status.usageLogs.withIP === 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <strong className="text-yellow-800 dark:text-yellow-200">No User Activity Data</strong>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        The Users section is empty because there are no usage logs with IP addresses. 
                        Click "Create Sample Data" to generate test user activity.
                      </p>
                    </div>
                  )}

                  {status.usageLogs.sample.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Sample Usage Logs</h4>
                      <div className="space-y-2">
                        {status.usageLogs.sample.map((log: any, index: number) => (
                          <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-mono">{log.ip_address}</span>
                              <Badge variant="outline">{log.action}</Badge>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                              Code: {log.code} | {new Date(log.timestamp).toLocaleString()}
                            </div>
                            {log.user_agent && (
                              <div className="text-gray-500 dark:text-gray-500 mt-1 text-xs">
                                {log.user_agent}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No usage logs data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Next Steps */}
      {status && status.usageLogs?.withIP === 0 && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">Create Sample Data</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Click "Create Sample Data" above to generate test access codes and usage logs with IP addresses.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">Check Users Section</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    After creating sample data, visit the Users section to see the user activity analytics.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
