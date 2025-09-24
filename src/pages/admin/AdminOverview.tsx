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
  AlertTriangle
} from "lucide-react";
import { mockBrands, mockUsers, mockIntegrations, getSystemStats } from "@/data/mockData";
import { NavLink } from "react-router-dom";

const AdminOverview = () => {
  const stats = getSystemStats();
  const recentActivity = [
    { id: 1, action: 'New user registered', user: 'Chris Taylor', time: '2 hours ago', type: 'user' },
    { id: 2, action: 'Brand KPI updated', brand: 'CollabAI', time: '4 hours ago', type: 'kpi' },
    { id: 3, action: 'Integration connected', brand: 'LeadsLift', integration: 'Facebook', time: '6 hours ago', type: 'integration' },
    { id: 4, action: 'User role changed', user: 'Alice Johnson', time: '1 day ago', type: 'user' },
    { id: 5, action: 'New brand created', brand: 'TechStartup Pro', time: '2 days ago', type: 'brand' },
  ];

  const systemAlerts = [
    { id: 1, message: 'Google Analytics sync failed for CollabAI', severity: 'warning', time: '1 hour ago' },
    { id: 2, message: 'High API usage detected for LeadsLift', severity: 'info', time: '3 hours ago' },
    { id: 3, message: 'Backup completed successfully', severity: 'success', time: '12 hours ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground">
          System-wide analytics and management dashboard for all brand modules
        </p>
        <div className="mt-2">
          <span className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 text-xs px-2 py-1 rounded-full font-medium">
            🔴 DUMMY DATA - Needs Database Connection
          </span>
        </div>
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
            {mockBrands.slice(0, 5).map((brand) => {
              const achievementRate = Math.round(
                (brand.kpis.reduce((sum, kpi) => sum + (kpi.current_value / (kpi.target_value || kpi.current_value)), 0) / brand.kpis.length) * 100
              );
              
              return (
                <div key={brand.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{brand.name}</span>
                      <span className="text-xs text-muted-foreground">{brand.owner_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={achievementRate >= 90 ? "default" : achievementRate >= 70 ? "secondary" : "outline"}>
                      {achievementRate}%
                    </Badge>
                    <Badge variant={brand.type === 'internal' ? 'default' : 'secondary'}>
                      {brand.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
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