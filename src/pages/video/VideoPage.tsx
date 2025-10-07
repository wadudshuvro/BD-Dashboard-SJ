import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CreateVideoModal } from "@/components/video/CreateVideoModal";
import { VideoCard } from "@/components/video/VideoCard";
import { SoraVideo, createVideo, deleteVideo, getVideos } from "@/Api/videoApi";
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

const formatStatusSubtitle = (video: SoraVideo) => {
  if (!video.createdAt) return "";
  try {
    const date = new Date(video.createdAt);
    if (!Number.isNaN(date.getTime())) {
      return `Generated ${date.toLocaleString()}`;
    }
  } catch (error) {
    return "";
  }
  return "";
};

const VideoPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<SoraVideo | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<SoraVideo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: videos = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["sora-videos"],
    queryFn: getVideos,
  });

  const createMutation = useMutation({
    mutationFn: createVideo,
    onSuccess: (video) => {
      toast({
        title: "Video generation started",
        description: `"${video.title}" is now processing. Refresh to see updates shortly.`,
      });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sora-videos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Unable to create video",
        description: error?.message || "Please try again.",
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
    onError: (error: any) => {
      toast({
        title: "Unable to delete video",
        description: error?.message || "Please try again.",
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
    setSelectedVideo(video);
  };

  const statusSubtitle = useMemo(() => {
    if (!selectedVideo) return "";
    return formatStatusSubtitle(selectedVideo);
  }, [selectedVideo]);

  const handleConfirmDelete = () => {
    if (!videoToDelete?.id) return;
    deleteMutation.mutate(videoToDelete.id);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">AI Video Studio (Sora 2)</h1>
          <p className="text-muted-foreground">
            Generate, monitor, and manage your AI-produced videos with OpenAI Sora 2.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
      ) : videos.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={handlePlay}
              onDelete={(item) => setVideoToDelete(item)}
              isDeleting={deletingId === video.id && deleteMutation.isPending}
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
        onCreate={(data) => createMutation.mutate(data)}
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
    </div>
  );
};

export default VideoPage;
