"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/contexts/theme-context"
import { toast } from "sonner"
import {
  Settings,
  Shield,
  Clock,
  Database,
  Bell,
  Key,
  Users,
  Server,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Lock,
  Globe,
  Mail,
  Smartphone
} from "lucide-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SystemSettings {
  // Security Settings
  maxCodeDuration: number
  defaultCodeDuration: number
  maxUsesPerCode: number
  requireIPValidation: boolean
  enableRateLimit: boolean
  rateLimitPerHour: number
  
  // System Settings
  autoCleanupEnabled: boolean
  cleanupIntervalHours: number
  maxStoredLogs: number
  enableRealTimeUpdates: boolean
  
  // Notification Settings
  enableEmailNotifications: boolean
  enableSlackNotifications: boolean
  notificationThreshold: number
  
  // API Settings
  enableAPIAccess: boolean
  apiRateLimit: number
  requireAPIKey: boolean
}

export default function SettingsPage() {
  const [adminToken, setAdminToken] = useState("")
  const [settings, setSettings] = useState<SystemSettings>({
    maxCodeDuration: 1440, // 24 hours
    defaultCodeDuration: 10,
    maxUsesPerCode: 50,
    requireIPValidation: false,
    enableRateLimit: true,
    rateLimitPerHour: 100,
    autoCleanupEnabled: true,
    cleanupIntervalHours: 1,
    maxStoredLogs: 10000,
    enableRealTimeUpdates: true,
    enableEmailNotifications: false,
    enableSlackNotifications: false,
    notificationThreshold: 10,
    enableAPIAccess: true,
    apiRateLimit: 1000,
    requireAPIKey: true
  })
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { resolvedTheme } = useTheme()

  // Get admin token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('admin-token')
    if (savedToken) {
      setAdminToken(savedToken)
      loadSettings()
    }
  }, [])

  const loadSettings = async () => {
    // In a real app, this would load from the backend
    // For now, we'll use localStorage
    const savedSettings = localStorage.getItem('admin-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      // In a real app, this would save to the backend
      localStorage.setItem('admin-settings', JSON.stringify(settings))
      setHasChanges(false)
      toast.success("Settings saved successfully")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const resetSettings = () => {
    setSettings({
      maxCodeDuration: 1440,
      defaultCodeDuration: 10,
      maxUsesPerCode: 50,
      requireIPValidation: false,
      enableRateLimit: true,
      rateLimitPerHour: 100,
      autoCleanupEnabled: true,
      cleanupIntervalHours: 1,
      maxStoredLogs: 10000,
      enableRealTimeUpdates: true,
      enableEmailNotifications: false,
      enableSlackNotifications: false,
      notificationThreshold: 10,
      enableAPIAccess: true,
      apiRateLimit: 1000,
      requireAPIKey: true
    })
    setHasChanges(true)
    toast.info("Settings reset to defaults")
  }

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-700 rounded-lg flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold theme-text-primary">System Settings</h1>
            <p className="text-sm theme-text-secondary">
              Configure system behavior and security settings
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button
            onClick={resetSettings}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={saveSettings}
            disabled={loading || !hasChanges}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="theme-bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Access Code Security
              </CardTitle>
              <CardDescription>
                Configure security settings for access code generation and validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxDuration">Maximum Code Duration (minutes)</Label>
                  <Input
                    id="maxDuration"
                    type="number"
                    value={settings.maxCodeDuration}
                    onChange={(e) => updateSetting('maxCodeDuration', parseInt(e.target.value))}
                    min="1"
                    max="10080"
                  />
                  <p className="text-xs theme-text-secondary">
                    Maximum time a code can remain valid (1-10080 minutes)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultDuration">Default Code Duration (minutes)</Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    value={settings.defaultCodeDuration}
                    onChange={(e) => updateSetting('defaultCodeDuration', parseInt(e.target.value))}
                    min="1"
                    max={settings.maxCodeDuration}
                  />
                  <p className="text-xs theme-text-secondary">
                    Default expiration time for new codes
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Maximum Uses Per Code</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={settings.maxUsesPerCode}
                    onChange={(e) => updateSetting('maxUsesPerCode', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                  <p className="text-xs theme-text-secondary">
                    Maximum number of times a code can be used
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (per hour)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={settings.rateLimitPerHour}
                    onChange={(e) => updateSetting('rateLimitPerHour', parseInt(e.target.value))}
                    min="1"
                    max="10000"
                    disabled={!settings.enableRateLimit}
                  />
                  <p className="text-xs theme-text-secondary">
                    Maximum requests per IP per hour
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Address Validation</Label>
                    <p className="text-sm theme-text-secondary">
                      Require codes to be used from the same IP that requested them
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireIPValidation}
                    onCheckedChange={(checked) => updateSetting('requireIPValidation', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Rate Limiting</Label>
                    <p className="text-sm theme-text-secondary">
                      Limit the number of requests per IP address
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableRateLimit}
                    onCheckedChange={(checked) => updateSetting('enableRateLimit', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card className="theme-bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure system behavior and maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cleanupInterval">Cleanup Interval (hours)</Label>
                  <Input
                    id="cleanupInterval"
                    type="number"
                    value={settings.cleanupIntervalHours}
                    onChange={(e) => updateSetting('cleanupIntervalHours', parseInt(e.target.value))}
                    min="1"
                    max="168"
                    disabled={!settings.autoCleanupEnabled}
                  />
                  <p className="text-xs theme-text-secondary">
                    How often to clean up expired codes
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLogs">Maximum Stored Logs</Label>
                  <Input
                    id="maxLogs"
                    type="number"
                    value={settings.maxStoredLogs}
                    onChange={(e) => updateSetting('maxStoredLogs', parseInt(e.target.value))}
                    min="100"
                    max="100000"
                  />
                  <p className="text-xs theme-text-secondary">
                    Maximum number of activity logs to keep
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Cleanup</Label>
                    <p className="text-sm theme-text-secondary">
                      Automatically remove expired codes and old logs
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoCleanupEnabled}
                    onCheckedChange={(checked) => updateSetting('autoCleanupEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-time Updates</Label>
                    <p className="text-sm theme-text-secondary">
                      Enable real-time dashboard updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableRealTimeUpdates}
                    onCheckedChange={(checked) => updateSetting('enableRealTimeUpdates', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="theme-bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure alerts and notifications for system events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="threshold">Notification Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={settings.notificationThreshold}
                  onChange={(e) => updateSetting('notificationThreshold', parseInt(e.target.value))}
                  min="1"
                  max="1000"
                />
                <p className="text-xs theme-text-secondary">
                  Send notifications when this many events occur within an hour
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </Label>
                    <p className="text-sm theme-text-secondary">
                      Send email alerts for important events
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableEmailNotifications}
                    onCheckedChange={(checked) => updateSetting('enableEmailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Slack Notifications
                    </Label>
                    <p className="text-sm theme-text-secondary">
                      Send notifications to Slack channels
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableSlackNotifications}
                    onCheckedChange={(checked) => updateSetting('enableSlackNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card className="theme-bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure API access and rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="apiRateLimit">API Rate Limit (per hour)</Label>
                <Input
                  id="apiRateLimit"
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => updateSetting('apiRateLimit', parseInt(e.target.value))}
                  min="1"
                  max="100000"
                  disabled={!settings.enableAPIAccess}
                />
                <p className="text-xs theme-text-secondary">
                  Maximum API requests per key per hour
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable API Access</Label>
                    <p className="text-sm theme-text-secondary">
                      Allow external applications to access the API
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableAPIAccess}
                    onCheckedChange={(checked) => updateSetting('enableAPIAccess', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require API Keys</Label>
                    <p className="text-sm theme-text-secondary">
                      Require valid API keys for all requests
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireAPIKey}
                    onCheckedChange={(checked) => updateSetting('requireAPIKey', checked)}
                    disabled={!settings.enableAPIAccess}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
