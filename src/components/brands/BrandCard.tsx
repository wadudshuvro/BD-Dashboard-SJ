import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BrandWithKPIs } from '@/types/brand';

interface BrandCardProps {
  brand: BrandWithKPIs;
}

export const BrandCard = ({ brand }: BrandCardProps) => {
  const activeKPIs = brand.kpis?.filter((kpi) => kpi.is_active) || [];
  const totalKPIs = activeKPIs.length;
  const completedKPIs = activeKPIs.filter(
    (kpi) => kpi.current_value && kpi.target_value && kpi.current_value >= kpi.target_value
  ).length;

  const completionRate = totalKPIs > 0 ? Math.round((completedKPIs / totalKPIs) * 100) : 0;

  return (
    <Link to={`/brands/${brand.slug}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">{brand.name}</CardTitle>
                <CardDescription>{brand.description}</CardDescription>
              </div>
            </div>
            <Badge variant={brand.type === 'internal' ? 'default' : 'secondary'}>
              {brand.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">KPIs</p>
                <p className="text-sm font-medium">{totalKPIs} active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Completion</p>
                <p className="text-sm font-medium">{completionRate}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
