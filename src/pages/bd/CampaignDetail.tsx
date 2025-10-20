import { useMemo, type ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Brain, Calendar, Linkedin, Mail, MessageCircle, Rocket, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCampaignDetail } from '@/hooks/useCampaignDetail';
import type { CampaignContactStatus } from '@/hooks/useCampaignDetail';
import { formatDistanceToNow } from 'date-fns';

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
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { campaign, contactByStatus, activities, tasks, isLoading, isError, error } = useCampaignDetail(campaignId);

  const linkedinStats = campaign?.linkedin_stats || {};
  const ghlStats = campaign?.ghl_stats || {};

  const totalContacts = campaign?.target_contacts_count || 0;
  const researchedCount = Number(campaign?.research_data?.contacts_researched ?? 0);
  const acceptanceRate = linkedinStats.requests_sent
    ? Math.round(((linkedinStats.connections_accepted || 0) / linkedinStats.requests_sent) * 100)
    : 0;
  const responseTotal =
    (linkedinStats.responses_received || 0) + (ghlStats.replies || 0) + (campaign?.responses_received || 0);

  const activityWithTime = useMemo(
    () =>
      activities.map((activity) => ({
        ...activity,
        relativeTime: formatDistanceToNow(new Date(activity.performed_at), { addSuffix: true }),
      })),
    [activities],
  );

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
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" disabled={!campaign.ghl_campaign_id}>
            <Mail className="h-4 w-4" /> GoHighLevel Campaign
          </Button>
          <Button variant="outline" className="gap-2" disabled={!campaign.linkedin_campaign_id}>
            <Linkedin className="h-4 w-4" /> LinkedIn Tracker
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr_340px]">
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

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
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
                            <div key={contact.id} className="rounded-md border bg-background p-3 text-sm">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{contact.contact_name.slice(0, 2).toUpperCase()}</AvatarFallback>
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
                            </div>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityWithTime.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                activityWithTime.map((activity) => (
                  <div key={activity.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium capitalize">{activity.activity_type.replace('_', ' ')}</p>
                        {activity.activity_data?.note ? (
                          <p className="text-muted-foreground">{activity.activity_data.note as string}</p>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.relativeTime}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Task Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground">No AI tasks queued for this campaign.</p>
              ) : (
                tasks.slice(0, 10).map((task) => (
                  <div key={task.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{task.task_type.replace('_', ' ')}</span>
                      <Badge variant={task.status === 'completed' ? 'default' : 'outline'} className="capitalize">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
              {tasks.length > 10 ? (
                <Button variant="link" className="px-0 text-xs">
                  View all tasks
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
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
