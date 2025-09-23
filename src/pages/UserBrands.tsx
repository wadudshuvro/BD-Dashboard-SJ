import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Users, 
  Plug, 
  Search,
  Eye,
  DollarSign
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockBrands, Brand } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";

const UserBrands = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "internal" | "client">("all");

  // Filter brands that the user has access to (mock logic - would be based on actual user permissions)
  const userBrands = mockBrands.filter(brand => {
    // Mock: users can see brands they're assigned to or all active brands for this demo
    return brand.is_active;
  });

  const filteredBrands = userBrands.filter(brand => {
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Brands</h1>
        <p className="text-muted-foreground">
          View brands you have access to and their current performance
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={(value: "all" | "internal" | "client") => setFilterType(value)}>
          <SelectTrigger className="w-40">
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

                {/* Budget (if available) */}
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
                  <h4 className="text-sm font-medium text-foreground">Key Metrics</h4>
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
                : "You don't have access to any brand modules yet. Contact your manager for access."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserBrands;