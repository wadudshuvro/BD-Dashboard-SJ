import { memo } from "react";
import { Play, Trash2, Loader2, DollarSign, Clock3, UserCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { SoraVideo } from "@/Api/videoApi";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: SoraVideo;
  onPlay: (video: SoraVideo) => void;
  onDelete: (video: SoraVideo) => void;
  isDeleting?: boolean;
}

const statusStyles: Record<string, string> = {
  ready: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20",
  succeeded: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20",
  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20",
  queued: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20",
  failed: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20",
  canceled: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20",
  unknown: "bg-muted text-muted-foreground border border-border/50",
};

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return "--";
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
  }).format(value);
};

const VideoCardComponent = ({ video, onPlay, onDelete, isDeleting }: VideoCardProps) => {
  const statusClass = statusStyles[video.status] ?? statusStyles.unknown;
  const thumbnailContent = video.thumbnailUrl ? (
    <img
      src={video.thumbnailUrl}
      alt={video.title}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-300 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900">
      <Play className="h-10 w-10 text-slate-500 dark:text-slate-400" />
    </div>
  );

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="line-clamp-2 text-lg font-semibold leading-tight">
            {video.title || `Video ${video.id}`}
          </CardTitle>
          <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusClass)}>
            {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Created by {video.userName ?? "Unknown"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg border border-border/60 bg-muted">
          {thumbnailContent}
        </AspectRatio>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" /> Duration
            </span>
            <span className="font-medium text-foreground">{formatDuration(video.durationSeconds)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Cost
            </span>
            <span className="font-medium text-foreground">{formatCurrency(video.costUsd)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4" /> ID
            </span>
            <span className="max-w-[160px] truncate text-right font-medium text-foreground" title={video.id}>
              {video.id}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/40">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => onPlay(video)}>
          <Play className="mr-2 h-4 w-4" />
          Play
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => onDelete(video)}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export const VideoCard = memo(VideoCardComponent);
