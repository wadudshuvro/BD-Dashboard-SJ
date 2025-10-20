import { useControlTowerLeads } from '@/hooks/useControlTowerData';
import { PipelineDataTable } from '@/components/bd/PipelineDataTable';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function LeadInbox() {
  const { data: leads = [], isLoading } = useControlTowerLeads();

  const columns = [
    { key: 'name' as const, label: 'Name' },
    { key: 'company' as const, label: 'Company' },
    {
      key: 'source' as const,
      label: 'Source',
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      ),
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => (
        <Badge
          variant={value === 'hot' ? 'default' : value === 'warm' ? 'secondary' : 'outline'}
        >
          {value.toUpperCase()}
        </Badge>
      ),
    },
    { key: 'owner_name' as const, label: 'Owner' },
    {
      key: 'created_at' as const,
      label: 'Date Created',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lead Inbox</h1>
        <p className="text-muted-foreground">
          All unqualified leads synced from Control Tower
        </p>
      </div>

      <PipelineDataTable
        data={leads}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No leads found"
        searchable
      />
    </div>
  );
}
