import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import type { AIAgent, AgentConfigurationEnvelope, AgentProviderConfig } from "@/Api/aiAgents";
import { useRunAIAgent } from "@/hooks/useRunAIAgent";
import { useSaveAgent } from "@/hooks/useSaveAgent";
import {
  DEFAULT_PROVIDER,
  buildAgentFormState,
  createEmptyAgentFormState,
  type AgentFormState,
} from "./types";
import { Loader2, PlayCircle, Save } from "lucide-react";

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "openai-mini", label: "OpenAI Mini" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
  { value: "perplexity", label: "Perplexity" },
];

const TABLE_OPTIONS = [
  { value: "deals", label: "Deals" },
  { value: "clients", label: "Clients" },
  { value: "contacts", label: "Contacts" },
  { value: "projects", label: "Projects" },
  { value: "tasks", label: "Tasks" },
];

const DOCUMENT_OPTIONS = [
  { value: "playbooks", label: "Playbooks" },
  { value: "reports", label: "Reports" },
  { value: "briefs", label: "Briefs" },
  { value: "notes", label: "Notes" },
];

const SCHEDULE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "scheduled", label: "Scheduled" },
];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "US Eastern" },
  { value: "America/Los_Angeles", label: "US Pacific" },
  { value: "Europe/London", label: "UK" },
];

const STEPS = [
  { id: "basic", label: "Basic" },
  { id: "prompt", label: "Prompt" },
  { id: "model", label: "Model" },
  { id: "data", label: "Data" },
  { id: "actions", label: "Actions" },
  { id: "schedule", label: "Schedule" },
  { id: "test", label: "Test" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

interface AgentConfigModalProps {
  agent: AIAgent | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (agent: AIAgent) => void;
  mode?: 'quick' | 'wizard';
}

const providerDefaults: Record<string, AgentProviderConfig> = {
  primary: { ...DEFAULT_PROVIDER },
  fallback: { ...DEFAULT_PROVIDER },
  research: { provider: "perplexity", model: "sonar-small", temperature: 0.7, maxTokens: 2000 },
};

export function AgentConfigModal({ agent, open, onClose, onSuccess, mode }: AgentConfigModalProps) {
  const { toast } = useToast();
  const saveMutation = useSaveAgent();
  const runMutation = useRunAIAgent();

  // Determine mode: quick for existing agents, wizard for new
  const isQuickMode = mode === 'quick' || (mode === undefined && agent !== null);
  const isWizardMode = !isQuickMode;

  const [formState, setFormState] = useState<AgentFormState>(() => buildAgentFormState(agent));
  const [activeStep, setActiveStep] = useState<StepId>("basic");
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Partial<Record<StepId, string>>>({});

  useEffect(() => {
    if (agent) {
      setFormState(buildAgentFormState(agent));
      setMaxUnlockedStep(0);
      setActiveStep("basic");
      setStepErrors({});
    } else {
      setFormState(createEmptyAgentFormState());
      setMaxUnlockedStep(0);
      setActiveStep("basic");
      setStepErrors({});
    }
  }, [agent]);

  const stepIndex = (id: StepId) => STEPS.findIndex((step) => step.id === id);

  const updateProvider = (target: "primary" | "fallback" | "research", patch: Partial<AgentProviderConfig>) => {
    setFormState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        providers: {
          ...prev.config.providers,
          [target]: {
            ...(prev.config.providers?.[target] || providerDefaults[target]),
            ...patch,
          },
        },
      },
    }));
  };

  const toggleFeature = (key: keyof NonNullable<AgentConfigurationEnvelope["features"]>, value: boolean) => {
    setFormState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        features: {
          ...prev.config.features,
          [key]: value,
        },
      },
    }));
  };

  const toggleDataSource = (key: "tables" | "documents", value: string) => {
    setFormState((prev) => {
      const current = new Set(prev.data_source_config?.[key] || []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      return {
        ...prev,
        data_source_config: {
          ...prev.data_source_config,
          [key]: Array.from(current),
        },
      };
    });
  };

  const updateSchedule = (patch: Partial<NonNullable<AgentFormState["schedule_config"]>>) => {
    setFormState((prev) => ({
      ...prev,
      schedule_config: {
        ...prev.schedule_config,
        ...patch,
      },
    }));
  };

  const updateStepError = (step: StepId, message: string | null) => {
    setStepErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[step] = message;
      } else {
        delete next[step];
      }
      return next;
    });
  };

  const validateStep = (step: StepId): boolean => {
    let error: string | null = null;
    switch (step) {
      case "basic": {
        if (!formState.name.trim()) {
          error = "Name is required.";
        } else if (!formState.category?.trim()) {
          error = "Select a category to continue.";
        } else if (!formState.type?.trim()) {
          error = "Agent type is required.";
        }
        break;
      }
      case "prompt": {
        if (!formState.system_prompt?.trim()) {
          error = "Provide a system prompt template.";
        }
        break;
      }
      case "model": {
        const primary = formState.config.providers?.primary;
        if (!primary?.provider) {
          error = "Select a primary provider.";
        } else if (!primary.model) {
          error = "Primary model is required.";
        }
        break;
      }
      case "data": {
        const tables = formState.data_source_config?.tables || [];
        if (tables.length === 0) {
          error = "Choose at least one table data source.";
        }
        break;
      }
      case "actions": {
        error = null;
        break;
      }
      case "schedule": {
        const schedule = formState.schedule_config?.schedule || "manual";
        if (schedule === "scheduled") {
          if (!formState.schedule_config?.frequency) {
            error = "Select a frequency for the schedule.";
          } else if (!formState.schedule_config?.run_at) {
            error = "Specify a run time.";
          }
        }
        break;
      }
      case "test": {
        error = null;
        break;
      }
      default:
        error = null;
    }

    updateStepError(step, error);
    return !error;
  };

  const handleUnlockNext = (currentStep: StepId) => {
    const currentIndex = stepIndex(currentStep);
    setMaxUnlockedStep((prev) => Math.max(prev, currentIndex + 1));
  };

  const handleStepChange = (nextStep: StepId) => {
    if (nextStep === activeStep) return;
    const nextIndex = stepIndex(nextStep);
    if (nextIndex <= maxUnlockedStep) {
      setActiveStep(nextStep);
      return;
    }

    if (validateStep(activeStep)) {
      handleUnlockNext(activeStep);
      const unlockedIndex = stepIndex(activeStep) + 1;
      if (nextIndex <= unlockedIndex) {
        setActiveStep(nextStep);
      }
    }
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    const currentIndex = stepIndex(activeStep);
    const nextStep = STEPS[currentIndex + 1];
    if (nextStep) {
      handleUnlockNext(activeStep);
      setActiveStep(nextStep.id);
    }
  };

  const handleBack = () => {
    const currentIndex = stepIndex(activeStep);
    const prevStep = STEPS[currentIndex - 1];
    if (prevStep) {
      setActiveStep(prevStep.id);
    }
  };

  const ensureAllStepsValid = () => {
    for (const step of STEPS) {
      if (!validateStep(step.id)) {
        setActiveStep(step.id);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    // Quick mode: validate only filled fields, not all steps
    if (isWizardMode && !ensureAllStepsValid()) {
      toast({
        title: "Fix validation issues",
        description: "Review each step and resolve the highlighted fields before saving.",
        variant: "destructive",
      });
      return;
    }

    // Quick mode: basic validation
    if (isQuickMode) {
      if (!formState.name.trim()) {
        toast({
          title: "Name required",
          description: "Please provide an agent name.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const savedAgent = await saveMutation.mutateAsync(formState);
      toast({
        title: formState.id ? "Agent updated" : "Agent created",
        description: `${savedAgent.name} saved successfully.`,
      });
      onSuccess?.(savedAgent);
      onClose();
    } catch (error) {
      toast({
        title: "Unable to save agent",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleTestRun = async () => {
    if (!formState.id) {
      toast({
        title: "Save agent first",
        description: "Persist the agent before running a dry run.",
      });
      return;
    }

    try {
      const response = await runMutation.mutateAsync({
        agent_id: formState.id,
        execution_context: {
          user_id: "system",
          filters: { category: formState.category || formState.type },
        },
      });

      toast({
        title: "Dry run triggered",
        description: response.summary || "Agent run started successfully.",
      });
    } catch (error) {
      toast({
        title: "Dry run failed",
        description: error instanceof Error ? error.message : "Unknown error encountered.",
        variant: "destructive",
      });
    }
  };

  const renderProviderSection = (label: string, key: "primary" | "fallback" | "research") => {
    const providerConfig = formState.config.providers?.[key] || providerDefaults[key];
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{label}</h4>
          {key === "research" && (
            <Switch
              checked={formState.config.features?.enableResearch ?? false}
              onCheckedChange={(checked) => toggleFeature("enableResearch", checked)}
            />
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Temperature</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={2}
              value={providerConfig.temperature ?? ""}
              onChange={(event) =>
                updateProvider(key, {
                  temperature: event.target.value ? Number(event.target.value) : undefined,
                })
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
                updateProvider(key, {
                  maxTokens: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              placeholder="e.g. 2000"
            />
          </div>
        </div>
      </div>
    );
  };

  const primaryProviderName = formState.config.providers?.primary?.provider;

  const promptPreview = useMemo(() => formState.system_prompt?.trim() || "No prompt provided yet.", [formState.system_prompt]);

  const nextStep = STEPS[stepIndex(activeStep) + 1];

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formState.id ? "Edit AI Agent" : "Create AI Agent"}</DialogTitle>
          <DialogDescription>
            {isQuickMode 
              ? "Update agent settings and configuration."
              : "Configure basic details, prompt, routing, and operational preferences for your AI agent."}
          </DialogDescription>
        </DialogHeader>

        {isQuickMode ? (
          // Quick Edit Mode: Simple tabs without wizard steps
          <Tabs value={activeStep} onValueChange={(value) => setActiveStep(value as StepId)} className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="model">Providers</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-6">
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">Agent name</Label>
                    <Input
                      id="agent-name"
                      value={formState.name}
                      onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="LinkedIn Deal Assistant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-slug">Slug</Label>
                    <Input
                      id="agent-slug"
                      value={formState.slug ?? ""}
                      onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
                      placeholder="linkedin-deal-assistant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-category">Category</Label>
                    <Input
                      id="agent-category"
                      value={formState.category ?? ""}
                      onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
                      placeholder="linkedin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-type">Agent type</Label>
                    <Input
                      id="agent-type"
                      value={formState.type ?? ""}
                      onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
                      placeholder="linkedin"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-description">Description</Label>
                  <Textarea
                    id="agent-description"
                    value={formState.description ?? ""}
                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Describe what this agent is responsible for"
                  />
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={Boolean(formState.is_active)}
                      onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, is_active: checked }))}
                    />
                    <div>
                      <p className="text-sm font-medium">Activation</p>
                      <p className="text-xs text-muted-foreground">Toggle to enable automated executions.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={Boolean(formState.config.features?.enableTelemetry ?? true)}
                      onCheckedChange={(checked) => toggleFeature("enableTelemetry", checked)}
                    />
                    <div>
                      <p className="text-sm font-medium">Telemetry</p>
                      <p className="text-xs text-muted-foreground">Collect latency and token usage metrics.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={primaryProviderName || DEFAULT_PROVIDER.provider}
                      onValueChange={(value) => updateProvider("primary", { provider: value })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Primary provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div>
                      <p className="text-sm font-medium">Primary provider</p>
                      <p className="text-xs text-muted-foreground">Sets the default provider for routing.</p>
                    </div>
                  </div>
                </div>

                {stepErrors.basic && <p className="text-sm text-destructive">{stepErrors.basic}</p>}
              </TabsContent>

              <TabsContent value="prompt" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-prompt">System prompt template</Label>
                  <Textarea
                    id="system-prompt"
                    className="min-h-[180px]"
                    value={formState.system_prompt ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormState((prev) => ({
                        ...prev,
                        system_prompt: value,
                        prompt_template: value,
                      }));
                    }}
                    placeholder="You are a business development assistant..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use handlebars-like placeholders such as {"{{account_name}}"} to personalize the prompt.
                  </p>
                </div>
                <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                  <p className="text-sm font-medium">Preview</p>
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{promptPreview}</pre>
                </div>
                {stepErrors.prompt && <p className="text-sm text-destructive">{stepErrors.prompt}</p>}
              </TabsContent>

              <TabsContent value="model" className="space-y-4">
                {renderProviderSection("Primary provider", "primary")}
                {renderProviderSection("Fallback provider", "fallback")}
                {renderProviderSection("Research provider", "research")}
                {stepErrors.model && <p className="text-sm text-destructive">{stepErrors.model}</p>}
              </TabsContent>

              <TabsContent value="data" className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Structured tables</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {TABLE_OPTIONS.map((option) => {
                      const checked = formState.data_source_config?.tables?.includes(option.value) ?? false;
                      return (
                        <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md border p-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleDataSource("tables", option.value)}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Document collections</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {DOCUMENT_OPTIONS.map((option) => {
                      const checked = formState.data_source_config?.documents?.includes(option.value) ?? false;
                      return (
                        <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md border p-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleDataSource("documents", option.value)}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {stepErrors.data && <p className="text-sm text-destructive">{stepErrors.data}</p>}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <div className="space-y-4">
                  <label className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Create follow-up tasks</p>
                      <p className="text-xs text-muted-foreground">Automatically create CRM tasks for flagged deals.</p>
                    </div>
                    <Switch
                      checked={Boolean(formState.output_actions?.create_tasks)}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          output_actions: {
                            ...prev.output_actions,
                            create_tasks: checked,
                          },
                        }))
                      }
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Send alert notifications</p>
                      <p className="text-xs text-muted-foreground">Push Slack or email alerts for urgent insights.</p>
                    </div>
                    <Switch
                      checked={Boolean(formState.output_actions?.send_alerts)}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          output_actions: {
                            ...prev.output_actions,
                            send_alerts: checked,
                          },
                        }))
                      }
                    />
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Run mode</Label>
                    <Select
                      value={formState.schedule_config?.schedule || "manual"}
                      onValueChange={(value) => updateSchedule({ schedule: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select run mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={formState.schedule_config?.frequency || ""}
                      onValueChange={(value) => updateSchedule({ frequency: value })}
                      disabled={(formState.schedule_config?.schedule || "manual") !== "scheduled"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Run time</Label>
                    <Input
                      type="time"
                      value={formState.schedule_config?.run_at || ""}
                      onChange={(event) => updateSchedule({ run_at: event.target.value })}
                      disabled={(formState.schedule_config?.schedule || "manual") !== "scheduled"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={formState.schedule_config?.timezone || "UTC"}
                      onValueChange={(value) => updateSchedule({ timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {stepErrors.schedule && <p className="text-sm text-destructive">{stepErrors.schedule}</p>}
              </TabsContent>

              <TabsContent value="test" className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Trigger a dry run to validate prompt output, routing, and data coverage. Save the agent first to enable
                    testing.
                  </p>
                </div>
                <Button onClick={handleTestRun} disabled={!formState.id || runMutation.isPending} className="gap-2">
                  {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  {runMutation.isPending ? "Running..." : "Run dry test"}
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          // Wizard Mode: Step-by-step with validation
          <Tabs value={activeStep} onValueChange={(value) => handleStepChange(value as StepId)} className="mt-4">
            <div className="flex flex-col gap-6 lg:flex-row">
              <TabsList className="grid h-fit grid-cols-3 gap-2 lg:w-48 lg:grid-cols-1">
                {STEPS.map((step, index) => (
                  <TabsTrigger
                    key={step.id}
                    value={step.id}
                    disabled={index > maxUnlockedStep}
                    className="justify-start gap-2 text-left"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold">
                      {index + 1}
                    </span>
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 space-y-6">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="agent-name">Agent name</Label>
                      <Input
                        id="agent-name"
                        value={formState.name}
                        onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="LinkedIn Deal Assistant"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agent-slug">Slug</Label>
                      <Input
                        id="agent-slug"
                        value={formState.slug ?? ""}
                        onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
                        placeholder="linkedin-deal-assistant"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agent-category">Category</Label>
                      <Input
                        id="agent-category"
                        value={formState.category ?? ""}
                        onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
                        placeholder="linkedin"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agent-type">Agent type</Label>
                      <Input
                        id="agent-type"
                        value={formState.type ?? ""}
                        onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
                        placeholder="linkedin"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent-description">Description</Label>
                    <Textarea
                      id="agent-description"
                      value={formState.description ?? ""}
                      onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="Describe what this agent is responsible for"
                    />
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={Boolean(formState.is_active)}
                        onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, is_active: checked }))}
                      />
                      <div>
                        <p className="text-sm font-medium">Activation</p>
                        <p className="text-xs text-muted-foreground">Toggle to enable automated executions.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={Boolean(formState.config.features?.enableTelemetry ?? true)}
                        onCheckedChange={(checked) => toggleFeature("enableTelemetry", checked)}
                      />
                      <div>
                        <p className="text-sm font-medium">Telemetry</p>
                        <p className="text-xs text-muted-foreground">Collect latency and token usage metrics.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={primaryProviderName || DEFAULT_PROVIDER.provider}
                        onValueChange={(value) => updateProvider("primary", { provider: value })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Primary provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div>
                        <p className="text-sm font-medium">Primary provider</p>
                        <p className="text-xs text-muted-foreground">Sets the default provider for routing.</p>
                      </div>
                    </div>
                  </div>

                  {stepErrors.basic && <p className="text-sm text-destructive">{stepErrors.basic}</p>}
                </TabsContent>

                <TabsContent value="prompt" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt">System prompt template</Label>
                    <Textarea
                      id="system-prompt"
                      className="min-h-[180px]"
                      value={formState.system_prompt ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormState((prev) => ({
                          ...prev,
                          system_prompt: value,
                          prompt_template: value,
                        }));
                      }}
                      placeholder="You are a business development assistant..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Use handlebars-like placeholders such as {"{{account_name}}"} to personalize the prompt.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                    <p className="text-sm font-medium">Preview</p>
                    <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{promptPreview}</pre>
                  </div>
                  {stepErrors.prompt && <p className="text-sm text-destructive">{stepErrors.prompt}</p>}
                </TabsContent>

                <TabsContent value="model" className="space-y-4">
                  {renderProviderSection("Primary provider", "primary")}
                  {renderProviderSection("Fallback provider", "fallback")}
                  {renderProviderSection("Research provider", "research")}
                  {stepErrors.model && <p className="text-sm text-destructive">{stepErrors.model}</p>}
                </TabsContent>

                <TabsContent value="data" className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Structured tables</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {TABLE_OPTIONS.map((option) => {
                        const checked = formState.data_source_config?.tables?.includes(option.value) ?? false;
                        return (
                          <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md border p-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleDataSource("tables", option.value)}
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Document collections</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {DOCUMENT_OPTIONS.map((option) => {
                        const checked = formState.data_source_config?.documents?.includes(option.value) ?? false;
                        return (
                          <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md border p-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleDataSource("documents", option.value)}
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {stepErrors.data && <p className="text-sm text-destructive">{stepErrors.data}</p>}
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="space-y-4">
                    <label className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm font-medium">Create follow-up tasks</p>
                        <p className="text-xs text-muted-foreground">Automatically create CRM tasks for flagged deals.</p>
                      </div>
                      <Switch
                        checked={Boolean(formState.output_actions?.create_tasks)}
                        onCheckedChange={(checked) =>
                          setFormState((prev) => ({
                            ...prev,
                            output_actions: {
                              ...prev.output_actions,
                              create_tasks: checked,
                            },
                          }))
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm font-medium">Send alert notifications</p>
                        <p className="text-xs text-muted-foreground">Push Slack or email alerts for urgent insights.</p>
                      </div>
                      <Switch
                        checked={Boolean(formState.output_actions?.send_alerts)}
                        onCheckedChange={(checked) =>
                          setFormState((prev) => ({
                            ...prev,
                            output_actions: {
                              ...prev.output_actions,
                              send_alerts: checked,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Run mode</Label>
                      <Select
                        value={formState.schedule_config?.schedule || "manual"}
                        onValueChange={(value) => updateSchedule({ schedule: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select run mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHEDULE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={formState.schedule_config?.frequency || ""}
                        onValueChange={(value) => updateSchedule({ frequency: value })}
                        disabled={(formState.schedule_config?.schedule || "manual") !== "scheduled"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Run time</Label>
                      <Input
                        type="time"
                        value={formState.schedule_config?.run_at || ""}
                        onChange={(event) => updateSchedule({ run_at: event.target.value })}
                        disabled={(formState.schedule_config?.schedule || "manual") !== "scheduled"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={formState.schedule_config?.timezone || "UTC"}
                        onValueChange={(value) => updateSchedule({ timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {stepErrors.schedule && <p className="text-sm text-destructive">{stepErrors.schedule}</p>}
                </TabsContent>

                <TabsContent value="test" className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Trigger a dry run to validate prompt output, routing, and data coverage. Save the agent first to enable
                      testing.
                    </p>
                  </div>
                  <Button onClick={handleTestRun} disabled={!formState.id || runMutation.isPending} className="gap-2">
                    {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                    {runMutation.isPending ? "Running..." : "Run dry test"}
                  </Button>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        )}

        <DialogFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          {isQuickMode ? (
            // Quick mode: Simple save/cancel
            <div className="flex w-full items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saveMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : (
            // Wizard mode: Navigation + save
            <>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={activeStep === "basic" || saveMutation.isPending}
                >
                  Back
                </Button>
              </div>
              <div className="flex items-center gap-3">
                {nextStep && (
                  <Button variant="secondary" onClick={handleNext} disabled={saveMutation.isPending}>
                    Next: {nextStep.label}
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saveMutation.isPending ? "Saving..." : "Create agent"}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
