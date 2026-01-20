import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllDHSSubmissions } from "@/hooks/useDHSSubmissions";
import { format } from "date-fns";
import { Loader2, Search, PhoneCall, UserCheck, Users, TrendingUp } from "lucide-react";
import { DHSTeamSummary } from "@/components/dhs/DHSTeamSummary";

export default function DHSManagement() {
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: allDHSSubmissions, isLoading } = useAllDHSSubmissions(dateFilter);

  // Filter submissions by search term and status
  const filteredSubmissions = allDHSSubmissions?.filter((submission) => {
    const matchesSearch = searchTerm === "" || 
      submission.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <Badge variant="secondary">No Status</Badge>;
    
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">DHS Management</h1>
        <p className="text-muted-foreground">
          Monitor team Daily Head Start submissions and track BD health indicators
        </p>
      </div>

      {/* Team Summary Dashboard */}
      <DHSTeamSummary />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Date filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredSubmissions && filteredSubmissions.length > 0 ? (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {submission.profiles?.full_name || submission.profiles?.email || "Unknown User"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(submission.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {submission.score && (
                      <Badge variant="secondary" className={getScoreColor(submission.score)}>
                        Score: {submission.score}/10
                      </Badge>
                    )}
                    {getStatusBadge(submission.status)}
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
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2 text-sm">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {submission.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "No submissions match your filters"
                : "No DHS submissions found for this period"}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

