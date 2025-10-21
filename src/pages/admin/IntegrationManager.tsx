import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Clock,
  Loader2,
  Plug,
  Power,
  RefreshCw,
  ScrollText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GlobalIntegration {
  id: string;
  name: string;
  description: string;
  category: string;
  is_enabled: boolean;
  icon: string;
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
  dimensions: any;
  recorded_at: string | null;
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Never";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    console.error("Failed to format date", error);
    return value;
  }
};

const IntegrationManager = () => {
  const { toast } = useToast();
  const [globalIntegrations, setGlobalIntegrations] = useState<GlobalIntegration[]>([
    {
      id: "collabai",
      name: "CollabAI",
      description: "Collaborative AI platform base URL configuration",
      category: "AI",
      is_enabled: false,
      icon: "🤝",
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT powered automation and analysis",
      category: "AI",
      is_enabled: false,
      icon: "🤖",
    },
  ]);
  const [crmIntegrations, setCrmIntegrations] = useState<CrmIntegrationEntry[]>([]);
  const [isCrmLoading, setIsCrmLoading] = useState(false);
  const [crmSyncing, setCrmSyncing] = useState<Record<string, boolean>>({});
  const [crmToggling, setCrmToggling] = useState<Record<string, boolean>>({});
  const [ghlForm, setGhlForm] = useState({ apiKey: "", locationId: "" });
  const [isConnectingGhl, setIsConnectingGhl] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [selectedLogSource, setSelectedLogSource] = useState<"hubspot" | "gohighlevel" | null>(null);
  const [logEntries, setLogEntries] = useState<IntegrationLogEntry[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const hubspotIntegration = crmIntegrations.find((integration) => integration.type === "hubspot");
  const goHighLevelIntegration = crmIntegrations.find((integration) => integration.type === "gohighlevel");

  useEffect(() => {
    void loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setIsCrmLoading(true);
    setCrmIntegrations([]);

    const nextGlobal = [...globalIntegrations];

    try {
      const { data, error } = await supabase.functions.invoke("integrations-dashboard", { method: "GET" });
      if (error) throw error;
      setCrmIntegrations(Array.isArray(data?.integrations) ? data.integrations : []);
    } catch (error) {
      console.error("Failed to load CRM integrations", error);
      toast({
        title: "Unable to load CRM integrations",
        description: "We could not fetch CRM integration details right now.",
        variant: "destructive",
      });
    } finally {
      setIsCrmLoading(false);
    }

    try {
      const { data: collabaiConfig } = await supabase.functions.invoke("collabai-manage", { method: "GET" });
      const collabEnabled = Boolean(collabaiConfig?.enabled);
      nextGlobal[0] = { ...nextGlobal[0], is_enabled: collabEnabled };
    } catch (error) {
      console.error("Failed to load CollabAI config", error);
    }

    try {
      const { data: openaiStatus } = await supabase.functions.invoke("openai-test", {
        body: { action: "status" },
      });
      const openaiEnabled = Boolean(openaiStatus?.configured ? openaiStatus.enabled : false);
      nextGlobal[1] = { ...nextGlobal[1], is_enabled: openaiEnabled };
    } catch (error) {
      console.error("Failed to load OpenAI config", error);
    }

    setGlobalIntegrations(nextGlobal);
  };

  const handleToggleCrmIntegration = async (integration: CrmIntegrationEntry) => {
    setCrmToggling((prev) => ({ ...prev, [integration.id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("integrations-dashboard", {
        method: "PATCH",
        body: { id: integration.id, type: integration.type, is_active: !integration.is_active },
      });
      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || "Unable to update integration state");
      }
      toast({
        title: `${integration.name} updated`,
        description: `${integration.name} is now ${!integration.is_active ? "active" : "inactive"}.`,
      });
      await loadIntegrations();
    } catch (error) {
      console.error("Failed to update CRM integration", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update integration state.",
        variant: "destructive",
      });
    } finally {
      setCrmToggling((prev) => ({ ...prev, [integration.id]: false }));
    }
  };

  const handleSyncCrmIntegration = async (integration: CrmIntegrationEntry) => {
    setCrmSyncing((prev) => ({ ...prev, [integration.type]: true }));
    try {
      if (integration.type === "hubspot") {
        const { data, error } = await supabase.functions.invoke("hubspot-sync/sync", { method: "POST" });
        if (error) throw error;
        if (!data?.ok) {
          throw new Error(data?.error || "HubSpot sync failed");
        }
        toast({ title: "HubSpot sync complete", description: "Recent HubSpot records are now up to date." });
      } else if (integration.type === "gohighlevel") {
        const { data, error } = await supabase.functions.invoke("gohighlevel-manage/sync-contacts", { method: "POST" });
        if (error) throw error;
        if (!data?.ok) {
          throw new Error(data?.error || "GoHighLevel sync failed");
        }
        toast({ title: "GoHighLevel sync complete", description: "Contacts and deals have been refreshed." });
      }
      await loadIntegrations();
    } catch (error) {
      console.error("CRM sync failed", error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unable to sync integration.",
        variant: "destructive",
      });
    } finally {
      setCrmSyncing((prev) => ({ ...prev, [integration.type]: false }));
    }
  };

  const handleConnectGoHighLevel = async () => {
    if (!ghlForm.apiKey.trim()) {
      toast({
        title: "API key required",
        description: "Enter a GoHighLevel API key before connecting.",
        variant: "destructive",
      });
      return;
    }

    setIsConnectingGhl(true);
    try {
      const { data, error } = await supabase.functions.invoke("gohighlevel-manage/integration", {
        method: "POST",
        body: {
          apiKey: ghlForm.apiKey.trim(),
          locationId: ghlForm.locationId.trim() || null,
        },
      });
      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || "Unable to connect GoHighLevel");
      }
      toast({ title: "GoHighLevel connected", description: "Credentials saved successfully." });
      setGhlForm({ apiKey: "", locationId: "" });
      await loadIntegrations();
    } catch (error) {
      console.error("GoHighLevel connection failed", error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Unable to connect to GoHighLevel.",
        variant: "destructive",
      });
    } finally {
      setIsConnectingGhl(false);
    }
  };

  const handleOpenIntegrationLogs = async (source: "hubspot" | "gohighlevel") => {
    setSelectedLogSource(source);
    setIsLogsDialogOpen(true);
    setIsLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from("analytics_data")
        .select("id, source, metric_name, metric_value, dimensions, recorded_at")
        .eq("source", source)
        .order("recorded_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      setLogEntries(data ?? []);
    } catch (error) {
      console.error("Failed to load integration logs", error);
      toast({
        title: "Unable to load logs",
        description: error instanceof Error ? error.message : "An unexpected error occurred while loading logs.",
        variant: "destructive",
      });
      setLogEntries([]);
    } finally {
      setIsLogsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Integration Manager</h1>
          <p className="text-sm text-muted-foreground">
            Monitor global AI integrations and manage CRM connections for your brands.
          </p>
        </div>
        <Button variant="outline" onClick={loadIntegrations} className="w-full md:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Global integrations</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {globalIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{integration.icon}</span>
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Category: {integration.category}</p>
                  <p>Status: {integration.is_enabled ? "Configured" : "Not configured"}</p>
                </div>
                <Badge variant={integration.is_enabled ? "default" : "outline"}>
                  {integration.is_enabled ? "Active" : "Pending"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Power className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">CRM integrations</h2>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">HubSpot</CardTitle>
              <CardDescription>Sync contacts, deals, and activities from HubSpot.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={hubspotIntegration?.is_active ?? false}
                disabled={!hubspotIntegration || Boolean(crmToggling[hubspotIntegration.id]) || isCrmLoading}
                onCheckedChange={() => hubspotIntegration && handleToggleCrmIntegration(hubspotIntegration)}
              />
              <Badge variant={hubspotIntegration?.is_active ? "default" : "outline"}>
                {hubspotIntegration?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <span>Last sync: {formatDateTime(hubspotIntegration?.last_sync)}</span>
              <span>Status: {hubspotIntegration?.status ?? "Unknown"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => hubspotIntegration && handleSyncCrmIntegration(hubspotIntegration)}
                disabled={!hubspotIntegration || Boolean(crmSyncing.hubspot)}
              >
                {crmSyncing.hubspot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sync now
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenIntegrationLogs("hubspot")}
              >
                <ScrollText className="mr-2 h-4 w-4" /> View logs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">GoHighLevel</CardTitle>
              <CardDescription>Sync contacts and opportunities from GoHighLevel.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={goHighLevelIntegration?.is_active ?? false}
                disabled={!goHighLevelIntegration || Boolean(crmToggling[goHighLevelIntegration.id]) || isCrmLoading}
                onCheckedChange={() => goHighLevelIntegration && handleToggleCrmIntegration(goHighLevelIntegration)}
              />
              <Badge variant={goHighLevelIntegration?.is_active ? "default" : "outline"}>
                {goHighLevelIntegration?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ghl-api-key">API key</Label>
                <Input
                  id="ghl-api-key"
                  placeholder="Enter GoHighLevel API key"
                  value={ghlForm.apiKey}
                  onChange={(event) => setGhlForm((prev) => ({ ...prev, apiKey: event.target.value }))}
                  disabled={isConnectingGhl}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ghl-location-id">Location ID (optional)</Label>
                <Input
                  id="ghl-location-id"
                  placeholder="Location ID"
                  value={ghlForm.locationId}
                  onChange={(event) => setGhlForm((prev) => ({ ...prev, locationId: event.target.value }))}
                  disabled={isConnectingGhl}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleConnectGoHighLevel} disabled={isConnectingGhl}>
                {isConnectingGhl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}Connect
              </Button>
              <Button
                onClick={() => goHighLevelIntegration && handleSyncCrmIntegration(goHighLevelIntegration)}
                disabled={!goHighLevelIntegration || Boolean(crmSyncing.gohighlevel)}
              >
                {crmSyncing.gohighlevel ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync now
              </Button>
              <Button variant="outline" onClick={() => handleOpenIntegrationLogs("gohighlevel")}>
                <ScrollText className="mr-2 h-4 w-4" /> View logs
              </Button>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <span>Last sync: {formatDateTime(goHighLevelIntegration?.last_sync)}</span>
              {goHighLevelIntegration?.metadata?.location_id && (
                <span>Location: {goHighLevelIntegration.metadata.location_id}</span>
              )}
              <span>Status: {goHighLevelIntegration?.status ?? "Unknown"}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Integration summary</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crmIntegrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell className="font-medium">{integration.name}</TableCell>
                  <TableCell>
                    <Badge variant={integration.is_active ? "default" : "outline"}>
                      {integration.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(integration.last_sync)}
                  </TableCell>
                </TableRow>
              ))}
              {crmIntegrations.length === 0 && !isCrmLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    No CRM integrations have been configured yet.
                  </TableCell>
                </TableRow>
              )}
              {isCrmLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading integrations...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>
              {selectedLogSource === "hubspot"
                ? "HubSpot sync logs"
                : selectedLogSource === "gohighlevel"
                ? "GoHighLevel sync logs"
                : "Integration logs"}
            </DialogTitle>
            <DialogDescription>
              Recent events captured from the integration sync pipeline.
            </DialogDescription>
          </DialogHeader>

          {isLogsLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading logs...
            </div>
          ) : logEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              No log entries found for this integration.
            </div>
          ) : (
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
              {logEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="space-y-2 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="secondary">{entry.metric_name}</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {formatDateTime(entry.recorded_at)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Value: {entry.metric_value ?? "n/a"}</p>
                      {entry.dimensions && Object.keys(entry.dimensions).length > 0 && (
                        <pre className="mt-2 rounded-md bg-muted p-2 text-xs">
                          {JSON.stringify(entry.dimensions, null, 2)}
                        </pre>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationManager;
