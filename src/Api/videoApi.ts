import { axiosPrivate } from "@/lib/axios";
import { supabase } from "@/integrations/supabase/client";

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
  costUsd?: number;
  userId?: string;
  userName?: string;
  url?: string;
  thumbnailUrl?: string;
  raw?: unknown;
}

export interface CreateVideoInput {
  prompt: string;
  aspectRatio?: string;
  metadata?: Record<string, unknown>;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRecord = (value: unknown): UnknownRecord | null => (isRecord(value) ? value : null);

const getArray = (value: unknown): unknown[] | null => (Array.isArray(value) ? value : null);

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

const pickFromNestedArray = (raw: unknown, key: string): unknown => {
  const record = getRecord(raw);
  if (!record) return undefined;
  const container = record[key];
  if (Array.isArray(container)) {
    return container.find((item) => item);
  }
  return undefined;
};

const extractUrl = (raw: unknown): string | undefined => {
  const record = getRecord(raw);
  const candidates = record
    ? [
        record["url"],
        record["video_url"],
        record["playback_url"],
        record["public_url"],
        record["download_url"],
        record["file_url"],
        record["media_url"],
        record["preview_url"],
      ]
    : [];

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

  const rawArray = getArray(raw);
  if (rawArray) {
    for (const item of rawArray) {
      const candidate = extractUrl(item);
      if (candidate) return candidate;
    }
  }

  return undefined;
};

const extractThumbnail = (raw: unknown): string | undefined => {
  const record = getRecord(raw);
  const candidates = record
    ? [
        record["thumbnail"],
        record["thumbnail_url"],
        record["cover_image"],
        record["cover_image_url"],
        record["preview_image"],
        record["preview_image_url"],
        record["image_url"],
        record["poster"],
        record["poster_url"],
      ]
    : [];

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

const normalizeStatus = (raw: unknown): VideoStatus => {
  const record = getRecord(raw);
  const statusCandidate =
    (record?.["status"] ??
      record?.["state"] ??
      record?.["phase"] ??
      record?.["lifecycle"] ??
      record?.["processing_state"] ??
      record?.["task_state"]) ?? null;

  if (typeof statusCandidate !== "string") {
    return "unknown";
  }

  const normalized = statusCandidate.toLowerCase();
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

const normalizeVideo = (raw: unknown): SoraVideo => {
  const record = getRecord(raw);
  if (!record) {
    return {
      id: "unknown",
      status: "unknown",
      title: "Unknown Video",
      raw,
    };
  }

  const idCandidate = record["id"] ?? record["video_id"] ?? crypto.randomUUID();
  const id = String(idCandidate);

  const metadata = getRecord(record["metadata"]);
  const meta = getRecord(record["meta"]);
  const usage = getRecord(record["usage"]);
  const promptValue = record["prompt"];
  const metadataPrompt = metadata?.["prompt"];

  const titleCandidate =
    (record["title"] as string | undefined) ??
    (record["name"] as string | undefined) ??
    (record["display_name"] as string | undefined) ??
    (metadata?.["title"] as string | undefined) ??
    (typeof promptValue === "string" ? promptValue.slice(0, 60) : undefined) ??
    `Video ${id.slice(0, 8)}`;

  const durationSeconds = asNumber(
    record["duration"],
    record["duration_seconds"],
    metadata?.["duration"],
    meta?.["duration"],
    record["length"],
    record["length_seconds"],
    usage?.["duration"],
    usage?.["duration_seconds"],
  );

  const costRecord = getRecord(record["cost"]);
  const usageCost = getRecord(usage?.["cost"]);
  const costUsd = asNumber(
    record["cost"],
    record["cost_usd"],
    record["total_cost"],
    record["price"],
    metadata?.["cost"],
    metadata?.["cost_usd"],
    meta?.["cost"],
    meta?.["cost_usd"],
    usage?.["cost"],
    usage?.["cost_usd"],
    costRecord?.["amount"],
    costRecord?.["value"],
    costRecord?.["total"],
    costRecord?.["usd"],
    usageCost?.["amount"],
    usageCost?.["value"],
    usageCost?.["total"],
    usageCost?.["usd"],
  );

  const userIdCandidate =
    metadata?.["user_id"] ??
    metadata?.["userId"] ??
    meta?.["user_id"] ??
    meta?.["userId"] ??
    record["user_id"] ??
    record["userId"];

  const userNameCandidate =
    metadata?.["user_name"] ??
    metadata?.["userName"] ??
    meta?.["user_name"] ??
    meta?.["userName"] ??
    record["user_name"] ??
    record["userName"];

  return {
    id,
    status: normalizeStatus(raw),
    title: String(titleCandidate),
    prompt:
      typeof promptValue === "string"
        ? promptValue
        : typeof metadataPrompt === "string"
          ? metadataPrompt
          : undefined,
    createdAt:
      (record["created_at"] as string | undefined) ??
      (record["created"] as string | undefined) ??
      (record["timestamp"] as string | undefined),
    durationSeconds,
    costUsd,
    userId: typeof userIdCandidate === "string" ? userIdCandidate : undefined,
    userName: typeof userNameCandidate === "string" ? userNameCandidate : undefined,
    url: extractUrl(raw),
    thumbnailUrl: extractThumbnail(raw),
    raw,
  };
};

const extractVideoItems = (payload: unknown): unknown[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const record = getRecord(payload);
  if (!record) return [];

  const directCandidates = [
    record["data"],
    record["items"],
    record["videos"],
    record["results"],
    record["records"],
  ];

  for (const candidate of directCandidates) {
    const array = getArray(candidate);
    if (array) return array;
  }

  const dataRecord = getRecord(record["data"]);
  if (dataRecord) {
    const nestedArray = Object.values(dataRecord).find((value) => Array.isArray(value));
    if (Array.isArray(nestedArray)) {
      return nestedArray;
    }
  }

  return [];
};

const extractResponseText = (payload: unknown): string => {
  if (!payload) return "";

  if (typeof payload === "string") {
    return payload;
  }

  const record = getRecord(payload);
  const outputText = record?.["output_text"];
  if (typeof outputText === "string") {
    return outputText;
  }
  if (Array.isArray(outputText)) {
    return outputText.join("\n");
  }

  const choices = getArray(record?.["choices"]);
  if (choices && choices.length > 0) {
    const choice = getRecord(choices[0]);
    const message = getRecord(choice?.["message"]);
    if (message) {
      const content = message["content"];
      if (typeof content === "string") {
        return content;
      }
      const contentArray = getArray(content);
      if (contentArray) {
        return contentArray
          .map((part) => {
            if (typeof part === "string") return part;
            const partRecord = getRecord(part);
            if (!partRecord) return "";
            if (typeof partRecord["text"] === "string") return partRecord["text"] as string;
            if (typeof partRecord["value"] === "string") return partRecord["value"] as string;
            return "";
          })
          .filter(Boolean)
          .join("\n");
      }
    }
  }

  const outputArray = getArray(record?.["output"]);
  if (outputArray) {
    return outputArray
      .map((item) => {
        if (typeof item === "string") return item;
        const itemRecord = getRecord(item);
        if (!itemRecord) return "";
        if (typeof itemRecord["content"] === "string") return itemRecord["content"] as string;
        if (typeof itemRecord["text"] === "string") return itemRecord["text"] as string;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

export const getVideos = async (): Promise<SoraVideo[]> => {
  const { data } = await axiosPrivate.get<unknown>("/v1/videos");
  const items = extractVideoItems(data);
  return items.map((item) => normalizeVideo(item));
};

export const getVideoById = async (id: string): Promise<SoraVideo> => {
  if (!id) {
    throw new Error("Video ID is required to check status.");
  }

  const { data } = await axiosPrivate.get<unknown>(`/v1/videos/${id}`);
  const record = getRecord(data);
  if (record?.["data"]) {
    return normalizeVideo(record["data"]);
  }
  return normalizeVideo(data);
};

export const createVideo = async ({ prompt, aspectRatio = "16:9", metadata }: CreateVideoInput): Promise<SoraVideo> => {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt is required to generate a video.");
  }

  const payload = {
    model: "gpt-4o-mini-tts",
    prompt: prompt.trim(),
    aspect_ratio: aspectRatio,
    ...(metadata ? { metadata } : {}),
  };

  const { data } = await axiosPrivate.post<unknown>("/v1/videos", payload);
  const record = getRecord(data);

  const arrayData = getArray(record?.["data"]);
  if (arrayData && arrayData.length > 0) {
    return normalizeVideo(arrayData[0]);
  }

  if (record?.["data"]) {
    return normalizeVideo(record["data"]);
  }
  return normalizeVideo(data);
};

export const deleteVideo = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error("Video ID is required to delete a video.");
  }

  await axiosPrivate.delete(`/v1/videos/${id}`);
};

export const enhanceVideoIdea = async (idea: string): Promise<string> => {
  if (!idea || !idea.trim()) {
    throw new Error("An idea is required to enhance the prompt.");
  }

  const { data, error } = await supabase.functions.invoke('sora-video-manager', {
    body: { operation: 'enhance', idea: idea.trim() }
  });

  if (error) throw error;
  return data?.enhancedPrompt || '';
};
