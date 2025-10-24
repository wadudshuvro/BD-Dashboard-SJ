import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useClients, type Client } from '@/hooks/useClients';
import { useDeals } from '@/hooks/useDeals';
import { useDealFiles } from '@/hooks/useDealFiles';

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
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { getClientById } = useClients();
  const { deals, loading: dealsLoading } = useDeals({ clientId, enabled: Boolean(clientId) });
  const { files, loading: filesLoading } = useDealFiles({ clientId, enabled: Boolean(clientId) });

  const [client, setClient] = useState<Client | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClient = async () => {
      if (!clientId) return;

      setIsLoadingClient(true);
      setError(null);

      try {
        const data = await getClientById(clientId);
        setClient(data);
      } catch (err) {
        console.error('Failed to load client', err);
        setError(err instanceof Error ? err.message : 'Unable to load client details');
      } finally {
        setIsLoadingClient(false);
      }
    };

    loadClient();
  }, [clientId, getClientById]);

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
  const relativeHubspotSync = client?.hubspot_last_sync ? formatRelativeDate(client.hubspot_last_sync) : null;

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
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back to clients
        </Button>
        {client?.hubspot_sync_status ? (
          <Badge variant="secondary" className="capitalize">
            HubSpot Sync: {client.hubspot_sync_status}
          </Badge>
        ) : null}
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
                {client?.hubspot_last_sync ? (
                  <span>
                    Last HubSpot Sync: {formatDate(client.hubspot_last_sync, true)}
                    {relativeHubspotSync ? ` (${relativeHubspotSync})` : ''}
                  </span>
                ) : null}
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
  );
}
