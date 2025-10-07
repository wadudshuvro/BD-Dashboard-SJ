import { axiosPrivate } from "@/lib/axios";

export type VideoStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "ready"
  | "failed"
  | "canceled"
  | "unknown";

export interface SoraVideo {
  id: string;
  status: VideoStatus;
  title: string;
  prompt?: string;
  createdAt?: string;
  durationSeconds?: number;
  url?: string;
  thumbnailUrl?: string;
  raw?: Record<string, unknown>;
}

export interface CreateVideoInput {
  prompt: string;
  file?: File | null;
}

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
  const titleCandidate =
    raw.title ||
    raw.name ||
    raw.display_name ||
    raw.metadata?.title ||
    raw.prompt?.slice?.(0, 60) ||
    `Video ${id.slice(0, 8)}`;

  const durationSeconds = asNumber(
    raw.duration,
    raw.duration_seconds,
    raw.metadata?.duration,
    raw.meta?.duration,
    raw.length,
    raw.length_seconds,
  );

  return {
    id,
    status: normalizeStatus(raw),
    title: String(titleCandidate),
    prompt: typeof raw.prompt === "string" ? raw.prompt : raw.metadata?.prompt,
    createdAt: raw.created_at || raw.created || raw.timestamp,
    durationSeconds: durationSeconds,
    url: extractUrl(raw),
    thumbnailUrl: extractThumbnail(raw),
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

export const getVideos = async (): Promise<SoraVideo[]> => {
  const response = await axiosPrivate.get<any>("/v1/videos");
  const items = extractVideoItems(response.data);
  return items.map((item) => normalizeVideo(item));
};

export const createVideo = async ({ prompt, file }: CreateVideoInput): Promise<SoraVideo> => {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt is required to generate a video.");
  }

  let response;
  if (file) {
    const formData = new FormData();
    formData.append("prompt", prompt.trim());
    formData.append("file", file);
    response = await axiosPrivate.post<any>("/v1/videos", formData);
  } else {
    response = await axiosPrivate.post<any>("/v1/videos", { prompt: prompt.trim() });
  }

  const payload = response.data;
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
  await axiosPrivate.delete(`/v1/videos/${id}`);
};
