"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  Database,
  Users,
  Activity,
  Play,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"

export default function TestDataPage() {
  const [loading, setLoading] = useState(false)
  const [dataInfo, setDataInfo] = useState<any>(null)
  const [generationResult, setGenerationResult] = useState<any>(null)
  const { resolvedTheme } = useTheme()

  const checkCurrentData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/test-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data info')
      }

      const data = await response.json()
      setDataInfo(data)
      toast.success('Data info loaded')
    } catch (error) {
      console.error('Error fetching data info:', error)
      toast.error('Failed to load data info')
    } finally {
      setLoading(false)
    }
  }

  const generateTestData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/test-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate test data')
      }

      const result = await response.json()
      setGenerationResult(result)
      toast.success('Test data generated successfully!')
      
      // Refresh data info
      setTimeout(() => {
        checkCurrentData()
      }, 1000)
    } catch (error) {
      console.error('Error generating test data:', error)
      toast.error('Failed to generate test data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-text-primary">Test Data Generator</h1>
          <p className="theme-text-secondary mt-1">
            Generate sample user activity data for testing the Users section
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkCurrentData}
            disabled={loading}
            className="theme-button-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Data
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={generateTestData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Generate Test Data
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">About Test Data Generation</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                This tool creates sample access codes and usage logs with different IP addresses and user agents 
                to populate the Users section with realistic activity data. The generated data spans the last 7 days 
                and includes various device types and browsers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Data Info */}
      {dataInfo && (
        <Card className="theme-bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current Database Status
            </CardTitle>
            <CardDescription>Overview of existing usage logs and user data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {dataInfo.totalUsageLogs}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Usage Logs</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {dataInfo.logsWithIP}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Logs with IP Address</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {dataInfo.uniqueIPs}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Unique Users (IPs)</div>
              </div>
            </div>

            {dataInfo.sampleLogs && dataInfo.sampleLogs.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium theme-text-primary mb-3">Sample Recent Logs</h4>
                <div className="space-y-2">
                  {dataInfo.sampleLogs.map((log: any, index: number) => (
                    <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-mono">{log.ip_address}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 mt-1">
                        Code: {log.code} | {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generation Result */}
      {generationResult && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <CheckCircle className="h-5 w-5" />
              Test Data Generated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Generated Codes</h4>
                <div className="space-y-1">
                  {generationResult.testCodes?.map((code: string, index: number) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-1">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Statistics</h4>
                <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <div>Usage logs created: {generationResult.usageLogsCreated}</div>
                  <div>Total attempted: {generationResult.totalAttempted}</div>
                  <div>Success rate: {Math.round((generationResult.usageLogsCreated / generationResult.totalAttempted) * 100)}%</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 rounded">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ Test data has been generated! You can now visit the{" "}
                <a href="/admin/users" className="underline font-medium">
                  Users section
                </a>{" "}
                to see the user activity data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="theme-bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                1
              </div>
              <div>
                <h4 className="font-medium theme-text-primary">Check Current Data</h4>
                <p className="text-sm theme-text-secondary">
                  Click "Check Data" to see how many usage logs and unique users are currently in your database.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                2
              </div>
              <div>
                <h4 className="font-medium theme-text-primary">Generate Test Data</h4>
                <p className="text-sm theme-text-secondary">
                  Click "Generate Test Data" to create sample access codes and usage logs with different IP addresses.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                3
              </div>
              <div>
                <h4 className="font-medium theme-text-primary">View Users Section</h4>
                <p className="text-sm theme-text-secondary">
                  Navigate to the Users section to see the generated user activity, statistics, and analytics.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
