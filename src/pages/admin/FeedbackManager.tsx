import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteFeedback,
  getFeedbackDetail,
  listFeedbackReports,
  postFeedbackComment,
  updateFeedbackStatus,
  updateFeedbackPriority,
  type FeedbackDetailResponse,
  type FeedbackReport,
  type FeedbackStatus,
  type FeedbackType,
  type FeedbackPriority,
} from "@/features/feedback/api";
import { cn } from "@/lib/utils";
import { Clock, Inbox, MessageCircle, ShieldCheck, Sparkles, Bug, Archive, Download } from "lucide-react";

const TABS = {
  bugs: {
    label: "Bugs",
    description: "Track and prioritize platform issues reported by the team.",
    type: "bug" as FeedbackType,
    includeClosed: false,
  },
  features: {
    label: "Features",
    description: "Review enhancement requests across the organization.",
    type: "feature" as FeedbackType,
    includeClosed: false,
  },
  closed: {
    label: "Closed",
    description: "Historical log of completed or archived requests.",
    status: "closed" as FeedbackStatus,
    includeClosed: true,
  },
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100",
  in_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100",
  closed: "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-100",
};

const STATUS_OPTIONS: FeedbackStatus[] = ["open", "in_review", "resolved", "closed"];

const PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_STYLES: Record<FeedbackPriority, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-100",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100",
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100",
};

const PRIORITY_OPTIONS: (FeedbackPriority | null)[] = [null, "low", "medium", "high"];

export default function FeedbackManager() {
  const [activeTab, setActiveTab] = useState<keyof typeof TABS>("bugs");
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Only super_admin and admin should have full access
  // All other roles (manager, project_manager, bd_user, team_member) are view-only
  const isViewOnly = !['super_admin', 'admin'].includes(user?.role || '');
  // Only super_admin can edit priority
  const isSuperAdmin = user?.role === 'super_admin';
  const { enabled: feedbackEnabled } = useFeatureFlag("feedback_enabled");

  const tabConfig = TABS[activeTab];

  const listQuery = useQuery({
    queryKey: ["feedback-list", activeTab, statusFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = {};

      if ("type" in tabConfig) {
        params.type = tabConfig.type;
        params.includeClosed = tabConfig.includeClosed;
      }

      if ("status" in tabConfig) {
        params.status = tabConfig.status;
        params.includeClosed = tabConfig.includeClosed;
      }

      // Add status filter if not "all" and not in "Closed" tab
      if (statusFilter !== 'all' && activeTab !== 'closed') {
        params.status = statusFilter;
      }

      const response = await listFeedbackReports(params);
      return response;
    },
    enabled: feedbackEnabled,
  });

  // Effect 1: Manage selected feedback item when data changes
  useEffect(() => {
    if (listQuery.data?.items?.length) {
      const hasSelection = listQuery.data.items.some((item) => item.id === selectedFeedbackId);
      if (!hasSelection) {
        setSelectedFeedbackId(listQuery.data.items[0].id);
      }
    } else {
      setSelectedFeedbackId(null);
    }
  }, [listQuery.data, selectedFeedbackId]);

  // Effect 2: Reset status filter ONLY when switching tabs
  useEffect(() => {
    setStatusFilter('all');
  }, [activeTab]);

  const detailQuery = useQuery({
    queryKey: ["feedback-detail", selectedFeedbackId],
    queryFn: async () => {
      if (!selectedFeedbackId) return null as unknown as FeedbackDetailResponse;
      return getFeedbackDetail(selectedFeedbackId);
    },
    enabled: feedbackEnabled && !!selectedFeedbackId,
  });

  const commentMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedFeedbackId) throw new Error("No feedback selected");
      return postFeedbackComment(selectedFeedbackId, message);
    },
    onSuccess: () => {
      setCommentDraft("");
      toast({
        title: "Comment posted",
        description: "Your reply has been added to the thread.",
      });
      queryClient.invalidateQueries({ queryKey: ["feedback-detail", selectedFeedbackId] });
    },
    onError: (error) => {
      toast({
        title: "Unable to add comment",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: FeedbackStatus) => {
      if (!selectedFeedbackId) throw new Error("No feedback selected");
      const updated = await updateFeedbackStatus(selectedFeedbackId, status);
      return updated;
    },
    onSuccess: (updated) => {
      toast({
        title: "Status updated",
        description: `Feedback is now marked as ${STATUS_LABELS[updated.status]}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["feedback-list"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-detail", selectedFeedbackId] });
    },
    onError: (error) => {
      toast({
        title: "Unable to update status",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: async (priority: FeedbackPriority | null) => {
      if (!selectedFeedbackId) throw new Error("No feedback selected");
      const updated = await updateFeedbackPriority(selectedFeedbackId, priority);
      return updated;
    },
    onSuccess: (updated) => {
      toast({
        title: "Priority updated",
        description: updated.priority 
          ? `Priority set to ${PRIORITY_LABELS[updated.priority]}.`
          : "Priority cleared.",
      });
      queryClient.invalidateQueries({ queryKey: ["feedback-list"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-detail", selectedFeedbackId] });
    },
    onError: (error) => {
      toast({
        title: "Unable to update priority",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFeedbackId) throw new Error("No feedback selected");
      return deleteFeedback(selectedFeedbackId);
    },
    onSuccess: () => {
      toast({
        title: "Feedback archived",
        description: "The item was marked as closed and hidden from active queues.",
      });
      queryClient.invalidateQueries({ queryKey: ["feedback-list"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-detail", selectedFeedbackId] });
    },
    onError: (error) => {
      toast({
        title: "Unable to archive",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const listItems = listQuery.data?.items ?? [];
  const totalItems = listQuery.data?.total ?? 0;

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentDraft.trim()) return;
    commentMutation.mutate(commentDraft.trim());
  };

  const selectedFeedback = detailQuery.data?.feedback;
  const feedbackComments = detailQuery.data?.comments ?? [];

  if (!feedbackEnabled) {
    return (
      <div className="py-12">
        <Card className="mx-auto max-w-2xl border-dashed border-primary/40 bg-muted/30 text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <ShieldCheck className="h-6 w-6" /> Feedback module disabled
            </CardTitle>
            <CardDescription>
              Turn on the <code>feedback_enabled</code> flag under platform settings to review submissions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Feedback manager</h1>
        <p className="text-muted-foreground">
          Review submissions, collaborate with the team, and close the loop with reporters.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as keyof typeof TABS)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(TABS).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              {key === "bugs" ? <Bug className="h-4 w-4" /> : null}
              {key === "features" ? <Sparkles className="h-4 w-4" /> : null}
              {key === "closed" ? <Archive className="h-4 w-4" /> : null}
              {config.label}
              <Badge variant="secondary" className="ml-1">
                {key === activeTab ? totalItems : ""}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(TABS).map(([key, config]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl">{config.label}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {activeTab !== 'closed' && (
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FeedbackStatus | 'all')}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Badge variant="outline" className="gap-2 text-xs">
                    <Inbox className="h-3.5 w-3.5" /> {totalItems} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {statusFilter !== 'all' && activeTab !== 'closed' && (
                  <div className="px-6 py-3 bg-muted/50 border-b">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium">{STATUS_LABELS[statusFilter]}</span> items only
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2 h-auto p-0 text-xs"
                        onClick={() => setStatusFilter('all')}
                      >
                        Clear filter
                      </Button>
                    </p>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Subject</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Submitted by</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listQuery.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                            Loading feedback…
                          </TableCell>
                        </TableRow>
                      ) : listItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                            No feedback found for this tab.
                          </TableCell>
                        </TableRow>
                      ) : (
                        listItems.map((item) => (
                          <TableRow
                            key={item.id}
                            className={cn(
                              "cursor-pointer transition-colors",
                              selectedFeedbackId === item.id
                                ? "bg-primary/5 hover:bg-primary/10"
                                : "hover:bg-muted/40",
                            )}
                            onClick={() => setSelectedFeedbackId(item.id)}
                          >
                            <TableCell className="font-medium">{item.subject}</TableCell>
                            <TableCell>
                              <Badge variant={item.type === "bug" ? "destructive" : "default"}>
                                {item.type === "bug" ? "Bug" : "Feature"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("text-xs", STATUS_STYLES[item.status])}>
                                {STATUS_LABELS[item.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.priority ? (
                                <Badge className={cn("text-xs", PRIORITY_STYLES[item.priority])}>
                                  {PRIORITY_LABELS[item.priority]}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{item.submitted_by_name ?? item.email ?? "—"}</span>
                                <span className="text-xs text-muted-foreground">{item.email ?? "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
              <Card className="order-2 lg:order-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageCircle className="h-5 w-5" /> Conversation
                  </CardTitle>
                  <CardDescription>
                    Respond to the reporter and leave internal notes for the admin team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {feedbackComments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet. Start the discussion below.</p>
                    ) : (
                      feedbackComments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border border-border bg-muted/40 p-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{comment.author_name ?? comment.author_email ?? "Comment"}</span>
                            <span>{new Date(comment.created_at).toLocaleString()}</span>
                          </div>
                          <p className="mt-2 text-sm text-foreground whitespace-pre-line">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form className="space-y-3" onSubmit={handleCommentSubmit}>
                    <Textarea
                      placeholder={
                        isViewOnly 
                          ? "Viewing only - super_admin required to comment" 
                          : "Leave a note for the team or reply to the reporter"
                      }
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      rows={4}
                      disabled={isViewOnly}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button type="submit" disabled={commentMutation.isPending || !selectedFeedbackId || isViewOnly}>
                        {commentMutation.isPending ? "Posting…" : "Add comment"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="order-1 lg:order-2">
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                    <Clock className="h-5 w-5" />
                    {selectedFeedback ? selectedFeedback.subject : "Select a feedback item"}
                    {isViewOnly && (
                      <Badge variant="outline" className="text-xs">
                        View Only
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    View submission details, attachment, and workflow status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {detailQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading details…</p>
                  ) : !selectedFeedback ? (
                    <p className="text-sm text-muted-foreground">Choose a feedback item from the table to inspect details.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={selectedFeedback.type === "bug" ? "destructive" : "default"}>
                          {selectedFeedback.type === "bug" ? "Bug" : "Feature"}
                        </Badge>
                        <Badge className={cn("text-xs", STATUS_STYLES[selectedFeedback.status])}>
                          {STATUS_LABELS[selectedFeedback.status]}
                        </Badge>
                      </div>

                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground">Submitted by</p>
                          <p className="font-medium">
                            {selectedFeedback.submitted_by_name ?? selectedFeedback.email ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{selectedFeedback.email ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Submitted on</p>
                          <p className="font-medium">{new Date(selectedFeedback.created_at).toLocaleString()}</p>
                        </div>
                        {selectedFeedback.reviewed_by_name ? (
                          <div>
                            <p className="text-muted-foreground">Currently handled by</p>
                            <p className="font-medium">{selectedFeedback.reviewed_by_name}</p>
                          </div>
                        ) : null}
                        <div>
                          <p className="text-muted-foreground">Record ID</p>
                          <p className="font-mono text-xs">{selectedFeedback.id}</p>
                        </div>
                      </div>

                      {selectedFeedback.description ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Description</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {selectedFeedback.description}
                          </p>
                        </div>
                      ) : null}

                      {/* Display multiple attachments if available */}
                      {detailQuery.data?.attachments && detailQuery.data.attachments.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Attachments ({detailQuery.data.attachments.length})</p>
                          <div className="space-y-2">
                            {detailQuery.data.attachments.map((attachment) => (
                              <Button
                                key={attachment.id}
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full justify-start gap-2"
                              >
                                <a
                                  href={attachment.signedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4" />
                                  <span className="truncate flex-1 text-left">{attachment.fileName}</span>
                                  {attachment.fileSize && (
                                    <span className="text-xs text-muted-foreground">
                                      {(attachment.fileSize / 1024).toFixed(2)} KB
                                    </span>
                                  )}
                                </a>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : detailQuery.data?.attachment_signed_url ? (
                        // Legacy single attachment support
                        <Button asChild variant="outline" className="gap-2">
                          <a
                            href={detailQuery.data.attachment_signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Inbox className="h-4 w-4" /> View attachment
                          </a>
                        </Button>
                      ) : null}

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold">Status</p>
                          <Select
                            value={selectedFeedback.status}
                            onValueChange={(value) => statusMutation.mutate(value as FeedbackStatus)}
                            disabled={isViewOnly}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold">
                            Priority
                            {!isSuperAdmin && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">(View only)</span>
                            )}
                          </p>
                          <Select
                            value={selectedFeedback.priority ?? "none"}
                            onValueChange={(value) => priorityMutation.mutate(value === "none" ? null : value as FeedbackPriority)}
                            disabled={!isSuperAdmin}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {PRIORITY_OPTIONS.filter(p => p !== null).map((priority) => (
                                <SelectItem key={priority} value={priority!}>
                                  {PRIORITY_LABELS[priority!]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {!isViewOnly && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => selectedFeedbackId && statusMutation.mutate("resolved")}
                            disabled={statusMutation.isPending || !selectedFeedbackId}
                          >
                            Mark resolved
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending || !selectedFeedbackId}
                          >
                            Archive
                          </Button>
                        </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
