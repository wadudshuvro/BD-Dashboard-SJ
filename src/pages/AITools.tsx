import React, { useState } from 'react';
import { Wrench, Plus, Settings, Download, Upload, Play, Code, Database, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";

interface AITool {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'analytics' | 'content' | 'integration';
  status: 'active' | 'inactive' | 'draft';
  usageCount: number;
  lastUsed: string;
  isCustom: boolean;
  config?: Record<string, any>;
}

const mockTools: AITool[] = [
  {
    id: '1',
    name: 'Auto Email Responder',
    description: 'Automatically generates and sends personalized email responses based on incoming messages',
    category: 'automation',
    status: 'active',
    usageCount: 245,
    lastUsed: '2024-01-15T14:30:00Z',
    isCustom: false
  },
  {
    id: '2',
    name: 'Content Performance Analyzer',
    description: 'Analyzes content performance across platforms and suggests optimization strategies',
    category: 'analytics',
    status: 'active',
    usageCount: 89,
    lastUsed: '2024-01-14T11:20:00Z',
    isCustom: true
  },
  {
    id: '3',
    name: 'Social Media Scheduler',
    description: 'Intelligently schedules social media posts for optimal engagement times',
    category: 'content',
    status: 'draft',
    usageCount: 12,
    lastUsed: '2024-01-12T09:45:00Z',
    isCustom: true
  }
];

export default function AITools() {
  const { user } = useAuth();
  const [tools, setTools] = useState<AITool[]>(mockTools);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    category: 'automation' as const,
    prompt: ''
  });
  
  // Check if user has management permissions
  const canManage = user?.role === 'manager' || user?.role === 'super_admin';

  const toggleToolStatus = (toolId: string) => {
    setTools(prev => prev.map(tool => 
      tool.id === toolId 
        ? { ...tool, status: tool.status === 'active' ? 'inactive' : 'active' }
        : tool
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'automation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'analytics': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'content': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'integration': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleCreateTool = () => {
    if (newTool.name && newTool.description) {
      const tool: AITool = {
        id: Date.now().toString(),
        name: newTool.name,
        description: newTool.description,
        category: newTool.category,
        status: 'draft',
        usageCount: 0,
        lastUsed: new Date().toISOString(),
        isCustom: true
      };
      setTools(prev => [tool, ...prev]);
      setNewTool({ name: '', description: '', category: 'automation', prompt: '' });
      setShowCreateForm(false);
    }
  };

  const totalUsage = tools.reduce((sum, tool) => sum + tool.usageCount, 0);
  const activeTools = tools.filter(tool => tool.status === 'active').length;
  const customTools = tools.filter(tool => tool.isCustom).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Tools</h1>
          <p className="text-muted-foreground">Build and manage custom AI-powered tools for your workflow</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button 
                className="bg-gradient-primary text-white hover:opacity-90"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Tool
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tools</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTools}</div>
            <p className="text-xs text-muted-foreground">
              {tools.length} total tools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Executions this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Tools</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customTools}</div>
            <p className="text-xs text-muted-foreground">
              Built by your team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Gain</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Time saved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Tool Form */}
      {showCreateForm && canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Create New AI Tool</CardTitle>
            <CardDescription>
              Build a custom AI tool by defining its purpose and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tool Name</label>
                <Input
                  placeholder="Enter tool name..."
                  value={newTool.name}
                  onChange={(e) => setNewTool(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select 
                  className="w-full p-2 border border-border rounded-md bg-background"
                  value={newTool.category}
                  onChange={(e) => setNewTool(prev => ({ ...prev, category: e.target.value as any }))}
                >
                  <option value="automation">Automation</option>
                  <option value="analytics">Analytics</option>
                  <option value="content">Content</option>
                  <option value="integration">Integration</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                placeholder="Brief description of what this tool does..."
                value={newTool.description}
                onChange={(e) => setNewTool(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">AI Prompt/Instructions</label>
              <Textarea
                placeholder="Describe how the AI should behave and what it should do..."
                value={newTool.prompt}
                onChange={(e) => setNewTool(prev => ({ ...prev, prompt: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTool} className="bg-gradient-primary text-white">
                Create Tool
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Card key={tool.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Wrench className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription className="text-sm">{tool.description}</CardDescription>
                  </div>
                </div>
                {canManage && tool.status !== 'draft' && (
                  <Switch
                    checked={tool.status === 'active'}
                    onCheckedChange={() => toggleToolStatus(tool.id)}
                  />
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Status and Category */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge className={getStatusColor(tool.status)}>
                    {tool.status}
                  </Badge>
                  <Badge className={getCategoryColor(tool.category)}>
                    {tool.category}
                  </Badge>
                  {tool.isCustom && (
                    <Badge variant="outline">Custom</Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {tool.usageCount} uses
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">
                  Last used: {new Date(tool.lastUsed).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {tools.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No AI Tools Available</CardTitle>
            <CardDescription className="mb-4">
              {canManage 
                ? "Create your first AI tool to start automating your workflow"
                : "No AI tools have been created yet. Contact your manager to set up tools."
              }
            </CardDescription>
            {canManage && (
              <Button 
                className="bg-gradient-primary text-white"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Tool
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}