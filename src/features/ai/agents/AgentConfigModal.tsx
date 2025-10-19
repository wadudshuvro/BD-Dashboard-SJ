import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import type { AIAgent, AgentConfigurationEnvelope, AgentProviderConfig } from "@/Api/aiAgents";
import { useUpdateAgentConfig } from "@/hooks/useUpdateAgentConfig";

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "openai-mini", label: "OpenAI Mini" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
  { value: "perplexity", label: "Perplexity" },
];

interface AgentConfigModalProps {
  agent: AIAgent | null;
  open: boolean;
  onClose: () => void;
}

const DEFAULT_PROVIDER: AgentProviderConfig = {
  provider: "openai",
  model: "gpt-4o-mini",
};

const createDefaultConfig = (): AgentConfigurationEnvelope => ({
  providers: {
    primary: { ...DEFAULT_PROVIDER },
    fallback: { ...DEFAULT_PROVIDER },
    research: { provider: "perplexity", model: "sonar-small" },
  },
  features: {
    enableResearch: false,
    enableTelemetry: true,
  },
});

export function AgentConfigModal({ agent, open, onClose }: AgentConfigModalProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateAgentConfig();
  const [config, setConfig] = useState<AgentConfigurationEnvelope>(() => createDefaultConfig());

  useEffect(() => {
    if (agent) {
      const merged: AgentConfigurationEnvelope = {
        providers: {
          primary: { ...DEFAULT_PROVIDER, ...(agent.config?.providers?.primary || {}) },
          fallback: { ...DEFAULT_PROVIDER, ...(agent.config?.providers?.fallback || {}) },
          research: { provider: "perplexity", model: "sonar-small", ...(agent.config?.providers?.research || {}) },
        },
        features: {
          enableResearch: agent.config?.features?.enableResearch ?? false,
          enableTelemetry: agent.config?.features?.enableTelemetry ?? true,
        },
      };
      setConfig(merged);
    } else {
      setConfig(createDefaultConfig());
    }
  }, [agent]);

  const updateProvider = (target: "primary" | "fallback" | "research", patch: Partial<AgentProviderConfig>) => {
    setConfig((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [target]: {
          ...(prev.providers?.[target] || DEFAULT_PROVIDER),
          ...patch,
        },
      },
    }));
  };

  const handleToggleFeature = (key: keyof NonNullable<AgentConfigurationEnvelope["features"]>, value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!agent) return;

    try {
      await updateMutation.mutateAsync({ agentId: agent.id, config });
      toast({
        title: "Configuration saved",
        description: `${agent.name} routing preferences updated successfully.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Unable to save configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const renderProviderSection = (label: string, key: "primary" | "fallback" | "research") => {
    const providerConfig = config.providers?.[key] || DEFAULT_PROVIDER;
    return (
      <div className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{label}</h4>
          {key === "research" && (
            <Switch
              checked={config.features?.enableResearch ?? false}
              onCheckedChange={(checked) => handleToggleFeature("enableResearch", checked)}
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={providerConfig.provider}
              onValueChange={(value) => updateProvider(key, { provider: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Input
              value={providerConfig.model}
              onChange={(event) => updateProvider(key, { model: event.target.value })}
              placeholder="Model identifier"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Temperature</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={2}
              value={providerConfig.temperature ?? ""}
              onChange={(event) =>
                updateProvider(key, { temperature: event.target.value ? Number(event.target.value) : undefined })
              }
              placeholder="0.0 - 2.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Input
              type="number"
              min={0}
              value={providerConfig.maxTokens ?? ""}
              onChange={(event) =>
                updateProvider(key, { maxTokens: event.target.value ? Number(event.target.value) : undefined })
              }
              placeholder="e.g. 2000"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configure agent providers</DialogTitle>
          <DialogDescription>
            Define provider routing, fallbacks, and telemetry preferences for {agent?.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {renderProviderSection("Primary provider", "primary")}
          {renderProviderSection("Fallback provider", "fallback")}
          {renderProviderSection("Research provider", "research")}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h4 className="text-sm font-medium">Telemetry</h4>
              <p className="text-sm text-muted-foreground">
                Store latency and token usage metrics for downstream dashboards.
              </p>
            </div>
            <Switch
              checked={config.features?.enableTelemetry ?? true}
              onCheckedChange={(checked) => handleToggleFeature("enableTelemetry", checked)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
