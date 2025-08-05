"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  Plus,
  Zap,
  Clock,
  Users,
  Calendar,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Trash2
} from "lucide-react"

interface QuickActionsProps {
  onGenerateCode: (options: any) => Promise<any>
  onRefresh: () => void
  loading?: boolean
}

export function QuickActions({
  onGenerateCode,
  onRefresh,
  loading = false
}: QuickActionsProps) {
  const [quickGenOptions, setQuickGenOptions] = useState({
    duration: 10,
    prefix: "",
    quantity: 1,
    autoExpire: true
  })
  const [generating, setGenerating] = useState(false)
  const { resolvedTheme } = useTheme()

  const handleQuickGenerate = async (preset?: string) => {
    setGenerating(true)
    try {
      let options = { ...quickGenOptions }
      
      // Apply presets
      switch (preset) {
        case 'quick':
          options = { duration: 5, prefix: "Q", quantity: 1, autoExpire: true }
          break
        case 'standard':
          options = { duration: 10, prefix: "", quantity: 1, autoExpire: true }
          break
        case 'extended':
          options = { duration: 1440, prefix: "EXT", quantity: 1, autoExpire: false } // 24 hours
          break
        case 'long-term':
          options = { duration: 10080, prefix: "LT", quantity: 1, autoExpire: false } // 1 week
          break
        case 'bulk':
          options = { duration: 30, prefix: "BULK", quantity: 5, autoExpire: true }
          break
      }
      
      const result = await onGenerateCode(options)
      
      if (preset) {
        toast.success(`${preset.charAt(0).toUpperCase() + preset.slice(1)} code(s) generated successfully`)
      } else {
        toast.success("Custom code generated successfully")
      }
    } catch (error) {
      toast.error("Failed to generate code")
    } finally {
      setGenerating(false)
    }
  }

  const quickActions = [
    {
      id: 'quick',
      title: 'Quick Code',
      description: '5-minute code',
      icon: Zap,
      color: 'from-blue-500 to-blue-600',
      action: () => handleQuickGenerate('quick')
    },
    {
      id: 'standard',
      title: 'Standard Code',
      description: '10-minute code',
      icon: Clock,
      color: 'from-green-500 to-green-600',
      action: () => handleQuickGenerate('standard')
    },
    {
      id: 'extended',
      title: 'Extended Code',
      description: '24-hour reusable',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      action: () => handleQuickGenerate('extended')
    },
    {
      id: 'long-term',
      title: 'Long-term Code',
      description: '1-week reusable',
      icon: Calendar,
      color: 'from-indigo-500 to-indigo-600',
      action: () => handleQuickGenerate('long-term')
    },
    {
      id: 'bulk',
      title: 'Bulk Generate',
      description: '5 codes at once',
      icon: Plus,
      color: 'from-orange-500 to-orange-600',
      action: () => handleQuickGenerate('bulk')
    }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Quick Action Buttons */}
      <div className="lg:col-span-2">
        <Card className="theme-bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Generate access codes with predefined settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.id}
                    onClick={action.action}
                    disabled={loading || generating}
                    className={`h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-r ${action.color} hover:opacity-90 text-white border-0`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="text-center">
                      <div className="text-sm font-medium">{action.title}</div>
                      <div className="text-xs opacity-90">{action.description}</div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Generator */}
      <div className="lg:col-span-1">
        <Card className="theme-bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Custom Generator
            </CardTitle>
            <CardDescription>
              Create codes with custom settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={quickGenOptions.duration.toString()}
                onValueChange={(value) => setQuickGenOptions(prev => ({ ...prev, duration: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="1440">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix (optional)</Label>
              <Input
                id="prefix"
                placeholder="e.g., VIP, TEST"
                value={quickGenOptions.prefix}
                onChange={(e) => setQuickGenOptions(prev => ({ ...prev, prefix: e.target.value.slice(0, 4) }))}
                maxLength={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Select
                value={quickGenOptions.quantity.toString()}
                onValueChange={(value) => setQuickGenOptions(prev => ({ ...prev, quantity: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 code</SelectItem>
                  <SelectItem value="3">3 codes</SelectItem>
                  <SelectItem value="5">5 codes</SelectItem>
                  <SelectItem value="10">10 codes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-expire">Auto-expire on use</Label>
              <Switch
                id="auto-expire"
                checked={quickGenOptions.autoExpire}
                onCheckedChange={(checked) => setQuickGenOptions(prev => ({ ...prev, autoExpire: checked }))}
              />
            </div>

            <Button
              onClick={() => handleQuickGenerate()}
              disabled={loading || generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Custom
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
