import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentTriageResults } from "@/hooks/useTaskTriage";
import { History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AITriageRecentActivity() {
  const { data: results = [], isLoading } = useRecentTriageResults(5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Recent triage activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-24 w-full" />}
        {!isLoading && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No triage runs yet. Select a task and click Run AI Triage.
          </p>
        )}
        <ul className="space-y-3">
          {results.map((result) => {
            const taskTitle =
              (result.task as { title?: string } | null)?.title ?? "Unknown task";
            const statusColors: Record<string, string> = {
              pending: "bg-amber-100 text-amber-800",
              approved: "bg-green-100 text-green-800",
              rejected: "bg-gray-100 text-gray-800",
            };

            return (
              <li
                key={result.id}
                className="flex items-center justify-between gap-4 text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{taskTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                    {result.suggested_priority && ` · ${result.suggested_priority} priority`}
                  </p>
                </div>
                <Badge className={statusColors[result.status] ?? ""} variant="secondary">
                  {result.status}
                </Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
