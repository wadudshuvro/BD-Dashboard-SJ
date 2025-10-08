import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CreateGeminiVideoModal } from "@/components/video-veo/CreateGeminiVideoModal";
import { GeminiVideoCard } from "@/components/video-veo/GeminiVideoCard";
import { RemixModal } from "@/components/video/RemixModal";
import {
  CreateGeminiVideoInput,
  GeminiVideo,
  createGeminiVideo,
  deleteGeminiVideo,
  downloadGeminiVideo,
  getGeminiVideo,
  isGeminiVideoProcessing,
  listGeminiVideos,
  remixGeminiVideo,
} from "@/Api/veoApi";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const skeletonCards = Array.from({ length: 6 });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeError = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return "Something went wrong";
};

const upsertVideoInCache = (videos: GeminiVideo[], next: GeminiVideo): GeminiVideo[] => {
  const filtered = videos.filter((video) => video.id !== next.id);
  return [next, ...filtered];
};

const removeVideoFromCache = (videos: GeminiVideo[], id: string): GeminiVideo[] => {
  return videos.filter((video) => video.id !== id);
};

const sortVideos = (videos: GeminiVideo[]): GeminiVideo[] => {
  return [...videos].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (bTime !== aTime) {
      return bTime - aTime;
    }
    return b.id.localeCompare(a.id);
  });
};

const getMetadataString = (metadata: Record<string, unknown> | undefined, key: string): string | undefined => {
  const value = metadata?.[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const GeminiVideoStudioPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const pollingSetRef = useRef<Set<string>>(new Set());
  const [pollingIds, setPollingIds] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [playerVideo, setPlayerVideo] = useState<GeminiVideo | null>(null);
  const [remixTarget, setRemixTarget] = useState<GeminiVideo | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [remixingId, setRemixingId] = useState<string | null>(null);

  const {
    data: videos = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["gemini-veo-videos"],
    queryFn: listGeminiVideos,
    refetchInterval: (query) =>
      query.state.data?.some((video) => isGeminiVideoProcessing(video.status)) ? 15000 : false,
  });

  const sortedVideos = useMemo(() => sortVideos(videos), [videos]);

  const mutation = useMutation({
    mutationFn: (payload: CreateGeminiVideoInput) => createGeminiVideo(payload),
    onSuccess: (video) => {
      queryClient.setQueryData<GeminiVideo[]>(["gemini-veo-videos"], (current = []) =>
        upsertVideoInCache(current, video),
      );
      toast({
        title: "Video request submitted",
        description: "We're generating your Gemini Veo 3 video. We'll keep you posted on progress.",
      });
      setIsCreateOpen(false);
      void pollVideo(video.id);
    },
    onError: (error) => {
      toast({
        title: "Unable to create video",
        description: normalizeError(error),
        variant: "destructive",
      });
    },
  });

  const pollVideo = useCallback(
    async (id: string) => {
      if (!id || pollingSetRef.current.has(id)) {
        return;
      }

      pollingSetRef.current.add(id);
      setPollingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

      try {
        let shouldContinue = true;
        while (shouldContinue) {
          const updated = await getGeminiVideo(id);
          queryClient.setQueryData<GeminiVideo[]>(["gemini-veo-videos"], (current = []) =>
            upsertVideoInCache(current, updated),
          );

          shouldContinue = isGeminiVideoProcessing(updated.status);
          if (!shouldContinue) {
            break;
          }

          await sleep(2000);
        }
      } catch (error) {
        console.error("Failed to poll Gemini Veo video", error);
        toast({
          title: "Unable to refresh video",
          description: normalizeError(error),
          variant: "destructive",
        });
      } finally {
        pollingSetRef.current.delete(id);
        setPollingIds((prev) => prev.filter((value) => value !== id));
      }
    },
    [queryClient, toast],
  );

  useEffect(() => {
    sortedVideos.forEach((video) => {
      if (isGeminiVideoProcessing(video.status) && !pollingSetRef.current.has(video.id)) {
        void pollVideo(video.id);
      }
    });
  }, [sortedVideos, pollVideo]);

  const handleCreateVideo = useCallback(
    async ({ prompt, duration, aspectRatio, resolution, negativePrompt, inputReference }: { 
      prompt: string; 
      duration: number;
      aspectRatio?: "16:9" | "9:16";
      resolution?: "720p" | "1080p";
      negativePrompt?: string;
      inputReference?: File | null;
    }) => {
      await mutation.mutateAsync({
        prompt,
        duration,
        aspectRatio,
        resolution,
        negativePrompt,
        inputReference: inputReference ?? undefined,
        metadata: {
          userId: user?.id,
          userEmail: user?.email,
          userName: user?.name,
        },
      });
    },
    [mutation, user?.email, user?.id, user?.name],
  );

  const handleDelete = useCallback(
    async (video: GeminiVideo) => {
      setDeletingId(video.id);
      try {
        await deleteGeminiVideo(video.id);
        queryClient.setQueryData<GeminiVideo[]>(["gemini-veo-videos"], (current = []) =>
          removeVideoFromCache(current, video.id),
        );
        toast({
          title: "Video removed",
          description: "The Gemini Veo 3 video has been deleted.",
        });
      } catch (error) {
        toast({
          title: "Unable to delete video",
          description: normalizeError(error),
          variant: "destructive",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [queryClient, toast],
  );

  const handleDownload = useCallback(
    async (video: GeminiVideo) => {
      setDownloadingId(video.id);
      try {
        const { blob, filename } = await downloadGeminiVideo(video.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename || `${video.id}.mp4`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast({
          title: "Download started",
          description: "Your Gemini Veo 3 video is downloading.",
        });
      } catch (error) {
        toast({
          title: "Unable to download video",
          description: normalizeError(error),
          variant: "destructive",
        });
      } finally {
        setDownloadingId(null);
      }
    },
    [toast],
  );

  const handleRemixSubmit = useCallback(
    async (prompt: string) => {
      if (!remixTarget) return;
      setRemixingId(remixTarget.id);
      try {
        const video = await remixGeminiVideo(remixTarget.id, prompt);
        queryClient.setQueryData<GeminiVideo[]>(["gemini-veo-videos"], (current = []) =>
          upsertVideoInCache(current, video),
        );
        toast({
          title: "Remix requested",
          description: "We're remixing the video with your new direction.",
        });
        setRemixTarget(null);
        void pollVideo(video.id);
      } catch (error) {
        toast({
          title: "Unable to remix video",
          description: normalizeError(error),
          variant: "destructive",
        });
      } finally {
        setRemixingId(null);
      }
    },
    [pollVideo, queryClient, remixTarget, toast],
  );

  const isEmpty = !isLoading && sortedVideos.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Video className="h-7 w-7 text-primary" /> Gemini Video Studio
          </h1>
          <p className="text-muted-foreground">
            Generate cinematic marketing videos with Google Gemini Veo 3.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create New Video
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {skeletonCards.map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/40 p-16 text-center">
          <Video className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No videos yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            No videos yet. Click ‘Create New Video’ to get started.
          </p>
          <Button className="mt-6 gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create New Video
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedVideos.map((video) => (
            <GeminiVideoCard
              key={video.id}
              video={video}
              onPlay={setPlayerVideo}
              onDownload={handleDownload}
              onRemix={(selected) => setRemixTarget(selected)}
              onDelete={handleDelete}
              isDeleting={deletingId === video.id}
              isDownloading={downloadingId === video.id}
              isRemixing={remixingId === video.id}
              isPolling={pollingIds.includes(video.id)}
            />
          ))}
        </div>
      )}

      <CreateGeminiVideoModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateVideo}
        isLoading={mutation.isPending}
      />

      <RemixModal
        open={Boolean(remixTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRemixTarget(null);
          }
        }}
        videoTitle={
          remixTarget?.title ||
          getMetadataString(remixTarget?.metadata, "title") ||
          getMetadataString(remixTarget?.metadata, "videoTitle") ||
          remixTarget?.id
        }
        defaultPrompt={remixTarget?.prompt ?? ""}
        isLoading={remixingId === remixTarget?.id}
        onSubmit={handleRemixSubmit}
        providerName="Google Gemini Veo 3"
      />

      <Dialog
        open={Boolean(playerVideo)}
        onOpenChange={(open) => {
          if (!open) {
            setPlayerVideo(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {playerVideo?.title ||
                getMetadataString(playerVideo?.metadata, "title") ||
                getMetadataString(playerVideo?.metadata, "videoTitle") ||
                "Gemini Veo 3 Preview"}
            </DialogTitle>
            <DialogDescription>
              {playerVideo?.prompt
                ? `Prompt: ${playerVideo.prompt}`
                : "Preview this Gemini Veo 3 generation."}
            </DialogDescription>
          </DialogHeader>
          {playerVideo?.video_url ? (
            <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
              <video
                src={playerVideo.video_url}
                controls
                autoPlay
                className="h-full w-full bg-black object-contain"
              />
            </AspectRatio>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 text-sm text-muted-foreground">
              This video is still processing. Check back soon.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeminiVideoStudioPage;
