import { useState, useEffect } from "react";
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
import { mockBrands } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [globalIntegrations, setGlobalIntegrations] = useState<GlobalIntegration[]>([]);
  const [brandIntegrations, setBrandIntegrations] = useState<BrandIntegration[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("global");
  const [configData, setConfigData] = useState<{apiKey: string; baseUrl?: string; locationId?: string}>({
    apiKey: '',
    baseUrl: '',
    locationId: ''
  });

  // Load integrations on mount
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    // Set up real integrations data
    const globalIntegrationsData: GlobalIntegration[] = [
        {
          id: 'collabai',
          name: 'CollabAI',
          type: 'collab_ai',
          description: 'Collaborative AI platform base URL configuration (users configure their own API keys)',
          icon: '🚀',
          category: 'ai',
          is_available: true,
          is_enabled: false,
          setup_complexity: 'easy',
          required_fields: ['base_url']
        },
        {
          id: 'openai',
          name: 'OpenAI',
          type: 'openai',
          description: 'AI-powered analysis and intelligent automation using GPT models',
          icon: '🤖',
          category: 'ai',
          is_available: true,
          is_enabled: true,
          setup_complexity: 'easy',
          required_fields: ['OPENAI_KEY (secret)']
        }
    ];

    const brandIntegrationsData: BrandIntegration[] = [
      {
        id: 'gohighlevel',
        name: 'GoHighLevel',
        type: 'gohighlevel',
        description: 'CRM and marketing automation platform',
        icon: '🎯',
        category: 'crm',
        is_available: true,
        setup_complexity: 'medium',
        required_fields: ['api_key', 'location_id'],
        brand_connections: {}
      }
    ];

    // Load actual configuration states
    try {
      const { data: collabaiConfig } = await supabase.functions.invoke('collabai-manage', { method: 'GET' });
      if (collabaiConfig?.configured) {
        globalIntegrationsData[0].is_enabled = collabaiConfig.enabled;
      }
    } catch (e) {
      console.error('Failed to load CollabAI config', e);
    }

    try {
      const { data: openaiConfig } = await supabase.functions.invoke('openai-test', { 
        body: { action: 'status' }
      });
      if (openaiConfig?.configured) {
        globalIntegrationsData[1].is_enabled = openaiConfig.enabled;
      }
    } catch (e) {
      console.error('Failed to load OpenAI config', e);
    }

    try {
      const { data: ghlConfig } = await supabase.functions.invoke('gohighlevel-manage', { method: 'GET' });
      if (ghlConfig?.configured) {
        // Mark as connected for current user/brand
        brandIntegrationsData[0].brand_connections['current'] = {
          is_enabled: ghlConfig.enabled,
          config: { location_id: ghlConfig.locationId || '' },
          status: 'connected'
        };
      }
    } catch (e) {
      console.error('Failed to load GoHighLevel config', e);
    }

    setGlobalIntegrations(globalIntegrationsData);
    setBrandIntegrations(brandIntegrationsData);
  };

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

  const testConnection = async (integration: any) => {
    if (integration.id === 'collabai') {
      if (!configData.baseUrl) {
        toast({
          title: 'Missing Configuration',
          description: 'Please enter Base URL before testing.',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Just test if the URL is reachable
        const testUrl = configData.baseUrl.trim().replace(/\/+$/, '');
        const response = await fetch(`${testUrl}/api/health`, { method: 'HEAD' });
        toast({ title: 'URL Configured', description: 'CollabAI base URL saved. Users can now configure their API keys in their profile.' });
      } catch (err: any) {
        toast({
          title: 'URL Saved',
          description: 'Base URL saved for CollabAI. Users can configure their API keys in profile.',
        });
      }
      return;
    }

    if (integration.id === 'openai') {
      try {
        toast({
          title: 'Testing Connection',
          description: 'Testing OpenAI API connectivity...',
        });

        const { data, error } = await supabase.functions.invoke('openai-test', {
          body: { action: 'test' },
        });
        
        if (error) {
          throw error;
        }

        if (!data?.ok) {
          throw new Error(data?.error || 'OpenAI connection test failed');
        }

        const modelsInfo = data.models_available 
          ? ` (${data.models_available} models available${data.has_gpt_models ? ', including GPT models' : ''})`
          : '';

        toast({ 
          title: 'OpenAI Connection Successful', 
          description: `Successfully connected to OpenAI API${modelsInfo}` 
        });

        // Also test text generation
        const { data: genData } = await supabase.functions.invoke('openai-test', {
          body: { action: 'generate_test' },
        });

        if (genData?.ok && genData?.generation_test) {
          toast({
            title: 'OpenAI Generation Test Passed',
            description: `Text generation working. Response: "${genData.test_response}"`,
          });
        }

      } catch (err: any) {
        console.error('OpenAI test error:', err);
        toast({
          title: 'OpenAI Connection Failed',
          description: err.message || 'Failed to connect to OpenAI API. Check your API key in secrets.',
          variant: 'destructive',
        });
      }
      return;
    }

    if (integration.id === 'gohighlevel') {
      if (!configData.apiKey) {
        toast({
          title: 'Missing API Key',
          description: 'Please enter an API key before testing the connection.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('gohighlevel-manage', {
          body: {
            action: 'test',
            apiKey: configData.apiKey,
            locationId: configData.locationId,
          },
        });
        if (error || !data?.ok) throw error || new Error(data?.error || 'Test failed');
        toast({ title: 'Connection Successful', description: 'Successfully connected to GoHighLevel' });
      } catch (err: any) {
        toast({
          title: 'Connection Failed',
          description: err.message || 'Failed to connect to GoHighLevel. Please check your credentials.',
          variant: 'destructive',
        });
      }
      return;
    }
  };

  const saveConfiguration = async (integration: any) => {
    if (integration.id === 'collabai') {
      if (!configData.baseUrl?.trim()) {
        toast({ title: 'Missing field', description: 'Base URL is required.', variant: 'destructive' });
        return;
      }
      try {
        // Save base URL to a global setting (you may want to create a separate table for this)
        const { data, error } = await supabase.functions.invoke('collabai-manage', {
          body: { action: 'save_base_url', baseUrl: configData.baseUrl.trim() },
        });
        if (error || !data?.ok) throw error || new Error(data?.error || 'Save failed');
        toast({ title: 'Settings Saved', description: 'CollabAI base URL configured. Users can now set up their API keys.' });
        setIsConfigDialogOpen(false);
        setConfigData({ apiKey: '', baseUrl: '', locationId: '' });
        loadIntegrations();
      } catch (e: any) {
        toast({ title: 'Save failed', description: e?.message ?? 'Unable to save integration.', variant: 'destructive' });
      }
      return;
    }

    if (integration.id === 'gohighlevel') {
      if (!configData.apiKey?.trim()) {
        toast({ title: 'Missing API Key', description: 'API key is required.', variant: 'destructive' });
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('gohighlevel-manage', {
          body: { action: 'save', apiKey: configData.apiKey.trim(), locationId: configData.locationId?.trim() },
        });
        if (error || !data?.ok) throw error || new Error(data?.error || 'Save failed');
        toast({ title: 'Settings Saved', description: 'GoHighLevel credentials stored successfully.' });
        setIsConfigDialogOpen(false);
        setConfigData({ apiKey: '', baseUrl: '', locationId: '' });
        loadIntegrations(); // Reload to show updated status
      } catch (e: any) {
        toast({ title: 'Save failed', description: e?.message ?? 'Unable to save integration.', variant: 'destructive' });
      }
      return;
    }
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
    setConfigData({ apiKey: '', baseUrl: '', locationId: '' });
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
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => testConnection(integration)}
                      className="flex-1"
                      disabled={!integration.is_available}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {integration.id === 'openai' ? 'Test API' : 'Test'}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Set up your {selectedIntegration?.name} integration settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedIntegration?.id !== 'collabai' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="api-key" className="text-right">
                  API Key *
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter API key..."
                  className="col-span-3"
                  value={configData.apiKey}
                  onChange={(e) => setConfigData(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
            )}
            {selectedIntegration?.id === 'collabai' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="base-url" className="text-right">
                  Base URL *
                </Label>
                <Input
                  id="base-url"
                  placeholder="https://your-collabai-instance.com"
                  className="col-span-3"
                  value={configData.baseUrl}
                  onChange={(e) => setConfigData(prev => ({ ...prev, baseUrl: e.target.value }))}
                />
              </div>
            )}
            {selectedIntegration?.id === 'gohighlevel' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location-id" className="text-right">
                  Location ID
                </Label>
                <Input
                  id="location-id"
                  placeholder="Optional location ID..."
                  className="col-span-3"
                  value={configData.locationId}
                  onChange={(e) => setConfigData(prev => ({ ...prev, locationId: e.target.value }))}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => testConnection(selectedIntegration)}>
              Test Connection
            </Button>
            <Button onClick={() => saveConfiguration(selectedIntegration)}>
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationManager;