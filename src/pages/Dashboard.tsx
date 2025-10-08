import { Users, Eye, MousePointer, TrendingUp, Clock, Target, DollarSign, Share2, Loader2 } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import EffortChart from "@/components/dashboard/EffortChart";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KPICardSkeleton } from "@/components/skeleton/KPICardSkeleton";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { 
    teamEffortKPIs, 
    socialMediaKPIs, 
    websiteKPIs, 
    paidCampaignKPIs, 
    loading, 
    error 
  } = useDashboardData();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Marketing Dashboard</h1>
          <p className="text-muted-foreground">Track your team's effort vs results across all marketing channels</p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Team Effort</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <KPICardSkeleton key={i} />
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Social Media Performance</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <KPICardSkeleton key={`social-${i}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="max-w-2xl">
        <AlertDescription className="flex items-center justify-between">
          <span>Error loading dashboard data: {error}</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Marketing Dashboard</h1>
        <p className="text-muted-foreground">
          Track your team's effort vs results across all marketing channels
        </p>
      </div>

      {/* Team Effort Metrics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Team Effort</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {teamEffortKPIs.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              changeType={kpi.changeType}
              icon={[<Clock />, <Target />, <Users />, <TrendingUp />][index]}
              description={kpi.description}
            />
          ))}
        </div>
      </div>

      {/* Social Media KPIs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Social Media Performance</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {socialMediaKPIs.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              changeType={kpi.changeType}
              icon={[<Eye />, <Share2 />, <Users />, <DollarSign />][index]}
              description={kpi.description}
            />
          ))}
        </div>
      </div>

      {/* Website KPIs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Website Performance</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {websiteKPIs.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              changeType={kpi.changeType}
              icon={[<MousePointer />, <Target />, <TrendingUp />, <DollarSign />][index]}
              description={kpi.description}
            />
          ))}
        </div>
      </div>

      {/* Paid Campaign KPIs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Paid Campaigns</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {paidCampaignKPIs.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              changeType={kpi.changeType}
              icon={[<MousePointer />, <DollarSign />, <TrendingUp />, <DollarSign />][index]}
              description={kpi.description}
            />
          ))}
        </div>
      </div>

      {/* Effort vs Results Chart */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Performance Trends</h2>
        <div className="grid gap-6">
          <EffortChart />
        </div>
      </div>
    </div>
  );
}