import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, Users, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useBrandBySlug } from '@/hooks/useUserBrands';
import { BrandKPIList } from '@/components/brands/BrandKPIList';
import { Skeleton } from '@/components/ui/skeleton';

const BrandDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: brandData, isLoading } = useBrandBySlug(slug);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!brandData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Brand not found</p>
        </div>
      </AdminLayout>
    );
  }

  const brand = brandData;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/brands">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              {brand.logo_url && (
                <img src={brand.logo_url} alt={brand.name} className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div>
                <h1 className="text-3xl font-bold">{brand.name}</h1>
                <p className="text-muted-foreground">{brand.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={brand.type === 'internal' ? 'default' : 'secondary'}>
              {brand.type}
            </Badge>
            {brand.can_edit_settings && (
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active KPIs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brandData.kpis?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Tracking metrics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brandData.team_members?.length || 0}</div>
              <p className="text-xs text-muted-foreground">With access</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${brand.monthly_budget?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Allocated budget</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kpis">
          <TabsList>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="kpis" className="space-y-4">
            {brandData.kpis && brandData.kpis.length > 0 ? (
              <BrandKPIList kpis={brandData.kpis} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No KPIs Yet</CardTitle>
                  <CardDescription>
                    Start tracking metrics by adding your first KPI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {brand.can_edit_kpis && (
                    <Button>Add KPI</Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>People who have access to this brand</CardDescription>
              </CardHeader>
              <CardContent>
                {brandData.team_members && brandData.team_members.length > 0 ? (
                  <div className="space-y-2">
                    {brandData.team_members.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{member.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                        </div>
                        <Badge>{member.access_level}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No team members yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connected services and data sources</CardDescription>
              </CardHeader>
              <CardContent>
                {brandData.integrations && brandData.integrations.length > 0 ? (
                  <div className="space-y-2">
                    {brandData.integrations.map((integration: any) => (
                      <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{integration.integration_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {integration.last_synced_at
                              ? `Last synced: ${new Date(integration.last_synced_at).toLocaleDateString()}`
                              : 'Never synced'}
                          </p>
                        </div>
                        <Badge variant={integration.is_enabled ? 'default' : 'secondary'}>
                          {integration.is_enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No integrations configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default BrandDetail;
