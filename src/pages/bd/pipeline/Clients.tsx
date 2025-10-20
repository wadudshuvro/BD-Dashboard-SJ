import { useControlTowerClients } from '@/hooks/useControlTowerData';
import { PipelineDataTable } from '@/components/bd/PipelineDataTable';
import { Badge } from '@/components/ui/badge';

export default function Clients() {
  const { data: clients = [], isLoading } = useControlTowerClients();

  const columns = [
    { key: 'name' as const, label: 'Client Name' },
    { key: 'industry' as const, label: 'Industry' },
    { key: 'owner_name' as const, label: 'Owner' },
    {
      key: 'active_projects_count' as const,
      label: 'Active Projects',
      render: (value: number) => (
        <Badge variant="secondary">{value || 0}</Badge>
      ),
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => (
        <Badge
          variant={value === 'active' ? 'default' : 'outline'}
          className="capitalize"
        >
          {value}
        </Badge>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Converted Clients</h1>
        <p className="text-muted-foreground">
          Directory of all converted accounts
        </p>
      </div>

      <PipelineDataTable
        data={clients}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No clients found"
        searchable
        externalLinkFn={(row) => `/clients/${row.id}`}
      />
    </div>
  );
}
