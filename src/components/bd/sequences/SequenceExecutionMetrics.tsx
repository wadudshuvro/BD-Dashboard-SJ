import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Play, CheckCircle2, XCircle, PauseCircle, TrendingUp } from "lucide-react";

interface SequenceExecutionMetricsProps {
  metrics: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    paused: number;
    successRate: string;
  };
  isLoading?: boolean;
}

export function SequenceExecutionMetrics({ metrics, isLoading }: SequenceExecutionMetricsProps) {
  const metricCards = [
    {
      title: "Total Enrollments",
      value: metrics.total,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active",
      value: metrics.active,
      icon: Play,
      color: "text-blue-500",
    },
    {
      title: "Completed",
      value: metrics.completed,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: "Failed",
      value: metrics.failed,
      icon: XCircle,
      color: "text-red-500",
    },
    {
      title: "Paused",
      value: metrics.paused,
      icon: PauseCircle,
      color: "text-yellow-500",
    },
    {
      title: "Success Rate",
      value: `${metrics.successRate}%`,
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metricCards.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : metric.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
