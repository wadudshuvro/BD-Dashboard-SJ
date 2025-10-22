import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Mail, Phone, Building, Calendar, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';

interface Deal {
  id: string;
  title: string;
  amount: number;
  stage: string;
  close_date: string;
  probability: number;
  created_at: string;
  updated_at: string;
  control_tower_id: string;
  control_tower_status: string;
  control_tower_client_id: string;
  control_tower_owner_id: string;
  synced_from_control_tower: boolean;
  last_synced_at: string;
  client_id: string;
  owner_id: string;
  pm_assigned_id: string;
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

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function DealDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [pm, setPm] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeal() {
      try {
        setLoading(true);
        setError(null);

        // Extract UUID from slug (format: deal-name-xxx-xxx-xxx-xxx-xxx)
        // UUID is the last 5 dash-separated segments
        if (!slug) {
          setError('Invalid deal URL');
          return;
        }
        
        const parts = slug.split('-');
        if (parts.length < 5) {
          setError('Invalid deal URL format');
          return;
        }
        
        // Get last 5 parts to form UUID
        const dealId = parts.slice(-5).join('-');
        
        console.log('Extracted deal ID:', dealId);

        // Fetch deal
        const { data: dealData, error: dealError } = await supabase
          .from('deals')
          .select('*')
          .eq('id', dealId)
          .single();

        if (dealError) throw dealError;
        if (!dealData) {
          setError('Deal not found');
          return;
        }

        setDeal(dealData);

        // Fetch client if exists
        if (dealData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', dealData.client_id)
            .single();
          
          if (clientData) setClient(clientData);
        }

        // Fetch owner if exists
        if (dealData.owner_id) {
          const { data: ownerData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('id', dealData.owner_id)
            .single();
          
          if (ownerData) setOwner(ownerData);
        }

        // Fetch PM if exists
        if (dealData.pm_assigned_id) {
          const { data: pmData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('id', dealData.pm_assigned_id)
            .single();
          
          if (pmData) setPm(pmData);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const getStageColor = (stage: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      prospecting: 'secondary',
      qualification: 'outline',
      proposal: 'default',
      negotiation: 'default',
      closed_won: 'default',
      closed_lost: 'destructive',
    };
    return colors[stage] || 'secondary';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{deal.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getStageColor(deal.stage)}>
                {deal.stage.replace('_', ' ').toUpperCase()}
              </Badge>
              {deal.synced_from_control_tower && (
                <Badge variant="outline">Synced from Control Tower</Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-3xl font-bold">{formatCurrency(deal.amount)}</p>
            {deal.probability && (
              <p className="text-sm text-muted-foreground">{deal.probability}% probability</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Deal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Deal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{deal.control_tower_status || 'Active'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stage</p>
                <p className="font-medium capitalize">{deal.stage.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Close</p>
                <p className="font-medium">{deal.close_date ? formatDate(deal.close_date) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(deal.created_at)}</p>
              </div>
              {deal.probability && (
                <div>
                  <p className="text-sm text-muted-foreground">Probability</p>
                  <p className="font-medium">{deal.probability}%</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(deal.updated_at)}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Control Tower Data</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Control Tower ID</p>
                  <p className="font-mono text-xs break-all">{deal.control_tower_id || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Synced</p>
                  <p className="text-sm">{deal.last_synced_at ? formatDate(deal.last_synced_at) : '-'}</p>
                </div>
                {deal.control_tower_client_id && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">CT Client ID</p>
                    <p className="font-mono text-xs break-all">{deal.control_tower_client_id}</p>
                  </div>
                )}
                {deal.control_tower_owner_id && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">CT Owner ID</p>
                    <p className="font-mono text-xs break-all">{deal.control_tower_owner_id}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
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

        {/* Team Members */}
        <Card className="md:col-span-2">
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
      </div>
    </div>
  );
}
