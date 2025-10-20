import { useEffect, useMemo, useState } from 'react';
import { Plus, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SyncControlTowerButton } from '@/components/bd/SyncControlTowerButton';
import { DealDialog, DealFormValues } from '@/components/bd/DealDialog';
import { DealDetailModal } from '@/components/bd/DealDetailModal';
import { DealFilters, DealFiltersState } from '@/components/bd/DealFilters';
import { useDeals, Deal, DealFilters as QueryDealFilters, DealStatus, DealStage } from '@/hooks/useDeals';
import { useClients } from '@/hooks/useClients';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { STATUS_BADGE_VARIANTS, STATUS_LABELS, STAGE_COLORS, STAGE_LABELS } from '@/lib/dealStages';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getUserDisplayName(users: ReturnType<typeof useAdminUsers>['users'], userId?: string | null) {
  if (!userId) return 'Unassigned';
  const user = users.find((item) => item.id === userId);
  if (!user) return 'Unassigned';
  if (user.first_name || user.last_name) {
    return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  }
  return user.email;
}

export default function Deals() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtersState, setFiltersState] = useState<DealFiltersState>({});
  const [sortBy, setSortBy] = useState<'title' | 'amount' | 'stage' | 'status' | 'probability' | 'close_date' | 'created_at'>(
    'created_at'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { clients } = useClients({ limit: 200 });
  const { users, fetchUsers } = useAdminUsers();

  useEffect(() => {
    fetchUsers({ limit: 200 }).catch((error) => {
      console.error('Failed to load users', error);
    });
  }, [fetchUsers]);

  const owners = useMemo(() => users, [users]);
  const pms = useMemo(() => users.filter((user) => user.role === 'pm' || user.role === 'manager'), [users]);

  const queryFilters = useMemo<QueryDealFilters>(() => ({
    stages: filtersState.stages ? (filtersState.stages as DealStage[]) : undefined,
    statuses: filtersState.statuses ? (filtersState.statuses as DealStatus[]) : undefined,
    ownerIds: filtersState.ownerIds,
    pmIds: filtersState.pmIds,
    dateFrom: filtersState.dateFrom ? filtersState.dateFrom.toISOString().split('T')[0] : null,
    dateTo: filtersState.dateTo ? filtersState.dateTo.toISOString().split('T')[0] : null,
    syncedOnly: filtersState.syncedOnly,
    search: filtersState.search?.trim() || undefined,
  }), [filtersState]);

  const { deals, loading, stats, createDeal, updateDeal, deleteDeal, assignProjectManager, updateDealStatus } = useDeals({
    filters: queryFilters,
    sortBy,
    sortOrder,
  });

  const openCreateDialog = () => {
    setEditingDeal(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (deal: Deal) => {
    setEditingDeal(deal);
    setIsDialogOpen(true);
  };

  const openDetailModal = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDetailOpen(true);
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder(column === 'title' ? 'asc' : 'desc');
    }
  };

  const handleDeleteDeal = async (deal: Deal) => {
    try {
      setIsDeleting(true);
      await deleteDeal(deal.id);
      setDealToDelete(null);
      if (selectedDeal?.id === deal.id) {
        setIsDetailOpen(false);
        setSelectedDeal(null);
      }
    } catch (error) {
      console.error('Failed to delete deal', error);
      toast.error('Unable to delete deal');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveDeal = async (values: DealFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingDeal) {
        await updateDeal(editingDeal.id, values);
      } else {
        await createDeal(values);
      }
      setIsDialogOpen(false);
      setEditingDeal(null);
    } catch (error) {
      console.error('Failed to save deal', error);
      toast.error('Unable to save deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignPm = async (dealId: string, pmId: string | null) => {
    try {
      await assignProjectManager(dealId, pmId);
    } catch (error) {
      console.error('Failed to assign PM', error);
      toast.error('Unable to assign project manager');
    }
  };

  const handleStatusChange = async (dealId: string, status: DealStatus) => {
    try {
      await updateDealStatus(dealId, status);
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error('Unable to update status');
    }
  };

  const ownerName = (deal: Deal) => getUserDisplayName(users, deal.owner_id);
  const pmName = (deal: Deal) => getUserDisplayName(users, deal.pm_assigned_id);
  const clientName = (deal: Deal) => {
    if (!deal.client_id) return 'Unassigned';
    const client = clients.find((item) => item.id === deal.client_id);
    return client?.name ?? 'Unassigned';
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals Pipeline</h1>
          <p className="text-muted-foreground">
            Manage opportunities, track progress, and sync with Control Tower.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Deal
          </Button>
          <SyncControlTowerButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.activeValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageDealSize)}</div>
          </CardContent>
        </Card>
      </div>

      <DealFilters filters={filtersState} onFiltersChange={setFiltersState} owners={owners} pms={pms} />

      <div className="rounded-xl border bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">
                  <button
                    type="button"
                    className="flex items-center gap-2 font-semibold"
                    onClick={() => handleSort('title')}
                  >
                    Deal
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-2 font-semibold"
                    onClick={() => handleSort('stage')}
                  >
                    Stage
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-2 font-semibold"
                    onClick={() => handleSort('amount')}
                  >
                    Amount
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>PM Assigned</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-2 font-semibold"
                    onClick={() => handleSort('probability')}
                  >
                    Probability
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-2 font-semibold"
                    onClick={() => handleSort('close_date')}
                  >
                    Close Date
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    Loading deals...
                  </TableCell>
                </TableRow>
              ) : deals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    No deals match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                deals.map((deal) => (
                  <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetailModal(deal)}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{deal.title}</span>
                        <span className="text-xs text-muted-foreground">Created {formatDate(deal.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{clientName(deal)}</TableCell>
                    <TableCell>
                      {deal.stage ? (
                        <Badge className={cn('capitalize', STAGE_COLORS[deal.stage])}>{STAGE_LABELS[deal.stage]}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(deal.amount)}</TableCell>
                    <TableCell>{ownerName(deal)}</TableCell>
                    <TableCell>{pmName(deal)}</TableCell>
                    <TableCell>{typeof deal.probability === 'number' ? `${deal.probability}%` : '—'}</TableCell>
                    <TableCell>{formatDate(deal.close_date)}</TableCell>
                    <TableCell>
                      {deal.status ? (
                        <Badge variant={STATUS_BADGE_VARIANTS[deal.status]} className="capitalize">
                          {STATUS_LABELS[deal.status]}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openDetailModal(deal)}>View details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(deal)}>Edit deal</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDealToDelete(deal)} className="text-destructive focus:text-destructive">
                            Delete deal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DealDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        deal={editingDeal}
        onSubmit={handleSaveDeal}
        isSubmitting={isSubmitting}
        clients={clients}
        owners={owners}
        pms={pms}
      />

      <DealDetailModal
        deal={selectedDeal}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={(deal) => {
          setEditingDeal(deal);
          setIsDialogOpen(true);
        }}
        onDelete={handleDeleteDeal}
        onStatusChange={handleStatusChange}
        onAssignPm={handleAssignPm}
        clients={clients}
        users={owners}
        pms={pms}
      />

      <AlertDialog open={!!dealToDelete} onOpenChange={(open) => !open && setDealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The deal will be permanently removed from the pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => dealToDelete && handleDeleteDeal(dealToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
