import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDealComments, useAddComment, useDeleteComment, AddCommentPayload } from '@/hooks/useDealComments';
import { useDealChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem } from '@/hooks/useDealChecklist';
import { useDealSystemInfo } from '@/hooks/useDealSystemInfo';
import { useDealFiles } from '@/hooks/useDealFiles';
import { useSyncControlTowerDeals } from '@/hooks/useSyncControlTowerDeals';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { DealFile } from '@/hooks/useDeals';

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
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface QuickActionsPanelProps {
  dealId: string;
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

const QuickActionsPanel = ({ dealId: _dealId, controlTowerId: _controlTowerId, externalLinks: _externalLinks }: QuickActionsPanelProps) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (actionId: string) => {
    setLoadingAction(actionId);
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast({ title: 'Feature coming in Phase 2' });
    setLoadingAction(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
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
      </CardContent>
    </Card>
  );
};

interface ExternalLinksSectionProps {
  externalLinks?: DealExternalLinks | null;
  hubspotUrl?: string | null;
}

const ExternalLinksSection = ({ externalLinks, hubspotUrl }: ExternalLinksSectionProps) => {
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
          label: 'CollabAI Agent',
          url: externalLinks?.collabai_agent_url,
          icon: Bot,
          color: 'text-green-600'
        }
      ].filter((link) => link.url),
    [externalLinks, hubspotUrl]
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
  { id: 'prospecting', label: 'Prospecting', color: 'bg-blue-500' },
  { id: 'qualification', label: 'Qualification', color: 'bg-purple-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const autoApplyAttemptedRef = useRef(false);
  
  // Google Drive state
  const [syncingFolder, setSyncingFolder] = useState(false);
  const [showMapFolderDialog, setShowMapFolderDialog] = useState(false);
  const [folderUrl, setFolderUrl] = useState("");

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
            deal_files:deal_files(
              id,
              deal_id,
              client_id,
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
        
        <Tabs value={isFilesTab ? "files" : "overview"} className="w-auto">
          <TabsList>
            <TabsTrigger value="overview" asChild>
              <Link to={basePath}>Overview</Link>
            </TabsTrigger>
            <TabsTrigger value="files" asChild>
              <Link to={`${basePath}/files`} className="flex items-center gap-2">
                Files
                {files.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {files.length}
                  </Badge>
                )}
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={getStageBadgeVariant(deal.stage)} className="capitalize">
                {deal.stage?.replace('_', ' ') || 'prospecting'}
              </Badge>
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

        <DealStageProgress currentStage={deal.stage} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Deal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Stage</p>
                    <p className="font-medium capitalize">{deal.stage?.replace('_', ' ') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{deal.control_tower_status || 'Active'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Close</p>
                    <p className="font-medium">{formatDate(deal.expected_closing_date || deal.close_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Source</p>
                    <p className="font-medium">{deal.lead_source || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deal Type</p>
                    <p className="font-medium">{deal.dealtype || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">HubSpot Deal ID</p>
                    <p className="font-mono text-xs break-all">{deal.hubspot_deal_id || '-'}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Control Tower ID</p>
                      <p className="font-mono text-xs break-all">{deal.control_tower_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Control Tower Client ID</p>
                      <p className="font-mono text-xs break-all">{deal.control_tower_client_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Control Tower Owner ID</p>
                      <p className="font-mono text-xs break-all">{deal.control_tower_owner_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{formatDate(deal.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {client && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{client.company || client.name}</p>
                  </div>
                  {client.contact_person && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Person</p>
                      <p className="font-medium">{client.contact_person}</p>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                        {client.phone}
                      </a>
                    </div>
                  )}
                  {client.website && (
                    <div>
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {client.industry && (
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="font-medium">{client.industry}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Deal Owner</p>
                    {owner ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{owner.first_name} {owner.last_name}</p>
                          <p className="text-sm text-muted-foreground">{owner.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Not assigned</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Project Manager</p>
                    {pm ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{pm.first_name} {pm.last_name}</p>
                          <p className="text-sm text-muted-foreground">{pm.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Not assigned</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {deal.notes && (
              <Card className="lg:col-span-2">
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
          </div>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
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
        </div>

        <div className="space-y-6">
          <QuickActionsPanel
            dealId={deal.id}
            controlTowerId={deal.control_tower_id}
            externalLinks={deal.external_links}
          />

          <ExternalLinksSection
            externalLinks={deal.external_links}
            hubspotUrl={deal.hubspot_crm_deal_url}
          />

          {/* Google Drive Documents */}
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
                    <>
                      <div className="space-y-2">
                        {files.slice(0, 5).map((file) => {
                          const isAIReady = file.metadata?.parser === 'pdfjs' || file.json_snapshot_path;
                          return (
                            <div key={file.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-md">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm flex-1 truncate">{file.drive_file_name}</span>
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
                      
                      {files.length > 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`${basePath}/files`)}
                        >
                          View All Files ({files.length})
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No files synced yet. Click "Sync Folder" to fetch documents.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Checklist
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
                        onCheckedChange={(checked) => handleToggleChecklistItem(item.id, Boolean(checked))}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Deal ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all">{deal.id}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(deal.id, 'Deal ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {systemInfo?.slug && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground">Slug</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded break-all">{systemInfo.slug}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(systemInfo.slug, 'Slug')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
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
