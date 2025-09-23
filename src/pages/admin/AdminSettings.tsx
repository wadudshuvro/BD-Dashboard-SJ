import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  Shield,
  Bell,
  Database,
  Mail,
  Smartphone,
  Globe,
  Key,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { mockSystemSettings, SystemSetting } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>(mockSystemSettings);
  const { toast } = useToast();

  const updateSetting = (id: string, value: string | boolean | number) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, value } : setting
    ));
    toast({
      title: "Setting Updated",
      description: "The setting has been saved successfully.",
    });
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.id}
              checked={setting.value as boolean}
              onCheckedChange={(checked) => updateSetting(setting.id, checked)}
            />
            <Label htmlFor={setting.id}>{setting.description}</Label>
          </div>
        );
      
      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.id}>{setting.description}</Label>
            <Select
              value={setting.value as string}
              onValueChange={(value) => updateSetting(setting.id, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {setting.options?.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.id}>{setting.description}</Label>
            <Input
              id={setting.id}
              type="number"
              value={setting.value as number}
              onChange={(e) => updateSetting(setting.id, parseInt(e.target.value))}
            />
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.id}>{setting.description}</Label>
            <Input
              id={setting.id}
              value={setting.value as string}
              onChange={(e) => updateSetting(setting.id, e.target.value)}
              placeholder={setting.key.includes('url') ? 'https://...' : ''}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences for the marketing intelligence platform
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Database className="h-4 w-4 mr-2" />
            Data & Sync
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Download className="h-4 w-4 mr-2" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic company details displayed throughout the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('General').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}
              
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Globe className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 2MB. Recommended: 200x200px
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Features</CardTitle>
              <CardDescription>
                Enable or disable platform-wide features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('Features').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication & Access</CardTitle>
              <CardDescription>
                Configure security policies and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('Security').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}
              
              <div className="space-y-2">
                <Label>Password Policy</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-length">Minimum Length</Label>
                    <Input id="min-length" type="number" defaultValue="8" />
                  </div>
                  <div>
                    <Label htmlFor="password-expiry">Expiry (days)</Label>
                    <Input id="password-expiry" type="number" defaultValue="90" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Security</CardTitle>
              <CardDescription>
                Manage API keys and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Master API Key</p>
                    <p className="text-sm text-muted-foreground">Used for system integrations</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">Active</Badge>
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Rate Limiting</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="requests-per-minute">Requests/min</Label>
                    <Input id="requests-per-minute" type="number" defaultValue="100" />
                  </div>
                  <div>
                    <Label htmlFor="requests-per-hour">Requests/hour</Label>
                    <Input id="requests-per-hour" type="number" defaultValue="1000" />
                  </div>
                  <div>
                    <Label htmlFor="requests-per-day">Requests/day</Label>
                    <Input id="requests-per-day" type="number" defaultValue="10000" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>
                Configure how and when the system sends notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('Notifications').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                SMTP settings for outgoing emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Server</Label>
                  <Input placeholder="smtp.example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" placeholder="587" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input placeholder="notifications@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="use-tls" />
                <Label htmlFor="use-tls">Use TLS encryption</Label>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline">Test Connection</Button>
                <Button>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>
                Configure when to send alerts based on system metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Failed Login Attempts</Label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div className="space-y-2">
                  <Label>API Error Rate (%)</Label>
                  <Input type="number" defaultValue="10" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sync Failure Threshold</Label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label>Storage Usage Warning (%)</Label>
                  <Input type="number" defaultValue="80" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Sync Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Synchronization</CardTitle>
              <CardDescription>
                Configure how often data is synchronized from external sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('Features').filter(s => s.key === 'auto_sync_interval').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}
              
              <div className="space-y-2">
                <Label>Sync Schedule</Label>
                <Select defaultValue="hourly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="15min">Every 15 minutes</SelectItem>
                    <SelectItem value="hourly">Every hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="retry-failed" defaultChecked />
                <Label htmlFor="retry-failed">Automatically retry failed syncs</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
              <CardDescription>
                Configure how long data is stored in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>KPI Data (months)</Label>
                  <Input type="number" defaultValue="24" />
                </div>
                <div className="space-y-2">
                  <Label>Activity Logs (days)</Label>
                  <Input type="number" defaultValue="90" />
                </div>
                <div className="space-y-2">
                  <Label>Error Logs (days)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="auto-cleanup" defaultChecked />
                <Label htmlFor="auto-cleanup">Automatically clean up old data</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Health</CardTitle>
              <CardDescription>
                Monitor the status of external integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Google Analytics', 'HubSpot', 'LinkedIn', 'Facebook'].map((integration, index) => (
                  <div key={integration} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${
                        index < 2 ? 'bg-success' : index < 3 ? 'bg-warning' : 'bg-destructive'
                      }`} />
                      <span className="font-medium">{integration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {index < 2 ? (
                        <Badge variant="outline" className="text-success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Healthy
                        </Badge>
                      ) : index < 3 ? (
                        <Badge variant="outline" className="text-warning">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Warning
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Backups</CardTitle>
              <CardDescription>
                Configure automatic data backups and retention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="auto-backup" defaultChecked />
                <Label htmlFor="auto-backup">Enable automatic backups</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Retention Period</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Backup Location</Label>
                <div className="flex gap-2">
                  <Input placeholder="s3://backup-bucket/marketing-data" className="flex-1" />
                  <Button variant="outline">Test Connection</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Backup & Restore</CardTitle>
              <CardDescription>
                Create manual backups or restore from existing backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup Now
                </Button>
                <Button variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Restore from Backup
                </Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Recent Backups</h4>
                {['2024-12-20 02:00:00', '2024-12-19 02:00:00', '2024-12-18 02:00:00'].map((date, index) => (
                  <div key={date} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">System Backup</p>
                      <p className="text-sm text-muted-foreground">{date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {index === 0 ? '2.3 GB' : index === 1 ? '2.1 GB' : '2.0 GB'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={() => {
          toast({
            title: "Settings Saved",
            description: "All settings have been saved successfully.",
          });
        }}>
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;