import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  Brain,
  CheckCircle2,
  Linkedin,
  Loader2,
  Mail,
  MessageCircle,
  Rocket,
  TrendingUp,
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

  const canRunResearch = hasPermission(["campaigns", "campaign_research", "research", "exa"], "edit")
    || hasPermission(/research/i, "edit");

  const totalContactsCount = Object.values(contactByStatus).reduce((sum, contacts) => sum + contacts.length, 0);
  const meetingsBooked = contactByStatus.meeting_booked?.length || 0;
  const conversionRate = totalContactsCount > 0 
    ? Math.round((meetingsBooked / totalContactsCount) * 100) 
    : 0;

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
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/campaigns">
            <ArrowLeft className="h-4 w-4" /> Back to campaigns
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Research Alert - Conditional */}
      {researchReportUrl && (
        <Alert>
          <Rocket className="h-4 w-4" />
          <AlertTitle>Research Report Available</AlertTitle>
          <AlertDescription>
            <Button asChild variant="link" className="px-0 text-sm h-auto">
              <a href={researchReportUrl} target="_blank" rel="noreferrer">
                View research report →
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Section - Campaign Header & Key Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{campaign.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {campaign.campaign_type?.replace('_', ' ')}
                </Badge>
                <Badge className="capitalize">{campaign.status}</Badge>
                {campaign.ai_agent_id && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" /> AI Enabled
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              label="Total Contacts"
              value={totalContactsCount}
              icon={Users}
              iconColor="text-blue-600"
            />
            <MetricCard
              label="Researched"
              value={researchedCount}
              icon={Brain}
              iconColor="text-purple-600"
            />
            <MetricCard
              label="Connected"
              value={contactByStatus.connected?.length || 0}
              icon={Linkedin}
              iconColor="text-blue-700"
            />
            <MetricCard
              label="Responses"
              value={responseTotal}
              icon={MessageCircle}
              iconColor="text-green-600"
            />
            <MetricCard
              label="Meetings"
              value={meetingsBooked}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
            />
            <MetricCard
              label="Conversion"
              value={`${conversionRate}%`}
              icon={TrendingUp}
              iconColor="text-orange-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Focus Area - Contact Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[520px]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {PIPELINE_STAGES.map((stage) => {
                const contacts = contactByStatus[stage.status] || [];
                return (
                  <div key={stage.status} className="space-y-4">
                    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{stage.title}</p>
                          <p className="text-xs text-muted-foreground">{stage.description}</p>
                        </div>
                        <Badge variant="secondary" className={stageBadgeClass(stage.status)}>
                          {contacts.length}
                        </Badge>
                      </div>
                      <Separator className="mt-2" />
                    </div>
                    <div className="space-y-3">
                      {contacts.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-center">
                          <p className="text-sm text-muted-foreground">No contacts</p>
                        </div>
                      ) : (
                        contacts.map((contact) => (
                          <button
                            key={contact.id}
                            onClick={() => navigate(`/campaigns/${campaign.slug}/contacts/${contact.slug}`)}
                            className="w-full rounded-lg border bg-card p-3 text-left hover:bg-accent hover:shadow-sm transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="text-xs">
                                  {contact.contact_name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm leading-tight truncate">
                                  {contact.contact_name}
                                </p>
                                {contact.contact_company && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {contact.contact_company}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {contact.contact_email && (
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  {contact.contact_linkedin_url && (
                                    <Linkedin className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

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

function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <div className="flex flex-col space-y-2 p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor || 'text-muted-foreground'}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function stageBadgeClass(status: CampaignContactStatus) {
  return `${STAGE_BADGE_CLASSES[status] ?? ''} border-none`;
}
