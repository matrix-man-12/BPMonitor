import { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  Palette, 
  Download, 
  Shield, 
  Globe,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

export default function Settings() {
  const { user } = useAuth()
  const { theme, setTheme, actualTheme } = useTheme()
  const [language, setLanguage] = useState('en')
  const [autoBackup, setAutoBackup] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // TODO: Implement data export API call
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      // For now, create a mock JSON file
      const userData = {
        profile: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          exportDate: new Date().toISOString()
        },
        settings: {
          theme,
          language,
          autoBackup
        },
        note: "BP readings data would be included in actual implementation"
      }
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bp-monitor-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }



  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences and account settings</p>
        </div>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the app looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose your preferred color scheme. System will follow your device settings.
              {theme === 'system' && (
                <span className="block mt-1 text-xs">
                  Currently using: <span className="font-medium capitalize">{actualTheme}</span> mode
                </span>
              )}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    English
                  </div>
                </SelectItem>
                <SelectItem value="es" disabled>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Español (Coming Soon)
                  </div>
                </SelectItem>
                <SelectItem value="fr" disabled>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Français (Coming Soon)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Data & Privacy
          </CardTitle>
          <CardDescription>
            Manage your data and privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Automatic Backup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup your data to the cloud daily
              </p>
            </div>
            <Switch
              checked={autoBackup}
              onCheckedChange={setAutoBackup}
              className="cursor-pointer"
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h4 className="text-base font-medium mb-2">Export Your Data</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Download a copy of all your data including BP readings, profile information, and settings.
              </p>
              <Button 
                onClick={handleExportData} 
                disabled={isExporting}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your data is stored securely and never shared with third parties. 
                You have full control over your information.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}