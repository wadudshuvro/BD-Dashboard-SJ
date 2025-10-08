import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, TrendingUp, Plus, Loader2, MapPin, Building2, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, loading: clientLoading } = useClients({});
  const { projects, loading: projectsLoading } = useProjects({ client_id: clientId });

  const client = clients.find(c => c.id === clientId);

  if (clientLoading || projectsLoading) {
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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Client Info */}
        <div className="lg:w-1/3">
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
                    {[client.city, client.country].filter(Boolean).join(', ')}
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
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
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
        </div>

        {/* Projects */}
        <div className="lg:w-2/3">
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