import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  Layers,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useBDCampaigns } from '@/hooks/useBDCampaigns';
import type { BDCampaign } from '@/hooks/useBDCampaigns';
import { useTargetNiches } from '@/hooks/useTargetNiches';
import type { TargetNiche } from '@/hooks/useTargetNiches';
import { CampaignDialog } from '@/components/bd/CampaignDialog';

type AggregateStats = {
  totalContacts: number;
  totalMeetings: number;
  totalDeals: number;
  linkedinRequests: number;
  linkedinAccepted: number;
  linkedinMessages: number;
  linkedinResponses: number;
  ghlEmailsSent: number;
  ghlReplies: number;
  totalResponses: number;
};

export default function CampaignManagement() {
  const pagination = usePagination(12);
  const queryClient = useQueryClient();
  const { campaigns, total, isLoading, error } = useBDCampaigns(
    undefined,
    pagination.currentPage,
    pagination.pageSize,
  );
  const { niches } = useTargetNiches();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const errorMessage = error instanceof Error && error.message ? error.message : null;
  const totalPages = Math.ceil(total / pagination.pageSize);

  const handleRetry = () => {
    if (pagination.currentPage !== 1) {
      pagination.setCurrentPage(1);
    }
    void queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const aggregateStats = useMemo(() => {
    return campaigns.reduce<AggregateStats>(
      (acc, campaign) => {
        const linkedin = (campaign.linkedin_stats as Record<string, number | undefined>) || {};
        const ghl = (campaign.ghl_stats as Record<string, number | undefined>) || {};

        acc.totalContacts += campaign.actual_contacts_reached ?? 0;
        acc.totalMeetings += campaign.meetings_booked ?? 0;
        acc.totalDeals += campaign.deals_generated ?? 0;
        acc.linkedinRequests += linkedin.requests_sent || 0;
        acc.linkedinAccepted += linkedin.connections_accepted || 0;
        acc.linkedinMessages += linkedin.messages_sent || 0;
        acc.linkedinResponses += linkedin.responses_received || 0;
        acc.ghlEmailsSent += ghl.emails_sent || 0;
        acc.ghlReplies += ghl.replies || 0;
        acc.totalResponses +=
          (linkedin.responses_received || 0) +
          (ghl.replies || 0) +
          (campaign.responses_received ?? 0);

        return acc;
      },
      {
        totalContacts: 0,
        totalMeetings: 0,
        totalDeals: 0,
        linkedinRequests: 0,
        linkedinAccepted: 0,
        linkedinMessages: 0,
        linkedinResponses: 0,
        ghlEmailsSent: 0,
        ghlReplies: 0,
        totalResponses: 0,
      },
    );
  }, [campaigns]);

  const metrics = [
    {
      title: 'Total Campaigns',
      value: campaigns.length,
      icon: Layers,
    },
    {
      title: 'Active Campaigns',
      value: campaigns.filter((c) => c.status === 'active').length,
      icon: TrendingUp,
    },
    {
      title: 'Contacts Reached',
      value: aggregateStats.totalContacts,
      icon: Users,
    },
    {
      title: 'Meetings Booked',
      value: aggregateStats.totalMeetings,
      icon: Phone,
    },
    {
      title: 'LinkedIn Requests Sent',
      value: aggregateStats.linkedinRequests,
      icon: Linkedin,
    },
    {
      title: 'LinkedIn Accepted',
      value: aggregateStats.linkedinAccepted,
      icon: Users,
    },
    {
      title: 'LinkedIn Messages',
      value: aggregateStats.linkedinMessages,
      icon: MessageCircle,
    },
    {
      title: 'Emails Sent (GHL)',
      value: aggregateStats.ghlEmailsSent,
      icon: Mail,
    },
    {
      title: 'Total Responses',
      value: aggregateStats.totalResponses,
      icon: Brain,
    },
  ];

  if (isLoading) return <div>Loading campaigns...</div>;

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load campaigns.';

    return (
      <>
        <CampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} niches={niches} />
        <div className="container mx-auto py-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Campaign Management</h1>
              <p className="text-muted-foreground">Track and manage your outbound campaigns</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertTitle>Unable to load campaigns</AlertTitle>
            <AlertDescription>
              <p className="mb-4">{errorMessage}</p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['bd-campaigns'] })}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <CampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} niches={niches} />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Campaign Management</h1>
            <p className="text-muted-foreground">Track and manage your outbound campaigns</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Failed to load campaigns</AlertTitle>
            <AlertDescription>
              <p>
                We couldn't load campaign metrics right now.
                {errorMessage ? ` Error: ${errorMessage}` : ' Please try again.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleRetry}>
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4 mb-8">
              {metrics.map((metric) => (
                <Card key={metric.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} niches={niches} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => pagination.currentPage > 1 && pagination.setCurrentPage(pagination.currentPage - 1)}
                        className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => pagination.setCurrentPage(pageNum)}
                            isActive={pagination.currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => pagination.currentPage < totalPages && pagination.setCurrentPage(pagination.currentPage + 1)}
                        className={pagination.currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function CampaignCard({ campaign, niches }: { campaign: BDCampaign; niches: TargetNiche[] }) {
  const navigate = useNavigate();
  const niche = niches.find((n) => n.id === campaign.niche_id);
  const targetCount = campaign.target_contacts_count ?? 0;
  const contactsReached = campaign.actual_contacts_reached ?? 0;
  const progress = targetCount ? (contactsReached / targetCount) * 100 : 0;

  const researchData = (campaign.research_data as Record<string, unknown>) || {};
  const researchCompleted = Number(
    (researchData['contacts_researched'] as number | undefined) ?? campaign.actual_contacts_reached ?? 0,
  );
  const linkedinStats = (campaign.linkedin_stats as Record<string, number | undefined>) || {};
  const ghlStats = (campaign.ghl_stats as Record<string, number | undefined>) || {};

  const acceptanceRate = linkedinStats.requests_sent
    ? Math.round(((linkedinStats.connections_accepted || 0) / linkedinStats.requests_sent) * 100)
    : 0;

  const messageFollowThrough = linkedinStats.connections_accepted
    ? Math.round(((linkedinStats.messages_sent || 0) / linkedinStats.connections_accepted) * 100)
    : 0;

  const responseTotal =
    (linkedinStats.responses_received || 0) + (ghlStats.replies || 0) + (campaign.responses_received || 0);

  const statusColors: Record<BDCampaign['status'], 'secondary' | 'default' | 'outline'> = {
    planning: 'secondary',
    active: 'default',
    paused: 'outline',
    completed: 'default',
    archived: 'outline',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{campaign.name}</CardTitle>
            <CardDescription>{niche?.name || 'Unknown Niche'}</CardDescription>
            <div className="mt-2 flex items-center gap-2">
              {campaign.linkedin_campaign_id ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </Badge>
              ) : null}
              {campaign.ghl_campaign_id ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </Badge>
              ) : null}
              {campaign.ai_agent_id ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" /> AI Assisted
                </Badge>
              ) : null}
            </div>
          </div>
          <Badge variant={statusColors[campaign.status]} className="uppercase">
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contact Progress</span>
              <span className="font-medium">
                {contactsReached} / {targetCount}
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="space-y-3 text-sm">
            <MetricRow label="Research Completed" value={`${researchCompleted}`} postfix={`/ ${targetCount}`} progress={targetCount ? (researchCompleted / targetCount) * 100 : 0} />
            <MetricRow label="LinkedIn Requests" value={`${linkedinStats.requests_sent || 0}`} postfix={targetCount ? `/ ${targetCount}` : undefined} progress={targetCount ? ((linkedinStats.requests_sent || 0) / targetCount) * 100 : undefined} />
          <MetricRow label="LinkedIn Acceptance Rate" value={`${acceptanceRate}%`} />
          <MetricRow label="Message Follow-Through" value={`${messageFollowThrough}%`} />
          <MetricRow label="Emails Sent" value={`${ghlStats.emails_sent || 0}`} />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Responses</div>
            <div className="font-medium">{responseTotal}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Meetings</div>
            <div className="font-medium">{campaign.meetings_booked}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {campaign.campaign_type?.replace('_', ' ')}
          </Badge>
          {campaign.linkedin_campaign_id ? (
            <Badge variant="outline">ID: {campaign.linkedin_campaign_id}</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="default" size="sm" onClick={() => navigate(`/bd/strategy/campaigns/${campaign.id}`)}>
            View Details
          </Button>
          <Button variant="outline" size="sm" disabled>
            Run AI Research
          </Button>
          <Button variant="outline" size="sm" disabled>
            Generate Content
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  postfix,
  progress,
}: {
  label: string;
  value: string;
  postfix?: string;
  progress?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          {postfix ? ` ${postfix}` : ''}
        </span>
      </div>
      {typeof progress === 'number' ? <Progress value={Math.min(progress, 100)} /> : null}
    </div>
  );
}
