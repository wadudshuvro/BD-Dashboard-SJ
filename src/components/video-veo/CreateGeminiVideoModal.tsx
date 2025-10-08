import { ChangeEvent, useEffect, useState } from "react";
import { Loader2, PlusCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setDuration("8");
      setTouchedPrompt(false);
      setTouchedDuration(false);
      setInputReference(null);
      setImagePreview(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setInputReference(null);
      setImagePreview(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Upload a JPG, PNG, or WEBP image for image-to-video generation.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Image must be under 20MB. Please choose a smaller file.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    setInputReference(file);
    
    // Create preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    setInputReference(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    const fileInput = document.getElementById("veo-reference") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
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
            <Label htmlFor="veo-reference">Reference Image (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Upload an image to generate a video based on it. Supports JPG, PNG, WEBP up to 20MB.
            </p>
            
            {imagePreview ? (
              <div className="relative">
                <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={imagePreview}
                    alt="Reference preview"
                    className="h-full w-full object-cover"
                  />
                </AspectRatio>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  {inputReference?.name} ({(inputReference!.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            ) : (
              <Input
                id="veo-reference"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            )}
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
