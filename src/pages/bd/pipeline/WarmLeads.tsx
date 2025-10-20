import { useControlTowerWarmLeads } from '@/hooks/useControlTowerData';
import { PipelineDataTable } from '@/components/bd/PipelineDataTable';
import { format } from 'date-fns';

export default function WarmLeads() {
  const { data: warmLeads = [], isLoading } = useControlTowerWarmLeads();

  const columns = [
    { key: 'contact_name' as const, label: 'Contact' },
    { key: 'company' as const, label: 'Company' },
    { key: 'source' as const, label: 'Source' },
    {
      key: 'last_touch' as const,
      label: 'Last Touch',
      render: (value: string) => (value ? format(new Date(value), 'MMM dd, yyyy') : '-'),
    },
    { key: 'next_step' as const, label: 'Next Step' },
    { key: 'owner_name' as const, label: 'Owner' },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Warm Leads</h1>
        <p className="text-muted-foreground">
          HubSpot-synced qualified leads
        </p>
      </div>

      <PipelineDataTable
        data={warmLeads}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No warm leads found"
        searchable
        externalLinkFn={(row) => row.hubspot_url}
      />
    </div>
  );
}
