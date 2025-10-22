import { PipelineDataTable } from '@/components/bd/PipelineDataTable';
import { Badge } from '@/components/ui/badge';
import { useControlTowerDealsByStage } from '@/hooks/useControlTowerData';
import { format } from 'date-fns';

interface StagePipelineTableProps {
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation';
  title: string;
  description: string;
}

export function StagePipelineTable({ stage, title, description }: StagePipelineTableProps) {
  const { data: deals = [], isLoading } = useControlTowerDealsByStage(stage);

  const formatCurrency = (value: any) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (value: any) => {
    if (!value) return '-';
    try {
      return format(new Date(value), 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const columns = [
    { key: 'deal_name' as const, label: 'Deal Name' },
    { key: 'client_name' as const, label: 'Client' },
    { key: 'client_contact_person' as const, label: 'Contact Person' },
    { 
      key: 'client_email' as const, 
      label: 'Email',
      render: (value: string) => value || '-'
    },
    { 
      key: 'client_phone' as const, 
      label: 'Phone',
      render: (value: string) => value || '-'
    },
    { 
      key: 'value' as const, 
      label: 'Value', 
      render: formatCurrency 
    },
    { 
      key: 'owner_name' as const, 
      label: 'Owner (SJ)',
      render: (value: string) => value || '-'
    },
    { 
      key: 'pm_assigned_name' as const, 
      label: 'PM (SJ)',
      render: (value: string) => value || '-'
    },
    { 
      key: 'lead_source' as const, 
      label: 'Source',
      render: (value: string) => value || '-'
    },
    { 
      key: 'close_date' as const, 
      label: 'Close Date', 
      render: formatDate 
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        <div className="mt-2">
          <Badge variant="secondary">{deals.length} Active Deals</Badge>
        </div>
      </div>

      <PipelineDataTable
        data={deals}
        columns={columns}
        isLoading={isLoading}
        emptyMessage={`No ${stage} deals found`}
        searchable
        externalLinkFn={(row) => row.hubspot_crm_deal_url}
      />
    </div>
  );
}
