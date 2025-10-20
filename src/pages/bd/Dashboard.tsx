import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useControlTowerDeals, useControlTowerClients, useControlTowerLeads } from '@/hooks/useControlTowerData';
import { TrendingUp, Users, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BDDashboard() {
  const { data: leads = [] } = useControlTowerLeads();
  const { data: deals = [] } = useControlTowerDeals();
  const { data: clients = [] } = useControlTowerClients();
  
  const newLeads = leads.filter((l: any) => 
    new Date(l.created_at).getMonth() === new Date().getMonth()
  ).length;
  
  const warmLeads = 0; // Will be populated when hubspot hook is available
  const dealsClosed = deals.filter((d: any) => d.control_tower_status === 'won').length;
  const totalLeads = leads.length;
  const activeDeals = deals.filter((d: any) => d.control_tower_status === 'active').length;
  const totalClients = clients.length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Business Development Dashboard</h1>
        <p className="text-muted-foreground">
          Track your BD performance and pipeline health
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              New Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newLeads}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Warm Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warmLeads}</div>
            <p className="text-xs text-muted-foreground">Ready for outreach</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-success" />
              Deals Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealsClosed}</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-warning" />
              Top Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Best performer</p>
          </CardContent>
        </Card>
      </div>

      {/* Snapshot Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Leads Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalLeads}</p>
                <p className="text-xs text-muted-foreground">Active leads</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/bd/pipeline/leads">View All</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{activeDeals}</p>
                <p className="text-xs text-muted-foreground">In progress</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/bd/pipeline/deals">View All</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalClients}</p>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/bd/pipeline/clients">View All</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
