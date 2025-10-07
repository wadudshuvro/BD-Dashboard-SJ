// Gemini Veo Manager v3.0 - Database persistence
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

console.log("GEMINI_API_KEY loaded:", GEMINI_API_KEY ? "✓ Present" : "✗ Missing");
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "veo-3.0-generate-001";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CreateVideoRequest {
  operation: "create";
  prompt: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface ListVideosRequest {
  operation: "list";
}

interface GetVideoRequest {
  operation: "retrieve";
  id: string;
}

interface DeleteVideoRequest {
  operation: "delete";
  id: string;
}

interface DownloadVideoRequest {
  operation: "content";
  id: string;
}

interface RemixVideoRequest {
  operation: "remix";
  id: string;
  prompt: string;
}

type RequestBody =
  | CreateVideoRequest
  | ListVideosRequest
  | GetVideoRequest
  | DeleteVideoRequest
  | DownloadVideoRequest
  | RemixVideoRequest;

async function pollOperation(operationName: string): Promise<any> {
  const maxAttempts = 60; // 10 minutes max (60 * 10 seconds)
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`${BASE_URL}/${operationName}`, {
      headers: {
        "x-goog-api-key": GEMINI_API_KEY!,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error polling operation:", error);
      throw new Error(`Failed to poll operation: ${error}`);
    }

    const operation = await response.json();
    
    if (operation.done) {
      return operation;
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
  }

  throw new Error("Video generation timeout");
}

async function createVideo(
  prompt: string,
  userId: string,
  duration?: number,
  metadata?: Record<string, unknown>
): Promise<any> {
  console.log("Creating video with prompt:", prompt);

  const response = await fetch(`${BASE_URL}/models/${MODEL}:predictLongRunning`, {
    method: "POST",
    headers: {
      "x-goog-api-key": GEMINI_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [
        {
          prompt: prompt,
          // Note: duration parameter is not supported by veo-3.0-generate-001
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Error creating video:", error);
    throw new Error(`Failed to create video: ${error}`);
  }

  const result = await response.json();
  const operationName = result.name;
  
  // Store operation in database
  const videoId = operationName.split("/").pop() || operationName;
  
  const { error: dbError } = await supabase
    .from("gemini_videos")
    .insert({
      id: videoId,
      operation_name: operationName,
      prompt,
      duration,
      status: "processing",
      metadata: metadata || {},
      user_id: userId,
    });

  if (dbError) {
    console.error("Error storing video in database:", dbError);
    throw new Error(`Failed to store video: ${dbError.message}`);
  }

  console.log("Video creation started, operation name:", operationName);

  return {
    id: videoId,
    operationName,
    prompt,
    duration,
    status: "processing",
    createdAt: new Date().toISOString(),
    metadata: metadata || {},
  };
}

async function getVideo(id: string): Promise<any> {
  // Get video from database
  const { data: videoData, error: dbError } = await supabase
    .from("gemini_videos")
    .select("*")
    .eq("id", id)
    .single();
  
  if (dbError || !videoData) {
    throw new Error("Video not found");
  }

  // Check if video is still processing
  if (videoData.status === "processing") {
    const response = await fetch(`${BASE_URL}/${videoData.operation_name}`, {
      headers: {
        "x-goog-api-key": GEMINI_API_KEY!,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error getting video status:", error);
      throw new Error(`Failed to get video: ${error}`);
    }

    const operation = await response.json();
    
    if (operation.done) {
      const videoUri = operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      
      // Update database
      await supabase
        .from("gemini_videos")
        .update({
          status: "completed",
          video_url: videoUri,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);
      
      videoData.status = "completed";
      videoData.video_url = videoUri;
      videoData.completed_at = new Date().toISOString();
    } else if (operation.error) {
      // Update database
      await supabase
        .from("gemini_videos")
        .update({
          status: "failed",
          error: operation.error,
        })
        .eq("id", id);
      
      videoData.status = "failed";
      videoData.error = operation.error;
    }
  }

  return videoData;
}

async function listVideos(userId: string): Promise<any[]> {
  // Get all videos for user from database
  const { data: videos, error: dbError } = await supabase
    .from("gemini_videos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (dbError) {
    console.error("Error listing videos:", dbError);
    throw new Error(`Failed to list videos: ${dbError.message}`);
  }
  
  // Update status for all processing videos
  const updatePromises = (videos || [])
    .filter((v) => v.status === "processing")
    .map((v) => getVideo(v.id).catch(() => v));
  
  await Promise.all(updatePromises);
  
  // Fetch updated videos
  const { data: updatedVideos } = await supabase
    .from("gemini_videos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  return updatedVideos || [];
}

async function deleteVideo(id: string): Promise<void> {
  // Delete from database
  const { error: dbError } = await supabase
    .from("gemini_videos")
    .delete()
    .eq("id", id);
  
  if (dbError) {
    console.error("Error deleting video:", dbError);
    throw new Error(`Failed to delete video: ${dbError.message}`);
  }
  
  console.log("Video deleted:", id);
}

async function downloadVideo(id: string): Promise<Response> {
  const videoData = await getVideo(id);
  
  if (videoData.status !== "completed" || !videoData.video_url) {
    throw new Error("Video is not ready for download");
  }

  const response = await fetch(videoData.video_url, {
    headers: {
      "x-goog-api-key": GEMINI_API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to download video");
  }

  return response;
}

async function remixVideo(id: string, newPrompt: string, userId: string): Promise<any> {
  const originalVideo = await getVideo(id);
  
  if (!originalVideo) {
    throw new Error("Original video not found");
  }

  // Create a new video with the new prompt, using the original duration
  return createVideo(newPrompt, userId, originalVideo.duration, {
    ...originalVideo.metadata,
    remixedFrom: id,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Get user ID from authorization header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: RequestBody = await req.json();
    const { operation } = body;

    console.log("Operation:", operation);

    switch (operation) {
      case "create": {
        const { prompt, duration, metadata } = body as CreateVideoRequest;
        const result = await createVideo(prompt, userId, duration, metadata);
        return new Response(JSON.stringify({ video: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        const videos = await listVideos(userId);
        return new Response(JSON.stringify({ videos }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "retrieve": {
        const { id } = body as GetVideoRequest;
        const video = await getVideo(id);
        return new Response(JSON.stringify({ video }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { id } = body as DeleteVideoRequest;
        await deleteVideo(id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "content": {
        const { id } = body as DownloadVideoRequest;
        const videoResponse = await downloadVideo(id);
        const blob = await videoResponse.blob();
        
        return new Response(blob, {
          headers: {
            ...corsHeaders,
            "Content-Type": "video/mp4",
            "Content-Disposition": `attachment; filename="video-${id}.mp4"`,
          },
        });
      }

      case "remix": {
        const { id, prompt } = body as RemixVideoRequest;
        const result = await remixVideo(id, prompt, userId);
        return new Response(JSON.stringify({ video: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error("Error in gemini-veo-manager:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
