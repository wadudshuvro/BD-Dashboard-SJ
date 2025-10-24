import { PipelineDataTable } from '@/components/bd/PipelineDataTable';
import { Badge } from '@/components/ui/badge';
import { useLocalDealsByStage } from '@/hooks/useDeals';
import { format } from 'date-fns';
import { usePagination } from '@/hooks/usePagination';
import { useNavigate, Link } from 'react-router-dom';

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
      label: 'Value', 
      render: formatCurrency 
    },
    { 
      key: 'updated_at' as const, 
      label: 'Last Update', 
      render: formatDate 
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
