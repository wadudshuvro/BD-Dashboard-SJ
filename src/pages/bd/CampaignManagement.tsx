import { useState } from 'react';
import { Plus, Search, TrendingUp, Users, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBDCampaigns } from '@/hooks/useBDCampaigns';
import { useTargetNiches } from '@/hooks/useTargetNiches';

export default function CampaignManagement() {
  const { campaigns, isLoading } = useBDCampaigns();
  const { niches } = useTargetNiches();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredCampaigns = campaigns.filter((campaign: any) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    active: campaigns.filter((c: any) => c.status === 'active').length,
    totalContacts: campaigns.reduce((acc: number, c: any) => acc + (c.actual_contacts_reached || 0), 0),
    totalMeetings: campaigns.reduce((acc: number, c: any) => acc + (c.meetings_booked || 0), 0),
    totalDeals: campaigns.reduce((acc: number, c: any) => acc + (c.deals_generated || 0), 0),
  };

  if (isLoading) return <div>Loading campaigns...</div>;

  return (
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

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts Reached</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMeetings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Generated</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
          </CardContent>
        </Card>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCampaigns.map((campaign: any) => (
          <CampaignCard key={campaign.id} campaign={campaign} niches={niches} />
        ))}
      </div>
    </div>
  );
}

function CampaignCard({ campaign, niches }: { campaign: any; niches: any[] }) {
  const niche = niches.find((n) => n.id === campaign.niche_id);
  const progress = campaign.target_contacts_count
    ? (campaign.actual_contacts_reached / campaign.target_contacts_count) * 100
    : 0;

  const statusColors = {
    planning: 'secondary',
    active: 'default',
    paused: 'outline',
    completed: 'success',
  } as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{campaign.name}</CardTitle>
            <CardDescription>{niche?.name || 'Unknown Niche'}</CardDescription>
          </div>
          <Badge variant={statusColors[campaign.status as keyof typeof statusColors] || 'default' as any}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Contact Progress</span>
            <span className="font-medium">
              {campaign.actual_contacts_reached} / {campaign.target_contacts_count || 0}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Responses</div>
            <div className="font-medium">{campaign.responses_received}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Meetings</div>
            <div className="font-medium">{campaign.meetings_booked}</div>
          </div>
        </div>

        <Badge variant="outline" className="capitalize">
          {campaign.campaign_type?.replace('_', ' ')}
        </Badge>
      </CardContent>
    </Card>
  );
}
