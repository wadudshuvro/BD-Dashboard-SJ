import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, RefreshCw, CloudUpload, CloudDownload, AlertCircle, CheckCircle2, Clock, CheckSquare } from 'lucide-react';

interface SyncLog {
  id: string;
  sync_type: 'pull' | 'push';
  entity_type: string;
  status: string;
  error_message: string | null;
  payload: Record<string, unknown> | null;
  synced_at: string | null;
  synced_by: string | null;
  entity_id: string | null;
  control_tower_id: string | null;
  synced_by_user?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

interface SyncConfig {
  auto_pull_enabled: boolean;
  auto_push_enabled: boolean;
  pull_schedule: 'hourly' | 'daily';
  push_schedule: 'hourly' | 'daily';
  retry_failed?: boolean;
  email_on_failure?: boolean;
}

const defaultConfig: SyncConfig = {
  auto_pull_enabled: true,
  auto_push_enabled: true,
  pull_schedule: 'hourly',
  push_schedule: 'hourly',
};

const ControlTowerSyncDashboard = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingComments, setPendingComments] = useState(0);
  const [pendingChecklist, setPendingChecklist] = useState(0);
  const [config, setConfig] = useState<SyncConfig>(defaultConfig);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isImportingChecklists, setIsImportingChecklists] = useState(false);
  const [filters, setFilters] = useState({ entityType: 'all', status: 'all' });

  useEffect(() => {
    fetchSummary();
    fetchConfig();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      // Fetch sync logs with user information
      const logQuery: any = supabase
        .from('control_tower_sync_log' as any)
        .select(`
          *,
          synced_by_user:synced_by(email, first_name, last_name)
        `)
        .order('synced_at', { ascending: false })
        .limit(100);
      
      const logResult = await logQuery;
      
      if (logResult.error) throw logResult.error;
      
      const mappedLogs: SyncLog[] = (logResult.data || []).map((log: any) => ({
        id: log.id,
        sync_type: log.sync_type as 'pull' | 'push',
        entity_type: log.entity_type,
        status: log.status,
        error_message: log.error_message || null,
        payload: log.payload || null,
        synced_at: log.synced_at,
        synced_by: log.synced_by || null,
        entity_id: log.entity_id || null,
        control_tower_id: log.control_tower_id || null,
        synced_by_user: log.synced_by_user || undefined,
      }));
      
      setLogs(mappedLogs);

      // Fetch pending comments count
      const commentQuery: any = supabase
        .from('deal_comments' as any)
        .select('id', { count: 'exact', head: true })
        .eq('synced_to_control_tower', false);
      
      const commentResult = await commentQuery;
      
      if (commentResult.error) throw commentResult.error;
      setPendingComments(commentResult.count ?? 0);

      // Fetch pending checklist items count
      const checklistQuery: any = supabase
        .from('deal_checklist_items' as any)
        .select('id', { count: 'exact', head: true })
        .eq('is_completed', true)
        .eq('synced_to_control_tower', false);
      
      const checklistResult = await checklistQuery;
      
      if (checklistResult.error) throw checklistResult.error;
      setPendingChecklist(checklistResult.count ?? 0);
    } catch (error) {
      console.error('Failed to load sync dashboard', error);
      toast({ title: 'Error', description: 'Unable to load sync information.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_configurations')
        .select('configuration_data')
        .eq('user_id', user.id)
        .eq('configuration_type', 'control_tower_sync')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.configuration_data && typeof data.configuration_data === 'object') {
        const configData = data.configuration_data as Record<string, any>;
        setConfig({ 
          ...defaultConfig, 
          auto_pull_enabled: configData.auto_pull_enabled ?? defaultConfig.auto_pull_enabled,
          auto_push_enabled: configData.auto_push_enabled ?? defaultConfig.auto_push_enabled,
          pull_schedule: configData.pull_schedule ?? defaultConfig.pull_schedule,
          push_schedule: configData.push_schedule ?? defaultConfig.push_schedule,
          retry_failed: configData.retry_failed ?? defaultConfig.retry_failed,
          email_on_failure: configData.email_on_failure ?? defaultConfig.email_on_failure,
        });
      } else {
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Failed to load sync config', error);
      toast({ title: 'Error', description: 'Could not load Control Tower sync settings.', variant: 'destructive' });
    } finally {
      setConfigLoading(false);
    }
  };

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_configurations')
        .upsert([{
          user_id: user.id,
          configuration_type: 'control_tower_sync',
          configuration_data: config as any,
        }]);

      if (error) throw error;
      toast({ title: 'Settings saved', description: 'Control Tower sync configuration updated.' });
    } catch (error) {
      console.error('Failed to save config', error);
      toast({ title: 'Error', description: 'Could not save Control Tower sync settings.', variant: 'destructive' });
    } finally {
      setConfigSaving(false);
    }
  };

  const triggerPullSync = async () => {
    setIsPulling(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-control-tower-deals', { body: {} });
      if (error) throw error;
      
      const summary = [
        `✅ Deals: ${data?.deals?.new || 0} new, ${data?.deals?.updated || 0} updated`,
        `👥 Clients: ${data?.clients?.new || 0} new, ${data?.clients?.updated || 0} updated`,
        `📋 Checklists: ${data?.checklists?.synced || 0} items synced`,
        `⏱️ Completed in ${((data?.duration || 0) / 1000).toFixed(1)}s`
      ];
      
      const totalFailed = (data?.deals?.failed || 0) + (data?.checklists?.failed || 0);
      if (totalFailed > 0) {
        summary.push(`⚠️ Failed: ${totalFailed} items`);
      }
      
      toast({ 
        title: totalFailed > 0 ? '⚠️ Pull Sync Completed with Issues' : '✅ Pull Sync Complete',
        description: summary.join('\n'),
        variant: totalFailed > 0 ? 'destructive' : 'default',
        duration: 8000
      });
    } catch (error: any) {
      toast({ title: '❌ Sync Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsPulling(false);
      fetchSummary();
    }
  };

  const triggerPushSync = async () => {
    setIsPushing(true);
    try {
      const { data, error } = await supabase.functions.invoke('push-to-control-tower', {
        body: { entity_type: 'all' },
      });
      if (error) throw error;
      
      const summary = [
        `💬 Comments: ${data?.comments_synced || 0} synced`,
        `☑️ Checklists: ${data?.checklists_synced || 0} synced`,
        `⏱️ Completed in ${(data?.duration / 1000 || 0).toFixed(1)}s`
      ];
      
      if (data?.failed > 0) {
        summary.push(`⚠️ Failed: ${data.failed} items`);
      }
      
      toast({ 
        title: data?.failed > 0 ? '⚠️ Push Sync Completed with Issues' : '✅ Push Sync Complete',
        description: summary.join('\n'),
        variant: data?.failed > 0 ? 'destructive' : 'default',
        duration: 8000
      });
    } catch (error: any) {
      toast({ title: '❌ Sync Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsPushing(false);
      fetchSummary();
    }
  };

  const triggerChecklistImport = async () => {
    setIsImportingChecklists(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-checklist-only');
      if (error) throw error;
      
      const summary = [
        `📋 ${data.synced} items imported`,
        `⏭️ ${data.skipped} skipped`,
        `⏱️ Completed in ${(data.duration / 1000).toFixed(1)}s`
      ];
      
      if (data.failed > 0) {
        summary.push(`⚠️ Failed: ${data.failed} items`);
      }
      
      toast({ 
        title: data.failed > 0 ? '⚠️ Checklist Import Completed with Issues' : '✅ Checklist Import Complete',
        description: summary.join('\n'),
        variant: data.failed > 0 ? 'destructive' : 'default',
        duration: 8000
      });
    } catch (error: any) {
      toast({ title: '❌ Import Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsImportingChecklists(false);
      fetchSummary();
    }
  };

  const lastPull = useMemo(() => logs.find((log) => log.sync_type === 'pull'), [logs]);
  const lastPush = useMemo(() => logs.find((log) => log.sync_type === 'push'), [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const entityMatch = filters.entityType === 'all' || log.entity_type === filters.entityType;
      const statusMatch = filters.status === 'all' || log.status === filters.status;
      return entityMatch && statusMatch;
    });
  }, [logs, filters]);

  const renderStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <Badge variant="outline" className="bg-green-600/10 text-green-700">
          <CheckCircle2 className="mr-1 h-3 w-3" /> Success
        </Badge>
      );
    }
    if (status === 'failed') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" /> Failed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" /> {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Control Tower Sync</h1>
        <p className="text-muted-foreground mt-2">
          Monitor bi-directional synchronization between Business Development Portal and Control Tower CRM.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Pull</CardTitle>
            <CardDescription>Inbound sync from Control Tower</CardDescription>
          </CardHeader>
          <CardContent>
            {lastPull?.synced_at ? (
              <p className="text-sm font-medium">
                {formatDistanceToNow(new Date(lastPull.synced_at), { addSuffix: true })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No pull sync recorded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Push</CardTitle>
            <CardDescription>Outbound updates to Control Tower</CardDescription>
          </CardHeader>
          <CardContent>
            {lastPush?.synced_at ? (
              <p className="text-sm font-medium">
                {formatDistanceToNow(new Date(lastPush.synced_at), { addSuffix: true })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No push sync recorded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Comments</CardTitle>
            <CardDescription>Unsynced user discussions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingComments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Checklist Items</CardTitle>
            <CardDescription>Completed items awaiting push</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingChecklist}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Sync</CardTitle>
          <CardDescription>Sync all deal data including estimates, proposals, PODs, categories, and collaboration links from Control Tower</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={triggerPullSync} disabled={isPulling || loading}>
            {isPulling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}
            {isPulling ? 'Pulling...' : 'Pull Now'}
          </Button>
          <Button variant="outline" onClick={triggerPushSync} disabled={isPushing || loading}>
            {isPushing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
            {isPushing ? 'Pushing...' : 'Push Now'}
          </Button>
          <Button variant="secondary" onClick={triggerChecklistImport} disabled={isImportingChecklists || loading}>
            {isImportingChecklists ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
            {isImportingChecklists ? 'Importing...' : 'Import Checklists'}
          </Button>
          <Button variant="ghost" onClick={fetchSummary} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
          <CardDescription>Configure automatic pull and push schedules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {configLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading settings...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded border border-border p-3">
                  <div>
                    <Label className="text-sm font-medium">Auto Pull Enabled</Label>
                    <p className="text-xs text-muted-foreground">Fetch latest deals hourly from Control Tower.</p>
                  </div>
                  <Switch
                    checked={config.auto_pull_enabled}
                    onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, auto_pull_enabled: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pull Frequency</Label>
                  <Select
                    value={config.pull_schedule}
                    onValueChange={(value: SyncConfig['pull_schedule']) =>
                      setConfig((prev) => ({ ...prev, pull_schedule: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every hour</SelectItem>
                      <SelectItem value="daily">Once daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded border border-border p-3">
                  <div>
                    <Label className="text-sm font-medium">Auto Push Enabled</Label>
                    <p className="text-xs text-muted-foreground">Send local updates back to Control Tower automatically.</p>
                  </div>
                  <Switch
                    checked={config.auto_push_enabled}
                    onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, auto_push_enabled: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Push Frequency</Label>
                  <Select
                    value={config.push_schedule}
                    onValueChange={(value: SyncConfig['push_schedule']) =>
                      setConfig((prev) => ({ ...prev, push_schedule: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every hour</SelectItem>
                      <SelectItem value="daily">Once daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={saveConfig} disabled={configSaving}>
                  {configSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Settings
                </Button>
                <Button variant="outline" onClick={fetchConfig} disabled={configLoading}>
                  Reset
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle>Sync Activity Log</CardTitle>
            <CardDescription>Audit trail of recent synchronization jobs.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={filters.entityType}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, entityType: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="deal">Deals</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
                <SelectItem value="stage_change">Stage changes</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading sync logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="mb-2 h-10 w-10" />
              <p className="text-sm">No sync activity found. Try adjusting filters or trigger a manual sync.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered By</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={log.sync_type === 'pull' ? 'default' : 'outline'}>
                          {log.sync_type === 'pull' ? (
                            <><CloudDownload className="mr-1 h-3 w-3" /> Pull</>
                          ) : (
                            <><CloudUpload className="mr-1 h-3 w-3" /> Push</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{log.entity_type.replace('_', ' ')}</TableCell>
                      <TableCell>{renderStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm">
                        {log.synced_by_user ? (
                          <div>
                            <div className="font-medium">
                              {log.synced_by_user.first_name && log.synced_by_user.last_name
                                ? `${log.synced_by_user.first_name} ${log.synced_by_user.last_name}`
                                : log.synced_by_user.email}
                            </div>
                            {log.synced_by_user.first_name && log.synced_by_user.last_name && (
                              <div className="text-xs text-muted-foreground">{log.synced_by_user.email}</div>
                            )}
                          </div>
                        ) : log.synced_by ? (
                          <span className="text-muted-foreground">User ID: {log.synced_by.slice(0, 8)}...</span>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.synced_at ? format(new Date(log.synced_at), 'MMM dd, HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {log.error_message ? (
                          <span className="text-xs text-destructive">{log.error_message}</span>
                        ) : log.payload ? (
                          <span className="text-xs text-muted-foreground">
                            {typeof log.payload.synced === 'number' && `${log.payload.synced} items`}
                            {typeof log.payload.duration === 'number' && ` in ${(log.payload.duration / 1000).toFixed(1)}s`}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ControlTowerSyncDashboard;