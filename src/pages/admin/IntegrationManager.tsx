import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Plug, 
  Search,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Power
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  mockBrands, 
  mockGlobalIntegrations, 
  mockBrandIntegrations
} from "@/data/mockData";

// Union type for different integration config structures
type IntegrationConfig = 
  | { api_key: string; location_id: string } // GoHighLevel
  | { access_token: string; company_id: string } // LinkedIn
  | { tracking_id: string; domain: string } // Analytics
  | { access_token: string; account_id: string } // Meta Ads
  | Record<string, any>; // Fallback for other configs

interface GlobalIntegration {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  category: 'ai' | 'communication' | 'analytics';
  is_available: boolean;
  is_enabled: boolean;
  setup_complexity: 'easy' | 'medium' | 'complex';
  required_fields: string[];
}

interface BrandConnection {
  is_enabled: boolean;
  config: IntegrationConfig;
  status: 'connected' | 'error' | 'pending';
}

interface BrandIntegration {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  category: 'crm' | 'social' | 'analytics' | 'marketing';
  is_available: boolean;
  setup_complexity: 'easy' | 'medium' | 'complex';
  required_fields: string[];
  brand_connections: {
    [brandId: string]: BrandConnection;
  };
}

const IntegrationManager = () => {
  const [globalIntegrations, setGlobalIntegrations] = useState(mockGlobalIntegrations);
  const [brandIntegrations, setBrandIntegrations] = useState<BrandIntegration[]>(mockBrandIntegrations as BrandIntegration[]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("global");

  const filteredGlobalIntegrations = globalIntegrations.filter(integration => 
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBrandIntegrations = brandIntegrations.filter(integration => 
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleGlobalIntegration = (id: string) => {
    setGlobalIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, is_enabled: !integration.is_enabled }
          : integration
      )
    );
  };

  const toggleBrandIntegration = (integrationId: string, brandId: string) => {
    setBrandIntegrations(prev => 
      prev.map(integration => {
        if (integration.id === integrationId) {
          const updatedConnections = { ...integration.brand_connections };
          if (updatedConnections[brandId]) {
            updatedConnections[brandId] = {
              ...updatedConnections[brandId],
              is_enabled: !updatedConnections[brandId].is_enabled
            };
          } else {
            // Create default config based on integration type
            const defaultConfig: IntegrationConfig = {};
            updatedConnections[brandId] = { 
              is_enabled: true, 
              config: defaultConfig, 
              status: 'pending' as const
            };
          }
          return { ...integration, brand_connections: updatedConnections };
        }
        return integration;
      })
    );
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'complex': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const openConfigDialog = (integration: any) => {
    setSelectedIntegration(integration);
    setIsConfigDialogOpen(true);
  };

  const getIntegrationStats = () => {
    const globalStats = {
      available: globalIntegrations.filter(i => i.is_available).length,
      enabled: globalIntegrations.filter(i => i.is_enabled).length,
    };
    
    const brandStats = {
      available: brandIntegrations.filter(i => i.is_available).length,
      connected: brandIntegrations.reduce((acc, integration) => {
        const connections = Object.values(integration.brand_connections).filter(conn => conn.is_enabled);
        return acc + connections.length;
      }, 0),
    };

    return { global: globalStats, brand: brandStats };
  };

  const stats = getIntegrationStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Integration Manager</h1>
        <p className="text-muted-foreground">
          Configure and manage system-wide and brand-specific integrations
        </p>
      </div>

      {/* Integration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global">Global Integrations</TabsTrigger>
          <TabsTrigger value="brand">Brand Integrations</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Global Integrations Tab */}
        <TabsContent value="global" className="space-y-6">
          {/* Search */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search global integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Global Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Plug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.global.available}</div>
                <p className="text-xs text-muted-foreground">Global integrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enabled</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.global.enabled}</div>
                <p className="text-xs text-muted-foreground">System-wide enabled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Category</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">AI, Communication, Analytics</div>
              </CardContent>
            </Card>
          </div>

          {/* Global Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGlobalIntegrations.map((integration) => (
              <Card key={integration.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <Badge className={getComplexityColor(integration.setup_complexity)}>
                          {integration.setup_complexity}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={integration.is_enabled}
                      onCheckedChange={() => toggleGlobalIntegration(integration.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>{integration.description}</CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={integration.is_available ? "default" : "secondary"}>
                      {integration.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    <Badge variant={integration.is_enabled ? "default" : "outline"}>
                      {integration.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Required Configuration:</p>
                    <div className="flex flex-wrap gap-1">
                      {integration.required_fields.map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openConfigDialog(integration)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Brand Integrations Tab */}
        <TabsContent value="brand" className="space-y-6">
          {/* Search and Brand Filter */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search brand integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {mockBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Plug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.brand.available}</div>
                <p className="text-xs text-muted-foreground">Brand integrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.brand.connected}</div>
                <p className="text-xs text-muted-foreground">Brand connections</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Category</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">CRM, Social, Analytics</div>
              </CardContent>
            </Card>
          </div>

          {/* Brand Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrandIntegrations.map((integration) => (
              <Card key={integration.id} className="relative">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge className={getComplexityColor(integration.setup_complexity)}>
                        {integration.setup_complexity}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>{integration.description}</CardDescription>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Brand Connections:</p>
                    <div className="space-y-1">
                      {mockBrands.slice(0, 3).map((brand) => {
                        const connection = integration.brand_connections[brand.id];
                        return (
                          <div key={brand.id} className="flex items-center justify-between text-xs">
                            <span>{brand.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={connection?.is_enabled ? "default" : "outline"}
                                className="text-xs"
                              >
                                {connection?.is_enabled ? "Connected" : "Not Connected"}
                              </Badge>
                              <Switch
                                checked={connection?.is_enabled || false}
                                onCheckedChange={() => toggleBrandIntegration(integration.id, brand.id)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openConfigDialog(integration)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Global Integration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Global Integrations</CardTitle>
                <CardDescription>System-wide integrations configured by administrators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {globalIntegrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{integration.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">{integration.category}</p>
                      </div>
                    </div>
                    <Badge variant={integration.is_enabled ? "default" : "secondary"}>
                      {integration.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Brand Integration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Integrations</CardTitle>
                <CardDescription>Brand-specific integrations and their connection status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {brandIntegrations.map((integration) => {
                  const connectedCount = Object.values(integration.brand_connections).filter(conn => conn.is_enabled).length;
                  return (
                    <div key={integration.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{integration.icon}</span>
                        <div>
                          <p className="font-medium text-foreground">{integration.name}</p>
                          <p className="text-sm text-muted-foreground">{integration.category}</p>
                        </div>
                      </div>
                      <Badge variant={connectedCount > 0 ? "default" : "secondary"}>
                        {connectedCount} Connected
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              Set up the integration configuration and manage settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input id="api-key" placeholder="Enter API key" type="password" />
              </div>
              <div>
                <Label htmlFor="settings">Additional Settings</Label>
                <Textarea id="settings" placeholder="Enter additional configuration settings" />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsConfigDialogOpen(false)}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationManager;