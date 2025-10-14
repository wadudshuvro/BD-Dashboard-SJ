import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEODSubmissions } from "@/hooks/useTeamSummaries";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Calendar, Loader2 } from "lucide-react";

export default function MyEODSubmissions() {
  const { user } = useAuth();
  const { data: submissions, isLoading } = useEODSubmissions(user?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My EOD Submissions</h1>
        <p className="text-muted-foreground">View your end-of-day submission history</p>
      </div>

      <div className="space-y-4">
        {submissions && submissions.length > 0 ? (
          submissions.map((submission: any) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(new Date(submission.date), "MMMM d, yyyy")}
                  </CardTitle>
                  {submission.hours_worked && (
                    <Badge variant="secondary">
                      {submission.hours_worked} hours
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.tasks_completed && (
                  <div>
                    <h4 className="font-medium mb-2">Tasks Completed</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {submission.tasks_completed}
                    </p>
                  </div>
                )}

                {submission.tomorrow_plan && (
                  <div>
                    <h4 className="font-medium mb-2">Tomorrow's Plan</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {submission.tomorrow_plan}
                    </p>
                  </div>
                )}

                {submission.challenges && (
                  <div>
                    <h4 className="font-medium mb-2">Challenges</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {submission.challenges}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No EOD submissions yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
