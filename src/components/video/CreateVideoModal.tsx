import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { enhanceVideoIdea } from "@/Api/videoApi";
import { useToast } from "@/hooks/use-toast";

interface CreateVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { idea: string; prompt: string }) => void;
  isLoading?: boolean;
}

export const CreateVideoModal = ({ open, onOpenChange, onCreate, isLoading }: CreateVideoModalProps) => {
  const [idea, setIdea] = useState("");
  const [prompt, setPrompt] = useState("");
  const [touchedPrompt, setTouchedPrompt] = useState(false);
  const { toast } = useToast();

  const enhanceMutation = useMutation({
    mutationFn: enhanceVideoIdea,
    onSuccess: (enhanced) => {
      setPrompt(enhanced);
      if (!enhanced.trim()) {
        toast({
          title: "No enhancement returned",
          description: "Try refining your idea and enhancing again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: unknown) => {
      const errorData = (error as { data?: { error?: { message?: string } } })?.data;
      const message =
        errorData?.error?.message || (error instanceof Error ? error.message : "Please try again.");
      toast({
        title: "Unable to enhance idea",
        description: message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!open) {
      setIdea("");
      setPrompt("");
      setTouchedPrompt(false);
      enhanceMutation.reset();
    }
  }, [open, enhanceMutation]);

  const handleEnhance = async () => {
    if (!idea.trim()) {
      toast({
        title: "Add an idea first",
        description: "Enter a short marketing concept before enhancing.",
      });
      return;
    }
    await enhanceMutation.mutateAsync(idea.trim());
    setTouchedPrompt(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouchedPrompt(true);
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Enhance your idea or craft a prompt before generating the video.",
        variant: "destructive",
      });
      return;
    }
    onCreate({ idea: idea.trim(), prompt: prompt.trim() });
  };

  const isEnhancing = enhanceMutation.isPending;
  const enhanceHelper = useMemo(() => {
    if (!idea.trim()) {
      return "Describe the marketing moment you want to capture.";
    }
    return "Click Enhance to transform this idea into a cinematic Sora prompt.";
  }, [idea]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">AI Video Assistant (Sora 2)</DialogTitle>
            <DialogDescription>
              Share your campaign idea, enhance it with AI, and generate a cinematic video with Sora 2.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="video-idea">Your Idea</Label>
            <Textarea
              id="video-idea"
              placeholder="Product launch teaser highlighting eco-friendly features in a vibrant city skyline..."
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              rows={4}
              className="resize-none"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">{enhanceHelper}</p>
            <Button
              type="button"
              variant="outline"
              className="gap-2 self-start"
              onClick={handleEnhance}
              disabled={isLoading || isEnhancing}
            >
              {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isEnhancing ? "Enhancing..." : "Enhance with AI"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-prompt">Enhanced Prompt</Label>
            <Textarea
              id="video-prompt"
              placeholder="A cinematic aerial shot..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onBlur={() => setTouchedPrompt(true)}
              rows={5}
              required
              className="resize-none"
              disabled={isLoading}
            />
            {touchedPrompt && !prompt.trim() ? (
              <p className="text-sm text-rose-500">Provide a detailed prompt to generate the video.</p>
            ) : null}
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading || isEnhancing}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isEnhancing || !prompt.trim()} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isLoading ? "Generating..." : "Generate Video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
