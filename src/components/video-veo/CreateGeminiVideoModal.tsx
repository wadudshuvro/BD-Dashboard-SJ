import { ChangeEvent, useEffect, useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface CreateGeminiVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: { prompt: string; duration: number; inputReference?: File | null }) => Promise<void> | void;
  isLoading?: boolean;
}

const MIN_DURATION = 1;
const MAX_DURATION = 20;

export const CreateGeminiVideoModal = ({
  open,
  onOpenChange,
  onCreate,
  isLoading,
}: CreateGeminiVideoModalProps) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("8");
  const [touchedPrompt, setTouchedPrompt] = useState(false);
  const [touchedDuration, setTouchedDuration] = useState(false);
  const [inputReference, setInputReference] = useState<File | null>(null);

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setDuration("8");
      setTouchedPrompt(false);
      setTouchedDuration(false);
      setInputReference(null);
    }
  }, [open]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setInputReference(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Upload a JPG, PNG, WEBP image or MP4 video as a reference.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    setInputReference(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouchedPrompt(true);
    setTouchedDuration(true);

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast({
        title: "Add a prompt",
        description: "Describe the video you want Gemini Veo 3 to generate.",
        variant: "destructive",
      });
      return;
    }

    const parsedDuration = Number(duration);
    if (!Number.isFinite(parsedDuration) || parsedDuration < MIN_DURATION || parsedDuration > MAX_DURATION) {
      toast({
        title: "Adjust the duration",
        description: `Pick a duration between ${MIN_DURATION} and ${MAX_DURATION} seconds.`,
        variant: "destructive",
      });
      return;
    }

    await onCreate({ prompt: trimmedPrompt, duration: parsedDuration, inputReference });
  };

  const promptError = touchedPrompt && !prompt.trim();
  const durationValue = Number(duration);
  const durationError =
    touchedDuration && (!Number.isFinite(durationValue) || durationValue < MIN_DURATION || durationValue > MAX_DURATION);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
              <PlusCircle className="h-6 w-6" /> Create Gemini Veo 3 Video
            </DialogTitle>
            <DialogDescription>
              Provide a cinematic marketing prompt, choose a short duration, and optionally add a reference file. We'll send it to
              Google Gemini Veo 3 for generation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="veo-prompt">Prompt</Label>
            <Textarea
              id="veo-prompt"
              placeholder="Describe the marketing concept, visuals, and call to action you want to see..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onBlur={() => setTouchedPrompt(true)}
              rows={6}
              disabled={isLoading}
            />
            {promptError ? <p className="text-sm text-rose-500">Enter a prompt to continue.</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="veo-duration">Duration (seconds)</Label>
              <Input
                id="veo-duration"
                type="number"
                min={MIN_DURATION}
                max={MAX_DURATION}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                onBlur={() => setTouchedDuration(true)}
                disabled={isLoading}
              />
              {durationError ? (
                <p className="text-sm text-rose-500">Choose between {MIN_DURATION} and {MAX_DURATION} seconds.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="veo-reference">Upload Theme / Reference</Label>
              <Input
                id="veo-reference"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.mp4"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Supported formats: JPG, PNG, WEBP, MP4.
                {inputReference ? ` Selected: ${inputReference.name}` : ""}
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              {isLoading ? "Creating..." : "Create Video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
