import { useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  Brain,
  Calendar,
  CheckCircle2,
  Linkedin,
  Loader2,
  Mail,
  MessageCircle,
  Rocket,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnalyticsCard, AIInsightPanel, ExecutionTimeline, IntegrationStatusList } from '@/features/campaign-detail/components';
import { useCampaignDetail } from '@/hooks/useCampaignDetail';
import type { CampaignContactStatus } from '@/hooks/useCampaignDetail';
import { useExaIntegration } from '@/hooks/useExaIntegration';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { CampaignLeadImportDialog } from '@/components/bd/CampaignLeadImportDialog';

const PIPELINE_STAGES: { status: CampaignContactStatus; title: string; description: string }[] = [
  { status: 'identified', title: 'Identified', description: 'Contacts imported into the campaign' },
  { status: 'researched', title: 'Researched', description: 'Research summaries created' },
  { status: 'contacted_linkedin', title: 'LinkedIn Request Sent', description: 'Connection requests sent' },
  { status: 'connected', title: 'Connected', description: 'Connection accepted on LinkedIn' },
  { status: 'messaged', title: 'Message Sent', description: 'LinkedIn message delivered' },
  { status: 'contacted_email', title: 'Email Sent', description: 'Email outreach via GHL' },
  { status: 'responded', title: 'Responded', description: 'Prospect replied to outreach' },
  { status: 'meeting_booked', title: 'Meeting Booked', description: 'Meeting scheduled with prospect' },
];

const STAGE_BADGE_CLASSES: Record<CampaignContactStatus, string> = {
  identified: 'bg-slate-100 text-slate-900',
  researched: 'bg-blue-100 text-blue-900',
  contacted_linkedin: 'bg-indigo-100 text-indigo-900',
  connected: 'bg-emerald-100 text-emerald-900',
  messaged: 'bg-purple-100 text-purple-900',
  contacted_email: 'bg-orange-100 text-orange-900',
  responded: 'bg-teal-100 text-teal-900',
  meeting_booked: 'bg-green-200 text-green-900',
};


export default function CampaignDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    campaign,
    contactByStatus,
    activities,
    tasks,
    analytics,
    kpis,
    projectTasks,
    aiAgentRuns,
    integrations,
    aiSummary,
    aiPostMortem,
    markCompleted,
    softArchive,
    isUpdating,
    isLoading,
    isError,
    error,
  } = useCampaignDetail(slug);
  const { runCampaignResearch, isRunningResearch } = useExaIntegration();
  const { hasPermission } = useUserPermissions();
  const [leadImportDialogOpen, setLeadImportDialogOpen] = useState(false);

  const linkedinStats = (campaign?.linkedin_stats as Record<string, number | undefined>) || {};
  const ghlStats = (campaign?.ghl_stats as Record<string, number | undefined>) || {};

  const totalContacts = campaign?.target_contacts_count || 0;
  const researchedCount = Number((campaign?.research_data as Record<string, unknown>)?.contacts_researched ?? 0);
  const acceptanceRate = linkedinStats.requests_sent
    ? Math.round(((linkedinStats.connections_accepted || 0) / linkedinStats.requests_sent) * 100)
    : 0;
  const responseTotal =
    (linkedinStats.responses_received || 0) + (ghlStats.replies || 0) + (campaign?.responses_received || 0);

  const campaignMetadata = (campaign?.metadata as Record<string, unknown>) ?? {};
  const researchReportUrl = typeof campaignMetadata["research_report_url"] === "string"
    ? (campaignMetadata["research_report_url"] as string)
    : typeof (campaignMetadata["latest_research_report"] as { url?: string } | undefined)?.url === "string"
      ? ((campaignMetadata["latest_research_report"] as { url?: string }).url as string)
      : undefined;
  const rawMetadataStatus = campaignMetadata["research_status"];
  const nestedMetadataStatus = (campaignMetadata["research"] as { status?: string } | undefined)?.status;
  const rawResearchDataStatus = (campaign?.research_data as Record<string, unknown> | undefined)?.["status"];
  const researchStatus =
    typeof rawMetadataStatus === "string"
      ? rawMetadataStatus
      : typeof nestedMetadataStatus === "string"
        ? nestedMetadataStatus
        : typeof rawResearchDataStatus === "string"
          ? (rawResearchDataStatus as string)
          : null;
  const rawMetadataUpdated = campaignMetadata["research_updated_at"];
  const nestedMetadataUpdated = (campaignMetadata["research"] as { updated_at?: string } | undefined)?.updated_at;
  const researchUpdatedAt =
    typeof rawMetadataUpdated === "string"
      ? rawMetadataUpdated
      : typeof nestedMetadataUpdated === "string"
        ? nestedMetadataUpdated
        : null;
  const canRunResearch = hasPermission(["campaigns", "campaign_research", "research", "exa"], "edit")
    || hasPermission(/research/i, "edit");

  const analyticsCards = useMemo(() => {
    const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

    const kpiCards = kpis.map((kpi) => ({
      key: `kpi-${kpi.id}`,
      title: kpi.label,
      value:
        kpi.current_value === null || kpi.current_value === undefined
          ? '—'
          : numberFormatter.format(kpi.current_value),
      suffix: kpi.unit ?? '',
      description:
        kpi.target_value !== null && kpi.target_value !== undefined
          ? `Target ${numberFormatter.format(kpi.target_value)}${kpi.unit ? ` ${kpi.unit}` : ''}`
          : kpi.source ?? '',
      delta: kpi.trend ?? 0,
      timestamp: kpi.updated_at ?? '',
    }));

    const metricCards = analytics.map((point) => {
      let delta: number | null = null;
      if (point.comparison_value !== null && point.comparison_value !== undefined && point.comparison_value !== 0) {
        delta = ((point.value - point.comparison_value) / point.comparison_value) * 100;
      }

      return {
        key: `metric-${point.id}`,
        title: point.metric,
        value: numberFormatter.format(point.value),
        suffix: '',
        description: point.source ? `Source: ${point.source}` : '',
        delta: delta ?? 0,
        timestamp: point.recorded_at ?? '',
      };
    });

    return [...kpiCards, ...metricCards];
  }, [analytics, kpis]);

  const handleMarkCompleted = async () => {
    try {
      await markCompleted();
      toast({
        title: 'Campaign marked completed',
        description: 'AI summary generation queued successfully.',
      });
    } catch (updateError) {
      toast({
        title: 'Unable to mark as completed',
        description: updateError instanceof Error ? updateError.message : 'Unexpected error',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async () => {
    try {
      await softArchive();
      toast({
        title: 'Campaign archived',
        description: 'The campaign has been archived and dependent views refreshed.',
      });
    } catch (updateError) {
      toast({
        title: 'Unable to archive campaign',
        description: updateError instanceof Error ? updateError.message : 'Unexpected error',
        variant: 'destructive',
      });
    }
  };

  const handleRunResearch = async () => {
    if (!campaign?.id) return;
    try {
      await runCampaignResearch({ campaignId: campaign.id });
    } catch (error) {
      console.error('Unable to trigger campaign research', error);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading campaign...</div>;
  }

  if (isError) {
    return (
      <div className="container mx-auto py-10 space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Unable to load campaign</CardTitle>
          </CardHeader>
          <CardContent>{(error as Error)?.message || 'Unknown error'}</CardContent>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/campaigns">
            <ArrowLeft className="h-4 w-4" /> Back to campaigns
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" disabled={!campaign.ghl_campaign_id}>
            <Mail className="h-4 w-4" /> GoHighLevel Campaign
          </Button>
          <Button variant="outline" className="gap-2" disabled={!campaign.linkedin_campaign_id}>
            <Linkedin className="h-4 w-4" /> LinkedIn Tracker
          </Button>
          {canRunResearch && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRunResearch}
              disabled={isRunningResearch}
            >
              {isRunningResearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Run R&D
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setLeadImportDialogOpen(true)}
          >
            <Users className="h-4 w-4" />
            Add Leads
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleArchive}
            disabled={campaign.status === 'archived' || isUpdating}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
            Archive
          </Button>
          <Button
            className="gap-2"
            onClick={handleMarkCompleted}
            disabled={campaign.status === 'completed' || isUpdating}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark Completed
          </Button>
        </div>
      </div>

      {(researchReportUrl || researchStatus) && (
        <Alert>
          <Rocket className="h-4 w-4" />
          <AlertTitle>Campaign research</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Status: {researchStatus ? researchStatus.toString().replace(/_/g, ' ') : 'Complete'}
              {researchUpdatedAt && ` • Updated ${new Date(researchUpdatedAt).toLocaleString()}`}
            </p>
            {researchReportUrl && (
              <Button asChild variant="link" className="px-0 text-sm">
                <a href={researchReportUrl} target="_blank" rel="noreferrer">
                  View research report
                </a>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{campaign.name}</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {campaign.campaign_type?.replace('_', ' ')}
                </Badge>
                <Badge className="capitalize">{campaign.status}</Badge>
                {campaign.ai_agent_id ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" /> AI Agent Assigned
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'No start date'} –{' '}
                  {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'No end date'}
                </span>
              </div>
              <Separator />
              <div className="space-y-2">
                <Metric label="Target Contacts" value={totalContacts} icon={Users} />
                <Metric label="Researched" value={researchedCount} icon={Brain} />
                <Metric label="LinkedIn Requests" value={linkedinStats.requests_sent || 0} icon={Linkedin} />
                <Metric label="LinkedIn Acceptance Rate" value={`${acceptanceRate}%`} icon={Rocket} />
                <Metric label="Emails Sent" value={ghlStats.emails_sent || 0} icon={Mail} />
                <Metric label="Responses" value={responseTotal} icon={MessageCircle} />
              </div>
            </CardContent>
          </Card>
          <IntegrationStatusList integrations={integrations} isLoading={isLoading} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  We have not ingested analytics data for this campaign yet. Once integrations sync you'll see charts here.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {analyticsCards.map((card) => (
                    <AnalyticsCard
                      key={card.key}
                      title={card.title}
                      value={card.value}
                      suffix={card.suffix}
                      description={card.description}
                      delta={card.delta}
                      timestamp={card.timestamp}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {PIPELINE_STAGES.map((stage) => {
                    const contacts = contactByStatus[stage.status] || [];
                    return (
                      <div key={stage.status} className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{stage.title}</p>
                            <p className="text-sm text-muted-foreground">{stage.description}</p>
                          </div>
                          <Badge variant="secondary" className={stageBadgeClass(stage.status)}>
                            {contacts.length}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-3">
                          {contacts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No contacts yet</p>
                          ) : (
                            contacts.slice(0, 5).map((contact) => (
                              <button
                                key={contact.id}
                                onClick={() => navigate(`/campaigns/${campaign.slug}/contacts/${contact.slug}`)}
                                className="w-full rounded-md border bg-background p-3 text-sm hover:bg-accent transition-colors text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {contact.contact_name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium leading-none">{contact.contact_name}</p>
                                    <p className="text-xs text-muted-foreground">{contact.contact_company}</p>
                                  </div>
                                </div>
                                {contact.research_summary ? (
                                  <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                                    {(contact.research_summary as any)?.summary || 'Research available'}
                                  </p>
                                ) : null}
                              </button>
                            ))
                          )}
                          {contacts.length > 5 ? (
                            <Button variant="link" className="px-0 text-xs">
                              View all {contacts.length} contacts
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <ExecutionTimeline activities={activities} tasks={projectTasks} aiAgentRuns={aiAgentRuns} />
        </div>

        <div className="space-y-6">
          <AIInsightPanel summary={aiSummary} postMortem={aiPostMortem} aiAgentRuns={aiAgentRuns} aiTasks={tasks} />
        </div>
      </div>

      {campaign && (
        <CampaignLeadImportDialog
          open={leadImportDialogOpen}
          onOpenChange={setLeadImportDialogOpen}
          campaign={campaign}
          onImportComplete={() => {
            toast({
              title: "Leads imported",
              description: "New contacts added to campaign pipeline",
            });
          }}
        />
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-background p-3">
      <div className="space-y-1">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

function stageBadgeClass(status: CampaignContactStatus) {
  return `${STAGE_BADGE_CLASSES[status] ?? ''} border-none`;
}
