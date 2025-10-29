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
import { useDealComments, useAddComment, useDeleteComment, AddCommentPayload } from '@/hooks/useDealComments';
import { useDealChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem } from '@/hooks/useDealChecklist';
import { useDealSystemInfo } from '@/hooks/useDealSystemInfo';
import { useDealFiles } from '@/hooks/useDealFiles';
import { useSyncControlTowerDeals } from '@/hooks/useSyncControlTowerDeals';
import { useRunBDAgent } from '@/hooks/useRunBDAgent';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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

  // Permission check for AI Lead Evaluation
  const canViewAiLeadEvaluation = Boolean(user && ['super_admin', 'manager', 'bd_user'].includes(user.role));

  const parts = slug?.split('-') || [];
  const dealId = parts.length >= 5 ? parts.slice(-5).join('-') : '';

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

  if (error || !deal) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error || 'Deal not found'}</p>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPath = location.pathname;
  const basePath = `/pipeline/${stage}/${slug}`;
  const isFilesTab = currentPath.includes('/files');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate(-1)} variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getStageBadgeVariant(deal.stage)} className="capitalize">
                {deal.stage?.replace('_', ' ') || 'prospecting'}
              </Badge>
              
              {/* Status Selector */}
              <Select
                value={deal.status || 'active'}
                onValueChange={async (value: DealStatus) => {
                  try {
                    await supabase
                      .from('deals')
                      .update({ status: value })
                      .eq('id', deal.id);
                    toast({ title: 'Status updated successfully' });
                    queryClient.invalidateQueries({ queryKey: ['deal', slug] });
                  } catch (error) {
                    toast({ title: 'Failed to update status', variant: 'destructive' });
                  }
                }}
              >
                <SelectTrigger className="w-[140px] h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {deal.priority && <Badge variant="outline">Priority: {deal.priority}</Badge>}
              {deal.synced_from_control_tower && <Badge variant="outline">Synced from Control Tower</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{deal.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Created {formatDate(deal.created_at)}</span>
              {deal.last_activity_at && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />Last activity {formatDistanceToNow(new Date(deal.last_activity_at), { addSuffix: true })}
                </span>
              )}
              {deal.last_synced_at && (
                <span className="flex items-center gap-1">
                  <Workflow className="h-4 w-4" />Synced {formatDistanceToNow(new Date(deal.last_synced_at), { addSuffix: true })}
                </span>
              )}
            </div>
            {deal.tags && deal.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {deal.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="text-right space-y-2">
            <div className="text-3xl font-bold">{formatCurrency(deal.amount)}</div>
            {deal.potential_amount && (
              <div className="text-sm text-muted-foreground">Potential: {formatCurrency(deal.potential_amount)}</div>
            )}
            {deal.probability && (
              <div className="text-sm text-muted-foreground">{deal.probability}% probability</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" colorIndicator="blue">
            Overview
          </TabsTrigger>
          <TabsTrigger value="activities" colorIndicator="green">
            <div className="flex items-center gap-2">
              Activities
              {comments && comments.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 py-0 text-xs">
                  {comments.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="tasks" colorIndicator="yellow">
            <div className="flex items-center gap-2">
              Tasks
              {checklistItems && checklistItems.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 py-0 text-xs">
                  {checklistItems.filter(item => item.is_completed).length}/{checklistItems.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="documents" colorIndicator="purple">
            <div className="flex items-center gap-2">
              Documents
              {files.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 py-0 text-xs">
                  {files.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="systems" colorIndicator="orange">
            Action
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {deal?.client_id && (
            <AiLeadEvaluation
              dealId={deal.id}
              clientId={deal.client_id}
              companyName={
                deal.client?.company?.trim() ||
                deal.client?.name?.trim() ||
                deal.title ||
                'Unnamed Deal'
              }
              website={deal.client?.website}
              probability={deal.probability}
              status={deal.status}
              canAccess={canViewAiLeadEvaluation}
              onDealRefetch={refreshDealDetails}
            />
          )}
          <DealStageProgress currentStage={deal.stage} />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Deal Information - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-4 w-4" />
                  Deal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Stage</p>
                    <p className="text-sm font-medium capitalize">{deal.stage?.replace('_', ' ') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize">{STATUS_LABELS[deal.status as DealStatus] || 'Active'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Close</p>
                    <p className="text-sm font-medium">{formatDate(deal.expected_closing_date || deal.close_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lead Source</p>
                    <p className="text-sm font-medium">{deal.lead_source || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Deal Type</p>
                    <p className="text-sm font-medium">{deal.dealtype === 'newbusiness' ? 'New Business' : deal.dealtype === 'existingbusiness' ? 'Existing Business' : deal.dealtype || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium">{deal.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pipeline</p>
                    <p className="text-sm font-medium">{deal.pipeline || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type of Work</p>
                    <p className="text-sm font-medium">{deal.type_of_work || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">POD</p>
                    <p className="text-sm font-medium">{deal.pods?.name || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client & Team - Merged */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-4 w-4" />
                  Client & Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Info */}
                {client && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Client</p>
                    <div className="space-y-2">
                      <div>
                        <Link 
                          to={`/clients/${client.slug}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {client.company || client.name}
                        </Link>
                        {client.contact_person && (
                          <p className="text-xs text-muted-foreground">{client.contact_person}</p>
                        )}
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a href={`mailto:${client.email}`} className="text-xs hover:underline">
                            {client.email}
                          </a>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a href={`tel:${client.phone}`} className="text-xs hover:underline">
                            {client.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Team Info */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Team</p>
                  
                  {/* Deal Owner */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Deal Owner</p>
                      {owner?.id !== user?.id && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-xs"
                          onClick={() => handleAssignToMe('owner')}
                        >
                          Assign to Me
                        </Button>
                      )}
                    </div>
                    {owner ? (
                      <div>
                        <p className="text-sm font-medium">{owner.first_name} {owner.last_name}</p>
                        <p className="text-xs text-muted-foreground">{owner.email}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not assigned</p>
                    )}
                  </div>

                  {/* Project Manager */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Project Manager</p>
                      {pm?.id !== user?.id && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-xs"
                          onClick={() => handleAssignToMe('pm')}
                        >
                          Assign to Me
                        </Button>
                      )}
                    </div>
                    <Select
                      value={pm?.id || 'unassigned'}
                      onValueChange={handleAssignPm}
                      disabled={assignPmMutation.isPending}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned" className="text-xs">
                          Unassigned
                        </SelectItem>
                        {allUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="text-xs">
                            {u.first_name} {u.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {deal.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Deal Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{deal.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Documents & Estimates Section */}
            {(deal.estimate_url || deal.internal_estimate_doc_url || deal.client_estimate_doc_url || 
              deal.pandadoc_proposal_url || deal.estimate_task_link || deal.internal_estimate_doc_link) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4" />
                    Documents & Estimates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deal.estimate_url && (
                    <a href={deal.estimate_url} target="_blank" rel="noopener noreferrer" 
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        Estimate Document
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.internal_estimate_doc_url && (
                    <a href={deal.internal_estimate_doc_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <FileCheck className="h-4 w-4" />
                        Internal Estimate
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.client_estimate_doc_url && (
                    <a href={deal.client_estimate_doc_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <FileSignature className="h-4 w-4" />
                        Client Estimate
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.pandadoc_proposal_url && (
                    <a href={deal.pandadoc_proposal_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <FileSignature className="h-4 w-4" />
                        PandaDoc Proposal
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.estimate_task_link && (
                    <a href={deal.estimate_task_link} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <CheckSquare className="h-4 w-4" />
                        Estimate Task
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.internal_estimate_doc_link && (
                    <a href={deal.internal_estimate_doc_link} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        Internal Estimate Doc Link
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Collaboration Tools Section */}
            {(deal.collaborative_ai || deal.collaborative_ai_link || deal.workboard_ai_link || 
              deal.client_agent_url || deal.client_agent_folder) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4" />
                    Collaboration & Workspaces
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deal.collaborative_ai && (
                    <div className="rounded border px-3 py-2">
                      <div className="text-xs text-muted-foreground">CollabAI Reference</div>
                      <div className="text-sm font-medium">{deal.collaborative_ai}</div>
                    </div>
                  )}
                  {deal.collaborative_ai_link && (
                    <a href={deal.collaborative_ai_link} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <Bot className="h-4 w-4" />
                        CollabAI Workspace
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.workboard_ai_link && (
                    <a href={deal.workboard_ai_link} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <Workflow className="h-4 w-4" />
                        Workboard AI
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.client_agent_url && (
                    <a href={deal.client_agent_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        Client Agent
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.client_agent_folder && (
                    <div className="rounded border px-3 py-2">
                      <div className="text-xs text-muted-foreground">Client Agent Folder</div>
                      <div className="text-sm font-medium break-all">{deal.client_agent_folder}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CRM Links Section */}
            {(deal.hubspot_crm_deal_url || deal.leadslift_crm_deal_url || deal.control_tower_id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <ExternalLink className="h-4 w-4" />
                    CRM & External Systems
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deal.hubspot_crm_deal_url && (
                    <a href={deal.hubspot_crm_deal_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors text-orange-600">
                      <span className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-4 w-4" />
                        HubSpot CRM Deal
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.leadslift_crm_deal_url && (
                    <a href={deal.leadslift_crm_deal_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between rounded border px-3 py-2 hover:bg-muted/50 transition-colors text-blue-600">
                      <span className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-4 w-4" />
                        LeadsLift CRM Deal
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {deal.control_tower_id && (
                    <div className="rounded border px-3 py-2">
                      <div className="text-xs text-muted-foreground">Control Tower ID</div>
                      <div className="text-sm font-medium">{deal.control_tower_id}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6 mt-6">
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments & Activity
                {comments && comments.length > 0 && (
                  <Badge variant="secondary">{comments.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {commentsLoading ? (
                  <div className="space-y-3">
                    <div className="h-20 bg-muted animate-pulse rounded-lg" />
                    <div className="h-20 bg-muted animate-pulse rounded-lg" />
                  </div>
                ) : comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {comment.user.first_name?.[0] || comment.user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {comment.user.first_name} {comment.user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {user?.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm break-words">
                        {highlightMentions(comment.comment, comment.mentioned_user_emails)}
                      </p>
                      {comment.synced_to_control_tower && (
                        <Badge variant="outline" className="text-xs">Synced to Control Tower</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No comments yet</p>
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  className="min-h-[60px]"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Deal Checklist
                {checklistItems && checklistItems.length > 0 && (
                  <Badge variant="secondary">{checklistItems.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklistItems && checklistItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} />
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {checklistLoading ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                ) : checklistItems && checklistItems.length > 0 ? (
                  checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg group">
                      <Checkbox
                        checked={item.is_completed}
                        onCheckedChange={() => handleToggleChecklistItem(item.id, item.is_completed)}
                      />
                      <label className={`flex-1 text-sm cursor-pointer ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.title}
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteChecklistItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No checklist items</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add new item..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                />
                <Button
                  onClick={handleAddChecklistItem}
                  disabled={!newChecklistItem.trim() || addChecklistMutation.isPending}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Google Drive Documents</CardTitle>
                </div>
                {deal?.google_drive_folder_url && (
                  <Button
                    onClick={() => handleSyncDriveFolder()}
                    disabled={syncingFolder}
                    variant="outline"
                    size="sm"
                  >
                    {syncingFolder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Folder
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!deal?.google_drive_folder_url ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No Google Drive folder mapped to this deal
                  </p>
                  <Button onClick={() => setShowMapFolderDialog(true)} variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Map Google Drive Folder
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={deal.google_drive_folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex-1 truncate"
                    >
                      {deal.google_drive_folder_url}
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(deal.google_drive_folder_url!, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {filesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((file) => {
                        const isAIReady = file.metadata?.parser === 'pdfjs' || file.json_snapshot_path;
                        return (
                          <div key={file.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-md">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm flex-1 truncate">{file.drive_file_name}</span>
                            {file.category ? (
                              <Badge variant="outline" className="text-xs">
                                {file.category}
                              </Badge>
                            ) : null}
                            {isAIReady && (
                              <Badge variant="secondary" className="text-xs">
                                <FileCheck className="h-3 w-3 mr-1" />
                                AI-Ready
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {file.drive_file_type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No files synced yet. Click "Sync Folder" to fetch documents.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Tab */}
        <TabsContent value="systems" className="space-y-6 mt-6">
          <QuickActionsPanel
            dealId={deal.id}
            deal={deal}
            controlTowerId={deal.control_tower_id}
            externalLinks={deal.external_links}
          />

          <ExternalLinksSection
            externalLinks={deal.external_links}
            hubspotUrl={deal.hubspot_crm_deal_url}
            leadsLiftUrl={deal.leadslift_crm_deal_url}
            estimateUrl={deal.estimate_url}
            pandadocUrl={deal.pandadoc_proposal_url}
            collabAiUrl={deal.collaborative_ai_link}
            workboardUrl={deal.workboard_ai_link}
            clientAgentUrl={deal.client_agent_url}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {deal.control_tower_id && (
                  <div>
                    <p className="text-muted-foreground mb-1">Control Tower ID</p>
                    <p className="font-mono text-xs break-all">{deal.control_tower_id}</p>
                  </div>
                )}
                {deal.hubspot_deal_id && (
                  <div>
                    <p className="text-muted-foreground mb-1">HubSpot Deal ID</p>
                    <p className="font-mono text-xs break-all">{deal.hubspot_deal_id}</p>
                  </div>
                )}
                {deal.last_synced_at && (
                  <div>
                    <p className="text-muted-foreground mb-1">Last Synced</p>
                    <p className="font-medium">{new Date(deal.last_synced_at).toLocaleString()}</p>
                  </div>
                )}
                {deal.synced_from_control_tower && (
                  <div>
                    <p className="text-muted-foreground mb-1">Sync Status</p>
                    <Badge variant="secondary">Synced from Control Tower</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showMapFolderDialog} onOpenChange={setShowMapFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map Google Drive Folder</DialogTitle>
            <DialogDescription>
              Enter the URL of the Google Drive folder containing documents for this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-url">Folder URL</Label>
              <Input
                id="folder-url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Copy the URL from your browser when viewing the folder in Google Drive
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMapFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMapGoogleDriveFolder} disabled={!folderUrl.trim()}>
              Map Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
