import { useState } from "react";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Mail, 
  Globe, 
  Linkedin, 
  Youtube, 
  Code, 
  ChevronDown,
  BarChart3,
  Target,
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
import { mockBrands, getBrandById } from "@/data/mockData";

export default function Index() {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"overview" | "comparison">("overview");

  const brands = mockBrands;
  const selectedBrandData = selectedBrand === "all" ? null : getBrandById(selectedBrand);

  const getBrandIcon = (brandName: string) => {
    const iconMap: Record<string, any> = {
      "Community Outreach": Users,
      "CollabAI": Code,
      "LeadsLift": TrendingUp,
      "BuildYourAI": Code,
      "Social Growth": Linkedin,
      "Content Engine": Youtube,
      "Email Marketing": Mail,
      "Web Presence": Globe
    };
    return iconMap[brandName] || BarChart3;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground"; 
      case "inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
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
              <p className="text-muted-foreground">Owner: {selectedBrandData.owner_name} • Team: {selectedBrandData.team_members.length} members</p>
            </div>
          </div>
          <Badge className={getStatusColor(selectedBrandData.is_active ? 'active' : 'inactive')}>
            {selectedBrandData.is_active ? 'active' : 'inactive'}
          </Badge>
        </div>

        {/* Brand KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {selectedBrandData.kpis.map((kpi) => (
            <KPICard
              key={kpi.id}
              title={kpi.name}
              value={kpi.current_value}
              change={15}
              changeType="positive"
              icon={<Target />}
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
              {selectedBrandData.active_integrations.map((integration) => (
                <div key={integration} className="flex items-center space-x-2 p-2 rounded-lg border">
                  <div className="h-2 w-2 bg-success rounded-full"></div>
                  <span className="text-sm font-medium">{integration}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBrandComparison = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {brands.map((brand) => {
          const IconComponent = getBrandIcon(brand.name);
          const totalKPIs = brand.kpis.length;
          const achievedKPIs = brand.kpis.filter(kpi => kpi.current_value >= kpi.target_value).length;
          const achievementRate = Math.round((achievedKPIs / totalKPIs) * 100);
          
          return (
            <Card key={brand.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{brand.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{brand.owner_name}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(brand.is_active ? 'active' : 'inactive')} variant="outline">
                    {brand.is_active ? 'active' : 'inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Team Size:</span>
                  <span className="font-medium">{brand.team_members.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">KPI Progress:</span>
                  <span className={`font-medium ${achievementRate >= 80 ? 'text-success' : achievementRate >= 60 ? 'text-warning' : 'text-destructive'}`}>
                    {achievementRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">${brand.monthly_budget?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedBrand(brand.id)}
                  >
                    View Details
                  </Button>
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
              .map(brand => ({
                ...brand,
                score: Math.round((brand.kpis.filter(kpi => kpi.current_value >= (kpi.target_value || 0)).length / brand.kpis.length) * 100)
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((brand, index) => {
                const IconComponent = getBrandIcon(brand.name);
                return (
                  <div key={brand.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-warning text-warning-foreground' : 
                        index === 1 ? 'bg-muted text-muted-foreground' : 
                        'bg-secondary text-secondary-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{brand.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${brand.score >= 80 ? 'text-success' : brand.score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                        {brand.score}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAllBrandsOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Total Brands"
          value={brands.length}
          description={`${brands.filter(b => b.is_active).length} active`}
          icon={<BarChart3 />}
        />
        <KPICard
          title="Team Members"
          value={brands.reduce((sum, b) => sum + b.team_members.length, 0)}
          description="Across all brands"
          icon={<Users />}
        />
        <KPICard
          title="Total Budget"
          value={`$${(brands.reduce((sum, b) => sum + (b.monthly_budget || 0), 0) / 1000).toFixed(0)}K`}
          description="Monthly allocation"
          icon={<TrendingUp />}
        />
        <KPICard
          title="Avg Performance"
          value={`${Math.round(brands.reduce((sum, b) => {
            const achieved = b.kpis.filter(kpi => kpi.current_value >= (kpi.target_value || 0)).length;
            return sum + (achieved / b.kpis.length * 100);
          }, 0) / brands.length)}%`}
          description="KPI achievement"
          icon={<Target />}
        />
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "overview" | "comparison")}>
        <TabsList>
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="comparison">Brand Comparison</TabsTrigger>
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
          {renderBrandComparison()}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Brand Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketing Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedBrand === "all" ? "Overview of all brand modules" : "Brand-specific performance metrics"}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Brand" />
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
      </div>

      {/* Dashboard Content */}
      {selectedBrand === "all" ? renderAllBrandsOverview() : renderBrandOverview()}
    </div>
  );
}