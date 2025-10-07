import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CreateVideoModal } from "@/components/video/CreateVideoModal";
import { RemixModal } from "@/components/video/RemixModal";
import { VideoCard } from "@/components/video/VideoCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  SoraVideo,
  CreateVideoInput,
  createVideo,
  deleteVideo,
  getVideoById,
  getVideos,
  downloadVideoContent,
  remixVideo,
  retrieveVideo,
} from "@/Api/videoApi";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


const skeletonArray = Array.from({ length: 6 });
const DEFAULT_VIDEO_MODELS = ["sora-2"];

type BrandOption = {
  id: string;
  name: string;
  slug?: string;
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

const formatStatusSubtitle = (video: SoraVideo) => {
  const segments: string[] = [];

  if (video.model) {
    segments.push(`Model ${video.model}`);
  }

  if (video.createdAt) {
    try {
      const date = new Date(video.createdAt);
      if (!Number.isNaN(date.getTime())) {
        segments.push(`Generated ${date.toLocaleString()}`);
      }
    } catch (error) {
      // ignore invalid dates
    }
  }

  if (video.userName) {
    segments.push(`Created by ${video.userName}`);
  }

  if (video.costUsd !== undefined) {
    segments.push(`Cost ${formatCurrency(video.costUsd)}`);
  }

  if (video.durationSeconds !== undefined) {
    segments.push(`Duration ${formatDuration(video.durationSeconds)}`);
  }

  return segments.join(" • ");
};

const pickFirstString = (...values: Array<string | undefined | null>) => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
};

const VideoPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<SoraVideo | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<SoraVideo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [remixTarget, setRemixTarget] = useState<SoraVideo | null>(null);
  const [remixingId, setRemixingId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("sora-2");
  const [modelFilter, setModelFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: brandOptions = [], isLoading: isBrandLoading } = useQuery<BrandOption[]>({
    queryKey: ["admin-brands", "options"],
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;
      if (!accessToken) {
        return [];
      }

      const response = await supabase.functions.invoke("admin-brands", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.error || !response.data) {
        console.error("Failed to load brands:", response.error);
        toast({
          title: "Unable to load brands",
          description: response.error?.message || "Please try again later",
          variant: "destructive",
        });
        return [];
      }

      type BrandRecord = {
        id?: string;
        name?: string | null;
        slug?: string | null;
      };

      const records = response.data as BrandRecord[];

      const parseBrandOption = (record: BrandRecord): BrandOption | null => {
        const id = record?.id?.trim();
        const name = record?.name?.trim();
        const slug = record?.slug?.trim();

        if (!id || !name) {
          return null;
        }

        return {
          id,
          name,
          slug,
        };
      };

      return records
        .map((record) => parseBrandOption(record))
        .filter((brand): brand is BrandOption => Boolean(brand))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  const {
    data: videos = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["sora-videos", { model: modelFilter ?? "all" }],
    queryFn: () => getVideos(modelFilter ?? undefined),
  });

  const availableModels = useMemo(() => {
    const models = new Set<string>(DEFAULT_VIDEO_MODELS);
    videos.forEach((video) => {
      if (video.model) {
        models.add(video.model);
      }
    });
    if (selectedModel) {
      models.add(selectedModel);
    }
    if (modelFilter) {
      models.add(modelFilter);
    }
    return Array.from(models).sort();
  }, [modelFilter, selectedModel, videos]);

  const updateVideoInCache = (video: SoraVideo) => {
    const modelKeys = new Set<string>(["all"]);
    if (video.model) {
      modelKeys.add(video.model);
    }
    modelKeys.add(modelFilter ?? "all");

    modelKeys.forEach((modelKey) => {
      queryClient.setQueryData<SoraVideo[]>(["sora-videos", { model: modelKey }], (existing = []) => {
        const index = existing.findIndex((item) => item.id === video.id);
        if (index === -1) {
          return [video, ...existing];
        }
        const updated = [...existing];
        updated[index] = { ...updated[index], ...video };
        return updated;
      });
    });
  };

  const enrichWithUser = useCallback(
    (video: SoraVideo): SoraVideo => ({
      ...video,
      userId: video.userId ?? user?.id ?? undefined,
      userName: video.userName ?? user?.name ?? undefined,
    }),
    [user?.id, user?.name],
  );

  const pollVideoStatus = async (videoId: string, options?: { intervalMs?: number; action?: "create" | "remix" }) => {
    const intervalMs = options?.intervalMs ?? 5000;
    const action = options?.action ?? "create";
    const actionLabel = action === "remix" ? "Remix" : "Video";
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      try {
        let updatedVideo: SoraVideo;
        try {
          updatedVideo = await retrieveVideo(videoId);
        } catch (error) {
          updatedVideo = await getVideoById(videoId);
        }
        updateVideoInCache(enrichWithUser(updatedVideo));

        if (["ready", "succeeded"].includes(updatedVideo.status)) {
          toast({
            title: `${actionLabel} ready`,
            description: `"${updatedVideo.title}" has finished rendering.`,
          });
          queryClient.invalidateQueries({ queryKey: ["sora-videos"] });
          return;
        }

        if (["failed", "canceled"].includes(updatedVideo.status)) {
          toast({
            title: `${actionLabel} failed`,
            description: `Sora was unable to render "${updatedVideo.title}". Try adjusting your prompt and try again.`,
            variant: "destructive",
          });
          queryClient.invalidateQueries({ queryKey: ["sora-videos"] });
          return;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "We will keep trying in the background.";
        toast({
          title: "Unable to check video status",
          description: message,
        });
        return;
      }
    }

    toast({
      title: `${actionLabel} still processing`,
      description: "Your video is taking longer than expected. Check back in a few minutes.",
    });
    queryClient.invalidateQueries({ queryKey: ["sora-videos"] });
  };
  const createMutation = useMutation<SoraVideo, unknown, CreateVideoInput>({
    mutationFn: createVideo,
    onSuccess: (video, variables) => {
      const resolvedTitle =
        pickFirstString(video.title, variables.title, variables.metadata?.title, variables.prompt) ??
        `Video ${video.id.slice(0, 8)}`;
      const resolvedBrandId = pickFirstString(video.brandId, variables.brandId, variables.metadata?.brand_id);
      const resolvedBrandName = pickFirstString(video.brandName, variables.brandName, variables.metadata?.brand_name);
      const resolvedBrandSlug = pickFirstString(video.brandSlug, variables.brandSlug, variables.metadata?.brand_slug);

      const enrichedVideo = enrichWithUser({
        ...video,
        title: resolvedTitle,
        brandId: resolvedBrandId,
        brandName: resolvedBrandName,
        brandSlug: resolvedBrandSlug,
        model: video.model ?? variables.model,
      });

      toast({
        title: "Video generation started",
        description: `"${resolvedTitle}" is now processing. We'll notify you when it's ready.`,
      });
      setIsCreateOpen(false);
      updateVideoInCache(enrichedVideo);
      queryClient.invalidateQueries({ queryKey: ["sora-videos"] });
      void pollVideoStatus(video.id);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Unable to create video",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onMutate: (id: string) => {
      setDeletingId(id);
    },
    onSuccess: () => {
      toast({
        title: "Video deleted",
        description: "The video has been removed from your library.",
      });
      queryClient.invalidateQueries({ queryKey: ["sora-videos"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Unable to delete video",
        description: message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingId(null);
      setVideoToDelete(null);
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const handlePlay = (video: SoraVideo) => {
    setSelectedVideo(enrichWithUser(video));
  };

  const handleDownload = async (video: SoraVideo) => {
    setDownloadingId(video.id);
    try {
      const content = await downloadVideoContent(video.id);
      const mimeType = content.contentType && content.contentType.trim() ? content.contentType : "video/mp4";
      const byteCharacters = atob(content.base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let index = 0; index < byteCharacters.length; index += 1) {
        byteNumbers[index] = byteCharacters.charCodeAt(index);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${video.id}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast({
        title: "Download started",
        description: `Downloading "${video.title || video.id}".`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Unable to download video",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemix = (video: SoraVideo) => {
    setRemixTarget(video);
  };

  const statusSubtitle = useMemo(() => {
    if (!selectedVideo) return "";
    return formatStatusSubtitle(selectedVideo);
  }, [selectedVideo]);


  const handleConfirmDelete = () => {
    if (!videoToDelete?.id) return;
    deleteMutation.mutate(videoToDelete.id);
  };

  const remixMutation = useMutation({
    mutationFn: ({ videoId, prompt }: { videoId: string; prompt: string }) => remixVideo(videoId, prompt),
  });

  const handleRemixSubmit = async (prompt: string) => {
    if (!remixTarget) return;
    setRemixingId(remixTarget.id);
    try {
      const remixedVideo = await remixMutation.mutateAsync({ videoId: remixTarget.id, prompt });
      const enrichedVideo = enrichWithUser(remixedVideo);
      toast({
        title: "Remix started",
        description: `"${enrichedVideo.title}" is being remixed. We'll notify you when it's ready.`,
      });
      setRemixTarget(null);
      updateVideoInCache(enrichedVideo);
      queryClient.invalidateQueries({ queryKey: ["sora-videos"] });
      await pollVideoStatus(enrichedVideo.id, { intervalMs: 2000, action: "remix" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Unable to remix video",
        description: message,
        variant: "destructive",
      });
    } finally {
      setRemixingId(null);
    }
  };

  const displayedVideos = useMemo(() => {
    if (!user?.id) {
      return videos;
    }
    return videos.filter((video) => !video.userId || video.userId === user.id);
  }, [videos, user?.id]);

  const totalCost = useMemo(
    () => displayedVideos.reduce((sum, video) => sum + (video.costUsd ?? 0), 0),
    [displayedVideos],
  );

  const totalDurationSeconds = useMemo(
    () => displayedVideos.reduce((sum, video) => sum + (video.durationSeconds ?? 0), 0),
    [displayedVideos],
  );

  const formatTotalDuration = useCallback((seconds: number) => {
    if (!seconds) return "0s";
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    const remainingSecs = Math.round(seconds % 60);
    if (hrs > 0) {
      return `${hrs}h ${remainingMins}m ${remainingSecs.toString().padStart(2, "0")}s`;
    }
    return `${mins}m ${remainingSecs.toString().padStart(2, "0")}s`;
  }, []);
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">AI Video Assistant</h1>
          <p className="text-muted-foreground">
            Transform quick ideas into cinematic prompts and generate professional marketing videos with OpenAI Sora models.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={modelFilter ?? "all"}
            onValueChange={(value) => setModelFilter(value === "all" ? null : value)}
            disabled={isLoading && !videos.length}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All models</SelectItem>
              {availableModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="gap-2"
          >
            <RefreshCcw className={isRefetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <VideoIcon className="h-4 w-4" />
            Create New Video
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          You've created <span className="font-semibold text-foreground">{displayedVideos.length}</span> videos
          {user?.name ? ` as ${user.name}` : ""}.
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <span>
            Total cost: <span className="font-semibold text-foreground">{formatCurrency(totalCost)}</span>
          </span>
          <span>
            Total duration: <span className="font-semibold text-foreground">{formatTotalDuration(totalDurationSeconds)}</span>
          </span>
        </div>
      </div>
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {skeletonArray.map((_, index) => (
            <div key={index} className="flex flex-col space-y-4 rounded-lg border border-border/60 p-4">
              <Skeleton className="h-48 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedVideos.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {displayedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={handlePlay}
              onDelete={(item) => setVideoToDelete(item)}
              isDeleting={deletingId === video.id && deleteMutation.isPending}
              onDownload={handleDownload}
              onRemix={handleRemix}
              isDownloading={downloadingId === video.id}
              isRemixing={remixingId === video.id && remixMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/30 p-12 text-center">
          <VideoIcon className="mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No videos yet</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Start by generating your first AI-powered video. Describe a scene, click Generate, and Sora will bring your
            vision to life.
          </p>
          <Button className="mt-6 gap-2" onClick={() => setIsCreateOpen(true)}>
            <VideoIcon className="h-4 w-4" />
            Create New Video
          </Button>
        </div>
      )}

      <CreateVideoModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        defaultModel={selectedModel}
        models={availableModels}
        brandOptions={brandOptions ?? []}
        isBrandLoading={isBrandLoading}
        onCreate={(data) => {
          setSelectedModel(data.model);
          createMutation.mutate({
            prompt: data.prompt,
            model: data.model,
            title: data.keyword,
            brandId: data.brandId,
            brandName: data.brandName,
            brandSlug: data.brandSlug,
            metadata: {
              user_id: user?.id,
              user_name: user?.name,
              brand_id: data.brandId,
              brand_name: data.brandName,
              brand_slug: data.brandSlug,
              title: data.keyword,
            },
          });
        }}
        isLoading={createMutation.isPending}
      />

      <Dialog open={Boolean(selectedVideo)} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          {selectedVideo ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">{selectedVideo.title}</DialogTitle>
                {statusSubtitle && <DialogDescription>{statusSubtitle}</DialogDescription>}
              </DialogHeader>
              {selectedVideo.url ? (
                <video
                  src={selectedVideo.url}
                  controls
                  autoPlay
                  className="h-auto w-full rounded-lg border border-border/60"
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/40 text-center text-sm text-muted-foreground">
                  A playable video URL is not yet available. Please try again later.
                </div>
              )}
              <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground sm:grid-cols-2">
                <div>
                  <span className="font-medium text-foreground">Creator:</span> {selectedVideo.userName ?? "Unknown"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Cost:</span> {formatCurrency(selectedVideo.costUsd)}
                </div>
                <div>
                  <span className="font-medium text-foreground">Duration:</span> {formatDuration(selectedVideo.durationSeconds)}
                </div>
                <div>
                  <span className="font-medium text-foreground">Model:</span> {selectedVideo.model ?? "Unknown"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Status:</span> {selectedVideo.status}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(videoToDelete)} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete video</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove "{videoToDelete?.title}" from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RemixModal
        open={Boolean(remixTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRemixTarget(null);
          }
        }}
        videoTitle={remixTarget?.title}
        defaultPrompt={remixTarget?.prompt}
        isLoading={remixMutation.isPending}
        onSubmit={handleRemixSubmit}
      />
    </div>
  );
};

export default VideoPage;
