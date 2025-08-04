"use client"

import { AdvancedDataTable } from "@/components/admin/advanced-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Trash2, Eye, Key, Clock } from "lucide-react"
import { toast } from "sonner"

interface AccessCode {
  id: string
  code: string
  createdAt: string
  expiresAt: string
  usageCount: number
  maxUsage: number
  isActive: boolean
  createdBy?: string
  lastUsed?: string
}

interface DataTableProps {
  title: string
  description?: string
  data: AccessCode[]
  loading?: boolean
  onCopyCode?: (code: string) => void
  onRevokeCode?: (id: string) => void
  onViewDetails?: (code: AccessCode) => void
  onRefresh?: () => void
}

export function DataTable({
  title,
  description,
  data,
  loading = false,
  onCopyCode,
  onRevokeCode,
  onViewDetails,
  onRefresh
}: DataTableProps) {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (code: AccessCode) => {
    const now = new Date()
    const expiresAt = new Date(code.expiresAt)
    const isExpired = now > expiresAt
    const isUsageLimitReached = code.usageCount >= code.maxUsage

    if (!code.isActive || isExpired || isUsageLimitReached) {
      return <Badge variant="destructive">Inactive</Badge>
    }

    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60))

    if (minutesUntilExpiry < 5) {
      return <Badge variant="destructive">Expiring Soon</Badge>
    } else if (minutesUntilExpiry < 30) {
      return <Badge variant="secondary">Expires Soon</Badge>
    }

    return <Badge variant="default">Active</Badge>
  }

  const columns = [
    {
      key: 'code' as keyof AccessCode,
      label: 'Access Code',
      sortable: true,
      filterable: true,
      render: (value: string, row: AccessCode) => (
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
            {value}
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleCopyCode(value)}
            title="Copy code"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
    {
      key: 'isActive' as keyof AccessCode,
      label: 'Status',
      sortable: true,
      render: (value: boolean, row: AccessCode) => getStatusBadge(row)
    },
    {
      key: 'usageCount' as keyof AccessCode,
      label: 'Usage',
      sortable: true,
      render: (value: number, row: AccessCode) => (
        <span className="text-sm">
          {value} / {row.maxUsage}
        </span>
      )
    },
    {
      key: 'createdAt' as keyof AccessCode,
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(value)}
        </span>
      )
    },
    {
      key: 'expiresAt' as keyof AccessCode,
      label: 'Expires',
      sortable: true,
      render: (value: string) => {
        const expiresAt = new Date(value)
        const now = new Date()
        const isExpired = now > expiresAt

        return (
          <span className={`text-sm ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {formatDate(value)}
          </span>
        )
      }
    }
  ]

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Code copied to clipboard")
    onCopyCode?.(code)
  }

  const handleRevokeCode = (row: AccessCode) => {
    onRevokeCode?.(row.id)
    toast.success("Code revoked successfully")
  }

  const handleViewDetails = (row: AccessCode) => {
    onViewDetails?.(row)
  }

  return (
    <AdvancedDataTable
      data={data}
      columns={columns}
      loading={loading}
      title={title}
      description={description}
      searchable={true}
      filterable={true}
      exportable={true}
      selectable={true}
      actions={{
        view: handleViewDetails,
        delete: handleRevokeCode
      }}
      bulkActions={[
        {
          label: "Revoke Selected",
          action: (selectedRows) => {
            selectedRows.forEach(row => handleRevokeCode(row))
          },
          icon: Trash2,
          variant: "destructive"
        }
      ]}
      onRefresh={onRefresh}
      emptyState={{
        title: "No access codes found",
        description: "Create your first access code to get started.",
        icon: Key
      }}
    />
  )
}


