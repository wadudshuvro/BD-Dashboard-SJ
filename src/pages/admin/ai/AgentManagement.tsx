import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useAdminAIAgents,
  useAgentRunsForUser,
  useRunAgentChat,
  useCreateAdminAgent,
  useUpdateAdminAgent,
  useToggleAdminAgent,
  useDeleteAdminAgent,
  type AdminAIAgent,
  type AgentRunRow,
} from "@/hooks/useAdminAIAgents";
import {
  QuickStartWizard,
  AgentCategoryGuide,
  SystemPromptGuide,
  MemorySystemGuide,
} from "@/components/admin/AgentConfigurationGuide";
import { Bot, MessageSquare, Play, Pencil, Power, PowerOff, Trash2, History, Loader2 } from "lucide-react";

function RunAgentDialog({
  agent,
  open,
  onOpenChange,
}: {
  agent: AdminAIAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const runChat = useRunAgentChat();
  const { toast } = useToast();

  const handleRun = async () => {
    if (!agent || !input.trim()) return;
    try {
      await runChat.mutateAsync({ agentId: agent.id, input: input.trim() });
      toast({ title: "Run completed" });
      setInput("");
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Run failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run: {agent?.name}</DialogTitle>
          <DialogDescription>One-off execution. No conversation history.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Input</Label>
          <Textarea
            placeholder="Enter your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRun} disabled={runChat.isPending || !input.trim()}>
            {runChat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExecutionHistoryDialog({
  runs,
  agents,
  open,
  onOpenChange,
}: {
  runs: AgentRunRow[];
  agents: AdminAIAgent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Execution History</DialogTitle>
          <DialogDescription>Last 50 runs (your user).</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {runs.length === 0 && <p className="text-sm text-muted-foreground">No runs yet.</p>}
            {runs.map((run) => {
              const agent = run.agent_id ? agentMap.get(run.agent_id) : null;
              const out = run.output as { text?: string } | null;
              const inp = run.input as { text?: string } | null;
              const chain = run.provider_chain as { latency_ms?: number } | null;
              return (
                <Card key={run.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm">{agent?.name ?? "Unknown agent"}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={run.status === "completed" ? "default" : run.status === "failed" ? "destructive" : "secondary"}>
                          {run.status}
                        </Badge>
                        {chain?.latency_ms != null && (
                          <Badge variant="outline">{chain.latency_ms}ms</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {run.created_at ? new Date(run.created_at).toLocaleString() : ""}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {inp?.text && <p><span className="font-medium">Input:</span> {inp.text}</p>}
                    {out?.text && (
                      <div>
                        <span className="font-medium">Output:</span>
                        <div className="prose prose-sm dark:prose-invert mt-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{out.text}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function AgentFormDialog({
  agent,
  open,
  onOpenChange,
  onSuccess,
}: {
  agent: AdminAIAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const isEdit = !!agent;
  const [name, setName] = useState(agent?.name ?? "");
  const [slug, setSlug] = useState(agent?.slug ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [category, setCategory] = useState(agent?.category ?? "general");
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt ?? agent?.prompt_template ?? "");
  const [isEnabled, setIsEnabled] = useState(agent?.is_enabled ?? true);
  const [memoryEnabled, setMemoryEnabled] = useState(agent?.memory_enabled ?? false);

  const createAgent = useCreateAdminAgent();
  const updateAgent = useUpdateAdminAgent();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    try {
      if (isEdit) {
        await updateAgent.mutateAsync({
          id: agent.id,
          name: name.trim(),
          slug: slug || undefined,
          description: description || null,
          category: category || "general",
          system_prompt: systemPrompt.trim(),
          is_enabled: isEnabled,
          memory_enabled: memoryEnabled,
        });
        toast({ title: "Agent updated" });
      } else {
        await createAgent.mutateAsync({
          name: name.trim(),
          slug: slug || undefined,
          description: description || null,
          category: category || "general",
          system_prompt: systemPrompt.trim(),
          is_enabled: isEnabled,
          memory_enabled: memoryEnabled,
        });
        toast({ title: "Agent created" });
      }
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit agent" : "New agent"}</DialogTitle>
          <DialogDescription>Configure name, prompt, and options.</DialogDescription>
        </DialogHeader>
        {!isEdit && <QuickStartWizard />}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-slug" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </div>
          <div className="flex items-center gap-2">
            <Label>Category</Label>
            <AgentCategoryGuide />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["general", "communication", "analysis", "task_management"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>System prompt</Label>
              <SystemPromptGuide />
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant..."
              rows={6}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Enable agent</Label>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Memory (conversation history)</Label>
              <MemorySystemGuide />
            </div>
            <Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createAgent.isPending || updateAgent.isPending}>
            {createAgent.isPending || updateAgent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AgentManagement() {
  const navigate = useNavigate();
  const { data: agents = [], isLoading } = useAdminAIAgents();
  const { data: runs = [] } = useAgentRunsForUser();
  const [runDialogAgent, setRunDialogAgent] = useState<AdminAIAgent | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [formAgent, setFormAgent] = useState<AdminAIAgent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteAgent, setDeleteAgent] = useState<AdminAIAgent | null>(null);
  const toggleAgent = useToggleAdminAgent();
  const deleteAdminAgent = useDeleteAdminAgent();
  const { toast } = useToast();

  const enabledCount = agents.filter((a) => a.is_enabled ?? a.is_active).length;

  const handleToggle = async (a: AdminAIAgent) => {
    try {
      await toggleAgent.mutateAsync({ id: a.id, is_enabled: !(a.is_enabled ?? a.is_active) });
      toast({ title: a.is_enabled ? "Agent disabled" : "Agent enabled" });
    } catch (e) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteAgent) return;
    try {
      await deleteAdminAgent.mutateAsync(deleteAgent.id);
      toast({ title: "Agent deleted" });
      setDeleteAgent(null);
    } catch (e) {
      toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agent Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4 mr-2" /> Execution History
          </Button>
          <Button onClick={() => { setFormAgent(null); setFormOpen(true); }}>
            New agent
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-semibold">{agents.length}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Enabled</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-semibold">{enabledCount}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Disabled</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-semibold">{agents.length - enabledCount}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Your runs</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-semibold">{runs.length}</span></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => {
          const enabled = a.is_enabled ?? a.is_active ?? false;
          return (
            <Card key={a.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{a.name}</CardTitle>
                  <CardDescription>{a.description || a.category || a.slug}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "On" : "Off"}</Badge>
                  {a.memory_enabled && <Badge variant="outline">Memory</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {enabled && (
                    <>
                      <Button size="sm" variant="default" onClick={() => navigate(`/adminpanel/ai/chat?agent=${a.id}`)}>
                        <MessageSquare className="h-4 w-4 mr-1" /> Chat
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRunDialogAgent(a)}>
                        <Play className="h-4 w-4 mr-1" /> Run
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setFormAgent(a); setFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggle(a)} disabled={toggleAgent.isPending}>
                    {enabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteAgent(a)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <RunAgentDialog agent={runDialogAgent} open={!!runDialogAgent} onOpenChange={(o) => !o && setRunDialogAgent(null)} />
      <ExecutionHistoryDialog runs={runs} agents={agents} open={historyOpen} onOpenChange={setHistoryOpen} />
      <AgentFormDialog agent={formAgent} open={formOpen} onOpenChange={setFormOpen} onSuccess={() => {}} />
      <AlertDialog open={!!deleteAgent} onOpenChange={(o) => !o && setDeleteAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agent?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the agent and its run history. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
