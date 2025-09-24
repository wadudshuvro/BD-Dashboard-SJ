import { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  Code, 
  Linkedin, 
  Youtube, 
  Target,
  DollarSign,
  Building2,
  Zap,
  Activity,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KPICard from "@/components/dashboard/KPICard";
import EffortChart from "@/components/dashboard/EffortChart";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user } = useAuth();
  const dashboardData = useDashboardData();
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"overview" | "comparison">("overview");

  const brands = dashboardData.brandPerformance;
  const selectedBrandData = selectedBrand === "all" ? null : brands.find(b => b.id === selectedBrand);

  const getBrandIcon = (brandName: string) => {
    const iconMap: Record<string, any> = {
      "Community Outreach": Users,
      "CollabAI": Code,
      "LeadsLift": TrendingUp,
      "BuildYourAI": Code,
      "Social Growth": Linkedin,
      "Content Engine": Youtube,
      "GHL Developer": Building2,
      "Crafted.Email": Activity,
      "PlatePresence": DollarSign,
      "SJ Innovation": Zap,
    };
    return iconMap[brandName] || Building2;
  };

  const getBrandStatusVariant = (status: string) => {
    switch (status) {
      case "growing": return "default";
      case "stable": return "secondary"; 
      case "declining": return "destructive";
      default: return "secondary";
    }
  };

  const renderBrandOverview = () => {
    if (!selectedBrandData) return null;
    
    const IconComponent = getBrandIcon(selectedBrandData.name);
    
    return (
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{selectedBrandData.name}</h1>
              <p className="text-muted-foreground">Status: {selectedBrandData.status} • Tasks: {selectedBrandData.activeTasks}</p>
            </div>
          </div>
          <Badge variant={getBrandStatusVariant(selectedBrandData.status)}>
            {selectedBrandData.status}
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {selectedBrandData.kpis.map((kpi, index) => (
            <KPICard
              key={kpi.id || index}
              title={kpi.name}
              value={kpi.current_value}
              change={15}
              changeType="positive"
              description="from target"
            />
          ))}
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <EffortChart />
          </CardContent>
        </Card>

        {/* Active Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {selectedBrandData.active_integrations.map((integration, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded-lg">
                  <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">{integration}</span>
                </div>
              ))}
              {selectedBrandData.active_integrations.length === 0 && (
                <p className="col-span-3 text-center text-muted-foreground py-4">No active integrations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAllBrandsOverview = () => {
    if (dashboardData.loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading dashboard data...</span>
        </div>
      );
    }

    if (dashboardData.error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">Error loading dashboard</p>
            <p className="text-sm text-muted-foreground">{dashboardData.error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={dashboardData.refreshData}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Brand Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => {
            const IconComponent = getBrandIcon(brand.name);
            const totalKPIs = brand.kpis.length;
            const achievedKPIs = brand.kpis.filter(kpi => 
              kpi.target_value ? kpi.current_value >= kpi.target_value : true
            ).length;
            const achievementRate = totalKPIs > 0 ? Math.round((achievedKPIs / totalKPIs) * 100) : 0;
            
            return (
              <Card key={brand.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => setSelectedBrand(brand.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-primary rounded-md flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{brand.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">Revenue: ${brand.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant={getBrandStatusVariant(brand.status)}>
                      {brand.growth > 0 ? '+' : ''}{brand.growth}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">KPI Achievement</span>
                      <span className="font-medium">{achievementRate}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${achievementRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{totalKPIs} KPIs</span>
                      <span>{brand.activeTasks} active tasks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Performance Rankings */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brands
                .sort((a, b) => {
                  const aRate = a.kpis.length > 0 ? a.kpis.filter(kpi => 
                    kpi.target_value ? kpi.current_value >= kpi.target_value : true
                  ).length / a.kpis.length : 0;
                  const bRate = b.kpis.length > 0 ? b.kpis.filter(kpi => 
                    kpi.target_value ? kpi.current_value >= kpi.target_value : true
                  ).length / b.kpis.length : 0;
                  return bRate - aRate;
                })
                .slice(0, 5)
                .map((brand, index) => {
                  const IconComponent = getBrandIcon(brand.name);
                  const achievementRate = brand.kpis.length > 0 ? Math.round(
                    (brand.kpis.filter(kpi => 
                      kpi.target_value ? kpi.current_value >= kpi.target_value : true
                    ).length / brand.kpis.length) * 100
                  ) : 0;
                  
                  return (
                    <div key={brand.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary rounded-full">
                          {index + 1}
                        </div>
                        <div className="h-8 w-8 bg-gradient-primary rounded-md flex items-center justify-center">
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{brand.name}</p>
                          <p className="text-xs text-muted-foreground">{brand.kpis.length} KPIs tracked</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{achievementRate}%</p>
                        <p className="text-xs text-muted-foreground">achievement</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <KPICard
            title="Total Brands"
            value={brands.length}
            description={`${brands.filter(b => b.status === 'growing').length} growing`}
            icon={<BarChart3 />}
          />
          <KPICard
            title="Active Tasks"
            value={brands.reduce((sum, b) => sum + b.activeTasks, 0)}
            description="Across all brands"
            icon={<Users />}
          />
          <KPICard
            title="Total Revenue"
            value={`$${(dashboardData.totalRevenue / 1000).toFixed(0)}K`}
            description="Monthly tracking"
            icon={<TrendingUp />}
          />
          <KPICard
            title="Avg Performance"
            value={`${Math.round(brands.reduce((sum, b) => {
              const achieved = b.kpis.filter(kpi => kpi.target_value ? kpi.current_value >= kpi.target_value : true).length;
              return sum + (achieved / Math.max(b.kpis.length, 1) * 100);
            }, 0) / Math.max(brands.length, 1))}%`}
            description="goal achievement"
            icon={<Target />}
          />
        </div>

        {/* Tabs for different views */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Cross-Brand Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <EffortChart />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comparison">
            <div className="grid gap-6 md:grid-cols-2">
              {dashboardData.teamEffortKPIs.slice(0, 4).map((kpi, index) => (
                <KPICard key={index} {...kpi} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Brand Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketing Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedBrand === "all" ? "Overview of all brand modules" : "Brand-specific performance metrics"}
          </p>
          {dashboardData.loading && (
            <div className="mt-2">
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 text-xs px-2 py-1 rounded-full font-medium">
                🔄 Loading Real Data...
              </span>
            </div>
          )}
        </div>
        
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dashboard Content */}
      {selectedBrand === "all" ? renderAllBrandsOverview() : renderBrandOverview()}
    </div>
  );
}