import { useClients } from '@/hooks/useClients';
import { PipelineDataTable } from '@/components/bd/PipelineDataTable';
import { Badge } from '@/components/ui/badge';
import { usePagination } from '@/hooks/usePagination';
import { useNavigate } from 'react-router-dom';
import { SyncControlTowerButton } from '@/components/bd/SyncControlTowerButton';
import { LastSyncDetails } from '@/components/bd/LastSyncDetails';

export default function Clients() {
  const pagination = usePagination(25);
  const navigate = useNavigate();
  const { clients, loading: isLoading, totalCount } = useClients({
    page: pagination.currentPage,
    limit: pagination.pageSize
  });

  const columns = [
    { key: 'name' as const, label: 'Client Name' },
    { key: 'company' as const, label: 'Company' },
    { key: 'industry' as const, label: 'Industry' },
    { key: 'contact_person' as const, label: 'Contact Person' },
    { key: 'email' as const, label: 'Email' },
    { key: 'phone' as const, label: 'Phone' },
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
    <div className="container mx-auto py-8 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Converted Clients</h1>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {isLoading ? '...' : totalCount}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Directory of all converted accounts
          </p>
        </div>
        <SyncControlTowerButton />
      </div>

      <LastSyncDetails />

      <PipelineDataTable
        data={clients}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No clients found"
        searchable
        onRowClick={(row) => navigate(`/clients/${row.slug}`)}
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
