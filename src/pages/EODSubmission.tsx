import { useState } from "react";
import { format } from "date-fns";
import { Calendar, FileText, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EODSubmissionForm } from "@/components/eod/EODSubmissionForm";
import { useEODSubmissions } from "@/hooks/useTeamSummaries";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function EODSubmission() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("month");
  
  const { data: eodSubmissions, isLoading } = useEODSubmissions(user?.id);

  const filteredSubmissions = eodSubmissions?.filter((submission) => {
    const submissionDate = new Date(submission.submission_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dateRange === "today") return daysDiff === 0;
    if (dateRange === "week") return daysDiff <= 7;
    if (dateRange === "month") return daysDiff <= 30;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">End of Day Submission</h1>
        <p className="text-muted-foreground mt-2">
          Submit your daily progress and view your EOD history
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: EOD Submission Form */}
        <EODSubmissionForm />

        {/* Right: My EOD Submissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My EOD Submissions</CardTitle>
                <CardDescription>View your submitted EOD reports</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={dateRange === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange("today")}
                >
                  Today
                </Button>
                <Button
                  variant={dateRange === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange("week")}
                >
                  Week
                </Button>
                <Button
                  variant={dateRange === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange("month")}
                >
                  Month
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading submissions...
              </div>
            ) : filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">
                          {format(new Date(submission.submission_date), "MMMM d, yyyy")}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary">
                        {submission.task_links?.length || 0} tasks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {submission.task_links && submission.task_links.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <LinkIcon className="h-3 w-3" />
                          <span>Task Links:</span>
                        </div>
                        <div className="space-y-1">
                          {submission.task_links.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-primary hover:underline truncate"
                            >
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {submission.notes && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="h-3 w-3" />
                            <span>Notes:</span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {submission.notes}
                          </p>
                        </div>
                      </>
                    )}
                    
                    <div className="text-xs text-muted-foreground pt-2">
                      Submitted {format(new Date(submission.created_at), "h:mm a")}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No EOD submissions found for this period.</p>
                <p className="text-sm mt-2">Submit your first EOD to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
