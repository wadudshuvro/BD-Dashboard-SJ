import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserSummary, useEODSubmissions } from '@/hooks/useTeamSummaries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function MyDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuth();
  
  const { data: summary } = useUserSummary(user?.id || '', selectedDate);
  const { data: eodSubmissions } = useEODSubmissions(user?.id, selectedDate);

  const hasSubmittedToday = eodSubmissions && eodSubmissions.length > 0;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">
            View your daily performance and EOD submissions
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* EOD Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>EOD Status for {format(selectedDate, 'PP')}</span>
            {hasSubmittedToday ? (
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Submitted
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasSubmittedToday ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You submitted your EOD at {format(new Date(eodSubmissions[0].created_at), 'p')}
              </p>
              {eodSubmissions[0].task_links && eodSubmissions[0].task_links.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Tasks:</p>
                  <ul className="space-y-1">
                    {eodSubmissions[0].task_links.map((link, i) => (
                      <li key={i} className="text-sm text-muted-foreground truncate">
                        • {link}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {eodSubmissions[0].notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground">{eodSubmissions[0].notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You haven't submitted your EOD for today yet.
              </p>
              <Link to="/user/actions-tasks">
                <Button>Submit EOD Now</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {summary && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.tasks_completed}</div>
                <p className="text-xs text-muted-foreground">
                  Today's tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.hours_logged}h</div>
                <p className="text-xs text-muted-foreground">
                  Time tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.productivity_score?.toFixed(0) || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  AI-calculated score
                </p>
              </CardContent>
            </Card>
          </div>

          {summary.ai_summary?.overall_summary && (
            <Card>
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {summary.ai_summary.overall_summary}
                </p>
              </CardContent>
            </Card>
          )}

          {summary.key_accomplishments && summary.key_accomplishments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Key Accomplishments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.key_accomplishments.map((accomplishment, i) => (
                    <li key={i} className="text-sm">• {accomplishment}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.concerns && summary.concerns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.concerns.map((concern, i) => (
                    <li key={i} className="text-sm">• {concern}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!summary && hasSubmittedToday && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>AI summary is being generated...</p>
            <p className="text-sm mt-2">Check back later for your performance analysis.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
