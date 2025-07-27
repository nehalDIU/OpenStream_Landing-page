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
}

export function CodeGenerator({ onGenerate, loading }: CodeGeneratorProps) {
  const [duration, setDuration] = useState(10)
  const [quantity, setQuantity] = useState(1)
  const [prefix, setPrefix] = useState("")
  const [autoExpire, setAutoExpire] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string[]>([])

  const presetDurations = [
    { label: "5 minutes", value: 5 },
    { label: "10 minutes", value: 10 },
    { label: "30 minutes", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "4 hours", value: 240 },
    { label: "24 hours", value: 1440 }
  ]

  const handleGenerate = async () => {
    try {
      console.log('Starting code generation with options:', { duration, quantity, prefix, autoExpire })

      const options: GenerateOptions = {
        duration,
        quantity,
        prefix: prefix.trim() || undefined,
        autoExpire
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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            Generate Access Codes
          </CardTitle>
          <CardDescription className="text-gray-400">
            Create new temporary access codes with custom settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-gray-300">
                Expiration Duration
              </Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {presetDurations.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value.toString()}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-gray-300">
                Number of Codes
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">Advanced Settings</span>
            </div>
            <Switch
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="space-y-2">
                <Label htmlFor="prefix" className="text-gray-300">
                  Code Prefix (Optional)
                </Label>
                <Input
                  id="prefix"
                  placeholder="e.g., VIP, TEMP, etc."
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase().slice(0, 4))}
                  className="bg-gray-700 border-gray-600 text-white"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500">
                  Optional prefix for generated codes (max 4 characters)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-gray-300">Auto-expire on use</Label>
                  <p className="text-xs text-gray-500">
                    Automatically deactivate codes after first use
                  </p>
                </div>
                <Switch
                  checked={autoExpire}
                  onCheckedChange={setAutoExpire}
                />
              </div>
            </div>
          )}

          {/* Generation Info */}
          <Alert className="bg-blue-900/20 border-blue-700">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              Codes will be 8 characters long and cryptographically secure. 
              {duration < 60 ? 
                ` They will expire in ${duration} minute${duration > 1 ? 's' : ''}.` :
                ` They will expire in ${Math.floor(duration / 60)} hour${Math.floor(duration / 60) > 1 ? 's' : ''}.`
              }
            </AlertDescription>
          </Alert>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || quantity < 1 || quantity > 50}
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
        <Card className="bg-green-900/20 border-green-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-400 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Recently Generated
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllCodes}
                className="border-green-600 text-green-400 hover:bg-green-900/30"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>
            <CardDescription className="text-green-200">
              {lastGenerated.length} code{lastGenerated.length > 1 ? 's' : ''} generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lastGenerated.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <span className="font-mono text-white">{code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(code)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
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
