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
import { mockIntegrations, mockBrands, Integration } from "@/data/mockData";

const IntegrationManager = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const filteredIntegrations = integrations.filter(integration => 
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, is_enabled: !integration.is_enabled }
          : integration
      )
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

  const getBrandIntegrationStatus = (integrationType: string, brandId: string) => {
    const brand = mockBrands.find(b => b.id === brandId);
    return brand?.active_integrations.includes(integrationType) ? 'connected' : 'not_connected';
  };

  const openConfigDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsConfigDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Integration Manager</h1>
        <p className="text-muted-foreground">
          Configure and manage external API integrations for all brand modules
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search integrations..."
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
            {mockBrands.map(brand => (
              <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Integration Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.filter(i => i.is_available).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {mockBrands.reduce((total, brand) => total + brand.active_integrations.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Easy Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.filter(i => i.setup_complexity === 'easy').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">2</div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{integration.icon}</div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {integration.name}
                      {(integration.type === 'openai' || integration.type === 'collab_ai') && (
                        <div className="flex items-center gap-2 ml-2">
                          <Power className={`h-4 w-4 ${integration.is_enabled ? 'text-success' : 'text-muted-foreground'}`} />
                          <Switch
                            checked={integration.is_enabled}
                            onCheckedChange={() => toggleIntegration(integration.id)}
                          />
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openConfigDialog(integration)}
                  disabled={(integration.type === 'openai' || integration.type === 'collab_ai') && !integration.is_enabled}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2 mt-3">
                <Badge variant={integration.is_available ? "default" : "destructive"}>
                  {integration.is_available ? "Available" : "Unavailable"}
                </Badge>
                {(integration.type === 'openai' || integration.type === 'collab_ai') && (
                  <Badge variant={integration.is_enabled ? "default" : "secondary"}>
                    {integration.is_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                )}
                <Badge className={getComplexityColor(integration.setup_complexity)}>
                  {integration.setup_complexity}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Brand Connection Status */}
              {selectedBrand === "all" ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Brand Connections</h4>
                  <div className="space-y-1">
                    {mockBrands.slice(0, 3).map((brand) => {
                      const status = getBrandIntegrationStatus(integration.type, brand.id);
                      return (
                        <div key={brand.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{brand.name}</span>
                          <div className="flex items-center gap-1">
                            {status === 'connected' ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className={status === 'connected' ? 'text-success' : 'text-muted-foreground'}>
                              {status === 'connected' ? 'Connected' : 'Not Connected'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {mockBrands.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        +{mockBrands.length - 3} more brands
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Connection Status</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {mockBrands.find(b => b.id === selectedBrand)?.name || 'Selected Brand'}
                    </span>
                    <div className="flex items-center gap-2">
                      {getBrandIntegrationStatus(integration.type, selectedBrand) === 'connected' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">Connected</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Not Connected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Required Fields */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Required Configuration</h4>
                <div className="text-xs text-muted-foreground">
                  {integration.required_fields.join(', ')}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openConfigDialog(integration)}
                  disabled={(integration.type === 'openai' || integration.type === 'collab_ai') && !integration.is_enabled}
                >
                  {selectedBrand !== "all" && getBrandIntegrationStatus(integration.type, selectedBrand) === 'connected' 
                    ? 'Manage' 
                    : 'Configure'
                  }
                </Button>
                <Button size="sm" variant="outline" disabled={(integration.type === 'openai' || integration.type === 'collab_ai') && !integration.is_enabled}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration?.icon} Configure {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              Set up API credentials and configuration for {selectedIntegration?.name} integration.
            </DialogDescription>
          </DialogHeader>
          
          {selectedIntegration && (
            <Tabs defaultValue="config" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="brands">Brand Assignment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="config" className="space-y-4">
                {((selectedIntegration.type === 'openai' || selectedIntegration.type === 'collab_ai') && !selectedIntegration.is_enabled) ? (
                  <div className="text-center py-8">
                    <Power className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Integration Disabled</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please enable this integration to configure its settings.
                    </p>
                    <Button onClick={() => toggleIntegration(selectedIntegration.id)}>
                      Enable {selectedIntegration.name}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedIntegration.required_fields.map((field) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="capitalize">
                          {field.replace(/_/g, ' ')}
                        </Label>
                        {field.includes('secret') || field.includes('key') ? (
                          <Input 
                            id={field} 
                            type="password" 
                            placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                          />
                        ) : field === 'model_preference' ? (
                          <select 
                            id={field}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select model</option>
                            {selectedIntegration.type === 'openai' ? (
                              <>
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                              </>
                            ) : (
                              <>
                                <option value="collab-pro">CollabAI Pro</option>
                                <option value="collab-standard">CollabAI Standard</option>
                                <option value="collab-lite">CollabAI Lite</option>
                              </>
                            )}
                          </select>
                        ) : (
                          <Input 
                            id={field} 
                            placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                          />
                        )}
                      </div>
                    ))}
                    
                    <div className="space-y-2">
                      <Label>Additional Notes</Label>
                      <Textarea placeholder="Any additional configuration notes..." />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="brands" className="space-y-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select which brands can use this integration:
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {mockBrands.map((brand) => {
                      const isConnected = getBrandIntegrationStatus(selectedIntegration.type, brand.id) === 'connected';
                      return (
                        <div key={brand.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{brand.name}</span>
                              <span className="text-xs text-muted-foreground">{brand.owner_name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isConnected ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <Button size="sm" variant="outline">
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsConfigDialogOpen(false)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationManager;