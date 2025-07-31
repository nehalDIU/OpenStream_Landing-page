// Analytics export utilities
// This file provides functions to export analytics data in various formats

export interface AnalyticsExportData {
  headers: string[]
  rows: (string | number)[][]
  title?: string
  metadata?: Record<string, any>
}

export interface AnalyticsExportOptions {
  format: 'csv' | 'json' | 'excel' | 'pdf'
  filename?: string
  includeMetadata?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

/**
 * Convert analytics data to CSV format
 */
export function exportAnalyticsToCSV(data: AnalyticsExportData, options: AnalyticsExportOptions = { format: 'csv' }): string {
  const { headers, rows, title, metadata } = data
  let csvContent = ''

  // Add title if provided
  if (title) {
    csvContent += `# ${title}\n`
  }

  // Add metadata if requested
  if (options.includeMetadata && metadata) {
    csvContent += '# Metadata\n'
    Object.entries(metadata).forEach(([key, value]) => {
      csvContent += `# ${key}: ${value}\n`
    })
    csvContent += '\n'
  }

  // Add headers
  csvContent += headers.join(',') + '\n'

  // Add data rows
  rows.forEach(row => {
    const escapedRow = row.map(cell => {
      const cellStr = String(cell)
      // Escape cells that contain commas, quotes, or newlines
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    })
    csvContent += escapedRow.join(',') + '\n'
  })

  return csvContent
}

/**
 * Convert analytics data to JSON format
 */
export function exportAnalyticsToJSON(data: AnalyticsExportData, options: AnalyticsExportOptions = { format: 'json' }): string {
  const { headers, rows, title, metadata } = data

  const jsonData = {
    title,
    metadata: options.includeMetadata ? metadata : undefined,
    exportedAt: new Date().toISOString(),
    dateRange: options.dateRange,
    data: rows.map(row => {
      const obj: Record<string, any> = {}
      headers.forEach((header, index) => {
        obj[header] = row[index]
      })
      return obj
    })
  }

  return JSON.stringify(jsonData, null, 2)
}

/**
 * Download file in browser
 */
export function downloadAnalyticsFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Export analytics data with automatic format detection
 */
export function exportAnalyticsData(data: AnalyticsExportData, options: AnalyticsExportOptions): void {
  const timestamp = new Date().toISOString().split('T')[0]
  const baseFilename = options.filename || `analytics_export_${timestamp}`

  let content: string
  let mimeType: string
  let extension: string

  switch (options.format) {
    case 'csv':
      content = exportAnalyticsToCSV(data, options)
      mimeType = 'text/csv'
      extension = 'csv'
      break
    
    case 'json':
      content = exportAnalyticsToJSON(data, options)
      mimeType = 'application/json'
      extension = 'json'
      break
    
    case 'excel':
      // For Excel, we'll export as CSV for now
      // In a real implementation, you'd use a library like xlsx
      content = exportAnalyticsToCSV(data, options)
      mimeType = 'application/vnd.ms-excel'
      extension = 'csv'
      break
    
    case 'pdf':
      // For PDF, we'll export as JSON for now
      // In a real implementation, you'd use a library like jsPDF
      content = exportAnalyticsToJSON(data, options)
      mimeType = 'application/pdf'
      extension = 'json'
      break
    
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }

  const filename = `${baseFilename}.${extension}`
  downloadAnalyticsFile(content, filename, mimeType)
}

/**
 * Format different types of analytics data for export
 */
export function formatAnalyticsForExport(analyticsData: any, type: string): AnalyticsExportData {
  switch (type) {
    case 'overview':
      return {
        title: 'Analytics Overview Report',
        headers: ['Metric', 'Value', 'Trend'],
        rows: [
          ['Total Codes', analyticsData.totalCodes || 0, ''],
          ['Active Codes', analyticsData.activeCodes || 0, ''],
          ['Used Codes', analyticsData.usedCodes || 0, ''],
          ['Success Rate', `${analyticsData.successRate || 0}%`, ''],
          ['Total Users', analyticsData.totalUsers || 0, ''],
          ['Peak Hour', analyticsData.peakHour || 'N/A', ''],
          ['Average Usage Time', `${analyticsData.avgUsageTime || 0} min`, '']
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'overview',
          period: 'Last 7 days'
        }
      }

    case 'usage':
      return {
        title: 'Usage Analytics Report',
        headers: ['Date', 'Codes Generated', 'Codes Used', 'Active Users', 'Success Rate'],
        rows: analyticsData.dailyTrends?.map((day: any) => [
          day.date,
          day.codes || 0,
          day.used || 0,
          day.users || 0,
          `${day.success_rate || 0}%`
        ]) || [],
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'usage',
          totalDays: analyticsData.dailyTrends?.length || 0
        }
      }

    case 'hourly':
      return {
        title: 'Hourly Usage Pattern Report',
        headers: ['Hour', 'Generated', 'Used', 'Expired'],
        rows: analyticsData.hourlyUsage?.map((hour: any) => [
          hour.hour,
          hour.generated || 0,
          hour.used || 0,
          hour.expired || 0
        ]) || [],
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'hourly',
          totalHours: 24
        }
      }

    case 'codes':
      return {
        title: 'Access Codes Report',
        headers: ['Code', 'Created At', 'Expires At', 'Status', 'Used By', 'Prefix'],
        rows: analyticsData.activeCodes?.map((code: any) => [
          code.code,
          new Date(code.createdAt).toLocaleString(),
          new Date(code.expiresAt).toLocaleString(),
          code.usedAt ? 'Used' : 'Active',
          code.usedBy || 'N/A',
          code.prefix || 'None'
        ]) || [],
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'codes',
          totalCodes: analyticsData.activeCodes?.length || 0
        }
      }

    case 'activity':
      return {
        title: 'Activity Logs Report',
        headers: ['Timestamp', 'Action', 'Code', 'Details'],
        rows: analyticsData.usageLogs?.map((log: any) => [
          new Date(log.timestamp).toLocaleString(),
          log.action,
          log.code,
          log.details || ''
        ]) || [],
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'activity',
          totalLogs: analyticsData.usageLogs?.length || 0
        }
      }

    default:
      return {
        title: 'Analytics Export',
        headers: ['Data'],
        rows: [['No data available']],
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: 'unknown'
        }
      }
  }
}

/**
 * Generate comprehensive analytics report
 */
export function generateComprehensiveReport(analyticsData: any): AnalyticsExportData {
  const overview = formatAnalyticsForExport(analyticsData, 'overview')
  const usage = formatAnalyticsForExport(analyticsData, 'usage')
  const hourly = formatAnalyticsForExport(analyticsData, 'hourly')

  return {
    title: 'Comprehensive Analytics Report',
    headers: ['Section', 'Metric', 'Value'],
    rows: [
      // Overview section
      ...overview.rows.map(row => ['Overview', row[0], row[1]]),
      ['', '', ''], // Empty row for separation
      
      // Usage summary
      ['Usage Summary', 'Total Days Analyzed', usage.rows.length],
      ['Usage Summary', 'Peak Usage Day', usage.rows.reduce((max, row) => 
        (row[1] as number) > (max[1] as number) ? row : max, usage.rows[0] || ['N/A', 0])[0]],
      ['', '', ''], // Empty row for separation
      
      // Hourly summary
      ['Hourly Pattern', 'Peak Hour', hourly.rows.reduce((max, row) => 
        (row[1] as number) > (max[1] as number) ? row : max, hourly.rows[0] || ['N/A', 0])[0]],
      ['Hourly Pattern', 'Total Hourly Events', hourly.rows.reduce((sum, row) => 
        sum + (row[1] as number) + (row[2] as number) + (row[3] as number), 0)]
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      reportType: 'comprehensive',
      sections: ['overview', 'usage', 'hourly']
    }
  }
}
