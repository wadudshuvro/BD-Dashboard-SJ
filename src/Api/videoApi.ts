import { supabase } from "@/integrations/supabase/client";

export type VideoStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "ready"
  | "failed"
  | "canceled"
  | "unknown";

const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  succeeded: "Ready",
  ready: "Ready",
  failed: "Failed",
  canceled: "Canceled",
  unknown: "Pending",
};

export const getVideoStatusLabel = (status: VideoStatus): string => {
  return VIDEO_STATUS_LABELS[status] ?? "Pending";
};

export const isVideoProcessingStatus = (status: VideoStatus): boolean => {
  return status === "queued" || status === "processing" || status === "unknown";
};

export interface SoraVideo {
  id: string;
  status: VideoStatus;
  title: string;
  prompt?: string;
  model?: string;
  createdAt?: string;
  durationSeconds?: number;
  url?: string;
  thumbnailUrl?: string;
  userId?: string;
  userName?: string;
  costUsd?: number;
  brandId?: string;
  brandName?: string;
  brandSlug?: string;
  raw?: Record<string, unknown>;
}

export interface VideoMetadata {
  user_id?: string;
  user_name?: string;
  brand_id?: string;
  brand_name?: string;
  brand_slug?: string;
  title?: string;
}

export interface CreateVideoInput {
  prompt: string;
  model?: string;
  title?: string;
  brandId?: string;
  brandName?: string;
  brandSlug?: string;
  file?: File | null;
  metadata?: VideoMetadata;
}

type SoraVideoManagerOperation =
  | { operation: "enhance"; idea: string }
  | { operation: "list" }
  | {
      operation: "create";
      prompt: string;
      model?: string;
      title?: string;
      metadata?: VideoMetadata;
    }
  | { operation: "delete"; videoId: string };

const invokeSoraVideoManager = async <T>(payload: SoraVideoManagerOperation): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<T>("sora-video-manager", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || "Failed to communicate with the Sora video manager");
  }

  return data as T;
};

const asNumber = (...values: Array<unknown>): number | undefined => {
  for (const value of values) {
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
};

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const enhanceVideoIdea = async (idea: string): Promise<string> => {
  const data = await invokeSoraVideoManager<{ enhancedPrompt?: string }>({
    operation: "enhance",
    idea: idea.trim(),
  });

  const enhancedPrompt = data?.enhancedPrompt;

  return typeof enhancedPrompt === "string" ? enhancedPrompt.trim() : "";
};

export const getVideoById = async (id: string): Promise<SoraVideo> => {
  const payload = await invokeSoraVideoManager<any>({ operation: "list" });
  const items = extractVideoItems(payload);
  const match = items.find((item) => {
    if (!item || typeof item !== "object") return false;
    const rawId = (item as any).id ?? (item as any).video_id;
    if (!rawId) return false;
    return String(rawId) === id;
  });

  return normalizeVideo(match ?? { id });
};

const pickFromNestedArray = (raw: any, key: string): any | undefined => {
  const container = raw?.[key];
  if (Array.isArray(container)) {
    return container.find((item) => item);
  }
  return undefined;
};

const extractUrl = (raw: any): string | undefined => {
  const candidates = [
    raw?.url,
    raw?.video_url,
    raw?.playback_url,
    raw?.public_url,
    raw?.download_url,
    raw?.file_url,
    raw?.media_url,
    raw?.preview_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  const arrayCandidates = ["assets", "files", "outputs", "output", "data", "videos"];
  for (const key of arrayCandidates) {
    const item = pickFromNestedArray(raw, key);
    if (!item) continue;
    const candidate = extractUrl(item);
    if (candidate) return candidate;
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const candidate = extractUrl(item);
      if (candidate) return candidate;
    }
  }

  return undefined;
};

const extractThumbnail = (raw: any): string | undefined => {
  const candidates = [
    raw?.thumbnail,
    raw?.thumbnail_url,
    raw?.cover_image,
    raw?.cover_image_url,
    raw?.preview_image,
    raw?.preview_image_url,
    raw?.image_url,
    raw?.poster,
    raw?.poster_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  const arrayCandidates = ["assets", "files", "outputs", "output", "frames", "previews"];
  for (const key of arrayCandidates) {
    const item = pickFromNestedArray(raw, key);
    if (!item) continue;
    const candidate = extractThumbnail(item);
    if (candidate) return candidate;
  }

  return undefined;
};

const extractModel = (raw: any): string | undefined => {
  const candidates = [
    raw?.model,
    raw?.metadata?.model,
    raw?.meta?.model,
    raw?.request?.model,
    raw?.configuration?.model,
    raw?.params?.model,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return undefined;
};

const normalizeStatus = (raw: any): VideoStatus => {
  const status =
    raw?.status || raw?.state || raw?.phase || raw?.lifecycle || raw?.processing_state || raw?.task_state;
  if (!status || typeof status !== "string") {
    return "unknown";
  }

  const normalized = status.toLowerCase();
  if (["queued", "processing", "succeeded", "ready", "failed", "canceled"].includes(normalized)) {
    return normalized as VideoStatus;
  }

  if (normalized === "completed" || normalized === "done" || normalized === "success") {
    return "ready";
  }

  if (normalized === "running" || normalized === "in_progress") {
    return "processing";
  }

  return "unknown";
};

const normalizeVideo = (raw: any): SoraVideo => {
  if (!raw || typeof raw !== "object") {
    return {
      id: "unknown",
      status: "unknown",
      title: "Unknown Video",
      raw: raw ?? undefined,
    };
  }

  const id = String((raw as any).id ?? (raw as any).video_id ?? crypto.randomUUID());
  const metadata = (raw as any).metadata ?? {};
  const metadataTitle = asNonEmptyString((metadata as any).title);
  const fallbackPromptTitle =
    typeof raw.prompt === "string" && raw.prompt.length > 0 ? raw.prompt.slice(0, 60) : undefined;
  const titleCandidate =
    metadataTitle ||
    asNonEmptyString(raw.title) ||
    asNonEmptyString(raw.name) ||
    asNonEmptyString(raw.display_name) ||
    asNonEmptyString(fallbackPromptTitle) ||
    `Video ${id.slice(0, 8)}`;

  const durationSeconds = asNumber(
    raw.duration,
    raw.duration_seconds,
    raw.metadata?.duration,
    raw.meta?.duration,
    raw.length,
    raw.length_seconds,
  );

  const costUsd = asNumber(
    raw.cost,
    raw.cost_usd,
    raw.metadata?.cost,
    raw.meta?.cost,
    raw.price,
    raw.price_usd,
  );

  return {
    id,
    status: normalizeStatus(raw),
    title: String(titleCandidate),
    prompt:
      asNonEmptyString(raw.prompt) ||
      asNonEmptyString((metadata as any).prompt) ||
      (typeof raw.prompt === "string" ? raw.prompt : raw.metadata?.prompt),
    model: extractModel(raw),
    createdAt: raw.created_at || raw.created || raw.timestamp,
    durationSeconds: durationSeconds,
    url: extractUrl(raw),
    thumbnailUrl: extractThumbnail(raw),
    userId: raw.user_id || raw.metadata?.user_id,
    userName: raw.user_name || raw.metadata?.user_name,
    costUsd: costUsd,
    brandId:
      asNonEmptyString(raw.brand_id) ||
      asNonEmptyString((metadata as any).brand_id) ||
      asNonEmptyString((metadata as any).brand?.id),
    brandName:
      asNonEmptyString(raw.brand_name) ||
      asNonEmptyString((metadata as any).brand_name) ||
      asNonEmptyString((metadata as any).brand?.name),
    brandSlug:
      asNonEmptyString(raw.brand_slug) ||
      asNonEmptyString((metadata as any).brand_slug) ||
      asNonEmptyString((metadata as any).brand?.slug),
    raw: raw ?? undefined,
  };
};

const extractVideoItems = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.videos)) return payload.videos;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.records)) return payload.records;
  if (payload?.data && typeof payload.data === "object") {
    const nested = Object.values(payload.data).find((value) => Array.isArray(value));
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [];
};

export const getVideos = async (model?: string): Promise<SoraVideo[]> => {
  const payload = await invokeSoraVideoManager<any>({ operation: "list" });
  const items = extractVideoItems(payload);
  const videos = items.map((item) => normalizeVideo(item));
  if (model && model.trim()) {
    return videos.filter((video) => video.model === model);
  }
  return videos;
};

export const createVideo = async ({
  prompt,
  model = "sora-2",
  title,
  brandId,
  brandName,
  brandSlug,
  file,
  metadata,
}: CreateVideoInput): Promise<SoraVideo> => {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt is required to generate a video.");
  }

  const resolvedModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "sora-2";

  const metadataPayload: VideoMetadata = {
    ...(metadata ?? {}),
  };

  const trimmedTitle = asNonEmptyString(title);
  if (trimmedTitle && !metadataPayload.title) {
    metadataPayload.title = trimmedTitle;
  }

  if (brandId && !metadataPayload.brand_id) {
    metadataPayload.brand_id = brandId;
  }

  if (brandName && !metadataPayload.brand_name) {
    metadataPayload.brand_name = brandName;
  }

  if (brandSlug && !metadataPayload.brand_slug) {
    metadataPayload.brand_slug = brandSlug;
  }

  const sanitizedMetadata = Object.fromEntries(
    Object.entries(metadataPayload).filter(([, value]) =>
      typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null,
    ),
  ) as VideoMetadata;

  if (file) {
    throw new Error("Uploading reference files is not supported via the Supabase proxy.");
  }

  const payload = await invokeSoraVideoManager<any>({
    operation: "create",
    prompt: prompt.trim(),
    model: resolvedModel,
    title: trimmedTitle,
    metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : undefined,
  });
  if (Array.isArray(payload?.data) && payload.data.length > 0) {
    return normalizeVideo(payload.data[0]);
  }
  if (payload?.data && typeof payload.data === "object") {
    return normalizeVideo(payload.data);
  }
  return normalizeVideo(payload);
};

export const deleteVideo = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error("Video ID is required to delete a video.");
  }
  await invokeSoraVideoManager({ operation: "delete", videoId: id });
};

