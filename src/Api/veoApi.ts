import { z } from "zod";

export type GeminiVideoStatus = "queued" | "in_progress" | "ready" | "failed";

export interface GeminiVideo {
  id: string;
  prompt: string;
  duration: number;
  thumbnail_url?: string;
  video_url?: string;
  status: GeminiVideoStatus;
  cost?: number;
  created_at?: string;
  updated_at?: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateGeminiVideoInput {
  prompt: string;
  duration: number;
  inputReference?: File | null;
  metadata?: Record<string, unknown>;
}

const API_BASE_PATH = "/api/video-veo";

const numberSchema = z
  .preprocess((value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }, z.number().optional());

const statusSchema = z
  .string()
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .enum(["queued", "processing", "in_progress", "running", "pending", "ready", "succeeded", "completed", "failed", "error"])
      .transform((status) => {
        switch (status) {
          case "ready":
          case "succeeded":
          case "completed":
            return "ready" as const;
          case "failed":
          case "error":
            return "failed" as const;
          case "processing":
          case "running":
          case "in_progress":
          case "pending":
            return "in_progress" as const;
          case "queued":
          default:
            return "queued" as const;
        }
      })
  );

const videoSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    video_id: z.union([z.string(), z.number()]).optional(),
    prompt: z.string().optional(),
    description: z.string().optional(),
    duration: numberSchema.optional(),
    duration_seconds: numberSchema.optional(),
    durationSeconds: numberSchema.optional(),
    thumbnail_url: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    video_url: z.string().optional(),
    url: z.string().optional(),
    download_url: z.string().optional(),
    status: z.string().optional(),
    state: z.string().optional(),
    cost: numberSchema.optional(),
    cost_usd: numberSchema.optional(),
    costUsd: numberSchema.optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
    updated_at: z.string().optional(),
    updatedAt: z.string().optional(),
    title: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })
  .transform((value) => {
    const idSource = value.id ?? value.video_id;
    const normalizedId = typeof idSource === "number" ? idSource.toString() : (idSource ?? "").toString();

    const parsedDuration =
      numberSchema.parse(value.duration) ??
      numberSchema.parse(value.duration_seconds) ??
      numberSchema.parse(value.durationSeconds) ??
      0;

    const statusInput = value.status ?? value.state ?? "queued";

    return {
      id: normalizedId,
      prompt: value.prompt ?? value.description ?? "",
      duration: parsedDuration,
      thumbnail_url: value.thumbnail_url ?? value.thumbnailUrl,
      video_url: value.video_url ?? value.download_url ?? value.url,
      status: statusSchema.parse(statusInput),
      cost: numberSchema.parse(value.cost) ?? numberSchema.parse(value.cost_usd) ?? numberSchema.parse(value.costUsd),
      created_at: value.created_at ?? value.createdAt,
      updated_at: value.updated_at ?? value.updatedAt,
      title: value.title,
      metadata: value.metadata,
    } satisfies GeminiVideo;
  });

const videosSchema = z
  .array(videoSchema)
  .transform((videos) => videos.filter((video) => video.id));

const extractVideos = (payload: unknown): GeminiVideo[] => {
  try {
    if (Array.isArray(payload)) {
      return videosSchema.parse(payload);
    }

    if (payload && typeof payload === "object") {
      const candidateArrays = [
        (payload as Record<string, unknown>).videos,
        (payload as Record<string, unknown>).data,
        (payload as Record<string, unknown>).items,
      ].filter(Boolean);

      for (const candidate of candidateArrays) {
        try {
          return videosSchema.parse(candidate);
        } catch (error) {
          continue;
        }
      }

      return videosSchema.parse([payload]);
    }
  } catch (error) {
    console.error("Failed to normalize Gemini Veo videos", error);
  }

  return [];
};

const extractVideo = (payload: unknown): GeminiVideo => {
  try {
    return videoSchema.parse(payload);
  } catch (error) {
    console.error("Failed to normalize Gemini Veo video", error);
    throw new Error("Invalid Gemini Veo video response");
  }
};

const unwrapVideoPayload = (payload: unknown): unknown => {
  if (payload && typeof payload === "object" && "video" in payload) {
    const candidate = (payload as { video?: unknown }).video;
    if (candidate !== undefined && candidate !== null) {
      return candidate;
    }
  }
  return payload;
};

export const listGeminiVideos = async (): Promise<GeminiVideo[]> => {
  const response = await fetch(`${API_BASE_PATH}/list`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to load Gemini Veo videos");
  }

  const payload = await response.json().catch(() => []);
  return extractVideos(payload);
};

export const getGeminiVideo = async (id: string): Promise<GeminiVideo> => {
  if (!id) {
    throw new Error("Video ID is required");
  }

  const response = await fetch(`${API_BASE_PATH}/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve Gemini Veo video");
  }

  const payload = await response.json().catch(() => ({}));
  return extractVideo(payload);
};

export const createGeminiVideo = async ({
  prompt,
  duration,
  inputReference,
  metadata,
}: CreateGeminiVideoInput): Promise<GeminiVideo> => {
  if (!prompt.trim()) {
    throw new Error("Prompt is required to create a video");
  }

  if (!Number.isFinite(duration) || duration < 1 || duration > 20) {
    throw new Error("Duration must be between 1 and 20 seconds");
  }

  const formData = new FormData();
  formData.append("prompt", prompt.trim());
  formData.append("duration", duration.toString());
  formData.append("size", "1280x720");

  if (inputReference) {
    formData.append("input_reference", inputReference);
  }

  if (metadata) {
    formData.append("metadata", JSON.stringify(metadata));
  }

  const response = await fetch(`${API_BASE_PATH}/create`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Unable to create Gemini Veo video");
    throw new Error(message || "Unable to create Gemini Veo video");
  }

  const payload = await response.json().catch(() => ({}));
  return extractVideo(unwrapVideoPayload(payload));
};

export const deleteGeminiVideo = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_PATH}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to delete Gemini Veo video");
  }
};

export const downloadGeminiVideo = async (
  id: string,
): Promise<{ blob: Blob; filename: string; contentType: string }> => {
  const response = await fetch(`${API_BASE_PATH}/${encodeURIComponent(id)}/download`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to download Gemini Veo video");
  }

  const contentType = response.headers.get("content-type") ?? "video/mp4";
  const disposition = response.headers.get("content-disposition");
  let filename = `${id}.mp4`;

  if (disposition) {
    const match = disposition.match(/filename\*?=([^;]+)/i);
    if (match?.[1]) {
      filename = decodeURIComponent(match[1].replace(/"/g, "").trim());
    }
  }

  const blob = await response.blob();
  return { blob, filename, contentType };
};

export const remixGeminiVideo = async (id: string, prompt: string): Promise<GeminiVideo> => {
  if (!prompt.trim()) {
    throw new Error("Prompt is required for remixing");
  }

  const response = await fetch(`${API_BASE_PATH}/${encodeURIComponent(id)}/remix`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: prompt.trim() }),
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Unable to remix Gemini Veo video");
    throw new Error(message || "Unable to remix Gemini Veo video");
  }

  const payload = await response.json().catch(() => ({}));
  return extractVideo(unwrapVideoPayload(payload));
};

export const getGeminiStatusLabel = (status: GeminiVideoStatus): string => {
  switch (status) {
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    case "in_progress":
      return "Processing";
    case "queued":
    default:
      return "Queued";
  }
};

export const isGeminiVideoProcessing = (status: GeminiVideoStatus): boolean => {
  return status === "queued" || status === "in_progress";
};
