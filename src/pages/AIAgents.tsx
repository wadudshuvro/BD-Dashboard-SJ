import React, { useState } from 'react';
import { Bot, Plus, Settings, Play, Pause, TrendingUp, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";

interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'analytics' | 'social' | 'seo';
  status: 'active' | 'inactive' | 'training';
  performance: number;
  tasksCompleted: number;
  lastActive: string;
  integrations: string[];
}

const mockAgents: AIAgent[] = [
  {
    id: '1',
    name: 'Content Creator Pro',
    description: 'Generates high-quality blog posts, social media content, and marketing copy',
    type: 'content',
    status: 'active',
    performance: 92,
    tasksCompleted: 156,
    lastActive: '2024-01-15T10:30:00Z',
    integrations: ['OpenAI GPT-4', 'Brand Guidelines', 'Content Calendar']
  },
  {
    id: '2', 
    name: 'Analytics Advisor',
    description: 'Analyzes performance data and provides actionable insights',
    type: 'analytics',
    status: 'active', 
    performance: 88,
    tasksCompleted: 89,
    lastActive: '2024-01-15T09:15:00Z',
    integrations: ['Google Analytics', 'Data Warehouse', 'Reporting Tools']
  },
  {
    id: '3',
    name: 'Social Media Manager',
    description: 'Manages social media posting, engagement, and community management',
    type: 'social',
    status: 'training',
    performance: 76,
    tasksCompleted: 34,
    lastActive: '2024-01-14T16:45:00Z',
    integrations: ['Facebook API', 'Instagram API', 'LinkedIn API']
  }
];

export default function AIAgents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>(mockAgents);
  
  // Check if user has management permissions
  const canManage = user?.role === 'manager' || user?.role === 'super_admin';

  const toggleAgentStatus = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'active' ? 'inactive' : 'active' }
        : agent
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'training': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'content': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'analytics': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'social': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'seo': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const totalTasks = agents.reduce((sum, agent) => sum + agent.tasksCompleted, 0);
  const activeAgents = agents.filter(agent => agent.status === 'active').length;
  const averagePerformance = Math.round(agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Agents</h1>
          <p className="text-muted-foreground">Manage and monitor your AI-powered automation agents</p>
        </div>
        {canManage && (
          <Button className="bg-gradient-primary text-white hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              {agents.length} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePerformance}%</div>
            <p className="text-xs text-muted-foreground">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12.4k</div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription className="text-sm">{agent.description}</CardDescription>
                  </div>
                </div>
                {canManage && (
                  <Switch
                    checked={agent.status === 'active'}
                    onCheckedChange={() => toggleAgentStatus(agent.id)}
                  />
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Status and Type */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                  <Badge className={getTypeColor(agent.type)}>
                    {agent.type}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {agent.tasksCompleted} tasks completed
                </span>
              </div>

              {/* Performance */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Performance Score</span>
                  <span className="font-medium">{agent.performance}%</span>
                </div>
                <Progress value={agent.performance} className="h-2" />
              </div>

              {/* Integrations */}
              <div>
                <p className="text-sm font-medium mb-2">Connected Integrations</p>
                <div className="flex flex-wrap gap-1">
                  {agent.integrations.map((integration, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {integration}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">
                  Last active: {new Date(agent.lastActive).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  {canManage && (
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    {agent.status === 'active' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for when no agents exist */}
      {agents.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No AI Agents Available</CardTitle>
            <CardDescription className="mb-4">
              {canManage 
                ? "Create your first AI agent to start automating your marketing tasks"
                : "No AI agents have been created yet. Contact your manager to set up agents."
              }
            </CardDescription>
            {canManage && (
              <Button className="bg-gradient-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Agent
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}