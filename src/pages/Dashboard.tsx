import { Users, Eye, MousePointer, TrendingUp, Clock, Target, DollarSign, Share2 } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import EffortChart from "@/components/dashboard/EffortChart";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Marketing Dashboard</h1>
        <p className="text-muted-foreground">
          Track your team's effort vs results across all marketing channels
        </p>
      </div>

      {/* Effort Metrics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Team Effort</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Hours This Week"
            value="42"
            change={12}
            changeType="positive"
            icon={<Clock />}
            description="vs last week"
          />
          <KPICard
            title="Tasks Completed"
            value="28"
            change={-5}
            changeType="negative"
            icon={<Target />}
            description="vs last week"
          />
          <KPICard
            title="Active Team Members"
            value="6"
            change={0}
            changeType="neutral"
            icon={<Users />}
            description="no change"
          />
          <KPICard
            title="Efficiency Score"
            value="2.8x"
            change={15}
            changeType="positive"
            icon={<TrendingUp />}
            description="results per hour"
          />
        </div>
      </div>

      {/* Social Media KPIs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Social Media Performance</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Impressions"
            value="245K"
            change={18}
            changeType="positive"
            icon={<Eye />}
            description="this month"
          />
          <KPICard
            title="Engagement Rate"
            value="4.2%"
            change={8}
            changeType="positive"
            icon={<Share2 />}
            description="avg across platforms"
          />
          <KPICard
            title="Follower Growth"
            value="+1,250"
            change={22}
            changeType="positive"
            icon={<Users />}
            description="this month"
          />
          <KPICard
            title="Social ROI"
            value="$8.50"
            change={-3}
            changeType="negative"
            icon={<DollarSign />}
            description="per follower"
          />
        </div>
      </div>

      {/* Website KPIs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Website Performance</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Sessions"
            value="18.2K"
            change={25}
            changeType="positive"
            icon={<MousePointer />}
            description="this month"
          />
          <KPICard
            title="Conversion Rate"
            value="3.8%"
            change={12}
            changeType="positive"
            icon={<Target />}
            description="visitors to leads"
          />
          <KPICard
            title="Bounce Rate"
            value="42%"
            change={-8}
            changeType="positive"
            icon={<TrendingUp />}
            description="improved retention"
          />
          <KPICard
            title="Lead Value"
            value="$185"
            change={5}
            changeType="positive"
            icon={<DollarSign />}
            description="avg per lead"
          />
        </div>
      </div>

      {/* Paid Campaign KPIs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Paid Campaigns</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Click-Through Rate"
            value="2.8%"
            change={15}
            changeType="positive"
            icon={<MousePointer />}
            description="across all ads"
          />
          <KPICard
            title="Cost Per Click"
            value="$1.25"
            change={-10}
            changeType="positive"
            icon={<DollarSign />}
            description="lower is better"
          />
          <KPICard
            title="ROAS"
            value="4.2x"
            change={20}
            changeType="positive"
            icon={<TrendingUp />}
            description="return on ad spend"
          />
          <KPICard
            title="Ad Spend"
            value="$8.5K"
            change={-5}
            changeType="neutral"
            icon={<DollarSign />}
            description="this month"
          />
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