import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyDHSHistory } from "@/hooks/useDHSSubmissions";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfMonth } from "date-fns";
import { Calendar, Loader2, Edit, PhoneCall, UserCheck, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DHSEditDialog } from "@/components/dhs/DHSEditDialog";

type DateFilter = "all" | "last7" | "last30" | "thisMonth";

export default function MyDHSSubmissions() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [editingSubmission, setEditingSubmission] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Calculate date range based on filter
  const getDateRange = () => {
    const today = new Date().toISOString().split('T')[0];

    switch (dateFilter) {
      case "last7":
        return {
          start: subDays(new Date(), 7).toISOString().split('T')[0],
          end: today,
        };
      case "last30":
        return {
          start: subDays(new Date(), 30).toISOString().split('T')[0],
          end: today,
        };
      case "thisMonth":
        return {
          start: startOfMonth(new Date()).toISOString().split('T')[0],
          end: today,
        };
      default:
        return undefined;
    }
  };

  const { data: submissions, isLoading } = useMyDHSHistory(user?.id, getDateRange());

  // Check if a submission is from today
  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const handleEditClick = (submission: any) => {
    setEditingSubmission(submission);
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return null;
    
    const variants = {
      on_track: { label: "On Track", className: "bg-green-100 text-green-800" },
      at_risk: { label: "At Risk", className: "bg-yellow-100 text-yellow-800" },
      blocked: { label: "Blocked", className: "bg-red-100 text-red-800" },
    };

    const config = variants[status as keyof typeof variants];
    if (!config) return null;

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getScoreColor = (score?: number | null) => {
    if (!score) return "text-gray-500";
    if (score <= 3) return "text-red-600";
    if (score <= 6) return "text-yellow-600";
    return "text-green-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My DHS Submissions</h1>
          <p className="text-muted-foreground">View your Daily Head Start history</p>
        </div>
        <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="last7">Last 7 Days</SelectItem>
            <SelectItem value="last30">Last 30 Days</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
          </SelectContent>
        </Select>
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
                  <div className="flex items-center gap-2">
                    {submission.score && (
                      <Badge variant="secondary" className={getScoreColor(submission.score)}>
                        Score: {submission.score}/10
                      </Badge>
                    )}
                    {getStatusBadge(submission.status)}
                    {isToday(submission.date) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(submission)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* BD Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Follow-ups</p>
                      <p className="font-semibold">{submission.follow_ups_done}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Calls</p>
                      <p className="font-semibold">{submission.calls_made}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Meetings</p>
                      <p className="font-semibold">{submission.meetings_booked}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pipeline</p>
                      <p className="font-semibold">
                        {submission.pipeline_updated ? "✓ Updated" : "✗ Not Updated"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {submission.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {submission.notes}
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
              <p className="text-muted-foreground">No DHS submissions yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {editingSubmission && (
        <DHSEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          submission={editingSubmission}
        />
      )}
    </div>
  );
}

