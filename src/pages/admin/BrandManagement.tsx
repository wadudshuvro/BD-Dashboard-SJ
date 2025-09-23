import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Users, 
  Plug, 
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  DollarSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { mockBrands, mockUsers, Brand } from "@/data/mockData";

const BrandManagement = () => {
  const [brands] = useState<Brand[]>(mockBrands);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "internal" | "client">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || brand.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getBrandStats = (brand: Brand) => {
    const totalKPIs = brand.kpis.length;
    const achievedKPIs = brand.kpis.filter(kpi => 
      kpi.current_value >= (kpi.target_value || kpi.current_value)
    ).length;
    const achievementRate = totalKPIs > 0 ? Math.round((achievedKPIs / totalKPIs) * 100) : 0;
    
    return { totalKPIs, achievedKPIs, achievementRate };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Brand Management</h1>
          <p className="text-muted-foreground">
            Manage brand modules, assign team members, and configure settings
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Brand Module</DialogTitle>
              <DialogDescription>
                Create a new brand module to track marketing efforts and results.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Brand Name</Label>
                  <Input id="brand-name" placeholder="Enter brand name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand-type">Brand Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal Brand</SelectItem>
                      <SelectItem value="client">Client Brand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-description">Description</Label>
                <Textarea id="brand-description" placeholder="Brief description of the brand" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-owner">Brand Owner</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers.filter(user => user.role === 'manager' || user.role === 'admin').map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly-budget">Monthly Budget ($)</Label>
                  <Input id="monthly-budget" type="number" placeholder="0" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>
                Create Brand
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search brands or owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={(value: "all" | "internal" | "client") => setFilterType(value)}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBrands.map((brand) => {
          const stats = getBrandStats(brand);
          
          return (
            <Card key={brand.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {brand.description}
                    </CardDescription>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Brand
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Team
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Plug className="mr-2 h-4 w-4" />
                        Integrations
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Brand
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex gap-2 mt-2">
                  <Badge variant={brand.type === 'internal' ? 'default' : 'secondary'}>
                    {brand.type}
                  </Badge>
                  <Badge variant={brand.is_active ? 'default' : 'destructive'}>
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    KPI Score: {stats.achievementRate}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Owner Info */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {brand.owner_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{brand.owner_name}</p>
                    <p className="text-xs text-muted-foreground">Brand Owner</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-foreground">{brand.team_members.length}</div>
                    <div className="text-xs text-muted-foreground">Team</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{brand.active_integrations.length}</div>
                    <div className="text-xs text-muted-foreground">Integrations</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{brand.kpis.length}</div>
                    <div className="text-xs text-muted-foreground">KPIs</div>
                  </div>
                </div>

                {/* Budget */}
                {brand.monthly_budget && (
                  <div className="flex items-center justify-between p-2 bg-accent/10 rounded-md">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Monthly Budget</span>
                    </div>
                    <span className="text-sm font-bold text-success">
                      ${brand.monthly_budget.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Recent KPIs */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Recent KPIs</h4>
                  <div className="space-y-1">
                    {brand.kpis.slice(0, 2).map((kpi) => (
                      <div key={kpi.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{kpi.name}</span>
                        <span className="font-medium">
                          {kpi.type === 'currency' ? '$' : ''}
                          {kpi.current_value.toLocaleString()}
                          {kpi.type === 'percentage' ? '%' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBrands.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No brands found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first brand module"
              }
            </p>
            {!searchTerm && filterType === "all" && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Brand
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BrandManagement;