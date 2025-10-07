import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Trash2, Loader2, DollarSign, Clock3, UserCircle2, Sparkles, Download, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getVideoThumbnail, SoraVideo } from "@/Api/videoApi";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoCardProps {
  video: SoraVideo;
  onPlay: (video: SoraVideo) => void;
  onDelete: (video: SoraVideo) => void;
  isDeleting?: boolean;
  onDownload: (video: SoraVideo) => void;
  onRemix: (video: SoraVideo) => void;
  isDownloading?: boolean;
  isRemixing?: boolean;
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

const VideoCardComponent = ({
  video,
  onPlay,
  onDelete,
  isDeleting,
  onDownload,
  onRemix,
  isDownloading,
  isRemixing,
}: VideoCardProps) => {
  const statusClass = statusStyles[video.status] ?? statusStyles.unknown;
  const { data: fetchedThumbnail, isLoading: isThumbnailLoading } = useQuery({
    queryKey: ["sora-video-thumbnail", video.id, video.thumbnailUrl],
    enabled: !video.thumbnailUrl,
    queryFn: async () => {
      try {
        const response = await getVideoThumbnail(video.id);
        if (!response?.base64Data) {
          return null;
        }
        const mime = response.contentType && response.contentType.trim().length > 0 ? response.contentType : "image/png";
        return `data:${mime};base64,${response.base64Data}`;
      } catch (error) {
        console.error("Unable to load thumbnail", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });

  const resolvedThumbnail = video.thumbnailUrl ?? fetchedThumbnail ?? undefined;

  const thumbnailContent = resolvedThumbnail ? (
    <img
      src={resolvedThumbnail}
      alt={video.title}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  ) : isThumbnailLoading ? (
    <div className="flex h-full w-full items-center justify-center">
      <Skeleton className="h-full w-full" />
    </div>
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
        {video.model ? (
          <CardDescription className="text-xs text-muted-foreground">Model: {video.model}</CardDescription>
        ) : null}
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
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Model
            </span>
            <span className="max-w-[160px] truncate text-right font-medium text-foreground" title={video.model ?? "Unknown"}>
              {video.model ?? "Unknown"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/40">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => onPlay(video)} disabled={isDownloading || isRemixing}>
          <Play className="mr-2 h-4 w-4" />
          Play
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onDownload(video)}
          disabled={isDownloading || isDeleting}
        >
          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onRemix(video)}
          disabled={isRemixing || isDeleting}
        >
          {isRemixing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Remix
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
