import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Building,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
  FileText,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useClientBySlug } from '@/hooks/useClientBySlug';
import { useDeals } from '@/hooks/useDeals';
import { useDealFiles } from '@/hooks/useDealFiles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

type AgentStructuredOutput = {
  industry?: string | null;
  employee_count?: number | string | null;
  revenue?: number | string | null;
  notes?: string | null;
  summary?: string | null;
};

function formatDate(value?: string | null, withTime = false) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    return withTime ? format(date, 'PPpp') : format(date, 'PP');
  } catch {
    return '—';
  }
}

function formatRelativeDate(value?: string | null) {
  if (!value) return null;
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return null;
  }
}

export default function ClientDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: client, isLoading: isLoadingClient, error: fetchError } = useClientBySlug(slug);
  const clientId = client?.id;
  const { deals, loading: dealsLoading } = useDeals({ clientId, enabled: Boolean(clientId) });
  const { files, loading: filesLoading } = useDealFiles({ clientId, enabled: Boolean(clientId) });

  const error = fetchError ? 'Unable to load client details' : null;

  const [isRunning, setIsRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentOutput, setAgentOutput] = useState<AgentStructuredOutput | null>(null);
  const [isApplyingUpdates, setIsApplyingUpdates] = useState(false);

  const parseNumericValue = (value: AgentStructuredOutput[keyof AgentStructuredOutput]) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.]/g, '');
      if (!cleaned) return undefined;
      const parsed = Number.parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      if (isRunning || isApplyingUpdates) {
        return;
      }
      setIsModalOpen(false);
      setAgentOutput(null);
      return;
    }
    setIsModalOpen(true);
  };

  const handleRunAgent = async () => {
    if (!client?.id) {
      toast({
        title: 'Client unavailable',
        description: 'Select a client before running the AI agent.',
        variant: 'destructive',
      });
      return;
    }

    setIsModalOpen(true);
    setIsRunning(true);
    setAgentOutput(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('run-ai-agent', {
        body: { agent_type: 'research', target: 'client', client_id: client.id },
      });

      if (functionError) {
        throw functionError;
      }

      const structuredOutput = (data as { structured_output?: AgentStructuredOutput })?.structured_output ?? null;

      if (!structuredOutput) {
        toast({
          title: 'No suggestions found',
          description: 'The AI agent did not return any enrichment data.',
        });
        return;
      }

      setAgentOutput(structuredOutput);
      toast({
        title: 'AI suggestions ready',
        description: 'Review the proposed updates before applying them.',
      });
    } catch (err) {
      console.error('Error running AI agent:', err);
      toast({
        title: 'Failed to run AI agent',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplySuggestions = async () => {
    if (!client?.id) {
      toast({
        title: 'Client unavailable',
        description: 'Unable to update this client right now.',
        variant: 'destructive',
      });
      return;
    }

    if (!agentOutput) {
      toast({
        title: 'No suggestions to apply',
        description: 'Run the AI agent to load suggestions before confirming.',
      });
      return;
    }

    const updatePayload: Record<string, unknown> = {};

    if (agentOutput.industry) {
      updatePayload.industry = agentOutput.industry;
    }

    const teamSize = parseNumericValue(agentOutput.employee_count);
    if (typeof teamSize === 'number') {
      updatePayload.team_size = teamSize;
    }

    const companyRevenue = parseNumericValue(agentOutput.revenue);
    if (typeof companyRevenue === 'number') {
      updatePayload.company_revenue = companyRevenue;
    }

    const notesValue = agentOutput.notes ?? agentOutput.summary;
    if (notesValue) {
      updatePayload.notes = notesValue;
    }

    if (Object.keys(updatePayload).length === 0) {
      toast({
        title: 'Nothing to update',
        description: 'The AI agent did not provide new client data to apply.',
      });
      return;
    }

    setIsApplyingUpdates(true);

    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update(updatePayload)
        .eq('id', client.id);

      if (updateError) {
        throw updateError;
      }

      await queryClient.invalidateQueries({ queryKey: ['client-by-slug', slug] });
      toast({
        title: 'Client updated',
        description: 'AI-enriched data has been applied successfully.',
      });
      setIsModalOpen(false);
      setAgentOutput(null);
    } catch (err) {
      console.error('Error applying AI suggestions:', err);
      toast({
        title: 'Failed to update client',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingUpdates(false);
    }
  };

  const handleCancel = () => {
    if (isRunning || isApplyingUpdates) {
      return;
    }
    setIsModalOpen(false);
    setAgentOutput(null);
  };

  const primaryContact = useMemo(
    () =>
      [
        client?.contact_person && {
          icon: User,
          label: 'Point of Contact',
          value: client.contact_person,
        },
        client?.email && {
          icon: Mail,
          label: 'Email',
          value: client.email,
        },
        client?.phone && {
          icon: Phone,
          label: 'Phone',
          value: client.phone,
        },
        client?.website && {
          icon: Globe,
          label: 'Website',
          value: client.website,
        },
        (client?.address || client?.city || client?.state || client?.country) && {
          icon: MapPin,
          label: 'Location',
          value: [client?.address, client?.city, client?.state, client?.country].filter(Boolean).join(', '),
        },
        client?.company && {
          icon: Building,
          label: 'Company',
          value: client.company,
        },
      ].filter(Boolean) as { icon: LucideIcon; label: string; value: string }[],
    [client]
  );

  const relativeUpdatedAt = formatRelativeDate(client?.updated_at);

  const createDealSlug = (dealTitle: string | null | undefined, dealId: string) => {
    const slug = (dealTitle || 'deal')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug ? `${slug}-${dealId}` : `deal-${dealId}`;
  };

  if (!isLoadingClient && !client && !error) {
    return (
      <div className="container mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Back to clients
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Client not found</CardTitle>
          </CardHeader>
          <CardContent>This client may have been removed or is unavailable.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply AI Suggestions</DialogTitle>
            <DialogDescription>
              Review the AI-enriched client fields and confirm to update this record.
            </DialogDescription>
          </DialogHeader>
          {isRunning && !agentOutput ? (
            <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-4 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Running AI agent and preparing suggestions…</span>
            </div>
          ) : agentOutput ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2">
                <span className="font-medium">Industry</span>
                <span className="rounded-md border bg-muted/40 p-2">
                  {agentOutput.industry || '—'}
                </span>
              </div>
              <div className="grid gap-2">
                <span className="font-medium">Employee Count</span>
                <span className="rounded-md border bg-muted/40 p-2">
                  {agentOutput.employee_count ?? '—'}
                </span>
              </div>
              <div className="grid gap-2">
                <span className="font-medium">Revenue</span>
                <span className="rounded-md border bg-muted/40 p-2">
                  {agentOutput.revenue ?? '—'}
                </span>
              </div>
              <div className="grid gap-2">
                <span className="font-medium">Notes</span>
                <span className="rounded-md border bg-muted/40 p-2">
                  {agentOutput.notes ?? agentOutput.summary ?? '—'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run the AI agent to generate suggestions for this client.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isRunning || isApplyingUpdates}>
              Cancel
            </Button>
            <Button
              onClick={handleApplySuggestions}
              disabled={isRunning || isApplyingUpdates || !agentOutput}
              className="gap-2"
            >
              {isApplyingUpdates ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isApplyingUpdates ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Back to clients
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleRunAgent}
                  disabled={isRunning || isApplyingUpdates || !client}
                  className="gap-2"
                >
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isRunning ? 'Running…' : 'Run Agent'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Use AI Agent to analyze and fill missing company data.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load client</CardTitle>
          </CardHeader>
          <CardContent>{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            {isLoadingClient ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ) : (
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold">
                  {client?.name || 'Unknown client'}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {client?.industry ? <Badge variant="outline">{client.industry}</Badge> : null}
                  {client?.status ? <Badge className="capitalize">{client.status}</Badge> : null}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {isLoadingClient ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : (
              <div className="space-y-3">
                {primaryContact.length === 0 ? (
                  <p className="text-muted-foreground">No contact details available.</p>
                ) : (
                  primaryContact.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-muted-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <Separator />

            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">Metadata</p>
              <div className="grid gap-1 text-sm text-muted-foreground">
                <span>Created: {formatDate(client?.created_at)}</span>
                <span>
                  Last Updated: {formatDate(client?.updated_at)}
                  {relativeUpdatedAt ? ` (${relativeUpdatedAt})` : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Associated Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {dealsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deals found for this client.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Close Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow
                        key={deal.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          navigate(
                            `/${(deal.stage || 'prospecting').toLowerCase()}/${createDealSlug(deal.title, deal.id)}`
                          )
                        }
                      >
                        <TableCell className="font-medium">{deal.title || 'Untitled deal'}</TableCell>
                        <TableCell className="capitalize">{deal.status || '—'}</TableCell>
                        <TableCell className="capitalize">{deal.stage || '—'}</TableCell>
                        <TableCell className="text-right">
                          {typeof deal.amount === 'number'
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                              }).format(deal.amount)
                            : '—'}
                        </TableCell>
                        <TableCell>{formatDate(deal.close_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Stored Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stored files for this client.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => {
                    const driveUrl = file.drive_folder_url ?? undefined;
                    const lastSync = file.drive_last_modified_at ?? file.updated_at;
                    const relativeSync = formatRelativeDate(lastSync);

                    return (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.drive_file_name || 'Untitled File'}</TableCell>
                        <TableCell>Google Drive</TableCell>
                        <TableCell>
                          {file.category ? (
                            <Badge variant="outline">{file.category}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Uncategorized</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(lastSync, true)}</span>
                            {relativeSync ? <span className="text-xs text-muted-foreground">{relativeSync}</span> : null}
                          </div>
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild disabled={!driveUrl}>
                            <a href={driveUrl || '#'} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" /> Drive
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
