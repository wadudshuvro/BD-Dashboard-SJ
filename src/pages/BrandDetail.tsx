import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  Plug,
  Settings,
  BarChart3,
  Loader2,
  Edit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyKPIs } from "@/components/empty-states/EmptyKPIs";
import { EmptyIntegrations } from "@/components/empty-states/EmptyIntegrations";

interface BrandKPI {
  id: string;
  name: string;
  type: 'number' | 'percentage' | 'currency';
  description: string;
  current_value: number;
  target_value?: number;
  source: string;
  display_order: number;
}

interface Brand {
  id: string;
  name: string;
  description?: string;
  type: string;
  is_active: boolean;
  created_at: string;
  owner_name?: string;
  team_members?: string[];
  monthly_budget?: number;
  active_integrations?: string[];
  status: string;
}

interface BrandWithKPIs extends Brand {
  kpis: BrandKPI[];
}

const BrandDetail = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandWithKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrandDetail = async () => {
      if (!brandId) return;
      
      try {
        setLoading(true);
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
          throw new Error('No valid session');
        }

        const response = await supabase.functions.invoke('admin-brands', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch brand');
        }

        const brands = response.data || [];
        const foundBrand = brands.find((b: BrandWithKPIs) => b.id === brandId);
        
        if (!foundBrand) {
          toast.error('Brand not found');
          navigate(-1);
          return;
        }

        setBrand(foundBrand);
      } catch (err) {
        console.error('Error fetching brand:', err);
        toast.error('Failed to load brand details');
        navigate(-1);      } finally {
        setLoading(false);
      }
    };

    fetchBrandDetail();
  }, [brandId, navigate]);

  const getBrandStats = (brand: BrandWithKPIs) => {
    const totalKPIs = brand.kpis?.length || 0;
    const achievedKPIs = brand.kpis?.filter(kpi => 
      kpi.current_value >= (kpi.target_value || kpi.current_value)
    ).length || 0;
    const achievementRate = totalKPIs > 0 ? Math.round((achievedKPIs / totalKPIs) * 100) : 0;
    
    return { totalKPIs, achievedKPIs, achievementRate };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Brand not found</h3>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const stats = getBrandStats(brand);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{brand.name}</h1>
            <p className="text-muted-foreground">{brand.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={brand.type === 'internal' ? 'default' : 'secondary'}>
            {brand.type}
          </Badge>
          <Badge variant={brand.is_active ? 'default' : 'destructive'}>
            {brand.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Brand
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KPI Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.achievementRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.achievedKPIs} of {stats.totalKPIs} KPIs achieved
            </p>
            <Progress value={stats.achievementRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brand.team_members?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${brand.monthly_budget?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Allocated budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrations</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brand.active_integrations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active integrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs & Metrics</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Brand Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Brand Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand Name</label>
                  <p className="text-sm font-medium">{brand.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{brand.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm capitalize">{brand.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm capitalize">{brand.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(brand.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Brand Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {(brand.owner_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{brand.owner_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">Brand Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Key Performance Indicators
              </CardTitle>
              <CardDescription>
                Track and monitor your brand's performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {brand.kpis && brand.kpis.length > 0 ? (
                <div className="space-y-4">
                  {brand.kpis.map((kpi) => {
                    const progress = kpi.target_value 
                      ? Math.min((kpi.current_value / kpi.target_value) * 100, 100)
                      : 100;
                    
                    return (
                      <div key={kpi.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium">{kpi.name}</h4>
                            <p className="text-xs text-muted-foreground">{kpi.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">
                              {kpi.type === 'currency' ? '$' : ''}
                              {kpi.current_value.toLocaleString()}
                              {kpi.type === 'percentage' ? '%' : ''}
                            </p>
                            {kpi.target_value && (
                              <p className="text-xs text-muted-foreground">
                                Target: {kpi.type === 'currency' ? '$' : ''}
                                {kpi.target_value.toLocaleString()}
                                {kpi.type === 'percentage' ? '%' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        {kpi.target_value && (
                          <Progress value={progress} className="h-2" />
                        )}
                        <Separator />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyKPIs onAddKPI={() => console.log("Add KPI")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage team members and their access to this brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Team management</h3>
                <p className="text-muted-foreground mb-4">
                  Team member management will be available soon
                </p>
                <Button variant="outline">Manage Team</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Active Integrations
              </CardTitle>
              <CardDescription>
                Connected services and data sources for this brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              {brand.active_integrations && brand.active_integrations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {brand.active_integrations.map((integration, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Plug className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{integration.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">Connected</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyIntegrations />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Brand Settings
              </CardTitle>
              <CardDescription>
                Configure brand settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Settings panel</h3>
                <p className="text-muted-foreground mb-4">
                  Brand settings configuration will be available soon
                </p>
                <Button variant="outline">Configure Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandDetail;