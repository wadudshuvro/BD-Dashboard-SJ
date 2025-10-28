import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Linkedin, Phone, Sparkles, MessageSquare, Trash2, Calendar, Users, Network, Briefcase, FileText, Award, Globe, Brain } from "lucide-react";
import { StatusBadgeWithIcon } from "@/components/bd/StatusBadgeWithIcon";
import { StatusProgressBar } from "@/components/bd/StatusProgressBar";
import { StatusHistoryTimeline } from "@/components/bd/StatusHistoryTimeline";
import { useCampaignContactStatusHistory } from "@/hooks/useCampaignContactStatusHistory";
import type { CampaignContactStatus } from "@/features/campaign-detail/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCampaignContactBySlug } from "@/hooks/useCampaignContactBySlug";
import { useCampaignBySlug } from "@/hooks/useCampaignBySlug";
import { useCampaignContactComments } from "@/hooks/useCampaignContactComments";
import { useCampaignContactResearch } from "@/hooks/useCampaignContactResearch";
import { useDeleteCampaignContact } from "@/hooks/useDeleteCampaignContact";
import { useCampaignContactUpdate } from "@/hooks/useCampaignContactUpdate";
import { useAgentList } from "@/hooks/useAgentList";
import { useRunCampaignAgent } from "@/hooks/useRunCampaignAgent";
import { useAgentRunHistory } from "@/hooks/useAgentRunHistory";
import { toast } from "sonner";
import { parseLinkedInProfile } from "@/utils/parseLinkedInData";
import { LinkedInProfileCard } from "@/components/contact/LinkedInProfileCard";
import { CurrentRoleCard } from "@/components/contact/CurrentRoleCard";
import { ExperienceTimelineCard } from "@/components/contact/ExperienceTimelineCard";
import { EducationCard } from "@/components/contact/EducationCard";
import { ProfessionalNetworkCard } from "@/components/contact/ProfessionalNetworkCard";
import { EngagementCard } from "@/components/contact/EngagementCard";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function CampaignContactDetail() {
  const { campaignSlug, contactSlug } = useParams<{ campaignSlug: string; contactSlug: string }>();
  const { data: contact, isLoading: contactLoading } = useCampaignContactBySlug(contactSlug);
  const { data: campaignData, isLoading: campaignLoading } = useCampaignBySlug(campaignSlug);
  const { comments, isLoading: commentsLoading, addComment, deleteComment, isAddingComment } = useCampaignContactComments(contact?.id);
  const researchMutation = useCampaignContactResearch();
  const deleteMutation = useDeleteCampaignContact();
  const updateMutation = useCampaignContactUpdate();
  const { data: statusHistory = [] } = useCampaignContactStatusHistory(contact?.id);
  
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // AI Agent hooks
  const { data: agents } = useAgentList();
  const runAgent = useRunCampaignAgent();
  const bdAgent = agents?.find(a => a.slug === 'bd-research-analyst');
  const { data: agentRuns } = useAgentRunHistory(bdAgent?.id);
  const latestRun = agentRuns?.[0];
  
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
    if (!bdAgent || !contact || !contactSlug) return;
    
    const researchData = {
      contact_name: contact.contact_name,
      company: contact.contact_company,
      title: contact.contact_title,
      linkedin_about: contact.linkedin_about,
      linkedin_headline: contact.linkedin_headline,
      total_years_experience: contact.total_years_experience,
      linkedin_skills: contact.linkedin_skills,
      education_summary: contact.education_summary,
      metadata: contact.metadata
    };

    runAgent.mutate({
      agentId: bdAgent.id,
      contactId: contact.id,
      contactSlug,
      executionContext: {
        user_id: contact.id,
        filters: {
          contact_data: researchData
        }
      }
    });
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
                  {latestRun?.output?.content ? (
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        {latestRun.output.content.split('\n').filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./)).map((point, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5 font-bold">•</span>
                            <span className="flex-1">{point.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <p className="text-xs text-muted-foreground">
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
              
              {!contact.linkedin_headline && contact.metadata && Object.keys(contact.metadata as object).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Raw LinkedIn Data</h3>
                  <Separator className="mb-3" />
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-96">
                    {JSON.stringify(contact.metadata, null, 2)}
                  </pre>
                </div>
              )}
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
