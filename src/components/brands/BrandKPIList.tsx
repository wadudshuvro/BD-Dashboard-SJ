import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BrandKPI } from '@/types/brand';

interface BrandKPIListProps {
  kpis: BrandKPI[];
}

export const BrandKPIList = ({ kpis }: BrandKPIListProps) => {
  const formatValue = (value: number | undefined, type: string) => {
    if (value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getProgress = (current: number | undefined, target: number | undefined) => {
    if (!current || !target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getTrend = (current: number | undefined, target: number | undefined) => {
    if (!current || !target) return 'neutral';
    if (current >= target) return 'up';
    if (current >= target * 0.8) return 'neutral';
    return 'down';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => {
        const progress = getProgress(kpi.current_value, kpi.target_value);
        const trend = getTrend(kpi.current_value, kpi.target_value);

        return (
          <Card key={kpi.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{kpi.name}</CardTitle>
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {trend === 'neutral' && <Minus className="w-4 h-4 text-yellow-500" />}
              </div>
              {kpi.description && (
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {formatValue(kpi.current_value, kpi.kpi_type)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatValue(kpi.target_value, kpi.kpi_type)}
                  </span>
                </div>
                
                {kpi.target_value && (
                  <Progress value={progress} className="h-2" />
                )}
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {kpi.source}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(progress)}% complete
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
