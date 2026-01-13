import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { History as HistoryIcon } from 'lucide-react';
import type { TaskHistoryEntry } from '@/services/taskHistoryService';
import { HistoryItem } from './HistoryItem';

interface HistoryTimelineProps {
  history: TaskHistoryEntry[];
  isLoading: boolean;
  error?: Error | null;
}

export function HistoryTimeline({ history, isLoading, error }: HistoryTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load history. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <HistoryIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">
          No changes recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <HistoryItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

