import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BarChart3, 
  Search,
  Plus,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  DollarSign,
  Percent,
  Hash
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockBrands, mockIntegrations, BrandKPI } from "@/data/mockData";

const KPIConfigurator = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>(mockBrands[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<BrandKPI | null>(null);

  const selectedBrandData = mockBrands.find(b => b.id === selectedBrand);
  const filteredKPIs = selectedBrandData?.kpis.filter(kpi => 
    kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kpi.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getKPIIcon = (type: string) => {
    switch (type) {
      case 'currency': return <DollarSign className="h-4 w-4" />;
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getKPITypeColor = (type: string) => {
    switch (type) {
      case 'currency': return 'bg-success text-success-foreground';
      case 'percentage': return 'bg-warning text-warning-foreground';
      case 'number': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatKPIValue = (value: number, type: string) => {
    switch (type) {
      case 'currency': return `$${value.toLocaleString()}`;
      case 'percentage': return `${value}%`;
      case 'number': return value.toLocaleString();
      default: return value.toString();
    }
  };

  const getProgressPercentage = (current: number, target?: number) => {
    if (!target) return 100;
    return Math.min((current / target) * 100, 100);
  };

  const openEditDialog = (kpi: BrandKPI) => {
    setSelectedKPI(kpi);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">KPI Configuration</h1>
          <p className="text-muted-foreground">
            Define and manage key performance indicators for each brand module
          </p>
          <div className="mt-2">
            <span className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 text-xs px-2 py-1 rounded-full font-medium">
              🔴 DUMMY DATA - Needs Database Connection
            </span>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedKPI(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add KPI
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedKPI ? 'Edit KPI' : 'Add New KPI'}
              </DialogTitle>
              <DialogDescription>
                {selectedKPI 
                  ? `Update the KPI configuration for ${selectedBrandData?.name}`
                  : `Create a new KPI for ${selectedBrandData?.name}`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kpi-name">KPI Name</Label>
                  <Input 
                    id="kpi-name" 
                    placeholder="e.g., Website Sessions" 
                    defaultValue={selectedKPI?.name || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kpi-type">KPI Type</Label>
                  <Select defaultValue={selectedKPI?.type || 'number'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kpi-description">Description</Label>
                <Textarea 
                  id="kpi-description" 
                  placeholder="Brief description of what this KPI measures"
                  defaultValue={selectedKPI?.description || ''}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target-value">Target Value (Optional)</Label>
                  <Input 
                    id="target-value" 
                    type="number" 
                    placeholder="Set target goal"
                    defaultValue={selectedKPI?.target_value || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-source">Data Source</Label>
                  <Select defaultValue={selectedKPI?.source || 'manual'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      {mockIntegrations.map(integration => (
                        <SelectItem key={integration.id} value={integration.type}>
                          {integration.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display-order">Display Order</Label>
                <Input 
                  id="display-order" 
                  type="number" 
                  placeholder="1" 
                  defaultValue={selectedKPI?.display_order || filteredKPIs.length + 1}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>
                {selectedKPI ? 'Update KPI' : 'Create KPI'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Brand Selection and Search */}
      <div className="flex gap-4 items-center">
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent>
            {mockBrands.map(brand => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search KPIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Brand Overview */}
      {selectedBrandData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {selectedBrandData.name} KPI Overview
            </CardTitle>
            <CardDescription>
              {selectedBrandData.description} • Owner: {selectedBrandData.owner_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{selectedBrandData.kpis.length}</div>
                <div className="text-sm text-muted-foreground">Total KPIs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {selectedBrandData.kpis.filter(kpi => kpi.current_value >= (kpi.target_value || kpi.current_value)).length}
                </div>
                <div className="text-sm text-muted-foreground">Goals Met</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {selectedBrandData.active_integrations.length}
                </div>
                <div className="text-sm text-muted-foreground">Data Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {Math.round((selectedBrandData.kpis.filter(kpi => kpi.current_value >= (kpi.target_value || kpi.current_value)).length / selectedBrandData.kpis.length) * 100) || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Achievement Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI List */}
      <Tabs defaultValue="cards" className="w-full">
        <TabsList>
          <TabsTrigger value="cards">Card View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredKPIs.map((kpi) => {
              const progress = getProgressPercentage(kpi.current_value, kpi.target_value);
              const isOnTarget = kpi.target_value ? kpi.current_value >= kpi.target_value : true;
              
              return (
                <Card key={kpi.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getKPIIcon(kpi.type)}
                        <div>
                          <CardTitle className="text-base">{kpi.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {kpi.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(kpi)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <Badge className={getKPITypeColor(kpi.type)}>
                        {kpi.type}
                      </Badge>
                      <Badge variant="outline">
                        {kpi.source}
                      </Badge>
                      {kpi.target_value && (
                        <Badge variant={isOnTarget ? "default" : "destructive"}>
                          {isOnTarget ? "On Target" : "Below Target"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-foreground">
                        {formatKPIValue(kpi.current_value, kpi.type)}
                      </div>
                      {kpi.target_value && (
                        <div className="text-sm text-muted-foreground">
                          Target: {formatKPIValue(kpi.target_value, kpi.type)}
                        </div>
                      )}
                    </div>

                    {kpi.target_value && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              isOnTarget ? 'bg-success' : 'bg-warning'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="table">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKPIs.map((kpi) => {
                  const progress = getProgressPercentage(kpi.current_value, kpi.target_value);
                  const isOnTarget = kpi.target_value ? kpi.current_value >= kpi.target_value : true;
                  
                  return (
                    <TableRow key={kpi.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{kpi.name}</div>
                          <div className="text-sm text-muted-foreground">{kpi.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getKPITypeColor(kpi.type)}>
                          {kpi.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatKPIValue(kpi.current_value, kpi.type)}
                      </TableCell>
                      <TableCell>
                        {kpi.target_value ? formatKPIValue(kpi.target_value, kpi.type) : '—'}
                      </TableCell>
                      <TableCell>
                        {kpi.target_value ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  isOnTarget ? 'bg-success' : 'bg-warning'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm">{Math.round(progress)}%</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{kpi.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(kpi)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredKPIs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No KPIs found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Try adjusting your search criteria"
                : `Get started by creating KPIs for ${selectedBrandData?.name}`
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First KPI
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KPIConfigurator;