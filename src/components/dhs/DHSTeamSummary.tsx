import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDHSTeamSummary } from "@/hooks/useDHSSubmissions";
import { Loader2, Users, TrendingUp, Target, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DHSTeamSummaryProps {
  date?: Date;
}

export function DHSTeamSummary({ date }: DHSTeamSummaryProps) {
  const { data: summary, isLoading } = useDHSTeamSummary(date);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const submissionRateColor = 
    summary.submission_rate >= 80 ? "text-green-600" :
    summary.submission_rate >= 50 ? "text-yellow-600" : "text-red-600";

  const avgScoreColor = summary.average_score
    ? summary.average_score >= 7 ? "text-green-600" :
      summary.average_score >= 5 ? "text-yellow-600" : "text-red-600"
    : "text-gray-500";

  return (
    <div className="space-y-4">
      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submission Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${submissionRateColor}`}>
              {summary.submission_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total_submissions} submissions today
            </p>
            <Progress value={summary.submission_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgScoreColor}`}>
              {summary.average_score ? summary.average_score.toFixed(1) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.average_score ? "Out of 10" : "No scores submitted"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_meetings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Meetings booked today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_calls}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total calls made
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown & Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">On Track</span>
              </div>
              <span className="font-semibold text-green-600">
                {summary.status_breakdown.on_track}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">At Risk</span>
              </div>
              <span className="font-semibold text-yellow-600">
                {summary.status_breakdown.at_risk}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Blocked</span>
              </div>
              <span className="font-semibold text-red-600">
                {summary.status_breakdown.blocked}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">BD Metrics Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Follow-ups Done</span>
              <span className="font-semibold">{summary.total_follow_ups}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Calls Made</span>
              <span className="font-semibold">{summary.total_calls}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Meetings Booked</span>
              <span className="font-semibold">{summary.total_meetings}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(summary.submission_rate < 50 || summary.status_breakdown.blocked > 0) && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-yellow-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-800">
            <ul className="list-disc list-inside space-y-1">
              {summary.submission_rate < 50 && (
                <li>Low submission rate ({summary.submission_rate.toFixed(0)}%) - Follow up with team members</li>
              )}
              {summary.status_breakdown.blocked > 0 && (
                <li>{summary.status_breakdown.blocked} team member(s) marked as blocked</li>
              )}
              {summary.status_breakdown.at_risk > 0 && (
                <li>{summary.status_breakdown.at_risk} team member(s) at risk</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

