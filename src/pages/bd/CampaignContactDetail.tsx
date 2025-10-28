import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Linkedin, Phone, Sparkles, MessageSquare, Trash2, Calendar, Users, Network, Briefcase, FileText, Award, Globe, Brain, Copy, Lightbulb, CheckSquare, BarChart3, Target, AlertTriangle } from "lucide-react";
import { StatusBadgeWithIcon } from "@/components/bd/StatusBadgeWithIcon";
import { StatusProgressBar } from "@/components/bd/StatusProgressBar";
import { StatusHistoryTimeline } from "@/components/bd/StatusHistoryTimeline";
import { useCampaignContactStatusHistory } from "@/hooks/useCampaignContactStatusHistory";
import type { CampaignContactStatus } from "@/features/campaign-detail/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCampaignContactBySlug } from "@/hooks/useCampaignContactBySlug";
import { useCampaignBySlug } from "@/hooks/useCampaignBySlug";
import { useCampaignContactComments } from "@/hooks/useCampaignContactComments";
import { useCampaignContactResearch } from "@/hooks/useCampaignContactResearch";
import { useDeleteCampaignContact } from "@/hooks/useDeleteCampaignContact";
import { useCampaignContactUpdate } from "@/hooks/useCampaignContactUpdate";
import { useAgentList } from "@/hooks/useAgentList";
import { useRunCampaignAgent } from "@/hooks/useRunCampaignAgent";
import { useAgentRunHistory } from "@/hooks/useAgentRunHistory";
import { useGenerateLinkedInMessage } from "@/hooks/useGenerateLinkedInMessage";
import { toast } from "sonner";
import { parseLinkedInProfile } from "@/utils/parseLinkedInData";
import { LinkedInProfileCard } from "@/components/contact/LinkedInProfileCard";
import { CurrentRoleCard } from "@/components/contact/CurrentRoleCard";
import { ExperienceTimelineCard } from "@/components/contact/ExperienceTimelineCard";
import { EducationCard } from "@/components/contact/EducationCard";
import { ProfessionalNetworkCard } from "@/components/contact/ProfessionalNetworkCard";
import { EngagementCard } from "@/components/contact/EngagementCard";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function CampaignContactDetail() {
  const { campaignSlug, contactSlug } = useParams<{ campaignSlug: string; contactSlug: string }>();
  const queryClient = useQueryClient();
  const { data: contact, isLoading: contactLoading } = useCampaignContactBySlug(contactSlug);
  const { data: campaignData, isLoading: campaignLoading } = useCampaignBySlug(campaignSlug);
  const { comments, isLoading: commentsLoading, addComment, deleteComment, isAddingComment } = useCampaignContactComments(contact?.id);
  const researchMutation = useCampaignContactResearch();
  const deleteMutation = useDeleteCampaignContact();
  const updateMutation = useCampaignContactUpdate();
  const { data: statusHistory = [] } = useCampaignContactStatusHistory(contact?.id);
  
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // LinkedIn Message Generation
  const [messageType, setMessageType] = useState<'connection_request' | 'first_followup' | 'second_followup' | 'meeting_request'>('connection_request');
  const [userContext, setUserContext] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const generateMessageMutation = useGenerateLinkedInMessage();
  const generatedMessages = generateMessageMutation.data;
  
  // AI Agent hooks
  const { data: agents } = useAgentList();
  const runAgent = useRunCampaignAgent();
  const bdAgent = agents?.find(a => a.slug === 'bd-research-analyst');
  const { data: agentRuns } = useAgentRunHistory(bdAgent?.id);
  
  // Filter agent runs to only show this contact's analysis
  const contactRuns = agentRuns?.filter(run => {
    // Access nested contact data from current structure
    const contactData = run.execution_context?.filters?.contact_data;
    
    // Access legacy structure for backward compatibility
    const legacyContactId = run.execution_context?.contactId;
    
    // Match by contact_name (primary) OR contactId (legacy)
    return (contactData?.contact_name === contact?.contact_name) ||
           (legacyContactId === contact?.id);
  });
  const latestRun = contactRuns?.[0];
  
  const campaign = campaignData?.campaign;

  const handleAddComment = () => {
    if (!contact || !newComment.trim()) return;
    addComment({ contactId: contact.id, comment: newComment });
    setNewComment("");
  };

  const handleRunResearch = () => {
    if (!contact || !contactSlug) return;
    researchMutation.mutate({ contactId: contact.id, contactSlug });
  };

  const handleDelete = () => {
    if (!contact || !campaignSlug) return;
    deleteMutation.mutate({ contactId: contact.id, campaignSlug });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!contact) return;
    updateMutation.mutate({ 
      contactId: contact.id, 
      updates: { status: newStatus } 
    });
  };

  const handleRunAgent = async () => {
    if (!bdAgent || !contact || !contactSlug || !campaign) {
      toast.error("Missing required data", {
        description: "Cannot run analysis without agent, contact, or campaign data",
      });
      return;
    }

    // Check if research_summary exists, recommend running it first if not
    if (!contact.research_summary || !(contact.research_summary as any)?.summary) {
      toast.info("Recommendation", {
        description: "For best results, run 'Run Research' first to gather external insights",
        duration: 5000,
      });
    }
    
    const comprehensiveContactData = {
      // === Basic Info ===
      contact_name: contact.contact_name,
      contact_email: contact.contact_email,
      contact_phone: contact.contact_phone,
      contact_linkedin_url: contact.contact_linkedin_url,
      
      // === Current Role ===
      current_employer: contact.current_employer || contact.contact_company,
      current_position_title: contact.current_position_title || contact.contact_title,
      current_position_start_date: contact.current_position_start_date,
      years_in_current_role: contact.years_in_current_role,
      
      // === Professional Profile ===
      linkedin_headline: contact.linkedin_headline,
      linkedin_about: contact.linkedin_about,
      linkedin_location: contact.linkedin_location,
      total_years_experience: contact.total_years_experience,
      industry_focus: contact.industry_focus,
      previous_employers: contact.previous_employers,
      
      // === Education ===
      education_summary: contact.education_summary,
      highest_degree: contact.highest_degree,
      
      // === Skills & Languages ===
      linkedin_skills: contact.linkedin_skills,
      languages: contact.languages,
      
      // === LinkedIn Metrics ===
      linkedin_follower_count: contact.linkedin_follower_count,
      linkedin_connection_count: contact.linkedin_connection_count,
      profile_completeness_score: contact.profile_completeness_score,
      last_linkedin_activity_date: contact.last_linkedin_activity_date,
      
      // === Research Insights ===
      research_summary: (contact.research_summary as any)?.summary || null,
      research_generated_at: (contact.research_summary as any)?.generated_at || null,
      
      // === Metadata (Parsed LinkedIn) ===
      linkedin_metadata: contact.metadata,
      
      // === Engagement Status ===
      current_status: contact.status,
      last_enriched_at: contact.last_enriched_at,
      
      // === Campaign Context ===
      campaign_name: campaign.name,
      campaign_type: campaign.campaign_type,
      campaign_status: campaign.status,
      campaign_target_regions: campaign.target_regions,
      campaign_goals: {
        target_contacts_count: campaign.target_contacts_count,
        actual_contacts_reached: campaign.actual_contacts_reached,
        responses_received: campaign.responses_received,
        meetings_booked: campaign.meetings_booked,
        deals_generated: campaign.deals_generated,
      },
      campaign_start_date: campaign.start_date,
      campaign_end_date: campaign.end_date,
    };

    runAgent.mutate({
      agentId: bdAgent.id,
      contactId: contact.id,
      contactSlug,
      executionContext: {
        contactId: contact.id,
        user_id: contact.id,
        filters: {
          contact_data: comprehensiveContactData
        }
      }
    }, {
      onSuccess: () => {
        // Invalidate agent runs query to fetch fresh data
        queryClient.invalidateQueries({ queryKey: ['ai-agent-runs', bdAgent.id] });
      }
    });
  };

  const handleGenerateMessage = () => {
    if (!contact) return;
    generateMessageMutation.mutate({
      contactId: contact.id,
      messageType,
      userContext,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  
  if (contactLoading || campaignLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (!contact || !campaign) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Contact not found</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2">
          <Link to={`/campaigns/${campaignSlug}`}>
            <ArrowLeft className="h-4 w-4" /> Back to {campaign.name}
          </Link>
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunResearch}
            disabled={researchMutation.isPending}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {researchMutation.isPending ? "Researching..." : "Run Research"}
          </Button>
          
          {contact?.contact_email && (
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={`mailto:${contact.contact_email}`}>
                <Mail className="h-4 w-4" /> Send Email
              </a>
            </Button>
          )}
          
          {contact?.contact_linkedin_url && (
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={contact.contact_linkedin_url} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" /> View LinkedIn
              </a>
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {contact?.contact_name} from this campaign. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete Contact</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{contact.contact_name}</CardTitle>
              <div className="flex gap-2 text-sm text-muted-foreground">
                {contact.contact_title && <span>{contact.contact_title}</span>}
                {contact.contact_company && <span>at {contact.contact_company}</span>}
              </div>
            </div>
            <Select 
              value={contact.status} 
              onValueChange={handleStatusChange} 
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue>
                  <StatusBadgeWithIcon status={contact.status as CampaignContactStatus} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="identified">
                  <StatusBadgeWithIcon status="identified" />
                </SelectItem>
                <SelectItem value="researched">
                  <StatusBadgeWithIcon status="researched" />
                </SelectItem>
                <SelectItem value="contacted_linkedin">
                  <StatusBadgeWithIcon status="contacted_linkedin" />
                </SelectItem>
                <SelectItem value="connected">
                  <StatusBadgeWithIcon status="connected" />
                </SelectItem>
                <SelectItem value="messaged">
                  <StatusBadgeWithIcon status="messaged" />
                </SelectItem>
                <SelectItem value="contacted_email">
                  <StatusBadgeWithIcon status="contacted_email" />
                </SelectItem>
                <SelectItem value="responded">
                  <StatusBadgeWithIcon status="responded" />
                </SelectItem>
                <SelectItem value="meeting_booked">
                  <StatusBadgeWithIcon status="meeting_booked" />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <StatusProgressBar currentStatus={contact.status as CampaignContactStatus} />
        </CardContent>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="history" className="relative">
                History
                {statusHistory.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {statusHistory.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="relative">
                Comments
                {comments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {comments.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Key Stats Row */}
              {(contact.linkedin_follower_count || contact.linkedin_connection_count || contact.total_years_experience) && (
                <div className="grid gap-4 md:grid-cols-3">
                  {contact.linkedin_follower_count && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <Users className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold">{contact.linkedin_follower_count.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Followers</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {contact.linkedin_connection_count && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <Network className="h-8 w-8 text-emerald-600" />
                          <div>
                            <p className="text-2xl font-bold">{contact.linkedin_connection_count}+</p>
                            <p className="text-sm text-muted-foreground">Connections</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {contact.total_years_experience && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="text-2xl font-bold">{contact.total_years_experience}</p>
                            <p className="text-sm text-muted-foreground">Years Experience</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {contact.contact_linkedin_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <a href={contact.contact_linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                          View LinkedIn Profile
                        </a>
                      </Button>
                    )}
                    {contact.contact_email && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <a href={`mailto:${contact.contact_email}`}>
                          <Mail className="h-4 w-4" />
                          Send Email
                        </a>
                      </Button>
                    )}
                    {contact.contact_phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <a href={`tel:${contact.contact_phone}`}>
                          <Phone className="h-4 w-4" />
                          Call
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("comments")}
                      className="gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Add Note
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRunResearch}
                      disabled={researchMutation.isPending}
                      className="gap-2"
                    >
                      <Brain className="h-4 w-4" />
                      {researchMutation.isPending ? "Researching..." : "Run Research"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* LinkedIn Outreach Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    LinkedIn Outreach
                  </CardTitle>
                  <CardDescription>
                    AI-generated personalized messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={messageType} onValueChange={(v: any) => setMessageType(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select message type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connection_request">Connection Request</SelectItem>
                      <SelectItem value="first_followup">First Follow-up</SelectItem>
                      <SelectItem value="second_followup">Second Follow-up</SelectItem>
                      <SelectItem value="meeting_request">Meeting Request</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Additional context (optional): e.g., 'Mention our mutual connection with John Smith' or 'Reference their recent post about AI'"
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    rows={3}
                  />

                  <Button 
                    onClick={handleGenerateMessage}
                    disabled={generateMessageMutation.isPending}
                    className="w-full"
                  >
                    {generateMessageMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Messages...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate LinkedIn Messages
                      </>
                    )}
                  </Button>

                  {generatedMessages && generatedMessages.message_variants && generatedMessages.message_variants.length > 0 && (
                    <div className="space-y-3">
                      <Tabs value={selectedVariant || generatedMessages.message_variants[0]?.variant_name} onValueChange={setSelectedVariant}>
                        <TabsList className="grid w-full grid-cols-3">
                          {generatedMessages.message_variants.map((variant) => (
                            <TabsTrigger key={variant.variant_name} value={variant.variant_name}>
                              {variant.variant_name.split(' ')[0]}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {generatedMessages.message_variants.map((variant) => (
                          <TabsContent key={variant.variant_name} value={variant.variant_name}>
                            <Card>
                              <CardContent className="pt-4 space-y-3">
                                <div className="relative">
                                  <p className="text-sm whitespace-pre-wrap p-3 bg-muted rounded-md">
                                    {variant.message}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(variant.message)}
                                    className="absolute top-2 right-2"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline">
                                    {variant.character_count} characters
                                  </Badge>
                                  <Badge variant="secondary">
                                    {variant.tone}
                                  </Badge>
                                  {variant.character_count > 300 && messageType === 'connection_request' && (
                                    <Badge variant="destructive">
                                      ⚠️ Over LinkedIn limit
                                    </Badge>
                                  )}
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Personalization Elements:
                                  </p>
                                  <ul className="text-xs space-y-1">
                                    {variant.personalization_elements.map((element, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-primary">•</span>
                                        {element}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        ))}
                      </Tabs>

                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertTitle>Recommended: {generatedMessages.recommended_variant}</AlertTitle>
                        <AlertDescription>
                          {generatedMessages.reasoning}
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-2 gap-2">
                        <Card>
                          <CardContent className="pt-4">
                            <p className="text-xs font-medium text-muted-foreground">Best Time to Send</p>
                            <p className="text-sm font-semibold capitalize">{generatedMessages.send_timing_suggestion}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <p className="text-xs font-medium text-muted-foreground">Follow-up Strategy</p>
                            <p className="text-xs">{generatedMessages.follow_up_strategy}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                  
                  {generatedMessages && (!generatedMessages.message_variants || generatedMessages.message_variants.length === 0) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Messages were generated but the response format was unexpected. Please try generating again.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* AI Research Insights */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Research Insights
                    </CardTitle>
                    <Button 
                      onClick={handleRunAgent}
                      disabled={runAgent.isPending || !bdAgent}
                      size="sm"
                    >
                      {runAgent.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Analyze Lead
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {runAgent.isPending ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing contact...
                    </div>
                  ) : latestRun?.ai_summary?.summary ? (
                    <div className="space-y-4">
                      {/* Executive Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Executive Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed">{latestRun.ai_summary.summary}</p>
                        </CardContent>
                      </Card>

                      {/* Lead Qualification */}
                      {latestRun.ai_summary.structured_output && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Lead Qualification</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                              {latestRun.ai_summary.structured_output.lead_quality_score && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Quality Score</p>
                                  <Badge variant={
                                    latestRun.ai_summary.structured_output.lead_quality_score?.includes('A') ? 'default' :
                                    latestRun.ai_summary.structured_output.lead_quality_score?.includes('B') ? 'secondary' :
                                    'outline'
                                  } className="text-lg">
                                    {latestRun.ai_summary.structured_output.lead_quality_score}
                                  </Badge>
                                </div>
                              )}
                              {latestRun.ai_summary.structured_output.engagement_readiness && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Engagement Readiness</p>
                                  <Badge variant={
                                    latestRun.ai_summary.structured_output.engagement_readiness === 'hot' ? 'destructive' :
                                    latestRun.ai_summary.structured_output.engagement_readiness === 'warm' ? 'default' :
                                    'secondary'
                                  }>
                                    {latestRun.ai_summary.structured_output.engagement_readiness?.toUpperCase()}
                                  </Badge>
                                </div>
                              )}
                              {latestRun.ai_summary.structured_output.decision_maker_level && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Decision Level</p>
                                  <p className="text-sm font-medium">
                                    {latestRun.ai_summary.structured_output.decision_maker_level}
                                  </p>
                                </div>
                              )}
                              {latestRun.ai_summary.structured_output.best_approach && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Best Approach</p>
                                  <p className="text-sm font-medium">
                                    {latestRun.ai_summary.structured_output.best_approach}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Key Talking Points */}
                      {latestRun.ai_summary.structured_output?.key_talking_points && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Key Talking Points
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {latestRun.ai_summary.structured_output.key_talking_points.map((point: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary font-bold">•</span>
                                  <span className="text-sm flex-1">{point}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(point)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Findings */}
                      {latestRun.ai_summary.findings && latestRun.ai_summary.findings.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Key Findings</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5">
                              {latestRun.ai_summary.findings.map((finding: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="text-primary mt-0.5 font-bold">•</span>
                                  <span className="flex-1">{finding}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Recommendations */}
                      {latestRun.ai_summary.recommendations && latestRun.ai_summary.recommendations.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5">
                              {latestRun.ai_summary.recommendations.map((rec: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  <span className="flex-1">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Insights & Risks */}
                      {(latestRun.ai_summary.insights || latestRun.ai_summary.risks) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {latestRun.ai_summary.insights && latestRun.ai_summary.insights.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Sparkles className="h-4 w-4" />
                                  Additional Insights
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-1.5">
                                  {latestRun.ai_summary.insights.map((insight: string, idx: number) => (
                                    <li key={idx} className="text-sm">• {insight}</li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}

                          {latestRun.ai_summary.risks && latestRun.ai_summary.risks.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  Risk Factors
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-1.5">
                                  {latestRun.ai_summary.risks.map((risk: string, idx: number) => (
                                    <li key={idx} className="text-sm">• {risk}</li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {/* Recommended Next Step */}
                      {latestRun.ai_summary.structured_output?.recommended_next_step && (
                        <Alert>
                          <CheckSquare className="h-4 w-4" />
                          <AlertTitle>Recommended Next Step</AlertTitle>
                          <AlertDescription>
                            <p className="font-medium">{latestRun.ai_summary.structured_output.recommended_next_step}</p>
                            {latestRun.ai_summary.structured_output.recommended_timing && (
                              <p className="text-xs mt-1 text-muted-foreground">
                                Timing: {latestRun.ai_summary.structured_output.recommended_timing}
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Action Items */}
                      {latestRun.ai_summary.action_items && latestRun.ai_summary.action_items.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CheckSquare className="h-4 w-4" />
                              Action Items
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {latestRun.ai_summary.action_items.map((item: any, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/30">
                                  <CheckSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-medium">{typeof item === 'string' ? item : item.description}</p>
                                    {typeof item === 'object' && (
                                      <div className="flex gap-2 mt-1">
                                        {item.priority && (
                                          <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                            {item.priority}
                                          </Badge>
                                        )}
                                        {item.confidence && (
                                          <Badge variant="outline" className="text-xs">
                                            {Math.round(item.confidence * 100)}% confidence
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Analysis Metrics */}
                      {latestRun.ai_summary.metrics && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Analysis Metrics
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-3 rounded-md bg-muted/30">
                                <p className="text-xs text-muted-foreground mb-1">Data Points</p>
                                <p className="text-2xl font-bold">{latestRun.ai_summary.metrics.total_items_analyzed || 0}</p>
                              </div>
                              <div className="text-center p-3 rounded-md bg-muted/30">
                                <p className="text-xs text-muted-foreground mb-1">High Priority</p>
                                <p className="text-2xl font-bold">{latestRun.ai_summary.metrics.high_priority_issues || 0}</p>
                              </div>
                              <div className="text-center p-3 rounded-md bg-muted/30">
                                <p className="text-xs text-muted-foreground mb-1">Anomalies</p>
                                <p className="text-2xl font-bold">{latestRun.ai_summary.metrics.anomalies_found || 0}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Confidence Score */}
                      {latestRun.ai_summary.confidence_score !== undefined && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Analysis Confidence
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  {latestRun.ai_summary.confidence_score >= 0.76 ? "High Confidence" :
                                   latestRun.ai_summary.confidence_score >= 0.51 ? "Medium Confidence" :
                                   "Low Confidence"}
                                </span>
                                <span className="text-sm font-bold">
                                  {Math.round(latestRun.ai_summary.confidence_score * 100)}%
                                </span>
                              </div>
                              <Progress 
                                value={latestRun.ai_summary.confidence_score * 100} 
                                className={
                                  latestRun.ai_summary.confidence_score >= 0.76 ? "[&>div]:bg-green-500" :
                                  latestRun.ai_summary.confidence_score >= 0.51 ? "[&>div]:bg-yellow-500" :
                                  "[&>div]:bg-red-500"
                                }
                              />
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <p className="text-xs text-muted-foreground text-center">
                        Last analyzed: {new Date(latestRun.created_at).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click "Analyze Lead" to get AI-powered insights about this contact based on their research data.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* About Section */}
              {contact.linkedin_about && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">{contact.linkedin_about}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LinkedInProfileCard contact={contact} />
                <CurrentRoleCard contact={contact} />
              </div>
              
              {(() => {
                const parsed = contact.metadata ? parseLinkedInProfile(contact.metadata) : null;
                return (
                  <>
                    {parsed?.work_history && parsed.work_history.length > 0 && (
                      <ExperienceTimelineCard 
                        workHistory={parsed.work_history}
                        totalYears={contact.total_years_experience}
                      />
                    )}
                    
                    {/* Skills & Languages */}
                    {(contact.linkedin_skills?.length || contact.languages?.length) && (
                      <div className="grid gap-6 md:grid-cols-2">
                        {contact.linkedin_skills && contact.linkedin_skills.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Skills
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {contact.linkedin_skills.slice(0, 12).map((skill, index) => (
                                  <Badge key={index} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                                {contact.linkedin_skills.length > 12 && (
                                  <Badge variant="outline">
                                    +{contact.linkedin_skills.length - 12} more
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {contact.languages && contact.languages.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Languages
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {contact.languages.map((lang, index) => (
                                  <Badge key={index} variant="outline">
                                    {lang}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <EducationCard 
                        education={contact.education_summary}
                        highestDegree={contact.highest_degree}
                      />
                      <ProfessionalNetworkCard 
                        languages={contact.languages}
                        skills={contact.linkedin_skills}
                      />
                    </div>
                    
                    {(contact.profile_completeness_score !== null || contact.last_linkedin_activity_date) && (
                      <EngagementCard 
                        score={contact.profile_completeness_score}
                        lastActivity={contact.last_linkedin_activity_date}
                      />
                    )}
                  </>
                );
              })()}
              
            </TabsContent>

            <TabsContent value="research" className="space-y-4 mt-6">
              {contact.research_summary ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">AI Research Summary</h3>
                    {typeof contact.research_summary === 'object' && (contact.research_summary as any)?.generated_at && (
                      <span className="text-xs text-muted-foreground">
                        Generated {formatDistanceToNow(new Date((contact.research_summary as any).generated_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <Separator className="mb-3" />
                  <div className="prose prose-sm max-w-none">
                    {typeof contact.research_summary === 'object' && (contact.research_summary as any)?.summary ? (
                      <div className="whitespace-pre-wrap text-sm">{(contact.research_summary as any).summary}</div>
                    ) : (
                      <pre className="text-xs bg-muted p-4 rounded">
                        {JSON.stringify(contact.research_summary, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No research data yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run AI research to gather insights about this contact
                  </p>
                  <Button onClick={handleRunResearch} disabled={researchMutation.isPending}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {researchMutation.isPending ? "Researching..." : "Run Research Now"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <StatusHistoryTimeline history={statusHistory} />
            </TabsContent>

            <TabsContent value="comments" className="space-y-4 mt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Add Comment</h3>
                <Textarea
                  placeholder="Share insights, notes, or next steps..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={!newComment.trim() || isAddingComment}
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isAddingComment ? "Adding..." : "Add Comment"}
                </Button>
              </div>

              <Separator />

              {commentsLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No comments yet. Be the first to add one!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium">
                              {comment.user_name || comment.user_email || "Unknown User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
