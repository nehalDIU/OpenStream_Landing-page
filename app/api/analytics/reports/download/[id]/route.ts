import { NextRequest, NextResponse } from 'next/server'

// Admin authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin2520'

function isValidAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${ADMIN_TOKEN}`
}

// Mock report storage - in a real implementation, you would store these in a database or file system
const mockReports = new Map([
  ['1', {
    id: '1',
    name: 'Weekly Overview Report',
    type: 'overview',
    format: 'pdf',
    content: 'Mock PDF content for Weekly Overview Report',
    generatedAt: '2025-01-31T10:30:00Z',
    size: '2.4 MB'
  }],
  ['2', {
    id: '2',
    name: 'Usage Analytics Report',
    type: 'usage',
    format: 'csv',
    content: 'Date,Codes Generated,Codes Used,Success Rate\n2025-01-31,15,12,80%\n2025-01-30,20,18,90%',
    generatedAt: '2025-01-30T15:45:00Z',
    size: '856 KB'
  }]
])

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    if (!isValidAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = params.id

    if (!reportId) {
      return NextResponse.json({ 
        error: 'Report ID is required' 
      }, { status: 400 })
    }

    // Find the report
    const report = mockReports.get(reportId)

    if (!report) {
      return NextResponse.json({ 
        error: 'Report not found' 
      }, { status: 404 })
    }

    // Determine content type based on format
    let contentType = 'application/octet-stream'
    let fileExtension = 'txt'

    switch (report.format) {
      case 'pdf':
        contentType = 'application/pdf'
        fileExtension = 'pdf'
        break
      case 'csv':
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileExtension = 'xlsx'
        break
      case 'json':
        contentType = 'application/json'
        fileExtension = 'json'
        break
    }

    // Generate filename
    const filename = `${report.name.replace(/\s+/g, '_').toLowerCase()}.${fileExtension}`

    // For demonstration, we'll return the mock content
    // In a real implementation, you would read the actual file from storage
    const content = report.content

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString()
      }
    })

  } catch (error) {
    console.error('Report download error:', error)
    return NextResponse.json({
      error: 'Failed to download report'
    }, { status: 500 })
  }
}
