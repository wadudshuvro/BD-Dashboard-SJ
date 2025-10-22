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
import { Loader2, RefreshCw, CloudUpload, CloudDownload, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface SyncLog {
  id: string;
  sync_type: 'pull' | 'push';
  entity_type: string;
  status: string;
  error_message: string | null;
  payload: Record<string, unknown> | null;
  synced_at: string | null;
}

interface SyncConfig {
  auto_pull_enabled: boolean;
  auto_push_enabled: boolean;
  pull_schedule: 'hourly' | 'daily';
  push_schedule: 'hourly' | 'daily';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState({ entityType: 'all', status: 'all' });

  useEffect(() => {
    fetchSummary();
    fetchConfig();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data: logData, error: logError } = await supabase
        .from('control_tower_sync_log')
        .select('*')
        .order('synced_at', { ascending: false })
        .limit(100);

      if (logError) throw logError;
      setLogs((logData as SyncLog[]) || []);

      const { count: commentCount, error: commentError } = await supabase
        .from('deal_comments')
        .select('id', { count: 'exact', head: true })
        .eq('synced_to_control_tower', false);

      if (commentError) throw commentError;
      setPendingComments(commentCount ?? 0);

      const { count: checklistCount, error: checklistError } = await supabase
        .from('deal_checklist_items')
        .select('id', { count: 'exact', head: true })
        .eq('is_completed', true)
        .is('control_tower_synced_at', null);

      if (checklistError) throw checklistError;
      setPendingChecklist(checklistCount ?? 0);
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

      if (data?.configuration_data) {
        setConfig({ ...defaultConfig, ...(data.configuration_data as SyncConfig) });
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
        .upsert({
          user_id: user.id,
          configuration_type: 'control_tower_sync',
          configuration_data: config,
        });

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
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-control-tower-deals', { body: {} });
      if (error) throw error;
      toast({ title: 'Pull triggered', description: `Pulled ${data?.synced ?? 0} deals from Control Tower.` });
    } catch (error) {
      console.error('Pull sync failed', error);
      toast({ title: 'Error', description: 'Failed to trigger pull sync.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
      fetchSummary();
    }
  };

  const triggerPushSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('push-to-control-tower', {
        body: { entity_type: 'all' },
      });
      if (error) throw error;
      toast({ title: 'Push triggered', description: 'Push sync executed successfully.' });
    } catch (error) {
      console.error('Push sync failed', error);
      toast({ title: 'Error', description: 'Failed to trigger push sync.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
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
          <CardDescription>Trigger synchronization jobs outside of scheduled runs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={triggerPullSync} disabled={isSyncing || loading}>
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}
            Pull Now
          </Button>
          <Button variant="outline" onClick={triggerPushSync} disabled={isSyncing || loading}>
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
            Push Now
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
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No sync activity found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.synced_at ? format(new Date(log.synced_at), 'MMM dd, yyyy HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="capitalize">{log.sync_type}</TableCell>
                      <TableCell className="capitalize">{log.entity_type || '—'}</TableCell>
                      <TableCell>{renderStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.error_message || Object.keys(log.payload || {}).length === 0
                          ? log.error_message ?? '—'
                          : JSON.stringify(log.payload)}
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
