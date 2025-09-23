import { useState } from "react";
import { Bot, FileText, Search, Calendar, Sparkles, Send, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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

export default function TaskHub() {
  const [selectedAgent, setSelectedAgent] = useState(aiAgents[0]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">AI Task Hub</h1>
        <p className="text-muted-foreground">
          Supercharge your marketing workflow with AI-powered assistants
        </p>
      </div>

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
    </div>
  );
}