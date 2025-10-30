import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, RefreshCw, CloudUpload, CloudDownload, AlertCircle, CheckCircle2, Clock, Trash2, Network, Activity, Settings, History, Calendar } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

interface DealCounts {
  prospecting: number;
  qualification: number;
  proposal: number;
  negotiation: number;
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
  const [dealCounts, setDealCounts] = useState<DealCounts>({ prospecting: 0, qualification: 0, proposal: 0, negotiation: 0 });
  const [config, setConfig] = useState<SyncConfig>(defaultConfig);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isSyncingPods, setIsSyncingPods] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [filters, setFilters] = useState({ entityType: 'all', status: 'all' });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  useEffect(() => {
    fetchSummary();
    fetchConfig();
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchSummary();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

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

      // Fetch deal counts by stage
      const dealsQuery: any = supabase
        .from('deals' as any)
        .select('stage');
      
      const dealsResult = await dealsQuery;
      
      if (!dealsResult.error && dealsResult.data) {
        const counts: DealCounts = {
          prospecting: dealsResult.data.filter((d: any) => d.stage === 'prospecting').length,
          qualification: dealsResult.data.filter((d: any) => d.stage === 'qualification').length,
          proposal: dealsResult.data.filter((d: any) => d.stage === 'proposal').length,
          negotiation: dealsResult.data.filter((d: any) => d.stage === 'negotiation').length,
        };
        setDealCounts(counts);
      }
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

  const triggerPullSync = async (fullSync: boolean = false) => {
    setIsPulling(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-control-tower-deals', { 
        body: { forceFullSync: fullSync } 
      });
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
        title: fullSync 
          ? (totalFailed > 0 ? '⚠️ Full Sync Completed with Issues' : '✅ Full Sync Complete')
          : (totalFailed > 0 ? '⚠️ Pull Sync Completed with Issues' : '✅ Pull Sync Complete'),
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

  const triggerPodSync = async () => {
    setIsSyncingPods(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-control-tower-pods');
      if (error) throw error;
      
      toast({ 
        title: '✅ POD Sync Complete',
        description: `Imported ${data?.podsImported || 0} PODs from Control Tower`,
        duration: 5000
      });
    } catch (error: any) {
      toast({ title: '❌ POD Sync Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsSyncingPods(false);
      fetchSummary();
    }
  };

  const clearAllLogs = async () => {
    setIsClearingLogs(true);
    try {
      const { error } = await supabase.rpc('clear_all_sync_logs');
      if (error) throw error;
      
      setShowClearDialog(false);
      
      toast({ 
        title: '✅ Logs Cleared',
        description: 'All sync logs have been deleted.',
      });
      
      await fetchSummary();
    } catch (error: any) {
      console.error('Clear logs error:', error);
      toast({ 
        title: '❌ Clear Failed', 
        description: error.message || 'Failed to clear logs', 
        variant: 'destructive' 
      });
    } finally {
      setIsClearingLogs(false);
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

  const getSyncStatusIndicator = () => {
    if (isPulling || isPushing || isSyncingPods) {
      return <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />;
    }
    if (lastPull?.status === 'failed' || lastPush?.status === 'failed') {
      return <span className="flex h-2 w-2 rounded-full bg-red-500" />;
    }
    if (lastPull || lastPush) {
      return <span className="flex h-2 w-2 rounded-full bg-green-500" />;
    }
    return <span className="flex h-2 w-2 rounded-full bg-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getSyncStatusIndicator()}
          <div>
            <h1 className="text-3xl font-bold">Control Tower</h1>
            <p className="text-muted-foreground mt-1">
              Bi-directional sync with Control Tower CRM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
          <Label htmlFor="auto-refresh" className="text-sm">
            Auto-refresh {autoRefresh && `(${refreshCountdown}s)`}
          </Label>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Jobs
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
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
              <CardDescription>Trigger immediate synchronization operations</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button 
                onClick={() => triggerPullSync(false)} 
                disabled={isPulling || loading}
                title="Pull active deals only (faster)"
              >
                {isPulling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}
                {isPulling ? 'Pulling...' : 'Pull Now (Active)'}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="default" 
                    disabled={isPulling || loading}
                    title="Full sync of all deals (may take several minutes)"
                  >
                    <CloudDownload className="mr-2 h-4 w-4" />
                    Full Sync (All)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Full Sync</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sync ALL deals from Control Tower, including closed deals. 
                      This operation may take several minutes depending on the data volume.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => triggerPullSync(true)}>
                      Start Full Sync
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button 
                variant="outline" 
                onClick={triggerPushSync} 
                disabled={isPushing || loading}
                title="Push local comments and checklist updates"
              >
                {isPushing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
                {isPushing ? 'Pushing...' : 'Push Now'}
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={triggerPodSync} 
                disabled={isSyncingPods || loading}
                title="Sync POD data from Control Tower"
              >
                {isSyncingPods ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Network className="mr-2 h-4 w-4" />}
                {isSyncingPods ? 'Syncing PODs...' : 'Sync PODs'}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={fetchSummary} 
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> 
                Refresh
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Coverage</CardTitle>
              <CardDescription>Local database deal counts by pipeline stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div>Stage</div>
                  <div className="text-right">Deal Count</div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Prospecting</span>
                    </div>
                    <div className="text-right font-mono font-semibold">{dealCounts.prospecting}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Qualification</span>
                    </div>
                    <div className="text-right font-mono font-semibold">{dealCounts.qualification}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Proposal</span>
                    </div>
                    <div className="text-right font-mono font-semibold">{dealCounts.proposal}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Negotiation</span>
                    </div>
                    <div className="text-right font-mono font-semibold">{dealCounts.negotiation}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t pt-3 font-semibold">
                    <div>Total Deals</div>
                    <div className="text-right font-mono">
                      {dealCounts.prospecting + dealCounts.qualification + dealCounts.proposal + dealCounts.negotiation}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sync Activity Log</CardTitle>
                  <CardDescription>Recent synchronization operations and their status</CardDescription>
                </div>
                <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All Logs
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Sync Logs?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all sync history from the database. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearAllLogs}
                        disabled={isClearingLogs}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isClearingLogs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isClearingLogs ? 'Clearing...' : 'Clear Logs'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-3">
                <Select value={filters.entityType} onValueChange={(v) => setFilters({ ...filters, entityType: v })}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deal">Deal</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="checklist">Checklist</SelectItem>
                    <SelectItem value="comment">Comment</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No sync logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {log.synced_at ? format(new Date(log.synced_at), 'MMM dd, HH:mm:ss') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {log.sync_type === 'pull' ? (
                              <Badge variant="secondary" className="gap-1">
                                <CloudDownload className="h-3 w-3" /> Pull
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <CloudUpload className="h-3 w-3" /> Push
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{log.entity_type}</TableCell>
                          <TableCell>{renderStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-xs">
                            {log.synced_by_user?.email || 'System'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.error_message ? (
                              <span className="text-destructive">{log.error_message}</span>
                            ) : (
                              log.control_tower_id || '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Jobs Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          {configLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Automatic Pull Sync</CardTitle>
                  <CardDescription>Scheduled inbound sync from Control Tower</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-pull">Enable Automatic Pull</Label>
                    <Switch
                      id="auto-pull"
                      checked={config.auto_pull_enabled}
                      onCheckedChange={(checked) => setConfig({ ...config, auto_pull_enabled: checked })}
                    />
                  </div>
                  {config.auto_pull_enabled && (
                    <div className="space-y-2">
                      <Label>Sync Frequency</Label>
                      <Select
                        value={config.pull_schedule}
                        onValueChange={(v: 'hourly' | 'daily') => setConfig({ ...config, pull_schedule: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Every Hour</SelectItem>
                          <SelectItem value="daily">Daily (at midnight)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automatic Push Sync</CardTitle>
                  <CardDescription>Scheduled outbound sync to Control Tower</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-push">Enable Automatic Push</Label>
                    <Switch
                      id="auto-push"
                      checked={config.auto_push_enabled}
                      onCheckedChange={(checked) => setConfig({ ...config, auto_push_enabled: checked })}
                    />
                  </div>
                  {config.auto_push_enabled && (
                    <div className="space-y-2">
                      <Label>Sync Frequency</Label>
                      <Select
                        value={config.push_schedule}
                        onValueChange={(v: 'hourly' | 'daily') => setConfig({ ...config, push_schedule: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Every Hour</SelectItem>
                          <SelectItem value="daily">Daily (at midnight)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Options</CardTitle>
                  <CardDescription>Error handling and notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="retry-failed">Retry Failed Syncs</Label>
                      <p className="text-sm text-muted-foreground">Automatically retry failed sync operations</p>
                    </div>
                    <Switch
                      id="retry-failed"
                      checked={config.retry_failed || false}
                      onCheckedChange={(checked) => setConfig({ ...config, retry_failed: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-failure">Email on Failure</Label>
                      <p className="text-sm text-muted-foreground">Send email notifications for sync failures</p>
                    </div>
                    <Switch
                      id="email-failure"
                      checked={config.email_on_failure || false}
                      onCheckedChange={(checked) => setConfig({ ...config, email_on_failure: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={saveConfig} disabled={configSaving}>
                {configSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {configSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Information</CardTitle>
              <CardDescription>How Control Tower synchronization works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🔽 Pull Sync (Control Tower → BD Portal)</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Imports active deals and their details</li>
                  <li>Syncs client information</li>
                  <li>Updates checklist items from Control Tower</li>
                  <li>Preserves local comments and annotations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔼 Push Sync (BD Portal → Control Tower)</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Sends new comments to Control Tower deals</li>
                  <li>Updates completed checklist items</li>
                  <li>Maintains bidirectional data consistency</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⚡ Best Practices</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Use "Pull Now (Active)" for regular updates</li>
                  <li>Reserve "Full Sync" for initial setup or major discrepancies</li>
                  <li>Monitor the Activity Log for sync errors</li>
                  <li>Keep automation enabled for continuous synchronization</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Control Tower API connection details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="outline" className="bg-green-600/10 text-green-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Version</span>
                  <span className="text-sm text-muted-foreground">v2.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sync Logs Retention</span>
                  <span className="text-sm text-muted-foreground">20 minutes (auto-cleanup)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControlTowerSyncDashboard;
