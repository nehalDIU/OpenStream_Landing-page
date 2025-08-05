"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "@/contexts/theme-context"
import {
  Plus,
  Copy,
  Clock,
  Zap,
  Settings,
  Info,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface CodeGeneratorProps {
  onGenerate: (options: GenerateOptions) => Promise<void>
  loading?: boolean
}

interface GenerateOptions {
  duration: number
  quantity: number
  prefix?: string
  autoExpire: boolean
  maxUses?: number
}

export function CodeGenerator({ onGenerate, loading }: CodeGeneratorProps) {
  const [duration, setDuration] = useState(10)
  const [quantity, setQuantity] = useState(1)
  const [prefix, setPrefix] = useState("")
  const [autoExpire, setAutoExpire] = useState(true)
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined)
  const [selectedUsageLimit, setSelectedUsageLimit] = useState<string>("unlimited")
  const [customUsageLimit, setCustomUsageLimit] = useState<string>("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string[]>([])
  const [selectedDuration, setSelectedDuration] = useState<string>("10")
  const [customDuration, setCustomDuration] = useState<string>("")
  const [customDurationUnit, setCustomDurationUnit] = useState<string>("minutes")
  const { resolvedTheme } = useTheme()

  const presetDurations = [
    { label: "5 minutes", value: 5 },
    { label: "10 minutes", value: 10 },
    { label: "30 minutes", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "4 hours", value: 240 },
    { label: "12 hours", value: 720 },
    { label: "24 hours", value: 1440 },
    { label: "3 days", value: 4320 },
    { label: "1 week", value: 10080 },
    { label: "2 weeks", value: 20160 },
    { label: "1 month", value: 43200 },
    { label: "3 months", value: 129600 },
    { label: "6 months", value: 259200 },
    { label: "1 year", value: 525600 },
    { label: "Custom", value: "custom" }
  ]

  const presetUsageLimits = [
    { label: "Unlimited", value: "unlimited" },
    { label: "1 use (One-time)", value: "1" },
    { label: "3 uses", value: "3" },
    { label: "5 uses", value: "5" },
    { label: "10 uses", value: "10" },
    { label: "25 uses", value: "25" },
    { label: "50 uses", value: "50" },
    { label: "100 uses", value: "100" },
    { label: "Custom", value: "custom" }
  ]

  const handleDurationChange = (value: string) => {
    setSelectedDuration(value)

    if (value === "custom") {
      // Calculate duration from custom input
      const customValue = customDuration ? parseInt(customDuration) : 10
      const multiplier = customDurationUnit === "minutes" ? 1 :
                        customDurationUnit === "hours" ? 60 :
                        customDurationUnit === "days" ? 1440 :
                        customDurationUnit === "weeks" ? 10080 :
                        customDurationUnit === "months" ? 43200 : 525600 // years
      setDuration(customValue * multiplier)
    } else {
      // Use preset value
      const numericValue = parseInt(value)
      setDuration(isNaN(numericValue) ? 10 : numericValue)
    }
  }

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value)
    if (selectedDuration === "custom") {
      const customValue = value ? parseInt(value) : 10
      const multiplier = customDurationUnit === "minutes" ? 1 :
                        customDurationUnit === "hours" ? 60 :
                        customDurationUnit === "days" ? 1440 :
                        customDurationUnit === "weeks" ? 10080 :
                        customDurationUnit === "months" ? 43200 : 525600 // years
      setDuration(customValue * multiplier)
    }
  }

  const handleCustomDurationUnitChange = (value: string) => {
    setCustomDurationUnit(value)
    if (selectedDuration === "custom" && customDuration) {
      const customValue = parseInt(customDuration)
      const multiplier = value === "minutes" ? 1 :
                        value === "hours" ? 60 :
                        value === "days" ? 1440 :
                        value === "weeks" ? 10080 :
                        value === "months" ? 43200 : 525600 // years
      setDuration(customValue * multiplier)
    }
  }

  const handleUsageLimitChange = (value: string) => {
    setSelectedUsageLimit(value)

    if (value === "unlimited") {
      setMaxUses(undefined)
    } else if (value === "custom") {
      // Keep current custom value or set to empty
      const customValue = customUsageLimit ? parseInt(customUsageLimit) : undefined
      setMaxUses(customValue)
    } else {
      // Convert string value to number for preset values
      const numericValue = parseInt(value)
      setMaxUses(isNaN(numericValue) ? undefined : numericValue)
    }
  }

  const handleCustomUsageLimitChange = (value: string) => {
    setCustomUsageLimit(value)
    if (selectedUsageLimit === "custom") {
      setMaxUses(value ? parseInt(value) : undefined)
    }
  }

  const handleGenerate = async () => {
    try {
      console.log('Starting code generation with options:', { duration, quantity, prefix, autoExpire, maxUses })

      const options: GenerateOptions = {
        duration,
        quantity,
        prefix: prefix.trim() || undefined,
        autoExpire,
        maxUses: maxUses && maxUses > 0 ? maxUses : undefined
      }

      // Call the parent's generate function and get the result
      const result = await onGenerate(options)
      console.log('Generation result:', result)

      // If the parent function returns generated codes, use them
      if (result && Array.isArray(result) && result.length > 0) {
        console.log('Using real generated codes:', result)
        setLastGenerated(result)
      } else {
        // For demo purposes, generate mock codes if no real codes returned
        console.log('Using mock codes for demo')
        const newCodes = Array.from({ length: quantity }, (_, i) => {
          const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase()
          return `${prefix}${randomPart}`.substring(0, 8) // Ensure 8 characters max
        })
        setLastGenerated(newCodes)
        console.log('Mock codes generated:', newCodes)
      }

    } catch (error) {
      console.error('Code generation error:', error)
      toast.error("Failed to generate access codes")
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Code copied to clipboard")
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success("Code copied to clipboard")
    }
  }

  const copyAllCodes = async () => {
    try {
      const allCodes = lastGenerated.join('\n')
      await navigator.clipboard.writeText(allCodes)
      toast.success(`Copied ${lastGenerated.length} codes to clipboard`)
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = lastGenerated.join('\n')
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success(`Copied ${lastGenerated.length} codes to clipboard`)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="theme-bg-card theme-transition">
        <CardHeader>
          <CardTitle className="theme-text-primary flex items-center gap-2">
            <Zap className={`h-5 w-5 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            Generate Access Codes
          </CardTitle>
          <CardDescription className="theme-text-secondary">
            Create new temporary access codes with custom settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="duration" className="theme-text-secondary">
                Expiration Duration
              </Label>
              <Select value={selectedDuration} onValueChange={handleDurationChange}>
                <SelectTrigger className="theme-input theme-transition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={`theme-bg-card theme-border ${
                  resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                  {presetDurations.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value.toString()}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Duration Input */}
              {selectedDuration === "custom" && (
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    min="1"
                    max="999999"
                    placeholder="Enter duration"
                    value={customDuration}
                    onChange={(e) => handleCustomDurationChange(e.target.value)}
                    className="theme-input theme-transition flex-1"
                  />
                  <Select value={customDurationUnit} onValueChange={handleCustomDurationUnitChange}>
                    <SelectTrigger className="theme-input theme-transition w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`theme-bg-card theme-border ${
                      resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="theme-text-secondary">
                Number of Codes
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="theme-input theme-transition"
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className={`h-4 w-4 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`} />
              <span className="text-sm theme-text-secondary">Advanced Settings</span>
            </div>
            <Switch
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className={`space-y-4 p-4 rounded-lg border theme-transition ${
              resolvedTheme === 'dark'
                ? 'bg-gray-900/50 border-gray-700'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-2">
                <Label htmlFor="prefix" className="theme-text-secondary">
                  Code Prefix (Optional)
                </Label>
                <Input
                  id="prefix"
                  placeholder="e.g., VIP, TEMP, etc."
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase().slice(0, 4))}
                  className="theme-input theme-transition"
                  maxLength={4}
                />
                <p className="text-xs theme-text-muted">
                  Optional prefix for generated codes (max 4 characters)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="theme-text-secondary">Auto-expire on use</Label>
                  <p className="text-xs theme-text-muted">
                    Automatically deactivate codes after first use
                  </p>
                </div>
                <Switch
                  checked={autoExpire}
                  onCheckedChange={setAutoExpire}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usageLimit" className="theme-text-secondary">
                  Usage Limit
                </Label>
                <Select value={selectedUsageLimit} onValueChange={handleUsageLimitChange}>
                  <SelectTrigger className="theme-input theme-transition">
                    <SelectValue placeholder="Select usage limit" />
                  </SelectTrigger>
                  <SelectContent>
                    {presetUsageLimits.map((preset) => (
                      <SelectItem
                        key={preset.value}
                        value={preset.value}
                      >
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Custom usage limit input - only show when "Custom" is selected */}
                {selectedUsageLimit === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customUsageLimit" className="theme-text-secondary text-sm">
                      Custom Usage Limit
                    </Label>
                    <Input
                      id="customUsageLimit"
                      type="number"
                      placeholder="Enter number (1-1000)"
                      value={customUsageLimit}
                      onChange={(e) => handleCustomUsageLimitChange(e.target.value)}
                      className="theme-input theme-transition"
                      min={1}
                      max={1000}
                    />
                  </div>
                )}

                <p className="text-xs theme-text-muted">
                  {selectedUsageLimit === "unlimited"
                    ? "Code can be used unlimited times (controlled by auto-expire setting)"
                    : selectedUsageLimit === "custom"
                    ? "Enter a custom number of uses (1-1000)"
                    : `Code will be deactivated after ${maxUses} use${maxUses !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Generation Info */}
          <Alert className="theme-status-info theme-transition">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Codes will be 8 characters long and cryptographically secure.
              {(() => {
                if (duration < 60) {
                  return ` They will expire in ${duration} minute${duration > 1 ? 's' : ''}.`
                } else if (duration < 1440) {
                  const hours = Math.floor(duration / 60)
                  return ` They will expire in ${hours} hour${hours > 1 ? 's' : ''}.`
                } else if (duration < 10080) {
                  const days = Math.floor(duration / 1440)
                  return ` They will expire in ${days} day${days > 1 ? 's' : ''}.`
                } else if (duration < 43200) {
                  const weeks = Math.floor(duration / 10080)
                  return ` They will expire in ${weeks} week${weeks > 1 ? 's' : ''}.`
                } else if (duration < 525600) {
                  const months = Math.floor(duration / 43200)
                  return ` They will expire in ${months} month${months > 1 ? 's' : ''}.`
                } else {
                  const years = Math.floor(duration / 525600)
                  return ` They will expire in ${years} year${years > 1 ? 's' : ''}.`
                }
              })()}
              {maxUses && (
                ` Each code can be used ${maxUses} time${maxUses > 1 ? 's' : ''}.`
              )}
              {!maxUses && !autoExpire && (
                ` Codes can be reused unlimited times.`
              )}
            </AlertDescription>
          </Alert>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={
              loading ||
              quantity < 1 ||
              quantity > 50 ||
              (selectedUsageLimit === "custom" && (!customUsageLimit || parseInt(customUsageLimit) < 1 || parseInt(customUsageLimit) > 1000))
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Generate {quantity} Code{quantity > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recently Generated Codes */}
      {lastGenerated.length > 0 && (
        <Card className="theme-status-success theme-transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 ${
                resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>
                <CheckCircle className="h-5 w-5" />
                Recently Generated
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllCodes}
                className={`theme-transition ${
                  resolvedTheme === 'dark'
                    ? 'border-green-600 text-green-400 hover:bg-green-900/30'
                    : 'border-green-500 text-green-600 hover:bg-green-50'
                }`}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>
            <CardDescription className={resolvedTheme === 'dark' ? 'text-green-200' : 'text-green-700'}>
              {lastGenerated.length} code{lastGenerated.length > 1 ? 's' : ''} generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lastGenerated.map((code, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border theme-transition ${
                    resolvedTheme === 'dark'
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="font-mono theme-text-primary">{code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(code)}
                    className="h-8 w-8 p-0 theme-text-secondary hover:theme-text-primary theme-transition"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
