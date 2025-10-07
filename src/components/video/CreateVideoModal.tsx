import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { prompt: string; file?: File | null }) => void;
  isLoading?: boolean;
}

export const CreateVideoModal = ({ open, onOpenChange, onCreate, isLoading }: CreateVideoModalProps) => {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setFile(null);
      setTouched(false);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (!prompt.trim()) return;
    onCreate({ prompt: prompt.trim(), file });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Create New Video</DialogTitle>
            <DialogDescription>
              Describe the scene you want to generate and optionally upload a reference clip.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="video-prompt">Prompt</Label>
            <Textarea
              id="video-prompt"
              placeholder="A cinematic drone shot of the sunrise over a futuristic city skyline..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onBlur={() => setTouched(true)}
              minLength={10}
              rows={5}
              required
              className="resize-none"
            />
            {touched && !prompt.trim() && (
              <p className="text-sm text-rose-500">A prompt is required to generate a video.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-file">Reference Video (optional)</Label>
            <Input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setFile(selectedFile);
              }}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Upload a short reference clip to guide the generation. Supported formats: MP4, MOV, AVI.
            </p>
            {file && (
              <p className="truncate text-sm font-medium text-foreground">Selected: {file.name}</p>
            )}
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !prompt.trim()} className="gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isLoading ? "Generating..." : "Generate Video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
