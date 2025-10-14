import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Calendar, TrendingUp, Loader2, MapPin, Building2, Globe, RefreshCw, Users, Handshake, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useContacts } from "@/hooks/useContacts";
import { useDeals } from "@/hooks/useDeals";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, loading: clientLoading, syncClientFromHubSpot } = useClients({});
  const { projects, loading: projectsLoading } = useProjects({ client_id: clientId });
  const { contacts, loading: contactsLoading } = useContacts(clientId);
  const { deals, loading: dealsLoading } = useDeals(clientId);
  const [isSyncing, setIsSyncing] = useState(false);

  const client = clients.find(c => c.id === clientId);

  const handleSync = async () => {
    if (!client?.hubspot_id || !clientId) return;
    
    setIsSyncing(true);
    try {
      await syncClientFromHubSpot(clientId);
    } catch (error: any) {
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (clientLoading || projectsLoading || contactsLoading || dealsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading client details...</span>
      </div>
    );
  }

  if (!client) {
    return (
      <Alert className="max-w-2xl">
        <AlertDescription>
          Client not found.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'planning': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'prospect': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'planning');
  const completedProjects = projects.filter(p => p.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="mx-auto h-24 w-24">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <CardTitle className="text-xl">{client.name}</CardTitle>
                {client.company && <CardDescription>{client.company}</CardDescription>}
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.hubspot_id && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">HubSpot Integration</p>
                    <Badge variant={client.hubspot_sync_status === 'synced' ? 'default' : 'secondary'}>
                      {client.hubspot_sync_status || 'unknown'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">ID: {client.hubspot_id}</p>
                  {client.hubspot_last_sync && (
                    <p className="text-xs text-muted-foreground">
                      Last sync: {format(new Date(client.hubspot_last_sync), 'PPp')}
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleSync} disabled={isSyncing}>
                    {isSyncing ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Sync from HubSpot
                      </>
                    )}
                  </Button>
                </div>
              )}

              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {client.website}
                  </a>
                </div>
              )}
              {(client.city || client.country) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {[client.city, client.state, client.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {client.industry && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.industry}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Joined {new Date(client.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">${(client.total_revenue || 0).toLocaleString()} total revenue</span>
              </div>
              {client.company_revenue && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Company Revenue</p>
                    <p className="text-sm font-medium">${client.company_revenue.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {client.team_size && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.team_size} employees</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Projects</span>
                <span className="font-semibold">{activeProjects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed Projects</span>
                <span className="font-semibold">{completedProjects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Budget</span>
                <span className="font-semibold">${totalBudget.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contacts Section */}
          {contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Contacts ({contacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {contact.first_name} {contact.last_name}
                            {contact.is_primary && (
                              <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                            )}
                          </p>
                          {contact.job_title && (
                            <p className="text-xs text-muted-foreground">{contact.job_title}</p>
                          )}
                          {contact.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </p>
                          )}
                          {contact.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </p>
                          )}
                        </div>
                        {contact.lifecycle_stage && (
                          <Badge variant="outline" className="text-xs">{contact.lifecycle_stage}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deals Section */}
          {deals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Handshake className="h-5 w-5" />
                  Deals ({deals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{deal.title}</p>
                          {deal.amount && (
                            <p className="text-sm text-muted-foreground">
                              ${deal.amount.toLocaleString()}
                            </p>
                          )}
                          {deal.close_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Close: {format(new Date(deal.close_date), 'PP')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {deal.stage && (
                            <Badge variant="outline" className="text-xs">{deal.stage}</Badge>
                          )}
                          {deal.probability && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {deal.probability}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Projects ({projects.length})</CardTitle>
                <CardDescription>All projects for this client</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No projects found for this client.
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Budget: ${(project.budget || 0).toLocaleString()}
                            {project.deadline && ` • Deadline: ${new Date(project.deadline).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
