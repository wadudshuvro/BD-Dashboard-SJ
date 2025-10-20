import { useControlTowerDeals } from '@/hooks/useControlTowerData';
import { PipelineDataTable } from '@/components/bd/PipelineDataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Deals() {
  const { data: deals = [], isLoading } = useControlTowerDeals();

  const totalValue = deals
    .filter((d) => d.status === 'active')
    .reduce((sum, deal) => sum + (deal.value || 0), 0);

  const winRate = deals.length > 0
    ? (deals.filter((d) => d.status === 'won').length / deals.length) * 100
    : 0;

  const columns = [
    { key: 'deal_name' as const, label: 'Deal Name' },
    { key: 'client_name' as const, label: 'Client' },
    {
      key: 'stage' as const,
      label: 'Stage',
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'value' as const,
      label: 'Value',
      render: (value: number) => (value ? `$${value.toLocaleString()}` : '-'),
    },
    { key: 'owner_name' as const, label: 'Owner' },
    { key: 'pm_assigned_name' as const, label: 'PM Assigned' },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => (
        <Badge
          variant={
            value === 'won' ? 'default' : value === 'lost' ? 'destructive' : 'secondary'
          }
        >
          {value.toUpperCase()}
        </Badge>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Deals Pipeline</h1>
        <p className="text-muted-foreground">
          Active and historical deals with PM linkage
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Active Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals.filter((d) => d.status === 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <PipelineDataTable
        data={deals}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No deals found"
        searchable
      />
    </div>
  );
}
