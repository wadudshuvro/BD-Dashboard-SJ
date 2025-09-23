import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, Calendar, TrendingUp, Users, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function ClientDetail() {
  const { clientId } = useParams();

  // Mock client data
  const client = {
    id: clientId,
    name: 'Sarah Johnson',
    email: 'sarah@techcorp.com', 
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Solutions',
    status: 'active',
    joinDate: '2023-08-15',
    totalRevenue: 15000,
    projects: [
      {
        id: '1',
        name: 'Website Redesign',
        status: 'in-progress',
        progress: 75,
        budget: 8000,
        deadline: '2024-02-28'
      },
      {
        id: '2', 
        name: 'SEO Optimization',
        status: 'completed',
        progress: 100,
        budget: 4000,
        deadline: '2024-01-15'
      },
      {
        id: '3',
        name: 'Social Media Campaign',
        status: 'planning',
        progress: 25,
        budget: 3000,
        deadline: '2024-03-30'
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

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
                <AvatarFallback className="bg-gradient-primary text-white text-xl">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <CardTitle className="text-xl">{client.name}</CardTitle>
                <CardDescription>{client.company}</CardDescription>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Joined {new Date(client.joinDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">${client.totalRevenue.toLocaleString()} total revenue</span>
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
                <span className="font-semibold">{client.projects.filter(p => p.status !== 'completed').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed Projects</span>
                <span className="font-semibold">{client.projects.filter(p => p.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Budget</span>
                <span className="font-semibold">${client.projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <div className="lg:w-2/3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Projects ({client.projects.length})</CardTitle>
                <CardDescription>All projects for this client</CardDescription>
              </div>
              <Button className="bg-gradient-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {client.projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Budget: ${project.budget.toLocaleString()} • Deadline: {new Date(project.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}