import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSyncControlTowerDeals } from '@/hooks/useSyncControlTowerDeals';
import { RefreshCw, Clock, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface SyncConfig {
  enabled: boolean;
  interval_minutes: number;
  last_sync_at?: string;
  last_sync_status?: 'success' | 'failed' | 'running';
}

function DataSyncSettings() {
  const [config, setConfig] = useState<SyncConfig>({
    enabled: false,
    interval_minutes: 60,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { syncDeals, isSyncing } = useSyncControlTowerDeals();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_configurations')
        .select('configuration_data')
        .eq('user_id', user.id)
        .eq('configuration_type', 'sync_schedule')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.configuration_data) {
        const configData = data.configuration_data as any;
        setConfig({
          enabled: configData.enabled ?? false,
          interval_minutes: configData.interval_minutes ?? 60,
          last_sync_at: configData.last_sync_at,
          last_sync_status: configData.last_sync_status,
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      toast.error('Failed to load sync settings');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_configurations')
        .upsert(
          {
            user_id: user.id,
            configuration_type: 'sync_schedule',
            configuration_data: config as any,
          },
          {
            onConflict: 'user_id,configuration_type',
          },
        );

      if (error) throw error;

      await loadConfig();
      toast.success('Sync settings saved successfully');
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save sync settings');
    } finally {
      setSaving(false);
    }
  };

  const handleManualSync = async () => {
    try {
      const result = await syncDeals();
      
      // Update last sync time
      const updatedConfig: SyncConfig = {
        ...config,
        last_sync_at: new Date().toISOString(),
        last_sync_status: (result.failed > 0 ? 'failed' : 'success') as 'success' | 'failed',
      };
      
      setConfig(updatedConfig);
      
      // Save updated config
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('ai_configurations')
          .upsert(
            {
              user_id: user.id,
              configuration_type: 'sync_schedule',
              configuration_data: updatedConfig as any,
            },
            {
              onConflict: 'user_id,configuration_type',
            },
          );

        if (error) {
          throw error;
        }

        await loadConfig();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast.error('Manual sync failed');
    }
  };

  const getStatusBadge = () => {
    if (isSyncing) {
      return <Badge variant="secondary" className="gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Syncing</Badge>;
    }
    if (!config.last_sync_status) {
      return <Badge variant="outline">Never synced</Badge>;
    }
    if (config.last_sync_status === 'success') {
      return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Success</Badge>;
    }
    return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Failed</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Data Sync Settings</h1>
        <p className="text-muted-foreground mt-2">Configure automated synchronization for Control Tower deals</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Sync</CardTitle>
            <CardDescription>Automatically sync deals from Control Tower on a schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sync-enabled">Enable Automatic Sync</Label>
                <p className="text-sm text-muted-foreground">Run sync automatically at specified intervals</p>
              </div>
              <Switch
                id="sync-enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            {config.enabled && (
              <div className="space-y-2">
                <Label htmlFor="interval">Sync Interval</Label>
                <Select
                  value={config.interval_minutes.toString()}
                  onValueChange={(value) => setConfig({ ...config, interval_minutes: parseInt(value) })}
                >
                  <SelectTrigger id="interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                    <SelectItem value="120">Every 2 hours</SelectItem>
                    <SelectItem value="240">Every 4 hours</SelectItem>
                    <SelectItem value="480">Every 8 hours</SelectItem>
                    <SelectItem value="1440">Once daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={saveConfig} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" onClick={loadConfig} disabled={loading}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Sync</CardTitle>
            <CardDescription>Trigger an immediate sync of Control Tower deals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sync Status</p>
                <p className="text-sm text-muted-foreground">Current synchronization state</p>
              </div>
              {getStatusBadge()}
            </div>

            {config.last_sync_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last synced: {new Date(config.last_sync_at).toLocaleString()}
              </div>
            )}

            <Button 
              onClick={handleManualSync} 
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Information</CardTitle>
            <CardDescription>Details about the synchronization process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p><strong>Data Source:</strong> Control Tower (Deals & Clients)</p>
              <p><strong>Sync Method:</strong> Incremental updates with conflict resolution</p>
              <p><strong>Tables Updated:</strong> deals, clients</p>
              <p><strong>Active Deal Stages:</strong> prospecting, qualification, proposal, negotiation</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DataSyncSettings;
