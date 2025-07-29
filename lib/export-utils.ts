// Export utilities for Activity Logs
import type { ActivityLogEntry, ActivityLogFilters, ExportConfig } from '@/types/activity-logs'

// CSV Export Functions
export function formatCSV(logs: ActivityLogEntry[], config?: Partial<ExportConfig>): string {
  if (logs.length === 0) {
    return 'No data to export'
  }

  const {
    includeHeaders = true,
    dateFormat = 'ISO',
    delimiter = ',',
    columns = getDefaultColumns()
  } = config || {}

  const selectedColumns = columns.filter(col => col.include)
  
  const csvRows: string[] = []

  // Add headers if requested
  if (includeHeaders) {
    const headers = selectedColumns.map(col => escapeCSVValue(col.label))
    csvRows.push(headers.join(delimiter))
  }

  // Add data rows
  logs.forEach(log => {
    const row = selectedColumns.map(col => {
      const value = getColumnValue(log, col.key, col.format)
      return escapeCSVValue(value, dateFormat)
    })
    csvRows.push(row.join(delimiter))
  })

  return csvRows.join('\n')
}

// JSON Export Functions
export function formatJSON(logs: ActivityLogEntry[], config?: Partial<ExportConfig>): string {
  const {
    includeMetadata = true,
    dateFormat = 'ISO',
    timezone = 'UTC'
  } = config || {}

  const exportData = {
    metadata: includeMetadata ? {
      exportedAt: new Date().toISOString(),
      totalRecords: logs.length,
      dateFormat,
      timezone,
      version: '1.0'
    } : undefined,
    data: logs.map(log => formatLogForExport(log, dateFormat, timezone))
  }

  return JSON.stringify(exportData, null, 2)
}

// Excel-compatible CSV format
export function formatExcelCSV(logs: ActivityLogEntry[], config?: Partial<ExportConfig>): string {
  const csvContent = formatCSV(logs, {
    ...config,
    delimiter: ',',
    includeHeaders: true
  })

  // Add BOM for Excel UTF-8 recognition
  return '\uFEFF' + csvContent
}

// Helper Functions
function getDefaultColumns() {
  return [
    { key: 'id', label: 'ID', include: true },
    { key: 'timestamp', label: 'Timestamp', include: true, format: (value: any) => new Date(value).toISOString() },
    { key: 'action', label: 'Action', include: true },
    { key: 'code', label: 'Code', include: true },
    { key: 'ip_address', label: 'IP Address', include: true },
    { key: 'user_agent', label: 'User Agent', include: false },
    { key: 'details', label: 'Details', include: true },
    { key: 'success', label: 'Success', include: false },
    { key: 'duration_ms', label: 'Duration (ms)', include: false },
    { key: 'user_id', label: 'User ID', include: false },
    { key: 'session_id', label: 'Session ID', include: false },
    { key: 'location', label: 'Location', include: false }
  ]
}

function getColumnValue(log: ActivityLogEntry, key: string, formatter?: (value: any) => string): string {
  const value = (log as any)[key]
  
  if (value === null || value === undefined) {
    return ''
  }

  if (formatter) {
    try {
      return formatter(value)
    } catch (error) {
      console.warn(`Error formatting value for key ${key}:`, error)
      return String(value)
    }
  }

  return String(value)
}

function escapeCSVValue(value: string | number | boolean | null | undefined, dateFormat?: string): string {
  if (value === null || value === undefined) {
    return ''
  }

  let stringValue = String(value)

  // Handle date formatting
  if (dateFormat && stringValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    const date = new Date(stringValue)
    switch (dateFormat) {
      case 'ISO':
        stringValue = date.toISOString()
        break
      case 'US':
        stringValue = date.toLocaleDateString('en-US')
        break
      case 'EU':
        stringValue = date.toLocaleDateString('en-GB')
        break
      default:
        stringValue = date.toLocaleDateString()
    }
  }

  // Escape quotes and wrap in quotes if necessary
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    stringValue = '"' + stringValue.replace(/"/g, '""') + '"'
  }

  return stringValue
}

function formatLogForExport(log: ActivityLogEntry, dateFormat: string, timezone: string): any {
  const formatted = { ...log }

  // Format timestamp
  if (formatted.timestamp) {
    const date = new Date(formatted.timestamp)
    formatted.formatted_timestamp = formatDateForExport(date, dateFormat, timezone)
    formatted.time_ago = getTimeAgo(date)
  }

  // Add computed fields
  formatted.action_display = getActionDisplay(formatted.action)
  formatted.success_display = formatted.success ? 'Success' : 'Failed'

  return formatted
}

function formatDateForExport(date: Date, format: string, timezone: string): string {
  switch (format) {
    case 'ISO':
      return date.toISOString()
    case 'US':
      return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US')
    case 'EU':
      return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB')
    default:
      return date.toLocaleString()
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

function getActionDisplay(action: string): string {
  switch (action) {
    case 'generated':
      return 'Code Generated'
    case 'used':
      return 'Code Used'
    case 'expired':
      return 'Code Expired'
    case 'revoked':
      return 'Code Revoked'
    default:
      return 'Unknown Action'
  }
}

// Download Functions
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  window.URL.revokeObjectURL(url)
  document.body.removeChild(link)
}

export function generateFilename(format: string, filters?: ActivityLogFilters): string {
  const timestamp = new Date().toISOString().split('T')[0]
  let filename = `activity-logs-${timestamp}`

  // Add filter info to filename
  if (filters) {
    const filterParts: string[] = []
    
    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start).toISOString().split('T')[0]
      const end = new Date(filters.dateRange.end).toISOString().split('T')[0]
      filterParts.push(`${start}-to-${end}`)
    }
    
    if (filters.activityTypes) {
      const activeTypes = Object.entries(filters.activityTypes)
        .filter(([_, active]) => active)
        .map(([type, _]) => type)
      if (activeTypes.length > 0 && activeTypes.length < 4) {
        filterParts.push(activeTypes.join('-'))
      }
    }
    
    if (filterParts.length > 0) {
      filename += `-${filterParts.join('-')}`
    }
  }

  return `${filename}.${format}`
}

// Export API Functions
export async function exportActivityLogs(
  adminToken: string,
  format: 'csv' | 'json',
  filters?: ActivityLogFilters,
  config?: Partial<ExportConfig>
): Promise<void> {
  try {
    const response = await fetch('/api/activity-logs/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        format,
        filters: filters || {},
        includeMetadata: config?.includeMetadata ?? true,
        maxRows: config?.maxRows ?? 10000,
        filename: config?.filename
      })
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    // Get filename from response headers or generate one
    const contentDisposition = response.headers.get('content-disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : generateFilename(format, filters)

    // Download the file
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)

  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
}

// Preview Export Data
export async function previewExport(
  adminToken: string,
  format: 'csv' | 'json',
  filters?: ActivityLogFilters
): Promise<{
  preview: string
  totalRecords: number
  estimatedFileSize: string
}> {
  const response = await fetch(`/api/activity-logs/export?${new URLSearchParams({
    format,
    preview: 'true',
    ...(filters?.dateRange && {
      startDate: filters.dateRange.start.toString(),
      endDate: filters.dateRange.end.toString()
    }),
    ...(filters?.activityTypes && {
      actions: Object.entries(filters.activityTypes)
        .filter(([_, active]) => active)
        .map(([type, _]) => type)
        .join(',')
    }),
    ...(filters?.searchTerm && { search: filters.searchTerm })
  })}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Preview failed: ${response.statusText}`)
  }

  const data = await response.json()
  
  let preview: string
  if (format === 'csv') {
    preview = formatCSV(data.data.slice(0, 5), { includeHeaders: true })
  } else {
    preview = formatJSON(data.data.slice(0, 5), { includeMetadata: true })
  }

  return {
    preview,
    totalRecords: data.totalRecords,
    estimatedFileSize: data.estimatedFileSize
  }
}
