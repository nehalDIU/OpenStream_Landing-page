"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  Download,
  FileText,
  Database,
  Calendar,
  Filter,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { format } from "date-fns"

interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'pdf'
  fields: string[]
  includeHeaders: boolean
  includeMetadata: boolean
  dateFormat: 'iso' | 'us' | 'eu'
  filename?: string
  description?: string
}

interface AdvancedExportDialogProps {
  logs: any[]
  filteredLogs: any[]
  onExport: (options: ExportOptions) => Promise<void>
  children: React.ReactNode
}

export function AdvancedExportDialog({
  logs,
  filteredLogs,
  onExport,
  children
}: AdvancedExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    fields: ['timestamp', 'code', 'action', 'details', 'ip_address'],
    includeHeaders: true,
    includeMetadata: false,
    dateFormat: 'iso',
    filename: `logs-export-${format(new Date(), 'yyyy-MM-dd')}`
  })

  const availableFields = [
    { key: 'timestamp', label: 'Timestamp', description: 'When the action occurred' },
    { key: 'code', label: 'Access Code', description: 'The access code involved' },
    { key: 'action', label: 'Action', description: 'Type of action performed' },
    { key: 'details', label: 'Details', description: 'Additional details about the action' },
    { key: 'ip_address', label: 'IP Address', description: 'Source IP address' },
    { key: 'user_agent', label: 'User Agent', description: 'Browser/client information' },
    { key: 'user_id', label: 'User ID', description: 'User identifier if available' },
    { key: 'session_id', label: 'Session ID', description: 'Session identifier' },
    { key: 'location', label: 'Location', description: 'Geographic location' },
    { key: 'device_type', label: 'Device Type', description: 'Type of device used' },
    { key: 'browser', label: 'Browser', description: 'Browser name and version' },
    { key: 'os', label: 'Operating System', description: 'Operating system information' },
    { key: 'success', label: 'Success Status', description: 'Whether the action was successful' },
    { key: 'error_message', label: 'Error Message', description: 'Error details if applicable' },
    { key: 'duration', label: 'Duration', description: 'Time taken for the action' }
  ]

  const formatOptions = [
    {
      value: 'csv',
      label: 'CSV',
      description: 'Comma-separated values, compatible with Excel',
      icon: FileText,
      recommended: true
    },
    {
      value: 'json',
      label: 'JSON',
      description: 'JavaScript Object Notation, for developers',
      icon: Database,
      recommended: false
    },
    {
      value: 'xlsx',
      label: 'Excel',
      description: 'Microsoft Excel format with formatting',
      icon: FileText,
      recommended: false
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Portable Document Format for reports',
      icon: FileText,
      recommended: false
    }
  ]

  const handleFieldToggle = (field: string) => {
    setOptions(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field]
    }))
  }

  const handleSelectAllFields = () => {
    setOptions(prev => ({
      ...prev,
      fields: availableFields.map(f => f.key)
    }))
  }

  const handleSelectNoneFields = () => {
    setOptions(prev => ({
      ...prev,
      fields: []
    }))
  }

  const handleExport = async () => {
    if (options.fields.length === 0) {
      toast.error("Please select at least one field to export")
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      await onExport(options)
      
      clearInterval(progressInterval)
      setExportProgress(100)
      
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
        setOpen(false)
        toast.success("Export completed successfully")
      }, 500)
    } catch (error) {
      setIsExporting(false)
      setExportProgress(0)
      toast.error("Export failed. Please try again.")
    }
  }

  const getEstimatedSize = () => {
    const avgRowSize = options.format === 'json' ? 200 : 100 // bytes per row
    const totalSize = filteredLogs.length * avgRowSize * (options.fields.length / availableFields.length)
    
    if (totalSize < 1024) return `${Math.round(totalSize)} B`
    if (totalSize < 1024 * 1024) return `${Math.round(totalSize / 1024)} KB`
    return `${Math.round(totalSize / (1024 * 1024))} MB`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Advanced Export Options
          </DialogTitle>
          <DialogDescription>
            Configure your export settings to get exactly the data you need
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredLogs.length}</div>
              <div className="text-xs text-gray-500">Records to export</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{options.fields.length}</div>
              <div className="text-xs text-gray-500">Fields selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{getEstimatedSize()}</div>
              <div className="text-xs text-gray-500">Estimated size</div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) => setOptions(prev => ({ ...prev, format: value as any }))}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {formatOptions.map((format) => {
                const Icon = format.icon
                return (
                  <div key={format.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={format.value} id={format.value} />
                    <Label
                      htmlFor={format.value}
                      className="flex items-center gap-3 cursor-pointer flex-1 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <Icon className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{format.label}</span>
                          {format.recommended && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          <Separator />

          {/* Field Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Fields to Export</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFields}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectNoneFields}
                >
                  Select None
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {availableFields.map((field) => (
                <div key={field.key} className="flex items-start space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={options.fields.includes(field.key)}
                    onCheckedChange={() => handleFieldToggle(field.key)}
                  />
                  <Label
                    htmlFor={field.key}
                    className="cursor-pointer flex-1"
                  >
                    <div className="font-medium">{field.label}</div>
                    <div className="text-xs text-gray-500">{field.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Additional Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Additional Options</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeHeaders"
                    checked={options.includeHeaders}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeHeaders: !!checked }))
                    }
                  />
                  <Label htmlFor="includeHeaders">Include column headers</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMetadata"
                    checked={options.includeMetadata}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeMetadata: !!checked }))
                    }
                  />
                  <Label htmlFor="includeMetadata">Include metadata</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <RadioGroup
                    value={options.dateFormat}
                    onValueChange={(value) => setOptions(prev => ({ ...prev, dateFormat: value as any }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="iso" id="iso" />
                      <Label htmlFor="iso">ISO 8601 (2024-01-15T10:30:00Z)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="us" id="us" />
                      <Label htmlFor="us">US Format (01/15/2024 10:30 AM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="eu" id="eu" />
                      <Label htmlFor="eu">EU Format (15/01/2024 10:30)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* File Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">File Details</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={options.filename}
                  onChange={(e) => setOptions(prev => ({ ...prev, filename: e.target.value }))}
                  placeholder="Enter filename..."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={options.description || ""}
                onChange={(e) => setOptions(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description for this export..."
                rows={3}
              />
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting...</span>
                <span className="text-sm text-gray-500">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={isExporting || options.fields.length === 0}
              className="min-w-32"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
