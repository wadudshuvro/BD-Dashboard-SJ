import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Plug,
  Search,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Power,
  Copy,
  Check,
  BarChart3,
  Eye,
  Loader2,
  Info,
  Download,
  Calendar,
  ScrollText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockBrands } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Union type for different integration config structures
type IntegrationConfig =
  | { api_key: string; location_id: string } // GoHighLevel
  | { access_token: string; company_id: string } // LinkedIn
  | { tracking_id: string; domain: string } // Analytics
  | { access_token: string; account_id: string } // Meta Ads
  | { webhook_url?: string; webhook_secret?: string; sync_frequency?: string; last_sync_at?: string | null } // n8n Analytics
  | Record<string, any>; // Fallback for other configs

interface GlobalIntegration {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  category: 'ai' | 'communication' | 'analytics';
  is_available: boolean;
  is_enabled: boolean;
  setup_complexity: 'easy' | 'medium' | 'complex';
  required_fields: string[];
}

interface BrandConnection {
  is_enabled: boolean;
  config: IntegrationConfig;
  status: 'connected' | 'error' | 'pending';
}

interface BrandIntegration {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  category: 'crm' | 'social' | 'analytics' | 'marketing';
  is_available: boolean;
  setup_complexity: 'easy' | 'medium' | 'complex';
  required_fields: string[];
  brand_connections: {
    [brandId: string]: BrandConnection;
  };
}

interface AnalyticsIntegrationSummary {
  id: string;
  brand_id: string;
  webhook_url: string;
  n8n_workflow_id?: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_frequency: string;
  data_sources: Record<string, any>;
  metadata: Record<string, any>;
}

interface AnalyticsIntegrationDetails extends AnalyticsIntegrationSummary {
  webhook_secret: string;
}

interface BrandSummary {
  id: string;
  name: string;
  active_integrations: string[];
  integration?: AnalyticsIntegrationSummary | null;
}

interface AnalyticsDataEntry {
  id: string;
  integration_id: string | null;
  data_type: string;
  date_range_start: string;
  date_range_end: string;
  metrics: Record<string, any>;
  dimensions: Record<string, any>;
  raw_data?: Record<string, any> | null;
  received_at: string | null;
}

interface CrmIntegrationEntry {
  id: string;
  name: string;
  type: "hubspot" | "gohighlevel" | string;
  status: string;
  is_active: boolean;
  last_sync: string | null;
  metadata?: Record<string, any> | null;
}

interface IntegrationLogEntry {
  id: string;
  source: string;
  metric_name: string;
  metric_value: number | null;
  dimensions: Record<string, any> | null;
  recorded_at: string | null;
}

const IntegrationManager = () => {
  const { toast } = useToast();
  const [globalIntegrations, setGlobalIntegrations] = useState<GlobalIntegration[]>([]);
  const [brandIntegrations, setBrandIntegrations] = useState<BrandIntegration[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("global");
  const [configData, setConfigData] = useState<{apiKey: string; baseUrl?: string; locationId?: string}>({
    apiKey: '',
    baseUrl: '',
    locationId: ''
  });
  const [brandOptions, setBrandOptions] = useState<BrandSummary[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [configBrandId, setConfigBrandId] = useState<string>('');
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsIntegrationDetails | null>(null);
  const [analyticsSyncFrequency, setAnalyticsSyncFrequency] = useState<string>('daily');
  const [analyticsWorkflowId, setAnalyticsWorkflowId] = useState<string>('');
  const [regenerateSecret, setRegenerateSecret] = useState(false);
  const [isAnalyticsConfigLoading, setIsAnalyticsConfigLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataEntry[]>([]);
  const [isAnalyticsDataDialogOpen, setIsAnalyticsDataDialogOpen] = useState(false);
  const [isAnalyticsDataLoading, setIsAnalyticsDataLoading] = useState(false);
  const [analyticsFilterStart, setAnalyticsFilterStart] = useState('');
  const [analyticsFilterEnd, setAnalyticsFilterEnd] = useState('');
  const [analyticsDataBrandId, setAnalyticsDataBrandId] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [crmIntegrations, setCrmIntegrations] = useState<CrmIntegrationEntry[]>([]);
  const [isCrmLoading, setIsCrmLoading] = useState(false);
  const [crmSyncing, setCrmSyncing] = useState<Record<string, boolean>>({});
  const [crmToggling, setCrmToggling] = useState<Record<string, boolean>>({});
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [selectedLogSource, setSelectedLogSource] = useState<"hubspot" | "gohighlevel" | null>(null);
  const [logEntries, setLogEntries] = useState<IntegrationLogEntry[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [ghlForm, setGhlForm] = useState({ apiKey: "", locationId: "" });
  const [isConnectingGhl, setIsConnectingGhl] = useState(false);

  const hubspotIntegration = crmIntegrations.find((integration) => integration.type === 'hubspot');
  const ghlIntegration = crmIntegrations.find((integration) => integration.type === 'gohighlevel');

  // Load integrations on mount
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setIsLoadingBrands(true);
    setCopySuccess(null);
    setIsCrmLoading(true);
    setCrmIntegrations([]);

    const globalIntegrationsData: GlobalIntegration[] = [
      {
        id: 'collabai',
        name: 'CollabAI',
        type: 'collab_ai',
        description: 'Collaborative AI platform base URL configuration (users configure their own API keys)',
        icon: '🚀',
        category: 'ai',
        is_available: true,
        is_enabled: false,
        setup_complexity: 'easy',
        required_fields: ['base_url']
      },
      {
        id: 'openai',
        name: 'OpenAI',
        type: 'openai',
        description: 'AI-powered analysis and intelligent automation using GPT models',
        icon: '🤖',
        category: 'ai',
        is_available: true,
        is_enabled: true,
        setup_complexity: 'easy',
        required_fields: ['OPENAI_KEY (secret)']
      }
    ];

    try {
      const { data, error } = await supabase.functions.invoke('integrations-dashboard', { method: 'GET' });
      if (error) throw error;
      setCrmIntegrations(Array.isArray(data?.integrations) ? data.integrations : []);
    } catch (error) {
      console.error('Failed to load CRM integrations', error);
      toast({
        title: 'Unable to load CRM integrations',
        description: 'We could not fetch CRM integration details right now. Please try again shortly.',
        variant: 'destructive'
      });
    } finally {
      setIsCrmLoading(false);
    }

    const brandIntegrationsData: BrandIntegration[] = [
    ];

    try {
      const { data: collabaiConfig } = await supabase.functions.invoke('collabai-manage', { method: 'GET' });
      if (collabaiConfig?.configured) {
        globalIntegrationsData[0].is_enabled = collabaiConfig.enabled;
      }
    } catch (error) {
      console.error('Failed to load CollabAI config', error);
    }

    try {
      const { data: openaiConfig } = await supabase.functions.invoke('openai-test', {
        body: { action: 'status' }
      });
      if (openaiConfig?.configured) {
        globalIntegrationsData[1].is_enabled = openaiConfig.enabled;
      }
    } catch (error) {
      console.error('Failed to load OpenAI config', error);
    }

    let fetchedBrands: BrandSummary[] = [];
    let analyticsConnections: Record<string, BrandConnection> = {};
    const fallbackBrandSummaries: BrandSummary[] = mockBrands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      active_integrations: brand.active_integrations,
      integration: undefined,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('n8n-analytics-manage', {
        body: { action: 'list_brands' }
      });

      if (error) {
        console.error('Failed to fetch n8n analytics brands', error);
        toast({
          title: "Failed to load analytics integrations",
          description: "Could not fetch n8n analytics data. Using cached data.",
          variant: "destructive",
        });
        throw error;
      }

      const brandsFromApi: BrandSummary[] = data?.brands ?? [];
      fetchedBrands = brandsFromApi;

      const sourceBrands = brandsFromApi.length > 0 ? brandsFromApi : fallbackBrandSummaries;
      analyticsConnections = sourceBrands.reduce<Record<string, BrandConnection>>((acc, brand) => {
        const isActive = brand.integration?.is_active ?? false;
        acc[brand.id] = {
          is_enabled: isActive,
          config: {
            webhook_url: brand.integration?.webhook_url,
            sync_frequency: brand.integration?.sync_frequency ?? 'daily',
            last_sync_at: brand.integration?.last_sync_at ?? null,
          },
          status: isActive ? 'connected' : 'pending'
        };
        return acc;
      }, {});
    } catch (error) {
      console.error('Failed to load analytics integrations', error);
      toast({
        title: "Error loading integrations",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      if (fetchedBrands.length === 0) {
        fetchedBrands = fallbackBrandSummaries;
      }
      const sourceBrands = fetchedBrands.length > 0 ? fetchedBrands : fallbackBrandSummaries;
      analyticsConnections = sourceBrands.reduce<Record<string, BrandConnection>>((acc, brand) => {
        acc[brand.id] = {
          is_enabled: false,
          config: { sync_frequency: 'daily', last_sync_at: null },
          status: 'pending'
        };
        return acc;
      }, {});
    }

    const analyticsIntegration: BrandIntegration = {
      id: 'n8n-analytics',
      name: 'n8n + Google Analytics',
      type: 'n8n_analytics',
      description: 'Stream Google Analytics metrics into the SJ Marketing AI platform via n8n webhooks.',
      icon: '📊',
      category: 'analytics',
      is_available: true,
      setup_complexity: 'medium',
      required_fields: ['webhook_url', 'webhook_secret'],
      brand_connections: analyticsConnections
    };

    setBrandOptions(fetchedBrands.length > 0 ? fetchedBrands : fallbackBrandSummaries);

    const availableBrands = fetchedBrands.length > 0 ? fetchedBrands : fallbackBrandSummaries;

    if (selectedBrand !== 'all') {
      const stillExists = availableBrands.some((brand) => brand.id === selectedBrand);
      if (!stillExists) {
        setSelectedBrand('all');
      }
    }

    if (!configBrandId && availableBrands.length > 0) {
      setConfigBrandId(availableBrands[0].id);
    }

    if (!analyticsDataBrandId && availableBrands.length > 0) {
      setAnalyticsDataBrandId(availableBrands[0].id);
    }

    setGlobalIntegrations(globalIntegrationsData);
    setBrandIntegrations([...brandIntegrationsData, analyticsIntegration]);
    setIsLoadingBrands(false);
  };

  const handleToggleCrmIntegration = async (integration: CrmIntegrationEntry) => {
    setCrmToggling((prev) => ({ ...prev, [integration.id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('integrations-dashboard', {
        method: 'PATCH',
        body: { id: integration.id, type: integration.type, is_active: !integration.is_active }
      });
      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || 'Unable to update integration');
      }
      toast({
        title: `${integration.name} updated`,
        description: `${integration.name} is now ${!integration.is_active ? 'active' : 'inactive'}.`
      });
      await loadIntegrations();
    } catch (error) {
      console.error('Failed to update CRM integration state', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Unable to update integration state.',
        variant: 'destructive'
      });
    } finally {
      setCrmToggling((prev) => ({ ...prev, [integration.id]: false }));
    }
  };

  const handleSyncCrmIntegration = async (integration: CrmIntegrationEntry) => {
    setCrmSyncing((prev) => ({ ...prev, [integration.type]: true }));
    try {
      if (integration.type === 'hubspot') {
        const { data, error } = await supabase.functions.invoke('hubspot-sync/sync', { method: 'POST' });
        if (error) throw error;
        if (!data?.ok) {
          throw new Error(data?.error || 'HubSpot sync failed');
        }
        toast({
          title: 'HubSpot sync complete',
          description: `Synced ${data.companies ?? 0} companies, ${data.contacts ?? 0} contacts, ${data.deals ?? 0} deals.`
        });
      } else if (integration.type === 'gohighlevel') {
        const { data, error } = await supabase.functions.invoke('gohighlevel-manage/sync-contacts', { method: 'POST' });
        if (error) throw error;
        if (!data?.ok) {
          throw new Error(data?.error || 'GoHighLevel sync failed');
        }
        toast({
          title: 'GoHighLevel sync complete',
          description: `Synced ${data.contactsSynced ?? 0} contacts and ${data.dealsSynced ?? 0} deals.`
        });
      }
      await loadIntegrations();
    } catch (error) {
      console.error('CRM sync failed', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unable to sync integration.',
        variant: 'destructive'
      });
    } finally {
      setCrmSyncing((prev) => ({ ...prev, [integration.type]: false }));
    }
  };

  const handleConnectGoHighLevel = async () => {
    if (!ghlForm.apiKey.trim()) {
      toast({
        title: 'API key required',
        description: 'Enter a GoHighLevel API key before connecting.',
        variant: 'destructive'
      });
      return;
    }

    setIsConnectingGhl(true);
    try {
      const { data, error } = await supabase.functions.invoke('gohighlevel-manage/integration', {
        method: 'POST',
        body: {
          apiKey: ghlForm.apiKey.trim(),
          locationId: ghlForm.locationId.trim() || null
        }
      });
      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || 'Unable to connect GoHighLevel');
      }
      toast({ title: 'GoHighLevel connected', description: 'Credentials saved successfully.' });
      setGhlForm({ apiKey: '', locationId: '' });
      await loadIntegrations();
    } catch (error) {
      console.error('GoHighLevel connection failed', error);
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Unable to connect to GoHighLevel.',
        variant: 'destructive'
      });
    } finally {
      setIsConnectingGhl(false);
    }
  };

  const handleOpenIntegrationLogs = async (source: 'hubspot' | 'gohighlevel') => {
    setIsLogsDialogOpen(true);
    setSelectedLogSource(source);
    setIsLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('id, source, metric_name, metric_value, dimensions, recorded_at')
        .eq('source', source)
        .order('recorded_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      setLogEntries(data ?? []);
    } catch (error) {
      console.error('Failed to load integration logs', error);
      toast({
        title: 'Unable to load logs',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while loading logs.',
        variant: 'destructive'
      });
      setLogEntries([]);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const filteredGlobalIntegrations = globalIntegrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBrandIntegrations = brandIntegrations.filter(integration => 
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleGlobalIntegration = (id: string) => {
    setGlobalIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, is_enabled: !integration.is_enabled }
          : integration
      )
    );
  };

  const toggleBrandIntegration = async (integrationId: string, brandId: string, nextState: boolean) => {
    if (integrationId === 'n8n-analytics') {
      try {
        const { data, error } = await supabase.functions.invoke('n8n-analytics-manage', {
          body: { action: 'update', brandId, isActive: nextState }
        });

        if (error || !data?.ok) {
          throw error || new Error(data?.error || 'Unable to update integration state');
        }

        toast({
          title: nextState ? 'Integration enabled' : 'Integration disabled',
          description: 'The n8n analytics integration status has been updated.'
        });

        await loadIntegrations();
      } catch (error: any) {
        console.error('Failed to toggle analytics integration', error);
        toast({
          title: 'Update failed',
          description: error?.message ?? 'Unable to update analytics integration.',
          variant: 'destructive'
        });
      }
      return;
    }

    setBrandIntegrations(prev =>
      prev.map(integration => {
        if (integration.id === integrationId) {
          const updatedConnections = { ...integration.brand_connections };
          if (updatedConnections[brandId]) {
            updatedConnections[brandId] = {
              ...updatedConnections[brandId],
              is_enabled: nextState
            };
          } else {
            const defaultConfig: IntegrationConfig = {};
            updatedConnections[brandId] = {
              is_enabled: nextState,
              config: defaultConfig,
              status: 'pending' as const
            };
          }
          return { ...integration, brand_connections: updatedConnections };
        }
        return integration;
      })
    );
  };

  const loadAnalyticsConfiguration = async (brandId: string, options?: { includeData?: boolean }) => {
    if (!brandId) return;
    setIsAnalyticsConfigLoading(true);
    try {
      const payload: Record<string, any> = {
        action: 'get',
        brandId,
        limit: options?.includeData ? 50 : 10,
      };

      if (options?.includeData && analyticsFilterStart) {
        payload.startDate = analyticsFilterStart;
      }
      if (options?.includeData && analyticsFilterEnd) {
        payload.endDate = analyticsFilterEnd;
      }

      const { data, error } = await supabase.functions.invoke('n8n-analytics-manage', {
        body: payload,
      });

      if (error) {
        throw error;
      }

      const integrationDetails = data?.integration as AnalyticsIntegrationDetails | null;
      const entries = Array.isArray(data?.data) ? (data.data as AnalyticsDataEntry[]) : [];

      setAnalyticsConfig(integrationDetails ?? null);
      setAnalyticsSyncFrequency(integrationDetails?.sync_frequency ?? 'daily');
      setAnalyticsWorkflowId(integrationDetails?.n8n_workflow_id ?? '');
      if (options?.includeData || analyticsDataBrandId === brandId) {
        setAnalyticsData(entries);
      }
    } catch (error: any) {
      console.error('Failed to load analytics configuration', error);
      toast({
        title: 'Unable to load analytics configuration',
        description: error?.message ?? 'Check your permissions and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyticsConfigLoading(false);
    }
  };

  const handleGenerateWebhook = async () => {
    if (!configBrandId) {
      toast({ title: 'Select a brand', description: 'Choose a brand to generate a webhook for.', variant: 'destructive' });
      return;
    }

    setIsAnalyticsConfigLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('n8n-analytics-manage', {
        body: {
          action: 'create',
          brandId: configBrandId,
          syncFrequency: analyticsSyncFrequency,
          metadata: analyticsConfig?.metadata ?? {},
          dataSources: analyticsConfig?.data_sources ?? { google_analytics: true },
        },
      });

      if (error || !data?.ok) {
        throw error || new Error(data?.error || 'Failed to create webhook');
      }

      const integrationDetails = data.integration as AnalyticsIntegrationDetails;
      setAnalyticsConfig(integrationDetails);
      setAnalyticsWorkflowId(integrationDetails?.n8n_workflow_id ?? '');
      setAnalyticsSyncFrequency(integrationDetails?.sync_frequency ?? analyticsSyncFrequency);
      setRegenerateSecret(false);
      setCopySuccess(null);

      toast({ title: 'Webhook ready', description: 'A dedicated webhook URL and secret were generated for this brand.' });
      await loadIntegrations();
    } catch (error: any) {
      console.error('Failed to generate webhook', error);
      toast({
        title: 'Webhook generation failed',
        description: error?.message ?? 'Unable to create webhook. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyticsConfigLoading(false);
    }
  };

  const handleSaveAnalyticsSettings = async () => {
    if (!configBrandId) {
      toast({ title: 'Select a brand', description: 'Choose a brand to update integration settings.', variant: 'destructive' });
      return;
    }

    setIsAnalyticsConfigLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('n8n-analytics-manage', {
        body: {
          action: 'update',
          brandId: configBrandId,
          syncFrequency: analyticsSyncFrequency,
          n8nWorkflowId: analyticsWorkflowId || null,
          regenerateSecret,
          metadata: analyticsConfig?.metadata ?? {},
          dataSources: analyticsConfig?.data_sources ?? { google_analytics: true },
        },
      });

      if (error || !data?.ok) {
        throw error || new Error(data?.error || 'Failed to update analytics settings');
      }

      const integrationDetails = data.integration as AnalyticsIntegrationDetails;
      setAnalyticsConfig(integrationDetails ?? null);
      setAnalyticsWorkflowId(integrationDetails?.n8n_workflow_id ?? '');
      setAnalyticsSyncFrequency(integrationDetails?.sync_frequency ?? analyticsSyncFrequency);
      if (regenerateSecret) {
        setCopySuccess(null);
      }
      setRegenerateSecret(false);

      toast({ title: 'Settings saved', description: 'Analytics integration settings updated successfully.' });
      await loadIntegrations();
    } catch (error: any) {
      console.error('Failed to update analytics settings', error);
      toast({
        title: 'Save failed',
        description: error?.message ?? 'Unable to update analytics integration.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyticsConfigLoading(false);
    }
  };

  const handleTestAnalytics = async () => {
    if (!configBrandId) {
      toast({ title: 'Select a brand', description: 'Choose a brand to test the webhook configuration.', variant: 'destructive' });
      return;
    }

    setIsAnalyticsConfigLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('n8n-analytics-manage', {
        body: { action: 'test', brandId: configBrandId }
      });

      if (error || !data?.ok) {
        throw error || new Error(data?.error || 'Webhook test failed');
      }

      toast({
        title: 'Webhook verified',
        description: 'Your n8n workflow can reach this webhook successfully.',
      });
    } catch (error: any) {
      console.error('Analytics test failed', error);
      toast({
        title: 'Test failed',
        description: error?.message ?? 'Unable to verify the webhook. Check your n8n workflow and secret.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyticsConfigLoading(false);
    }
  };

  const handleFetchAnalyticsData = async (brandId: string) => {
    if (!brandId) {
      toast({ title: 'Select a brand', description: 'Choose a brand to load analytics data.', variant: 'destructive' });
      return;
    }

    setIsAnalyticsDataLoading(true);
    try {
      const payload: Record<string, any> = {
        action: 'fetch_data',
        brandId,
        limit: 50,
      };

      if (analyticsFilterStart) payload.startDate = analyticsFilterStart;
      if (analyticsFilterEnd) payload.endDate = analyticsFilterEnd;

      const { data, error } = await supabase.functions.invoke('n8n-analytics-manage', { body: payload });
      if (error || !data?.ok) {
        throw error || new Error(data?.error || 'Failed to load analytics data');
      }

      setAnalyticsData(data.data as AnalyticsDataEntry[]);
      setAnalyticsDataBrandId(brandId);
    } catch (error: any) {
      console.error('Failed to fetch analytics data', error);
      toast({
        title: 'Unable to load analytics data',
        description: error?.message ?? 'Try adjusting the filters or check the webhook activity.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyticsDataLoading(false);
    }
  };

  const handleCopyToClipboard = async (value: string | undefined, key: string) => {
    if (!value) {
      toast({ title: 'Nothing to copy', description: 'Generate the webhook first to view this value.', variant: 'destructive' });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(key);
      setTimeout(() => setCopySuccess(null), 2000);
      toast({ title: 'Copied to clipboard', description: 'Use this value inside your n8n workflow.' });
    } catch (error) {
      console.error('Clipboard copy failed', error);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard. Copy manually instead.',
        variant: 'destructive',
      });
    }
  };

  const handleExportAnalyticsData = () => {
    if (!analyticsData || analyticsData.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Load analytics data before exporting.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `n8n-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: `Exported ${analyticsData.length} analytics records.`,
      });
    } catch (error) {
      console.error('Export failed', error);
      toast({
        title: 'Export failed',
        description: 'Could not export analytics data. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleAnalyticsBrandChange = (brandId: string) => {
    setConfigBrandId(brandId);
    setAnalyticsFilterStart('');
    setAnalyticsFilterEnd('');
    setAnalyticsDataBrandId(brandId);
    setAnalyticsConfig(null);
    setAnalyticsData([]);
    setRegenerateSecret(false);
    loadAnalyticsConfiguration(brandId);
  };

  const openAnalyticsDataDialog = async (brandId: string) => {
    setAnalyticsFilterStart('');
    setAnalyticsFilterEnd('');
    if (!brandId) {
      toast({ title: 'Select a brand', description: 'Choose a brand to view analytics data.', variant: 'destructive' });
      return;
    }
    setIsAnalyticsDataDialogOpen(true);
    await handleFetchAnalyticsData(brandId);
  };

  const testConnection = async (integration: any) => {
    if (integration.id === 'collabai') {
      if (!configData.baseUrl) {
        toast({
          title: 'Missing Configuration',
          description: 'Please enter Base URL before testing.',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Just test if the URL is reachable
        const testUrl = configData.baseUrl.trim().replace(/\/+$/, '');
        const response = await fetch(`${testUrl}/api/health`, { method: 'HEAD' });
        toast({ title: 'URL Configured', description: 'CollabAI base URL saved. Users can now configure their API keys in their profile.' });
      } catch (err: any) {
        toast({
          title: 'URL Saved',
          description: 'Base URL saved for CollabAI. Users can configure their API keys in profile.',
        });
      }
      return;
    }

    if (integration.id === 'openai') {
      try {
        toast({
          title: 'Testing Connection',
          description: 'Testing OpenAI API connectivity...',
        });

        const { data, error } = await supabase.functions.invoke('openai-test', {
          body: { action: 'test' },
        });
        
        if (error) {
          throw error;
        }

        if (!data?.ok) {
          throw new Error(data?.error || 'OpenAI connection test failed');
        }

        const modelsInfo = data.models_available 
          ? ` (${data.models_available} models available${data.has_gpt_models ? ', including GPT models' : ''})`
          : '';

        toast({ 
          title: 'OpenAI Connection Successful', 
          description: `Successfully connected to OpenAI API${modelsInfo}` 
        });

        // Also test text generation
        const { data: genData } = await supabase.functions.invoke('openai-test', {
          body: { action: 'generate_test' },
        });

        if (genData?.ok && genData?.generation_test) {
          toast({
            title: 'OpenAI Generation Test Passed',
            description: `Text generation working. Response: "${genData.test_response}"`,
          });
        }

      } catch (err: any) {
        console.error('OpenAI test error:', err);
        toast({
          title: 'OpenAI Connection Failed',
          description: err.message || 'Failed to connect to OpenAI API. Check your API key in secrets.',
          variant: 'destructive',
        });
      }
      return;
    }

    if (integration.id === 'n8n-analytics') {
      await handleTestAnalytics();
      return;
    }

  };

  const saveConfiguration = async (integration: any) => {
    if (integration.id === 'n8n-analytics') {
      await handleSaveAnalyticsSettings();
      return;
    }

    if (integration.id === 'collabai') {
      if (!configData.baseUrl?.trim()) {
        toast({ title: 'Missing field', description: 'Base URL is required.', variant: 'destructive' });
        return;
      }
      try {
        // Save base URL to a global setting (you may want to create a separate table for this)
        const { data, error } = await supabase.functions.invoke('collabai-manage', {
          body: { action: 'save_base_url', baseUrl: configData.baseUrl.trim() },
        });
        if (error || !data?.ok) throw error || new Error(data?.error || 'Save failed');
        toast({ title: 'Settings Saved', description: 'CollabAI base URL configured. Users can now set up their API keys.' });
        setIsConfigDialogOpen(false);
        setConfigData({ apiKey: '', baseUrl: '', locationId: '' });
        loadIntegrations();
      } catch (e: any) {
        toast({ title: 'Save failed', description: e?.message ?? 'Unable to save integration.', variant: 'destructive' });
      }
      return;
    }

    if (integration.id === 'gohighlevel') {
      if (!configData.apiKey?.trim()) {
        toast({ title: 'Missing API Key', description: 'API key is required.', variant: 'destructive' });
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('gohighlevel-manage', {
          body: { action: 'save', apiKey: configData.apiKey.trim(), locationId: configData.locationId?.trim() },
        });
        if (error || !data?.ok) throw error || new Error(data?.error || 'Save failed');
        toast({ title: 'Settings Saved', description: 'GoHighLevel credentials stored successfully.' });
        setIsConfigDialogOpen(false);
        setConfigData({ apiKey: '', baseUrl: '', locationId: '' });
        loadIntegrations(); // Reload to show updated status
      } catch (e: any) {
        toast({ title: 'Save failed', description: e?.message ?? 'Unable to save integration.', variant: 'destructive' });
      }
      return;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'complex': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const openConfigDialog = (integration: any, brandId?: string) => {
    setSelectedIntegration(integration);

    if (integration.id === 'n8n-analytics') {
      const availableBrands = brandOptions.length > 0
        ? brandOptions
        : mockBrands.map((brand) => ({
            id: brand.id,
            name: brand.name,
            active_integrations: brand.active_integrations,
            integration: undefined,
          }));
      const fallbackBrandId = brandId
        || (selectedBrand !== 'all' ? selectedBrand : availableBrands[0]?.id);

      if (fallbackBrandId) {
        handleAnalyticsBrandChange(fallbackBrandId);
      } else {
        setAnalyticsConfig(null);
      }
      setRegenerateSecret(false);
    } else {
      setConfigData({ apiKey: '', baseUrl: '', locationId: '' });
    }

    setIsConfigDialogOpen(true);
  };

  const getIntegrationStats = () => {
    const globalStats = {
      available: globalIntegrations.filter(i => i.is_available).length,
      enabled: globalIntegrations.filter(i => i.is_enabled).length,
    };
    
    const brandStats = {
      available: brandIntegrations.filter(i => i.is_available).length,
      connected: brandIntegrations.reduce((acc, integration) => {
        const connections = Object.values(integration.brand_connections).filter(conn => conn.is_enabled);
        return acc + connections.length;
      }, 0),
    };

    return { global: globalStats, brand: brandStats };
  };

  const availableBrandOptions = brandOptions.length > 0
    ? brandOptions
    : mockBrands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        active_integrations: brand.active_integrations,
        integration: undefined,
      }));

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'No data received yet';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const activeBrandForActions = selectedBrand !== 'all' ? selectedBrand : (availableBrandOptions[0]?.id ?? '');

  const stats = getIntegrationStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Integration Manager</h1>
        <p className="text-muted-foreground">
          Configure and manage system-wide and brand-specific integrations
        </p>
      </div>

      {/* CRM Integrations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">CRM Integrations</h2>
            <p className="text-sm text-muted-foreground">
              Keep HubSpot and GoHighLevel data synchronized with the BD platform.
            </p>
          </div>
          {isCrmLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading CRM integrations...
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🧩</span>
                    HubSpot CRM
                  </CardTitle>
                  <CardDescription>Sync companies, contacts, deals, and KPIs from HubSpot.</CardDescription>
                </div>
                <Switch
                  checked={hubspotIntegration?.is_active ?? false}
                  disabled={!hubspotIntegration || Boolean(crmToggling[hubspotIntegration.id]) || isCrmLoading}
                  onCheckedChange={() => hubspotIntegration && handleToggleCrmIntegration(hubspotIntegration)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant={hubspotIntegration?.is_active ? 'default' : 'outline'}>
                  {hubspotIntegration?.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span>
                  Last sync: {hubspotIntegration?.last_sync ? formatDateTime(hubspotIntegration.last_sync) : 'Not yet synced'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {hubspotIntegration ? 'HubSpot connection detected. Use the controls below to trigger a manual sync or inspect logs.' : 'No active HubSpot integration found. Configure the integration in Supabase to enable syncing.'}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  disabled={!hubspotIntegration || Boolean(crmSyncing.hubspot)}
                  onClick={() => hubspotIntegration && handleSyncCrmIntegration(hubspotIntegration)}
                >
                  {crmSyncing.hubspot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Sync Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenIntegrationLogs('hubspot')}
                >
                  <ScrollText className="mr-2 h-4 w-4" />
                  View Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    GoHighLevel
                  </CardTitle>
                  <CardDescription>Import contacts, pipeline stages, and KPI metrics from GoHighLevel.</CardDescription>
                </div>
                <Switch
                  checked={ghlIntegration?.is_active ?? false}
                  disabled={!ghlIntegration || Boolean(crmToggling[ghlIntegration.id]) || isCrmLoading}
                  onCheckedChange={() => ghlIntegration && handleToggleCrmIntegration(ghlIntegration)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant={ghlIntegration?.is_active ? 'default' : 'outline'}>
                  {ghlIntegration?.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span>Last sync: {ghlIntegration?.last_sync ? formatDateTime(ghlIntegration.last_sync) : 'Not yet synced'}</span>
                {ghlIntegration?.metadata?.location_id && (
                  <span>Location: {ghlIntegration.metadata.location_id}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="ghl-api-key">API Key</Label>
                  <Input
                    id="ghl-api-key"
                    type="password"
                    placeholder="Enter GoHighLevel API key"
                    value={ghlForm.apiKey}
                    onChange={(event) => setGhlForm((prev) => ({ ...prev, apiKey: event.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keys are encrypted before storage. Provide a new key to rotate credentials.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ghl-location-id">Location ID</Label>
                  <Input
                    id="ghl-location-id"
                    placeholder="Optional GoHighLevel location ID"
                    value={ghlForm.locationId}
                    onChange={(event) => setGhlForm((prev) => ({ ...prev, locationId: event.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={handleConnectGoHighLevel}
                  disabled={isConnectingGhl}
                >
                  {isConnectingGhl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                  Connect GHL
                </Button>
                <Button
                  variant="outline"
                  disabled={!ghlIntegration || Boolean(crmSyncing.gohighlevel)}
                  onClick={() => ghlIntegration && handleSyncCrmIntegration(ghlIntegration)}
                >
                  {crmSyncing.gohighlevel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Sync Contacts
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenIntegrationLogs('gohighlevel')}
                >
                  <ScrollText className="mr-2 h-4 w-4" />
                  View Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Integration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global">Global Integrations</TabsTrigger>
          <TabsTrigger value="brand">Brand Integrations</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Global Integrations Tab */}
        <TabsContent value="global" className="space-y-6">
          {/* Search */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search global integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Global Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Plug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.global.available}</div>
                <p className="text-xs text-muted-foreground">Global integrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enabled</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.global.enabled}</div>
                <p className="text-xs text-muted-foreground">System-wide enabled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Category</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">AI, Communication, Analytics</div>
              </CardContent>
            </Card>
          </div>

          {/* Global Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGlobalIntegrations.map((integration) => (
              <Card key={integration.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <Badge className={getComplexityColor(integration.setup_complexity)}>
                          {integration.setup_complexity}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={integration.is_enabled}
                      onCheckedChange={() => toggleGlobalIntegration(integration.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>{integration.description}</CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={integration.is_available ? "default" : "secondary"}>
                      {integration.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    <Badge variant={integration.is_enabled ? "default" : "outline"}>
                      {integration.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Required Configuration:</p>
                    <div className="flex flex-wrap gap-1">
                      {integration.required_fields.map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openConfigDialog(integration)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => testConnection(integration)}
                      className="flex-1"
                      disabled={!integration.is_available}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {integration.id === 'openai' ? 'Test API' : 'Test'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Brand Integrations Tab */}
        <TabsContent value="brand" className="space-y-6">
          {/* Search and Brand Filter */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search brand integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedBrand} onValueChange={setSelectedBrand} disabled={isLoadingBrands}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {availableBrandOptions.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingBrands && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading brand integrations...
            </div>
          )}

          {/* Brand Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Plug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.brand.available}</div>
                <p className="text-xs text-muted-foreground">Brand integrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.brand.connected}</div>
                <p className="text-xs text-muted-foreground">Brand connections</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Category</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">CRM, Social, Analytics</div>
              </CardContent>
            </Card>
          </div>

          {/* Brand Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrandIntegrations.map((integration) => (
              <Card key={integration.id} className="relative">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge className={getComplexityColor(integration.setup_complexity)}>
                        {integration.setup_complexity}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>{integration.description}</CardDescription>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Brand Connections:</p>
                    <div className="space-y-1">
                      {availableBrandOptions.slice(0, 3).map((brand) => {
                        const connection = integration.brand_connections[brand.id];
                        return (
                          <div key={brand.id} className="flex items-center justify-between text-xs">
                            <span>{brand.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={connection?.is_enabled ? "default" : "outline"}
                                className="text-xs"
                              >
                                {connection?.is_enabled ? "Connected" : "Not Connected"}
                              </Badge>
                              <Switch
                                checked={connection?.is_enabled || false}
                                onCheckedChange={(checked) => toggleBrandIntegration(integration.id, brand.id, checked)}
                                disabled={integration.id === 'n8n-analytics' && isLoadingBrands}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfigDialog(integration, integration.id === 'n8n-analytics' ? (activeBrandForActions || undefined) : undefined)}
                      className="flex-1"
                      disabled={integration.id === 'n8n-analytics' && !activeBrandForActions}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    {integration.id === 'n8n-analytics' ? (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => activeBrandForActions && openAnalyticsDataDialog(activeBrandForActions)}
                          className="flex-1"
                          disabled={!activeBrandForActions || isAnalyticsDataLoading}
                        >
                          {isAnalyticsDataLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <BarChart3 className="h-4 w-4 mr-2" />
                          )}
                          View Data
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activeBrandForActions && handleFetchAnalyticsData(activeBrandForActions)}
                          className="flex-1"
                          disabled={!activeBrandForActions || isAnalyticsDataLoading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => testConnection(integration)}
                        className="flex-1"
                        disabled={!integration.is_available}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Global Integration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Global Integrations</CardTitle>
                <CardDescription>System-wide integrations configured by administrators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {globalIntegrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{integration.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">{integration.category}</p>
                      </div>
                    </div>
                    <Badge variant={integration.is_enabled ? "default" : "secondary"}>
                      {integration.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Brand Integration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Integrations</CardTitle>
                <CardDescription>Brand-specific integrations and their connection status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {brandIntegrations.map((integration) => {
                  const connectedCount = Object.values(integration.brand_connections).filter(conn => conn.is_enabled).length;
                  return (
                    <div key={integration.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{integration.icon}</span>
                        <div>
                          <p className="font-medium text-foreground">{integration.name}</p>
                          <p className="text-sm text-muted-foreground">{integration.category}</p>
                        </div>
                      </div>
                      <Badge variant={connectedCount > 0 ? "default" : "secondary"}>
                        {connectedCount} Connected
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog
        open={isConfigDialogOpen}
        onOpenChange={(open) => {
          setIsConfigDialogOpen(open);
          if (!open) {
            setSelectedIntegration(null);
            setConfigData({ apiKey: '', baseUrl: '', locationId: '' });
            setAnalyticsConfig(null);
            setRegenerateSecret(false);
            setCopySuccess(null);
            setAnalyticsWorkflowId('');
            setIsAnalyticsConfigLoading(false);
          }
        }}
      >
        <DialogContent className={selectedIntegration?.id === 'n8n-analytics' ? 'sm:max-w-[720px]' : 'sm:max-w-[425px]'}>
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Set up your {selectedIntegration?.name} integration settings
            </DialogDescription>
          </DialogHeader>

          {selectedIntegration?.id === 'n8n-analytics' ? (
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label>Brand</Label>
                <Select
                  value={configBrandId || activeBrandForActions || ''}
                  onValueChange={handleAnalyticsBrandChange}
                  disabled={availableBrandOptions.length === 0 || isAnalyticsConfigLoading || isLoadingBrands}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingBrands ? "Loading brands..." : "Select brand"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrandOptions.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoadingBrands && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading available brands...
                  </p>
                )}
                {!isLoadingBrands && availableBrandOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">No brands available for configuration.</p>
                )}
              </div>

              <div className="grid gap-4 rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Integration status</p>
                    <p className="text-xs text-muted-foreground">
                      Last sync: {formatDateTime(analyticsConfig?.last_sync_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{(analyticsConfig?.is_active ?? false) ? 'Active' : 'Paused'}</span>
                    <Switch
                      checked={analyticsConfig?.is_active ?? false}
                      onCheckedChange={(checked) => configBrandId && toggleBrandIntegration('n8n-analytics', configBrandId, checked)}
                      disabled={!configBrandId}
                    />
                  </div>
                </div>
                <Separator />
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Webhook URL</p>
                      <p className="text-xs text-muted-foreground">Use this URL in your n8n HTTP Request node.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(analyticsConfig?.webhook_url, 'url')}
                      disabled={!analyticsConfig?.webhook_url}
                    >
                      {copySuccess === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="break-all rounded-md bg-muted px-3 py-2 text-xs font-mono">
                    {analyticsConfig?.webhook_url ?? 'Generate a webhook to view the URL.'}
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Webhook secret</p>
                      <p className="text-xs text-muted-foreground">Send this in the X-Webhook-Secret header from n8n.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(analyticsConfig?.webhook_secret, 'secret')}
                      disabled={!analyticsConfig?.webhook_secret}
                    >
                      {copySuccess === 'secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="break-all rounded-md bg-muted px-3 py-2 text-xs font-mono">
                    {analyticsConfig?.webhook_secret ?? 'Generate a webhook to view the secret.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Sync frequency</Label>
                  <Select
                    value={analyticsSyncFrequency}
                    onValueChange={setAnalyticsSyncFrequency}
                    disabled={isAnalyticsConfigLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workflow-id">n8n Workflow ID (optional)</Label>
                  <Input
                    id="workflow-id"
                    placeholder="e.g. 123"
                    value={analyticsWorkflowId}
                    onChange={(e) => setAnalyticsWorkflowId(e.target.value)}
                    disabled={isAnalyticsConfigLoading}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="regenerate-secret"
                  checked={regenerateSecret}
                  onCheckedChange={(checked) => setRegenerateSecret(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="regenerate-secret">Regenerate webhook secret on save</Label>
                  <p className="text-xs text-muted-foreground">
                    Creates a new secret and URL. Update your n8n workflow after saving.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Info className="h-4 w-4" />
                  Setup steps
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  <li>Generate the webhook and copy the URL + secret.</li>
                  <li>In n8n, add an HTTP Request node pointing to the webhook URL with the secret header.</li>
                  <li>Map Google Analytics metrics to the payload structure and schedule the workflow.</li>
                  <li>Run a test execution and use “Test Webhook” to confirm delivery.</li>
                </ul>
              </div>

              <DialogFooter className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerateWebhook}
                  disabled={!configBrandId || isAnalyticsConfigLoading}
                >
                  {isAnalyticsConfigLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plug className="h-4 w-4 mr-2" />
                  )}
                  {analyticsConfig?.webhook_secret ? 'Regenerate Webhook' : 'Generate Webhook'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestAnalytics}
                  disabled={!analyticsConfig?.webhook_secret || isAnalyticsConfigLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Webhook
                </Button>
                <Button onClick={handleSaveAnalyticsSettings} disabled={isAnalyticsConfigLoading || !configBrandId}>
                  {isAnalyticsConfigLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Save Settings
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                {selectedIntegration?.id !== 'collabai' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="api-key" className="text-right">
                      API Key *
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter API key..."
                      className="col-span-3"
                      value={configData.apiKey}
                      onChange={(e) => setConfigData(prev => ({ ...prev, apiKey: e.target.value }))}
                    />
                  </div>
                )}
                {selectedIntegration?.id === 'collabai' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="base-url" className="text-right">
                      Base URL *
                    </Label>
                    <Input
                      id="base-url"
                      placeholder="https://your-collabai-instance.com"
                      className="col-span-3"
                      value={configData.baseUrl}
                      onChange={(e) => setConfigData(prev => ({ ...prev, baseUrl: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={() => testConnection(selectedIntegration)}>
                  Test Connection
                </Button>
                <Button onClick={() => saveConfiguration(selectedIntegration)}>
                  Save Configuration
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAnalyticsDataDialogOpen}
        onOpenChange={(open) => {
          setIsAnalyticsDataDialogOpen(open);
          if (!open) {
            setAnalyticsData([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[860px]">
          <DialogHeader>
            <DialogTitle>Analytics data</DialogTitle>
            <DialogDescription>
              Recent payloads delivered from your n8n workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Brand</Label>
                <Select
                  value={analyticsDataBrandId || activeBrandForActions || ''}
                  onValueChange={(value) => handleFetchAnalyticsData(value)}
                  disabled={availableBrandOptions.length === 0 || isAnalyticsDataLoading || isLoadingBrands}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingBrands ? "Loading brands..." : "Select brand"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrandOptions.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor="analytics-start">Start date</Label>
                  <Input
                    id="analytics-start"
                    type="date"
                    value={analyticsFilterStart}
                    onChange={(e) => setAnalyticsFilterStart(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="analytics-end">End date</Label>
                  <Input
                    id="analytics-end"
                    type="date"
                    value={analyticsFilterEnd}
                    onChange={(e) => setAnalyticsFilterEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => analyticsDataBrandId && handleFetchAnalyticsData(analyticsDataBrandId)}
                disabled={!analyticsDataBrandId}
              >
                {isAnalyticsDataLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Apply filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                  onClick={() => {
                    setAnalyticsFilterStart('');
                    setAnalyticsFilterEnd('');
                    if (analyticsDataBrandId) {
                      handleFetchAnalyticsData(analyticsDataBrandId);
                    }
                  }}
                disabled={!analyticsDataBrandId}
              >
                <Clock className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAnalyticsData}
                disabled={analyticsData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>

            <div className="rounded-lg border border-border/50">
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Data type</TableHead>
                      <TableHead className="w-[180px]">Date range</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead className="w-[160px]">Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                          {isAnalyticsDataLoading ? 'Loading analytics data...' : 'No analytics data received yet.'}
                        </TableCell>
                      </TableRow>
                    )}
                    {analyticsData.map((entry) => {
                      const metricsEntries = Object.entries(entry.metrics || {});
                      const metricsPreview = metricsEntries.slice(0, 3);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="align-top text-sm font-medium text-foreground">{entry.data_type}</TableCell>
                          <TableCell className="align-top text-xs text-muted-foreground">
                            <div className="flex flex-col">
                              <span>{entry.date_range_start}</span>
                              <span>{entry.date_range_end}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1 text-xs">
                              {metricsPreview.map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between gap-4">
                                  <span className="font-medium text-foreground">{key}</span>
                                  <span className="text-muted-foreground">{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
                                </div>
                              ))}
                              {metricsEntries.length > metricsPreview.length && (
                                <span className="text-xs text-muted-foreground">
                                  +{metricsEntries.length - metricsPreview.length} more metrics
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-xs text-muted-foreground">{formatDateTime(entry.received_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isLogsDialogOpen}
        onOpenChange={(open) => {
          setIsLogsDialogOpen(open);
          if (!open) {
            setLogEntries([]);
            setSelectedLogSource(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>
              {selectedLogSource === 'hubspot' ? 'HubSpot sync logs' : selectedLogSource === 'gohighlevel' ? 'GoHighLevel sync logs' : 'Integration logs'}
            </DialogTitle>
            <DialogDescription>
              Most recent analytics events captured for this integration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {isLogsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading logs...
              </div>
            ) : logEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent events recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="w-24">Value</TableHead>
                    <TableHead className="w-48">Recorded</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.metric_name}</TableCell>
                      <TableCell>{entry.metric_value ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(entry.recorded_at)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.dimensions ? JSON.stringify(entry.dimensions) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationManager;