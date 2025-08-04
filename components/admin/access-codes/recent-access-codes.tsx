"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  Search,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ExternalLink,
  Edit,
  Share,
  Download,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AccessCode {
  code: string
  expiresAt: string
  createdAt: string
  usedAt?: string
  usedBy?: string
  prefix?: string
  auto_expire_on_use?: boolean
  max_uses?: number
  current_uses?: number
}

interface RecentAccessCodesProps {
  codes: AccessCode[]
  loading?: boolean
  onCopyCode: (code: string) => void
  onRevokeCode: (code: string) => Promise<void>
  onRefresh: () => void
}

export function RecentAccessCodes({
  codes,
  loading = false,
  onCopyCode,
  onRevokeCode,
  onRefresh
}: RecentAccessCodesProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof AccessCode>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [showExpired, setShowExpired] = useState(false)
  const [hiddenCodes, setHiddenCodes] = useState<Set<string>>(new Set())
  const [codeToRevoke, setCodeToRevoke] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  // Filter and sort codes
  const filteredCodes = codes
    .filter(code => {
      const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           code.prefix?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           code.usedBy?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const isExpired = new Date(code.expiresAt) < new Date()
      const showCode = showExpired || !isExpired
      
      return matchesSearch && showCode
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return 1
      if (bValue === undefined) return -1
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortDirection === "asc" ? comparison : -comparison
    })
    .slice(0, 10) // Show only recent 10 codes

  const handleSort = (field: keyof AccessCode) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleCopyCode = (code: string) => {
    onCopyCode(code)
    toast.success("Code copied to clipboard")
  }

  const handleRevokeCode = async (code: string) => {
    setActionLoading(code)
    try {
      await onRevokeCode(code)
      toast.success("Code revoked successfully")
      setCodeToRevoke(null)
    } catch (error) {
      toast.error("Failed to revoke code")
    } finally {
      setActionLoading(null)
    }
  }

  const confirmRevokeCode = async () => {
    if (codeToRevoke) {
      await handleRevokeCode(codeToRevoke)
    }
  }

  const handleViewDetails = (code: AccessCode) => {
    const details = `
Code: ${code.code}
${code.prefix ? `Prefix: ${code.prefix}` : ''}
Created: ${new Date(code.createdAt).toLocaleString()}
Expires: ${new Date(code.expiresAt).toLocaleString()}
${code.usedAt ? `Used: ${new Date(code.usedAt).toLocaleString()}` : 'Status: Unused'}
${code.usedBy ? `Used by: ${code.usedBy}` : ''}
${code.max_uses ? `Usage: ${code.current_uses || 0}/${code.max_uses}` : 'Usage: Unlimited'}
Auto-expire on use: ${code.auto_expire_on_use ? 'Yes' : 'No'}
    `.trim()

    navigator.clipboard.writeText(details)
    toast.success("Code details copied to clipboard")
  }

  const handleShareCode = (code: string) => {
    const shareUrl = `${window.location.origin}/access?code=${code}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("Access URL copied to clipboard")
  }

  const handleDownloadCode = (code: AccessCode) => {
    const data = {
      code: code.code,
      prefix: code.prefix,
      createdAt: code.createdAt,
      expiresAt: code.expiresAt,
      usedAt: code.usedAt,
      usedBy: code.usedBy,
      maxUses: code.max_uses,
      currentUses: code.current_uses,
      autoExpireOnUse: code.auto_expire_on_use
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `access-code-${code.code}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Code data downloaded")
  }

  const handleExtendExpiry = async (code: string) => {
    try {
      // This would typically call an API to extend the code
      toast.info("Extend expiry functionality would be implemented here")
    } catch (error) {
      toast.error("Failed to extend code expiry")
    }
  }

  const handleMarkAsUsed = async (code: string) => {
    try {
      // This would typically call an API to mark the code as used
      toast.info("Mark as used functionality would be implemented here")
    } catch (error) {
      toast.error("Failed to mark code as used")
    }
  }

  const toggleCodeVisibility = (code: string) => {
    const newHidden = new Set(hiddenCodes)
    if (newHidden.has(code)) {
      newHidden.delete(code)
    } else {
      newHidden.add(code)
    }
    setHiddenCodes(newHidden)
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return "Expired"
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  const getStatusBadge = (code: AccessCode) => {
    const now = new Date()
    const expires = new Date(code.expiresAt)
    
    if (code.usedAt) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Used</Badge>
    }
    
    if (expires < now) {
      return <Badge variant="destructive">Expired</Badge>
    }
    
    const timeLeft = expires.getTime() - now.getTime()
    const minutesLeft = timeLeft / (1000 * 60)
    
    if (minutesLeft <= 5) {
      return <Badge variant="destructive" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Expiring Soon</Badge>
    }
    
    return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
  }

  const displayCode = (code: string) => {
    if (hiddenCodes.has(code)) {
      return "••••••••"
    }
    return code
  }

  return (
    <Card className="theme-bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Recent Access Codes
              <Badge variant="secondary" className="ml-2">
                {filteredCodes.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Latest generated access codes with real-time status
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowExpired(!showExpired)}>
                  {showExpired ? "Hide" : "Show"} Expired Codes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search codes, prefixes, or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-4 bg-gray-300 rounded w-12"></div>
              </div>
            ))}
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No access codes found</p>
            <p className="text-sm mt-1">Generate some codes to see them here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center gap-2">
                      Code
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => (
                  <TableRow key={code.code} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {code.prefix && (
                            <span className="text-blue-600 dark:text-blue-400">{code.prefix}</span>
                          )}
                          {displayCode(code.code)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCodeVisibility(code.code)}
                          className="h-6 w-6 p-0"
                        >
                          {hiddenCodes.has(code.code) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(code)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(code.createdAt).toLocaleDateString()} {new Date(code.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-sm",
                        new Date(code.expiresAt) < new Date() ? "text-red-500" : "text-gray-600 dark:text-gray-400"
                      )}>
                        {formatTimeRemaining(code.expiresAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {code.max_uses ? (
                        <span className="text-sm">
                          {code.current_uses || 0}/{code.max_uses}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Unlimited</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <DropdownMenu>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  disabled={actionLoading === code.code}
                                >
                                  {actionLoading === code.code ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleCopyCode(code.code)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareCode(code.code)}>
                            <Share className="h-4 w-4 mr-2" />
                            Copy Access URL
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(code)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadCode(code)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Data
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!code.usedAt && new Date(code.expiresAt) > new Date() && (
                            <>
                              <DropdownMenuItem onClick={() => handleExtendExpiry(code.code)}>
                                <Clock className="h-4 w-4 mr-2" />
                                Extend Expiry
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMarkAsUsed(code.code)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Used
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => setCodeToRevoke(code.code)}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke Code
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                          </DropdownMenu>
                          <TooltipContent>
                            <p>More actions for this code</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!codeToRevoke} onOpenChange={() => setCodeToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this access code? This action cannot be undone and the code will immediately become invalid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeCode}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Revoke Code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
