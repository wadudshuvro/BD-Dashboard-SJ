import { PipelineDataTable } from '@/components/bd/PipelineDataTable';
import { Badge } from '@/components/ui/badge';
import { useLocalDealsByStage } from '@/hooks/useDeals';
import { format } from 'date-fns';
import { usePagination } from '@/hooks/usePagination';
import { useNavigate, Link } from 'react-router-dom';
import { STAGE_LABELS, DealStage } from '@/lib/dealStages';

interface StagePipelineTableProps {
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation';
  title: string;
  description: string;
}

export function StagePipelineTable({ stage, title, description }: StagePipelineTableProps) {
  const pagination = usePagination(25);
  const { data, isLoading } = useLocalDealsByStage(stage, pagination.currentPage, pagination.pageSize);
  const navigate = useNavigate();
  
  const deals = data?.data || [];
  const totalCount = data?.total || 0;

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

  const createDealSlug = (dealName: string, dealId: string) => {
    const slug = dealName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `/${stage}/${slug}-${dealId}`;
  };

  const columns = [
    { 
      key: 'deal_name' as const, 
      label: 'Deal Name',
      render: (value: string, row: any) => (
        <a
          href={createDealSlug(value || 'untitled', row.id)}
          className="text-primary hover:underline font-medium"
          onClick={(e) => {
            e.preventDefault();
            navigate(createDealSlug(value || 'untitled', row.id));
          }}
        >
          {value || 'Untitled Deal'}
        </a>
      )
    },
    { 
      key: 'client_name' as const, 
      label: 'Client',
      render: (value: string, row: any) => {
        if (!value || value === '-' || !row.client_slug) return value || '-';
        return (
          <Link 
            to={`/clients/${row.client_slug}`}
            className="text-primary hover:underline"
          >
            {value}
          </Link>
        );
      }
    },
    { 
      key: 'value' as const, 
      label: 'Amount', 
      render: formatCurrency 
    },
    { 
      key: 'stage' as const, 
      label: 'Stage',
      render: (value: string) => {
        const label = STAGE_LABELS[value as DealStage] || value;
        return <Badge variant="secondary">{label}</Badge>;
      }
    },
    { 
      key: 'dealtype' as const, 
      label: 'Type',
      render: (value: string) => {
        if (!value) return '-';
        return value === 'newbusiness' ? 'New Business' : 'Existing Business';
      }
    },
    { 
      key: 'category' as const, 
      label: 'Category',
      render: (value: string) => value || '-'
    },
    { 
      key: 'created_at' as const, 
      label: 'Create Date', 
      render: formatDate 
    },
    { 
      key: 'close_date' as const, 
      label: 'Close Date', 
      render: formatDate 
    },
    { 
      key: 'pod_name' as const, 
      label: 'POD',
      render: (value: string) => value || '-'
    },
    { 
      key: 'lead_source' as const, 
      label: 'Source',
      render: (value: string) => value || '-'
    },
  ];

  return (
    <div>
      {title && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          <div className="mt-2">
            <Badge variant="secondary">{deals.length} Active Deals</Badge>
          </div>
        </div>
      )}

      <PipelineDataTable
        data={deals}
        columns={columns}
        isLoading={isLoading}
        emptyMessage={`No ${stage} deals found`}
        searchable
        externalLinkFn={(row) => row.hubspot_crm_deal_url}
        totalCount={totalCount}
        currentPage={pagination.currentPage}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setCurrentPage}
        onPageSizeChange={(size) => {
          pagination.setPageSize(size);
          pagination.reset();
        }}
      />
    </div>
  );
}
