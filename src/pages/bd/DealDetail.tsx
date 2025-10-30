import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Copy,
  Info,
  FileText,
  FileSignature,
  FileCheck,
  Sparkles,
  CheckSquare,
  Folder,
  Bot,
  Workflow,
  Zap,
  RefreshCw,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useDealComments, useAddComment, useDeleteComment, AddCommentPayload } from '@/hooks/useDealComments';
import { useDealChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem } from '@/hooks/useDealChecklist';
import { useDealSystemInfo } from '@/hooks/useDealSystemInfo';
import { useDealFiles } from '@/hooks/useDealFiles';
import { useSyncControlTowerDeals } from '@/hooks/useSyncControlTowerDeals';
import { useRunBDAgent } from '@/hooks/useRunBDAgent';
import { usePMContactInfo } from '@/hooks/usePMContactInfo';
import { DealControlTowerSync } from '@/components/bd/DealControlTowerSync';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { ContactPMDialog } from '@/components/bd/ContactPMDialog';
import { SendReminderDialog } from '@/components/bd/SendReminderDialog';
import AiLeadEvaluation from '@/features/pipeline/AiLeadEvaluation';
import { AIAgentModal } from '@/components/ai/AIAgentModal';
import type { DealFile } from '@/hooks/useDeals';
import { DEAL_STATUSES, STATUS_LABELS, STAGE_LABELS, type DealStatus } from '@/lib/dealStages';

interface DealExternalLinks {
  n8n_workflow_url?: string | null;
  activecollab_project_url?: string | null;
  collabai_agent_url?: string | null;
}

interface Deal {
  id: string;
  title: string;
  amount: number | null;
  potential_amount?: number | null;
  stage: string | null;
  status?: string | null;
  close_date: string | null;
  expected_closing_date?: string | null;
  probability: number | null;
  created_at: string;
  updated_at: string;
  control_tower_id: string | null;
  control_tower_status: string | null;
  control_tower_client_id: string | null;
  control_tower_owner_id: string | null;
  synced_from_control_tower: boolean | null;
  last_synced_at: string | null;
  last_activity_at?: string | null;
  last_activity_by?: string | null;
  client_id: string | null;
  owner_id: string | null;
  pm_assigned_id: string | null;
  pm_control_tower_id: string | null;
  notes?: string | null;
  hubspot_deal_id?: string | null;
  hubspot_crm_deal_url?: string | null;
  dealtype?: string | null;
  lead_source?: string | null;
  priority?: string | null;
  tags?: string[] | null;
  external_links?: DealExternalLinks | null;
  deal_files?: DealFile[];
  google_drive_folder_id?: string | null;
  google_drive_folder_url?: string | null;
  slug?: string | null;
  
  // New Control Tower fields
  category?: string | null;
  pipeline?: string | null;
  type_of_work?: string | null;
  pod_id?: string | null;
  
  // Document URLs
  estimate_url?: string | null;
  internal_estimate_doc_url?: string | null;
  client_estimate_doc_url?: string | null;
  estimate_task_link?: string | null;
  internal_estimate_doc_link?: string | null;
  pandadoc_proposal_url?: string | null;
  
  // Collaboration URLs
  collaborative_ai?: string | null;
  collaborative_ai_link?: string | null;
  workboard_ai_link?: string | null;
  client_agent_url?: string | null;
  client_agent_folder?: string | null;
  
  // CRM URLs
  leadslift_crm_deal_url?: string | null;
  
  // POD relationship
  pods?: {
    id: string;
    name: string;
  } | null;
  
  // Client relationship
  client?: {
    id: string;
    name: string | null;
    company?: string | null;
    website?: string | null;
  } | null;
}

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  contact_person: string;
  website: string;
  industry: string;
  slug: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
}

interface QuickActionsPanelProps {
  dealId: string;
  deal: Deal | null;
  controlTowerId?: string | null;
  externalLinks?: DealExternalLinks | null;
}

const actionItems = [
  {
    id: 'generate-docs',
    label: 'Generate Business Documents',
    icon: FileText,
    tooltip: 'N8N Integration - Coming in Phase 2'
  },
  {
    id: 'generate-sow',
    label: 'Generate SOW with Call Summary',
    icon: FileSignature,
    tooltip: 'N8N Integration - Coming in Phase 2'
  },
  {
    id: 'generate-nda',
    label: 'Generate NDA',
    icon: FileCheck,
    tooltip: 'N8N Integration - Coming in Phase 2'
  },
  {
    id: 'ask-ai',
    label: 'Ask AI for Suggestions',
    icon: Sparkles,
    tooltip: 'CollabAI Integration - Coming in Phase 2'
  },
  {
    id: 'create-task',
    label: 'Create ActiveCollab Task',
    icon: CheckSquare,
    tooltip: 'ActiveCollab Integration - Coming in Phase 2'
  },
  {
    id: 'create-project',
    label: 'Create Project',
    icon: Folder,
    tooltip: 'ActiveCollab Integration - Coming in Phase 2'
  },
];

const QuickActionsPanel = ({ dealId, deal, controlTowerId: _controlTowerId, externalLinks: _externalLinks }: QuickActionsPanelProps) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<{ id: string; name: string; description: string } | null>(null);
  const [agentResult, setAgentResult] = useState<any>(null);
  
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['bd-ai-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('id, name, description')
        .in('type', ['deal_analysis', 'proposal_review', 'objection_handling'])
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const runAgent = useRunBDAgent();

  const handleAction = async (actionId: string) => {
    setLoadingAction(actionId);
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast({ title: 'Feature coming in Phase 2' });
    setLoadingAction(null);
  };

  const handleAgentClick = (agent: { id: string; name: string; description: string }) => {
    setActiveAgent(agent);
    setAgentResult(null);
  };

  const handleAgentExecute = async (fileIds: string[], userContext: string) => {
    if (!activeAgent || !deal) return;

    try {
      const result = await runAgent.mutateAsync({
        agentId: activeAgent.id,
        dealId: deal.id,
        dealTitle: deal.title,
        clientName: deal.client?.name,
        dealStage: deal.stage || undefined,
        fileIds,
        userContext,
      });

      setAgentResult(result);
    } catch (error) {
      console.error('Agent execution error:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Agents Section */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Bot className="h-3 w-3" />
              AI Agents
            </h4>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {agentsLoading ? (
                <div className="col-span-full flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : agents && agents.length > 0 ? (
                agents.map((agent) => (
                  <Button
                    key={agent.id}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleAgentClick(agent)}
                  >
                    <Bot className="h-4 w-4" />
                    {agent.name}
                  </Button>
                ))
              ) : (
                <p className="col-span-full text-xs text-muted-foreground">No agents available</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Other Actions */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Other Actions</h4>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {actionItems.map((action) => (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      disabled
                      onClick={() => handleAction(action.id)}
                    >
                      <action.icon className="h-4 w-4" />
                      {loadingAction === action.id ? 'Loading…' : action.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{action.tooltip}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {activeAgent && (
        <AIAgentModal
          open={!!activeAgent}
          onOpenChange={(open) => {
            if (!open) {
              setActiveAgent(null);
              setAgentResult(null);
            }
          }}
          agentId={activeAgent.id}
          agentName={activeAgent.name}
          agentDescription={activeAgent.description}
          dealId={dealId}
          dealTitle={deal?.title || ''}
          onExecute={handleAgentExecute}
          isLoading={runAgent.isPending}
          result={agentResult}
        />
      )}
    </>
  );
};

interface ExternalLinksSectionProps {
  externalLinks?: DealExternalLinks | null;
  hubspotUrl?: string | null;
  leadsLiftUrl?: string | null;
  estimateUrl?: string | null;
  pandadocUrl?: string | null;
  collabAiUrl?: string | null;
  workboardUrl?: string | null;
  clientAgentUrl?: string | null;
}

const ExternalLinksSection = ({ 
  externalLinks, 
  hubspotUrl,
  leadsLiftUrl,
  estimateUrl,
  pandadocUrl,
  collabAiUrl,
  workboardUrl,
  clientAgentUrl
}: ExternalLinksSectionProps) => {
  const links = useMemo(
    () =>
      [
        {
          label: 'HubSpot Deal',
          url: hubspotUrl,
          icon: ExternalLink,
          color: 'text-orange-600'
        },
        {
          label: 'LeadsLift CRM',
          url: leadsLiftUrl,
          icon: ExternalLink,
          color: 'text-blue-600'
        },
        {
          label: 'Estimate Document',
          url: estimateUrl,
          icon: FileText,
          color: 'text-green-600'
        },
        {
          label: 'PandaDoc Proposal',
          url: pandadocUrl,
          icon: FileSignature,
          color: 'text-purple-600'
        },
        {
          label: 'CollabAI Workspace',
          url: collabAiUrl,
          icon: Bot,
          color: 'text-green-600'
        },
        {
          label: 'Workboard AI',
          url: workboardUrl,
          icon: Workflow,
          color: 'text-indigo-600'
        },
        {
          label: 'Client Agent',
          url: clientAgentUrl,
          icon: User,
          color: 'text-teal-600'
        },
        {
          label: 'N8N Workflow',
          url: externalLinks?.n8n_workflow_url,
          icon: Workflow,
          color: 'text-purple-600'
        },
        {
          label: 'ActiveCollab Project',
          url: externalLinks?.activecollab_project_url,
          icon: Folder,
          color: 'text-blue-600'
        },
        {
          label: 'CollabAI Agent (Legacy)',
          url: externalLinks?.collabai_agent_url,
          icon: Bot,
          color: 'text-green-600'
        }
      ].filter((link) => link.url),
    [externalLinks, hubspotUrl, leadsLiftUrl, estimateUrl, pandadocUrl, collabAiUrl, workboardUrl, clientAgentUrl]
  );

  if (links.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ExternalLink className="h-4 w-4" />
          External Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url!}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between rounded border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${link.color}`}
          >
            <span className="flex items-center gap-2 text-foreground">
              <link.icon className="h-4 w-4" />
              {link.label}
            </span>
            <ExternalLink className="h-4 w-4" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
};

interface DealStageProgressProps {
  currentStage?: string | null;
}

const pipelineStages = [
  { id: 'prospecting', label: STAGE_LABELS.prospecting, color: 'bg-blue-500' },
  { id: 'qualification', label: STAGE_LABELS.qualification, color: 'bg-purple-500' },
  { id: 'proposal', label: STAGE_LABELS.proposal, color: 'bg-yellow-500' },
  { id: 'negotiation', label: STAGE_LABELS.negotiation, color: 'bg-orange-500' },
  { id: 'closed_won', label: STAGE_LABELS.closed_won, color: 'bg-green-500' },
];

const DealStageProgress = ({ currentStage }: DealStageProgressProps) => {
  const stageIndex = pipelineStages.findIndex((stage) => stage.id === currentStage);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
      {pipelineStages.map((stage, index) => {
        const isCompleted = stageIndex > index;
        const isCurrent = stageIndex === index;

        return (
          <div key={stage.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${
                isCompleted || isCurrent ? stage.color : 'bg-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <div className="text-sm font-medium capitalize">
              {stage.label}
              {isCurrent && <span className="ml-2 text-xs text-primary">Current</span>}
            </div>
            {index < pipelineStages.length - 1 && (
              <div className="h-px w-8 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
};

const highlightMentions = (text: string, mentionedEmails?: string[] | null) => {
  if (!mentionedEmails || mentionedEmails.length === 0) {
    return <>{text}</>;
  }

  const mentionSet = new Set(mentionedEmails.map((email) => email.toLowerCase()));
  const parts = text.split(/(@[\w.+-@]+)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          const value = part.slice(1).toLowerCase();
          if (mentionSet.has(value)) {
            return (
              <span key={`${part}-${index}`} className="font-medium text-primary">
                {part}
              </span>
            );
          }
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
};

export default function DealDetail() {
  const { stage, slug } = useParams<{ stage: string; slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Extract active tab from URL
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';

  const [deal, setDeal] = useState<Deal | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [pm, setPm] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const autoApplyAttemptedRef = useRef(false);
  
  // Google Drive state
  const [syncingFolder, setSyncingFolder] = useState(false);
  const [showMapFolderDialog, setShowMapFolderDialog] = useState(false);
  const [folderUrl, setFolderUrl] = useState("");
  const [showContactPMDialog, setShowContactPMDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  // Permission check for AI Lead Evaluation
  const canViewAiLeadEvaluation = Boolean(user && ['super_admin', 'manager', 'bd_user'].includes(user.role));

  // Fetch deal by slug
  const { data: dealData, isLoading: dealLoading } = useQuery({
    queryKey: ['deal-by-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('deals')
        .select('*, clients(*)')
        .eq('slug', slug)
        .single();
      
      if (error) {
        console.error('[DealDetail] Error fetching deal by slug:', error);
        throw error;
      }
      return data;
    },
    enabled: !!slug,
  });

  const dealId = dealData?.id || '';

  // Update local deal and client state when data loads
  useEffect(() => {
    if (dealData) {
      setDeal(dealData as Deal);
      if (dealData.clients) {
        setClient(dealData.clients as Client);
      }
      setLoading(false);
    } else if (dealLoading) {
      setLoading(true);
    }
  }, [dealData, dealLoading]);

  const { data: comments, isLoading: commentsLoading } = useDealComments(dealId);
  const { data: checklistItems, isLoading: checklistLoading } = useDealChecklist(dealId);
  const { data: systemInfo, isLoading: systemInfoLoading } = useDealSystemInfo(dealId, deal?.title);
  const { files, loading: filesLoading, refetch: refetchFiles } = useDealFiles({
    dealId: deal?.id,
    enabled: !!deal?.id
  });
  const addCommentMutation = useAddComment(dealId);
  const deleteCommentMutation = useDeleteComment(dealId);
  const addChecklistMutation = useAddChecklistItem(dealId);
  const toggleChecklistMutation = useToggleChecklistItem(dealId);
  const deleteChecklistMutation = useDeleteChecklistItem(dealId);
  const { syncDeals: syncSingleDeal, isSyncing: isSyncingSingle } = useSyncControlTowerDeals(dealId);
  const [isSyncingDeal, setIsSyncingDeal] = useState(false);
  const [resyncingChecklist, setResyncingChecklist] = useState(false);
  
  // Fetch PM contact info from profiles or employees table
  const { data: pmContactInfo } = usePMContactInfo(
    deal?.pm_assigned_id,
    deal?.pm_control_tower_id
  );

  // Handle tab changes and update URL
  const handleTabChange = (newTab: string) => {
    const newSearchParams = new URLSearchParams(location.search);
    if (newTab === 'overview') {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', newTab);
    }
    navigate({
      pathname: location.pathname,
      search: newSearchParams.toString()
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshDealDetails = useCallback(async () => {
    if (!dealId) return;

    try {
      const { data: refreshedDeal, error: refreshedDealError } = await supabase
        .from('deals')
        .select('*, clients(*)')
        .eq('id', dealId)
        .single();

      if (refreshedDealError) throw refreshedDealError;

      if (refreshedDeal) {
        setDeal(refreshedDeal as Deal);
      }

      if (refreshedDeal?.client_id) {
        const { data: refreshedClient, error: refreshedClientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', refreshedDeal.client_id)
          .single();

        if (!refreshedClientError && refreshedClient) {
          setClient(refreshedClient as Client);
        }
      }
    } catch (refreshError) {
      console.error('Failed to refresh deal after AI evaluation:', refreshError);
    }
  }, [dealId]);

  useEffect(() => {
    async function fetchDeal() {
      try {
        setLoading(true);
        setError(null);

        if (!slug) {
          setError('Invalid deal URL');
          return;
        }

        const idParts = slug.split('-');
        if (idParts.length < 5) {
          setError('Invalid deal URL format');
          return;
        }

        const extractedDealId = idParts.slice(-5).join('-');

        const { data: dealData, error: dealError } = await supabase
          .from('deals')
          .select(`
            *,
            pods(id, name),
            deal_files:deal_files(
              id,
              deal_id,
              client_id,
              category,
              drive_file_id,
              drive_folder_id,
              drive_file_name,
              drive_file_type,
              drive_last_modified_at,
              drive_created_at,
              storage_bucket_path,
              json_snapshot_path,
              file_size,
              checksum,
              metadata,
              drive_folder_url,
              created_at,
              updated_at
            )
          `)
          .eq('id', extractedDealId)
          .single();

        if (dealError) throw dealError;
        if (!dealData) {
          setError('Deal not found');
          return;
        }

        setDeal(dealData as Deal);

        if (dealData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', dealData.client_id)
            .single();
          if (clientData) setClient(clientData as Client);
        }

        if (dealData.owner_id) {
          const { data: ownerData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('id', dealData.owner_id)
            .single();
          if (ownerData) setOwner(ownerData as UserProfile);
        }

        if (dealData.pm_assigned_id) {
          const { data: pmData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('id', dealData.pm_assigned_id)
            .single();
          if (pmData) setPm(pmData as UserProfile);
        }

        // Fetch all users for PM assignment dropdown
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('status', 'active')
          .order('first_name');
        if (usersData) setAllUsers(usersData as UserProfile[]);
      } catch (err) {
        console.error('Error fetching deal:', err);
        setError(err instanceof Error ? err.message : 'Failed to load deal');
      } finally {
        setLoading(false);
      }
    }

    fetchDeal();
  }, [slug]);

  useEffect(() => {
    const autoApplyTemplate = async () => {
      if (!deal?.id || !deal.stage) return;
      if ((checklistItems?.length ?? 0) > 0) return;
      if (autoApplyAttemptedRef.current) return;

      autoApplyAttemptedRef.current = true;

      try {
        const { data, error } = await supabase.functions.invoke('apply-checklist-template', {
          body: { dealId: deal.id, stage: deal.stage },
        });

        if (error) throw error;
        if (data?.success) {
          toast({ title: 'Checklist template applied' });
          queryClient.invalidateQueries({ queryKey: ['deal-checklist', deal.id] });
        }
      } catch (err) {
        console.error('Failed to apply checklist template:', err);
      }
    };

    autoApplyTemplate();
  }, [deal?.id, deal?.stage, checklistItems?.length, queryClient]);

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const mentionPattern = /@([\w.+-@]+)/g;
    const mentions = [...newComment.matchAll(mentionPattern)].map((match) => match[1]);
    const uniqueMentions = Array.from(new Set(mentions));

    let mentionedUsersPayload: AddCommentPayload['mentioned_users'] = [];
    let mentionedEmailsPayload: AddCommentPayload['mentioned_user_emails'] = [];

    if (uniqueMentions.length > 0) {
      const { data: mentionUsers, error: mentionError } = await supabase
        .from('users')
        .select('id, email')
        .in('email', uniqueMentions);

      if (mentionError) {
        console.error('Failed to resolve mentions:', mentionError);
      } else if (mentionUsers) {
        mentionedUsersPayload = mentionUsers.map((user) => user.id);
        mentionedEmailsPayload = mentionUsers.map((user) => user.email);
      }
    } else {
      mentionedUsersPayload = [];
      mentionedEmailsPayload = [];
    }

    try {
      await addCommentMutation.mutateAsync({
        comment: newComment,
        mentioned_users: mentionedUsersPayload,
        mentioned_user_emails: mentionedEmailsPayload,
      });
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    addChecklistMutation.mutate(newChecklistItem);
    setNewChecklistItem('');
  };

  const handleToggleChecklistItem = (itemId: string, isCompleted: boolean) => {
    toggleChecklistMutation.mutate({ itemId, isCompleted });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteChecklistMutation.mutate(itemId);
    }
  };

  // PM Assignment mutation
  const assignPmMutation = useMutation({
    mutationFn: async (pmId: string | null) => {
      if (!deal?.id) throw new Error('No deal ID');
      
      const { data, error } = await supabase
        .from('deals')
        .update({ pm_assigned_id: pmId })
        .eq('id', deal.id)
        .select('pm_assigned_id')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (_, pmId) => {
      if (pmId) {
        const { data: pmData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', pmId)
          .single();
        if (pmData) setPm(pmData as UserProfile);
      } else {
        setPm(null);
      }
      
      toast({
        title: 'PM assigned successfully',
        description: pmId ? 'Project manager has been updated' : 'Project manager removed',
      });
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
    },
    onError: (error) => {
      toast({
        title: 'Assignment failed',
        description: error instanceof Error ? error.message : 'Failed to assign PM',
        variant: 'destructive',
      });
    },
  });

  const handleAssignPm = (pmId: string) => {
    assignPmMutation.mutate(pmId === 'unassigned' ? null : pmId);
  };

  const handleAssignToMe = async (role: 'owner' | 'pm') => {
    if (!deal?.id || !user?.id) return;
    
    const field = role === 'owner' ? 'owner_id' : 'pm_assigned_id';
    
    try {
      const { error } = await supabase
        .from('deals')
        .update({ [field]: user.id })
        .eq('id', deal.id);
      
      if (error) throw error;
      
      if (role === 'owner') {
        const { data: ownerData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', user.id)
          .single();
        if (ownerData) setOwner(ownerData as UserProfile);
      } else {
        const { data: pmData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', user.id)
          .single();
        if (pmData) setPm(pmData as UserProfile);
      }
      
      toast({
        title: 'Assigned successfully',
        description: `You are now the ${role === 'owner' ? 'deal owner' : 'project manager'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
    } catch (error) {
      toast({
        title: 'Assignment failed',
        description: error instanceof Error ? error.message : 'Failed to assign',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`,
    });
  };

  const handleSyncDealFromControlTower = async () => {
    setIsSyncingDeal(true);
    try {
      await syncSingleDeal();
      // Refresh all deal data after sync
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['deal', slug] }),
        queryClient.invalidateQueries({ queryKey: ['deal-checklist', dealId] }),
        queryClient.invalidateQueries({ queryKey: ['deal-comments', dealId] }),
        queryClient.invalidateQueries({ queryKey: ['deal-files', dealId] })
      ]);
      
      // Refresh the deal data locally
      await refreshDealDetails();
      
      toast({
        title: 'Sync complete',
        description: 'Deal data updated from Control Tower'
      });
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsSyncingDeal(false);
    }
  };

  const handleResyncChecklist = async () => {
    if (!deal?.synced_from_control_tower) {
      toast({
        title: 'Cannot re-sync',
        description: 'This deal is not synced from Control Tower',
        variant: 'destructive'
      });
      return;
    }

    setResyncingChecklist(true);
    try {
      const { data, error } = await supabase.functions.invoke('resync-deal-checklist', {
        body: { dealId }
      });

      if (error) throw error;

      // Refresh checklist and deal data
      await queryClient.invalidateQueries({ queryKey: ['deal-checklist', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      await refreshDealDetails();
      
      toast({
        title: 'Checklist re-synced',
        description: `${data.synced_count} items synced from Control Tower`
      });
    } catch (error) {
      toast({
        title: 'Re-sync failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setResyncingChecklist(false);
    }
  };

  const handleMapGoogleDriveFolder = async () => {
    if (!deal || !folderUrl.trim()) return;
    
    const folderIdMatch = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (!folderIdMatch) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Google Drive folder URL",
        variant: "destructive",
      });
      return;
    }
    
    const folderId = folderIdMatch[1];
    
    try {
      const { error } = await supabase
        .from("deals")
        .update({
          google_drive_folder_id: folderId,
          google_drive_folder_url: folderUrl.trim(),
        })
        .eq("id", deal.id);
      
      if (error) throw error;
      
      setDeal({ ...deal, google_drive_folder_id: folderId, google_drive_folder_url: folderUrl.trim() });
      setShowMapFolderDialog(false);
      setFolderUrl("");
      
      toast({
        title: "Folder mapped",
        description: "Google Drive folder has been linked to this deal",
      });
      
      await handleSyncDriveFolder(folderId);
    } catch (error) {
      console.error("Failed to map folder", error);
      toast({
        title: "Error",
        description: "Failed to map Google Drive folder",
        variant: "destructive",
      });
    }
  };

  const handleSyncDriveFolder = async (folderId?: string) => {
    if (!deal) return;
    
    const driveFolder = folderId || deal.google_drive_folder_id;
    if (!driveFolder) return;
    
    setSyncingFolder(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-deal-files", {
        body: {
          deals: [{
            dealId: deal.id,
            driveFolderId: driveFolder,
          }],
        },
      });
      
      if (error) throw error;
      
      const result = data?.results?.[0];
      if (result?.status === "success") {
        toast({
          title: "Sync complete",
          description: `${result.filesAdded || 0} files added, ${result.filesUpdated || 0} updated`,
        });
        refetchFiles();
      } else {
        throw new Error(result?.error || "Sync failed");
      }
    } catch (error) {
      console.error("Sync failed", error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unable to sync Google Drive folder",
        variant: "destructive",
      });
    } finally {
      setSyncingFolder(false);
    }
  };

  const completionPercentage = checklistItems
    ? Math.round((checklistItems.filter((item) => item.is_completed).length / checklistItems.length) * 100) || 0
    : 0;

  const getStageBadgeVariant = (currentStage?: string | null): 'default' | 'destructive' | 'outline' | 'secondary' => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      prospecting: 'secondary',
      qualification: 'outline',
      proposal: 'default',
      negotiation: 'default',
      closed_won: 'default',
      closed_lost: 'destructive',
    };
    return variants[currentStage ?? ''] || 'secondary';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <p>Deal Detail Content - Needs to be restored from git history</p>
      <p>Deal ID: {dealId}</p>
      <p>PM Contact Info: {JSON.stringify(pmContactInfo)}</p>
      
      {/* Contact PM Dialog */}
      {pmContactInfo?.email && (
        <ContactPMDialog
          open={showContactPMDialog}
          onOpenChange={setShowContactPMDialog}
          dealId={dealId}
          dealTitle={deal?.title || ''}
          dealSlug={deal?.slug || undefined}
          dealStage={stage}
          pmName={pmContactInfo.full_name}
          pmEmail={pmContactInfo.email}
        />
      )}

      {/* Send Reminder Dialog */}
      <SendReminderDialog
        open={showReminderDialog}
        onOpenChange={setShowReminderDialog}
        dealId={dealId}
        dealTitle={deal?.title || ''}
        ownerEmail={owner?.email}
        ownerName={(owner?.first_name || '') + ' ' + (owner?.last_name || '')}
        pmEmail={pmContactInfo?.email}
        pmName={pmContactInfo?.full_name}
      />
    </div>
  );
}
