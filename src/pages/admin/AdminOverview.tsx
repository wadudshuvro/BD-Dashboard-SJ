import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  Plug, 
  TrendingUp,
  Activity,
  Calendar,
  DollarSign,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useSystemStats } from "@/hooks/useSystemStats";
import { NavLink } from "react-router-dom";

const AdminOverview = () => {
  const { stats, recentActivity, systemAlerts, topBrands, loading, error } = useSystemStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive">Error loading system data: {error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground">
          System-wide analytics and management dashboard for all brand modules
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBrands}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrations</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIntegrations}</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.totalRevenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performing Brands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Brands
            </CardTitle>
            <CardDescription>
              Based on KPI achievement rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topBrands.length > 0 ? (
              topBrands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{brand.name}</span>
                      <span className="text-xs text-muted-foreground">{brand.owner_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={brand.achievementRate >= 90 ? "default" : brand.achievementRate >= 70 ? "secondary" : "outline"}>
                      {brand.achievementRate}%
                    </Badge>
                    <Badge variant={brand.type === 'internal' ? 'default' : 'secondary'}>
                      {brand.type}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No brand performance data available
              </div>
            )}
            <Button variant="outline" className="w-full" asChild>
              <NavLink to="/adminpanel/brands">View All Brands</NavLink>
            </Button>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Recent system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <div className={`h-2 w-2 rounded-full mt-2 ${
                  alert.severity === 'warning' ? 'bg-warning' : 
                  alert.severity === 'success' ? 'bg-success' : 'bg-accent'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest actions across all brand modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 py-2">
                <div className={`h-2 w-2 rounded-full ${
                  activity.type === 'user' ? 'bg-primary' :
                  activity.type === 'brand' ? 'bg-success' :
                  activity.type === 'integration' ? 'bg-accent' : 'bg-warning'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {activity.action}
                    {activity.user && <span className="text-primary"> - {activity.user}</span>}
                    {activity.brand && <span className="text-success"> - {activity.brand}</span>}
                    {activity.integration && <span className="text-accent"> ({activity.integration})</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start" asChild>
              <NavLink to="/adminpanel/brands">
                <Building2 className="mr-2 h-4 w-4" />
                Add New Brand
              </NavLink>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <NavLink to="/adminpanel/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </NavLink>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <NavLink to="/adminpanel/integrations">
                <Plug className="mr-2 h-4 w-4" />
                Setup Integration
              </NavLink>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <NavLink to="/adminpanel/settings">
                <Calendar className="mr-2 h-4 w-4" />
                System Settings
              </NavLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;