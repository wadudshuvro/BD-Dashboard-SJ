import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, FileText, Search, Calendar, Sparkles, Send, Copy, Check, Wrench, Plus, Settings, Download, Upload, Play, Code, Database, Zap, TrendingUp, Activity, Pause } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// AI Agents for Task Hub functionality
const aiAgents = [
  {
    id: 'content',
    name: 'Content Generator',
    description: 'Create LinkedIn posts, blogs, and ad copy',
    icon: <FileText className="h-5 w-5" />,
    color: 'primary',
    examples: [
      'Write a LinkedIn post about AI in marketing',
      'Create ad copy for a productivity app',
      'Draft a blog post about social media trends'
    ]
  },
  {
    id: 'seo',
    name: 'SEO Assistant',
    description: 'Optimize content and suggest keywords',
    icon: <Search className="h-5 w-5" />,
    color: 'accent',
    examples: [
      'Analyze SEO for our homepage',
      'Suggest keywords for "project management"',
      'Optimize this blog post for search'
    ]
  },
  {
    id: 'reporting',
    name: 'Reporting Agent',
    description: 'Generate KPI summaries and insights',
    icon: <Bot className="h-5 w-5" />,
    color: 'success',
    examples: [
      'Create weekly performance summary',
      'Analyze campaign ROI trends',
      'Generate client report for Q1'
    ]
  },
  {
    id: 'campaign',
    name: 'Campaign Planner',
    description: 'Plan posting schedules and optimizations',
    icon: <Calendar className="h-5 w-5" />,
    color: 'warning',
    examples: [
      'Plan content calendar for next month',
      'Optimize ad targeting for B2B SaaS',
      'Schedule posts for product launch'
    ]
  }
];

// Mock responses for AI agents
const mockResponses = {
  content: `🚀 The Future of Marketing is Here with AI

Artificial Intelligence is revolutionizing how we connect with customers:

✨ Personalized content at scale
📊 Data-driven insights in real-time
🎯 Precise audience targeting
⚡ Automated campaign optimization

The question isn't whether to adopt AI—it's how quickly you can integrate it into your marketing strategy.

What's your experience with AI tools in marketing? Share your thoughts below! 👇

#AIMarketing #MarketingTech #DigitalTransformation`,
  
  seo: `🔍 SEO Analysis Complete

**Current Performance:**
- Title Tag: ✅ Optimized (52 characters)
- Meta Description: ⚠️ Too short (95 characters - recommend 150-160)
- H1 Tag: ✅ Contains primary keyword
- Internal Links: ❌ Only 2 found (recommend 5-8)

**Recommended Keywords:**
• "marketing automation tools" (1.2K monthly searches)
• "AI marketing platform" (890 monthly searches)  
• "customer engagement software" (2.1K monthly searches)

**Quick Wins:**
1. Extend meta description with benefits
2. Add "How to" section for long-tail keywords
3. Include more internal links to related content

**SEO Score: 78/100** ⬆️ +15 from last month`,

  reporting: `📊 Weekly Performance Report | Jan 15-21, 2024

**🎯 Key Highlights:**
• 25% increase in social engagement
• Website conversions up 18%
• Email open rates improved to 24.3%

**📈 Social Media:**
• LinkedIn: 15K impressions (+22%)
• Instagram: 8.2K engagements (+31%)
• Twitter: 12K profile visits (+15%)

**💻 Website Performance:**
• 4.2K unique visitors (+18%)
• 3.8% conversion rate (+12%)
• 2:35 avg session duration

**💰 Campaign ROI:**
• Total spend: $2,340
• Generated leads: 89
• Cost per lead: $26.29
• Projected revenue: $18,450

**🚀 Next Week Focus:**
• Launch LinkedIn carousel campaign
• A/B test email subject lines
• Optimize landing page CTA`,

  campaign: `📅 30-Day Content Calendar & Campaign Plan

**Week 1: Brand Awareness**
• LinkedIn: 3 thought leadership posts
• Instagram: 5 behind-the-scenes stories
• Blog: "Ultimate Guide to Marketing Automation"

**Week 2: Product Focus**
• LinkedIn: Case study + demo video
• Instagram: User-generated content campaign
• Email: Feature spotlight series (3 emails)

**Week 3: Community Building**
• LinkedIn: Poll about industry trends
• Instagram: Q&A session + live demo
• Webinar: "Marketing Trends 2024"

**Week 4: Conversion Push** 
• LinkedIn: Special offer announcement
• Instagram: Limited-time promotion
• Email: Urgency-driven campaign sequence

**🎯 Paid Campaign Strategy:**
• Budget: $3,000/month
• Focus: LinkedIn + Google Ads
• Target: Marketing managers, 25-45, B2B SaaS
• Expected: 150 leads, $20 CPA

**📊 Success Metrics:**
• 500+ new followers across platforms
• 200+ email subscribers  
• 12% increase in trial signups`
};

// AI Agents interface and mock data
interface AIAgent {
  id: string;
  name: string;
  description: string;
  provider: 'CollabAI' | 'OpenAI';
  type: 'content' | 'analytics' | 'social' | 'seo' | 'chatbot' | 'assistant';
  status: 'active' | 'inactive' | 'training';
  performance: number;
  tasksCompleted: number;
  lastActive: string;
  integrations: string[];
  model?: string;
}

const mockAgents: AIAgent[] = [
  {
    id: '1',
    name: 'GPT-4 Content Creator',
    description: 'Advanced content generation using OpenAI GPT-4 for blogs, social media, and marketing copy',
    provider: 'OpenAI',
    type: 'content',
    status: 'active',
    performance: 94,
    tasksCompleted: 156,
    lastActive: '2024-01-15T10:30:00Z',
    integrations: ['WordPress', 'LinkedIn API', 'Content Calendar'],
    model: 'gpt-4'
  },
  {
    id: '2', 
    name: 'CollabAI Analytics Expert',
    description: 'Specialized AI agent for marketing analytics and performance insights using CollabAI',
    provider: 'CollabAI',
    type: 'analytics',
    status: 'active', 
    performance: 91,
    tasksCompleted: 89,
    lastActive: '2024-01-15T09:15:00Z',
    integrations: ['Google Analytics', 'Facebook Ads', 'HubSpot'],
    model: 'collab-analytics-v2'
  },
  {
    id: '3',
    name: 'GPT-4 Social Media Manager',
    description: 'Manages social media posting, engagement, and community interactions using OpenAI',
    provider: 'OpenAI',
    type: 'social',
    status: 'training',
    performance: 76,
    tasksCompleted: 34,
    lastActive: '2024-01-14T16:45:00Z',
    integrations: ['Facebook API', 'Instagram API', 'Twitter API'],
    model: 'gpt-4'
  },
  {
    id: '4',
    name: 'CollabAI SEO Optimizer',
    description: 'Advanced SEO analysis and optimization recommendations powered by CollabAI',
    provider: 'CollabAI',
    type: 'seo',
    status: 'active',
    performance: 88,
    tasksCompleted: 67,
    lastActive: '2024-01-15T11:20:00Z',
    integrations: ['SEMrush', 'Google Search Console', 'Ahrefs'],
    model: 'collab-seo-pro'
  },
  {
    id: '5',
    name: 'GPT-4 Customer Support Bot',
    description: 'Intelligent customer support chatbot using OpenAI GPT-4 for instant responses',
    provider: 'OpenAI',
    type: 'chatbot',
    status: 'active',
    performance: 96,
    tasksCompleted: 234,
    lastActive: '2024-01-15T14:10:00Z',
    integrations: ['Zendesk', 'Intercom', 'Slack'],
    model: 'gpt-4-turbo'
  },
  {
    id: '6',
    name: 'CollabAI Executive Assistant',
    description: 'AI-powered executive assistant for scheduling, email management, and task coordination',
    provider: 'CollabAI',
    type: 'assistant',
    status: 'active',
    performance: 92,
    tasksCompleted: 145,
    lastActive: '2024-01-15T13:45:00Z',
    integrations: ['Google Calendar', 'Gmail', 'Microsoft Teams'],
    model: 'collab-assistant-v3'
  }
];

// AI Tools interface and mock data
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
  href?: string;
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
  },
  {
    id: 'video-ai',
    name: 'AI Video Studio (Sora 2)',
    description: 'Generate, manage, and review OpenAI Sora videos within the marketing workspace',
    category: 'content',
    status: 'active',
    usageCount: 64,
    lastUsed: new Date().toISOString(),
    isCustom: false,
    href: '/dashboard/workspace/video'
  }
];

export default function AIWorkspace() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check if user has management permissions
  const canManage = user?.role === 'manager' || user?.role === 'super_admin';

  // AI Task Hub State
  const [selectedAgent, setSelectedAgent] = useState(aiAgents[0]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Agents State
  const [agents, setAgents] = useState<AIAgent[]>(mockAgents);

  // AI Tools State
  const [tools, setTools] = useState<AITool[]>(mockTools);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    category: 'automation' as const,
    prompt: ''
  });

  // AI Task Hub Functions
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Add some details about what you'd like me to help with.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setResponse(mockResponses[selectedAgent.id as keyof typeof mockResponses]);
      setIsLoading(false);
      toast({
        title: "Content generated!",
        description: `${selectedAgent.name} has created your content.`,
      });
    }, 2000);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  // AI Agents Functions
  const toggleAgentStatus = (agentId: string) => {
    if (!canManage) return;
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'active' ? 'inactive' : 'active' }
        : agent
    ));
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'training': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'content': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'analytics': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'social': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'seo': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'chatbot': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'assistant': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'CollabAI': return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // AI Tools Functions
  const toggleToolStatus = (toolId: string) => {
    if (!canManage) return;
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

  // Calculate stats
  const totalAgentTasks = agents.reduce((sum, agent) => sum + agent.tasksCompleted, 0);
  const activeAgents = agents.filter(agent => agent.status === 'active').length;
  const averageAgentPerformance = Math.round(agents.reduce((sum, agent) => sum + agent.performance, 0) / agents.length);
  const totalUsage = tools.reduce((sum, tool) => sum + tool.usageCount, 0);
  const activeTools = tools.filter(tool => tool.status === 'active').length;
  const customTools = tools.filter(tool => tool.isCustom).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Workspace</h1>
        <p className="text-muted-foreground">
          Supercharge your marketing workflow with AI-powered assistants and custom tools
        </p>
      </div>

      <Tabs defaultValue="assistants" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assistants">AI Assistants</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="tools">AI Tools</TabsTrigger>
        </TabsList>
        
        {/* AI Task Hub Tab */}
        <TabsContent value="assistants" className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Agent Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Choose Your AI Agent</h2>
              <div className="space-y-3">
                {aiAgents.map((agent) => (
                  <Card
                    key={agent.id}
                    className={`cursor-pointer transition-smooth hover:shadow-lg ${
                      selectedAgent.id === agent.id 
                        ? 'ring-2 ring-primary shadow-glow' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`
                          h-10 w-10 rounded-lg flex items-center justify-center
                          ${agent.color === 'primary' ? 'bg-gradient-primary text-white' :
                            agent.color === 'accent' ? 'bg-accent text-white' :
                            agent.color === 'success' ? 'bg-success text-white' :
                            'bg-warning text-white'
                          }
                        `}>
                          {agent.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground">{agent.name}</h3>
                          <p className="text-sm text-muted-foreground">{agent.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Task Input */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className={`
                      h-8 w-8 rounded-lg flex items-center justify-center
                      ${selectedAgent.color === 'primary' ? 'bg-gradient-primary text-white' :
                        selectedAgent.color === 'accent' ? 'bg-accent text-white' :
                        selectedAgent.color === 'success' ? 'bg-success text-white' :
                        'bg-warning text-white'
                      }
                    `}>
                      {selectedAgent.icon}
                    </div>
                    <span>{selectedAgent.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-foreground mb-2">
                      What would you like me to help you with?
                    </label>
                    <Textarea
                      id="prompt"
                      placeholder={`Ask ${selectedAgent.name} to help with your task...`}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Try these examples:</span>
                    {selectedAgent.examples.map((example, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-smooth"
                        onClick={() => handleExampleClick(example)}
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full bg-gradient-primary hover:shadow-glow"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Response */}
              {response && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Generated Content</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="flex items-center space-x-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-success" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                        {response}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* AI Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          {/* Agents Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">AI Agents</h2>
              <p className="text-muted-foreground">Manage and monitor your AI-powered agents from CollabAI and OpenAI</p>
            </div>
            {canManage && (
              <Button className="bg-gradient-primary text-white hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Deploy New Agent
              </Button>
            )}
          </div>

          {/* Agent Stats Cards */}
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
                <div className="text-2xl font-bold">{totalAgentTasks}</div>
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
                <div className="text-2xl font-bold">{averageAgentPerformance}%</div>
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
                  {/* Status, Type, and Provider */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={getAgentStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                      <Badge className={getAgentTypeColor(agent.type)}>
                        {agent.type}
                      </Badge>
                      <Badge className={getProviderColor(agent.provider)}>
                        {agent.provider}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {agent.tasksCompleted} tasks completed
                    </span>
                  </div>

                  {/* Model Info */}
                  {agent.model && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Model:</span> {agent.model}
                    </div>
                  )}

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
                <CardTitle className="mb-2">No AI Agents Deployed</CardTitle>
                <CardDescription className="mb-4">
                  {canManage 
                    ? "Deploy your first AI agent to start automating your marketing tasks"
                    : "No AI agents have been deployed yet. Contact your manager to set up agents."
                  }
                </CardDescription>
                {canManage && (
                  <Button className="bg-gradient-primary text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Deploy Your First Agent
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          {/* Tools Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">AI Tools</h2>
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
                      {tool.href ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={tool.href} className="flex items-center gap-1">
                            <Play className="h-4 w-4" />
                            <span>Launch</span>
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}