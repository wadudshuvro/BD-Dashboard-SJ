import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { enhanceVideoIdea } from "@/Api/videoApi";
import { useToast } from "@/hooks/use-toast";

interface CreateVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    idea: string;
    prompt: string;
    model: string;
    keyword: string;
    brandId?: string;
    brandName?: string;
    brandSlug?: string;
    durationSeconds: number;
    inputReference?: File | null;
  }) => void;
  isLoading?: boolean;
  defaultModel?: string;
  models?: string[];
  brandOptions?: Array<{ id: string; name: string; slug?: string }>;
  isBrandLoading?: boolean;
}

const DEFAULT_MODEL = "sora-2";
const MAX_KEYWORD_LENGTH = 60;
const KEYWORD_PLACEHOLDER = "Holiday campaign teaser";
const NO_BRAND_VALUE = "__no_brand__";
const DEFAULT_DURATION_SECONDS = 8;
const MIN_DURATION_SECONDS = 1;
const MAX_DURATION_SECONDS = 20;
const COST_PER_SECOND_USD = 0.01;

export const CreateVideoModal = ({
  open,
  onOpenChange,
  onCreate,
  isLoading,
  defaultModel = DEFAULT_MODEL,
  models,
  brandOptions,
  isBrandLoading,
}: CreateVideoModalProps) => {
  const [idea, setIdea] = useState("");
  const [prompt, setPrompt] = useState("");
  const [touchedPrompt, setTouchedPrompt] = useState(false);
  const [model, setModel] = useState(defaultModel);
  const [keyword, setKeyword] = useState("");
  const [keywordTouched, setKeywordTouched] = useState(false);
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState<string>(String(DEFAULT_DURATION_SECONDS));
  const [durationTouched, setDurationTouched] = useState(false);
  const [inputReference, setInputReference] = useState<File | null>(null);
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
      setModel(defaultModel);
      setKeyword("");
      setKeywordTouched(false);
      setBrandId(undefined);
      setDuration(String(DEFAULT_DURATION_SECONDS));
      setDurationTouched(false);
      setInputReference(null);
      enhanceMutation.reset();
    }
  }, [open, enhanceMutation, defaultModel]);

  useEffect(() => {
    if (open) {
      setModel(defaultModel);
    }
  }, [defaultModel, open]);

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
    setKeywordTouched(true);
    setDurationTouched(true);
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Enhance your idea or craft a prompt before generating the video.",
        variant: "destructive",
      });
      return;
    }
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      toast({
        title: "Keyword required",
        description: "Add a short keyword before generating your video.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedKeyword.length > MAX_KEYWORD_LENGTH) {
      toast({
        title: "Keyword too long",
        description: `Keep the keyword under ${MAX_KEYWORD_LENGTH} characters.`,
        variant: "destructive",
      });
      return;
    }

    if (!isDurationValid) {
      toast({
        title: "Adjust the duration",
        description: `Pick a duration between ${MIN_DURATION_SECONDS} and ${MAX_DURATION_SECONDS} seconds.`,
        variant: "destructive",
      });
      return;
    }

    const selectedBrand = brandOptions?.find((option) => option.id === brandId);

    onCreate({
      idea: idea.trim(),
      prompt: prompt.trim(),
      model,
      keyword: trimmedKeyword,
      brandId: selectedBrand?.id,
      brandName: selectedBrand?.name,
      brandSlug: selectedBrand?.slug,
      durationSeconds: parsedDuration,
      inputReference,
    });
  };

  const isEnhancing = enhanceMutation.isPending;
  const availableModels = useMemo(() => {
    const unique = new Set<string>([DEFAULT_MODEL, defaultModel]);
    (models ?? []).forEach((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        unique.add(entry.trim());
      }
    });
    return Array.from(unique).sort();
  }, [defaultModel, models]);

  useEffect(() => {
    if (!availableModels.includes(model)) {
      setModel(defaultModel);
    }
  }, [availableModels, defaultModel, model]);

  const formatModelLabel = useCallback((value: string) => {
    if (!value) return "Unknown";
    return value
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }, []);

  const enhanceHelper = useMemo(() => {
    if (!idea.trim()) {
      return "Describe the marketing moment you want to capture.";
    }
    return "Click Enhance to transform this idea into a cinematic Sora prompt.";
  }, [idea]);

  const trimmedKeyword = keyword.trim();
  const isKeywordValid = trimmedKeyword.length > 0 && trimmedKeyword.length <= MAX_KEYWORD_LENGTH;
  const keywordError = keywordTouched && !isKeywordValid;
  const brandSelectValue = brandId ?? NO_BRAND_VALUE;
  const disableBrandSelect = Boolean(isLoading || isBrandLoading);
  const availableBrandOptions = brandOptions ?? [];
  const parsedDuration = Number(duration);
  const isDurationValid =
    Number.isFinite(parsedDuration) &&
    parsedDuration >= MIN_DURATION_SECONDS &&
    parsedDuration <= MAX_DURATION_SECONDS;
  const durationError = durationTouched && !isDurationValid;
  const estimatedCost = isDurationValid
    ? (parsedDuration * COST_PER_SECOND_USD).toFixed(3)
    : undefined;

  const handleInputReferenceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setInputReference(null);
      return;
    }

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);
    if (file.type && !allowedTypes.has(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Upload a JPEG, PNG, WEBP image or an MP4 video.",
        variant: "destructive",
      });
      event.target.value = "";
      setInputReference(null);
      return;
    }

    setInputReference(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">AI Video Assistant</DialogTitle>
            <DialogDescription>
              Share your business development idea, enhance it with AI, and generate a cinematic video with your selected Sora model.
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
            <Label htmlFor="video-keyword">Keyword / Video name</Label>
            <Input
              id="video-keyword"
              placeholder={KEYWORD_PLACEHOLDER}
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                if (!keywordTouched) {
                  setKeywordTouched(true);
                }
              }}
              onBlur={() => setKeywordTouched(true)}
              maxLength={MAX_KEYWORD_LENGTH}
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Keep it short and memorable for quick identification.</span>
              <span>
                {keyword.length}/{MAX_KEYWORD_LENGTH}
              </span>
            </div>
            {keywordError ? (
              <p className="text-sm text-rose-500">Add a short keyword under {MAX_KEYWORD_LENGTH} characters.</p>
            ) : null}
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

          <div className="space-y-2">
            <Label htmlFor="video-input-reference">Upload Theme Image or Video</Label>
            <input
              id="video-input-reference"
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              onChange={handleInputReferenceChange}
              className="w-full rounded-lg border border-input bg-background p-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Accepted formats: JPEG, PNG, WEBP or MP4 up to 20 seconds for reference visuals.
            </p>
            {inputReference ? (
              <p className="text-xs text-muted-foreground">Selected: {inputReference.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-duration">Duration (seconds)</Label>
            <Input
              id="video-duration"
              type="number"
              min={MIN_DURATION_SECONDS}
              max={MAX_DURATION_SECONDS}
              value={duration}
              onChange={(event) => {
                setDuration(event.target.value);
                if (!durationTouched) {
                  setDurationTouched(true);
                }
              }}
              onBlur={() => setDurationTouched(true)}
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Sora supports clips up to {MAX_DURATION_SECONDS} seconds. Keep business development snippets punchy and concise.
            </p>
            {estimatedCost ? (
              <p className="text-sm text-muted-foreground">Estimated Cost: ${estimatedCost}</p>
            ) : null}
            {durationError ? (
              <p className="text-sm text-rose-500">
                Choose a duration between {MIN_DURATION_SECONDS} and {MAX_DURATION_SECONDS} seconds.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-brand">Brand</Label>
            <Select
              value={brandSelectValue}
              onValueChange={(value) => setBrandId(value === NO_BRAND_VALUE ? undefined : value)}
              disabled={disableBrandSelect}
            >
              <SelectTrigger id="video-brand">
                <SelectValue placeholder={disableBrandSelect ? "Loading brands..." : "Select a brand"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BRAND_VALUE}>No brand</SelectItem>
                {availableBrandOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Associate this video with a brand to keep your library organized.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-model">Model</Label>
            <Select value={model} onValueChange={setModel} disabled={isLoading}>
              <SelectTrigger id="video-model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatModelLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose which version of Sora should generate this video.
            </p>
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading || isEnhancing}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isEnhancing || !prompt.trim() || !isKeywordValid || !isDurationValid}
              className="gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isLoading ? "Generating..." : "Generate Video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
