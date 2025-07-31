"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  Download,
  FileText,
  Calendar,
  Clock,
  Mail,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react"

interface ReportsPanelProps {
  adminToken: string
}

interface ReportConfig {
  type: string
  format: string
  dateRange: string
  customStartDate?: string
  customEndDate?: string
  includeCharts: boolean
  includeDetails: boolean
  emailDelivery: boolean
  emailAddress?: string
  scheduledDelivery: boolean
  scheduleFrequency?: string
}

export function ReportsPanel({ adminToken }: ReportsPanelProps) {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: "overview",
    format: "pdf",
    dateRange: "7d",
    includeCharts: true,
    includeDetails: false,
    emailDelivery: false,
    scheduledDelivery: false
  })
  const [generating, setGenerating] = useState(false)
  const [recentReports, setRecentReports] = useState([
    {
      id: "1",
      name: "Weekly Overview Report",
      type: "overview",
      format: "pdf",
      generatedAt: "2025-01-31T10:30:00Z",
      size: "2.4 MB",
      status: "completed"
    },
    {
      id: "2",
      name: "Usage Analytics Report",
      type: "usage",
      format: "csv",
      generatedAt: "2025-01-30T15:45:00Z",
      size: "856 KB",
      status: "completed"
    }
  ])
  const { resolvedTheme } = useTheme()

  const reportTypes = [
    {
      value: "overview",
      label: "Overview Report",
      description: "Comprehensive system overview with key metrics",
      icon: BarChart3
    },
    {
      value: "usage",
      label: "Usage Analytics",
      description: "Detailed usage patterns and trends",
      icon: TrendingUp
    },
    {
      value: "security",
      label: "Security Report",
      description: "Security events and access patterns",
      icon: Shield
    },
    {
      value: "users",
      label: "User Activity",
      description: "User behavior and engagement metrics",
      icon: Users
    },
    {
      value: "performance",
      label: "Performance Report",
      description: "System performance and response times",
      icon: Activity
    }
  ]

  const generateReport = async () => {
    setGenerating(true)
    
    try {
      const response = await fetch('/api/analytics/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportConfig)
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      if (reportConfig.format === 'pdf' || reportConfig.format === 'excel') {
        // Handle file download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${reportConfig.type}-${Date.now()}.${reportConfig.format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // Handle JSON/CSV response
        const data = await response.json()
        console.log('Report data:', data)
      }

      toast.success("Report generated successfully")
      
      // Add to recent reports
      const newReport = {
        id: Date.now().toString(),
        name: `${reportTypes.find(t => t.value === reportConfig.type)?.label} - ${new Date().toLocaleDateString()}`,
        type: reportConfig.type,
        format: reportConfig.format,
        generatedAt: new Date().toISOString(),
        size: "1.2 MB", // Mock size
        status: "completed"
      }
      setRecentReports(prev => [newReport, ...prev.slice(0, 4)])

    } catch (error) {
      toast.error("Failed to generate report")
      console.error('Report generation error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const scheduleReport = async () => {
    try {
      const response = await fetch('/api/analytics/reports/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportConfig)
      })

      if (!response.ok) {
        throw new Error('Failed to schedule report')
      }

      toast.success("Report scheduled successfully")
    } catch (error) {
      toast.error("Failed to schedule report")
    }
  }

  const downloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/analytics/reports/download/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Report downloaded")
    } catch (error) {
      toast.error("Failed to download report")
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="theme-bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Report
              </CardTitle>
              <CardDescription>
                Create custom reports with detailed analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selection */}
              <div className="space-y-3">
                <Label>Report Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = reportConfig.type === type.value
                    
                    return (
                      <div
                        key={type.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setReportConfig(prev => ({ ...prev, type: type.value }))}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-sm">{type.label}</h4>
                            <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Configuration Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select 
                    value={reportConfig.format} 
                    onValueChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select 
                    value={reportConfig.dateRange} 
                    onValueChange={(value) => setReportConfig(prev => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Date Range */}
              {reportConfig.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input 
                      type="date" 
                      value={reportConfig.customStartDate || ''}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input 
                      type="date" 
                      value={reportConfig.customEndDate || ''}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Report Options */}
              <div className="space-y-3">
                <Label>Report Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeCharts"
                      checked={reportConfig.includeCharts}
                      onCheckedChange={(checked) => 
                        setReportConfig(prev => ({ ...prev, includeCharts: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeCharts" className="text-sm">Include charts and visualizations</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeDetails"
                      checked={reportConfig.includeDetails}
                      onCheckedChange={(checked) => 
                        setReportConfig(prev => ({ ...prev, includeDetails: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeDetails" className="text-sm">Include detailed data tables</Label>
                  </div>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="space-y-3">
                <Label>Delivery Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="emailDelivery"
                      checked={reportConfig.emailDelivery}
                      onCheckedChange={(checked) => 
                        setReportConfig(prev => ({ ...prev, emailDelivery: checked as boolean }))
                      }
                    />
                    <Label htmlFor="emailDelivery" className="text-sm">Send via email</Label>
                  </div>
                  
                  {reportConfig.emailDelivery && (
                    <Input 
                      placeholder="Email address"
                      type="email"
                      value={reportConfig.emailAddress || ''}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, emailAddress: e.target.value }))}
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={generateReport}
                  disabled={generating}
                  className="flex-1"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={scheduleReport}
                  variant="outline"
                  disabled={!reportConfig.emailDelivery}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <div className="space-y-6">
          <Card className="theme-bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Reports
              </CardTitle>
              <CardDescription>
                Previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentReports.map((report) => (
                <div 
                  key={report.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{report.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {report.format.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">{report.size}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadReport(report.id)}
                      className="ml-2"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {recentReports.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No reports generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
