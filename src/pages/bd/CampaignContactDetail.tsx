import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Linkedin, Phone, Sparkles, MessageSquare, Trash2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCampaignContactBySlug } from "@/hooks/useCampaignContactBySlug";
import { useCampaignBySlug } from "@/hooks/useCampaignBySlug";
import { useCampaignContactComments } from "@/hooks/useCampaignContactComments";
import { useCampaignContactResearch } from "@/hooks/useCampaignContactResearch";
import { useDeleteCampaignContact } from "@/hooks/useDeleteCampaignContact";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function CampaignContactDetail() {
  const { campaignSlug, contactSlug } = useParams<{ campaignSlug: string; contactSlug: string }>();
  const { data: contact, isLoading: contactLoading } = useCampaignContactBySlug(contactSlug);
  const { data: campaignData, isLoading: campaignLoading } = useCampaignBySlug(campaignSlug);
  const { comments, isLoading: commentsLoading, addComment, deleteComment, isAddingComment } = useCampaignContactComments(contact?.id);
  const researchMutation = useCampaignContactResearch();
  const deleteMutation = useDeleteCampaignContact();
  
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  const campaign = campaignData?.campaign;

  const handleAddComment = () => {
    if (!contact || !newComment.trim()) return;
    addComment({ contactId: contact.id, comment: newComment });
    setNewComment("");
  };

  const handleRunResearch = () => {
    if (!contact) return;
    researchMutation.mutate(contact.id);
  };

  const handleDelete = () => {
    if (!contact || !campaignSlug) return;
    deleteMutation.mutate({ contactId: contact.id, campaignSlug });
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
            <Badge className="capitalize">{contact.status.replace('_', ' ')}</Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
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
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <Separator className="mb-3" />
                <div className="grid gap-3">
                  {contact.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${contact.contact_email}`} className="hover:underline">
                        {contact.contact_email}
                      </a>
                    </div>
                  )}
                  {contact.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${contact.contact_phone}`} className="hover:underline">
                        {contact.contact_phone}
                      </a>
                    </div>
                  )}
                  {contact.contact_linkedin_url && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={contact.contact_linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {contact.last_enriched_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Last researched {formatDistanceToNow(new Date(contact.last_enriched_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {contact.metadata && Object.keys(contact.metadata as object).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Additional Data</h3>
                  <Separator className="mb-3" />
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
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
