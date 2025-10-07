import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sanitizeMetadata = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(([_, entryValue]) => {
    if (typeof entryValue === 'string') {
      return entryValue.trim().length > 0;
    }
    return entryValue !== undefined && entryValue !== null;
  });

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
};

const setStringIfMissing = (object: Record<string, unknown>, key: string, value?: string) => {
  if (!value) {
    return;
  }
  const existing = object[key];
  if (typeof existing !== 'string' || existing.trim().length === 0) {
    object[key] = value;
  }
};

const attachSupplementalMetadata = (
  payload: unknown,
  metadata: Record<string, unknown> | undefined,
  fallbackTitle?: string,
  fallbackModel?: string,
) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const target = payload as Record<string, unknown>;

  setStringIfMissing(target, 'title', fallbackTitle);
  setStringIfMissing(target, 'model', fallbackModel);

  if (metadata) {
    const metadataRecord = metadata as Record<string, unknown>;
    const existingMetadata =
      typeof target.metadata === 'object' && target.metadata !== null ? target.metadata as Record<string, unknown> : {};
    const mergedMetadata: Record<string, unknown> = { ...metadataRecord, ...existingMetadata };

    setStringIfMissing(mergedMetadata, 'title', fallbackTitle);

    const brandId = typeof metadataRecord['brand_id'] === 'string' ? metadataRecord['brand_id'] : undefined;
    const brandName = typeof metadataRecord['brand_name'] === 'string' ? metadataRecord['brand_name'] : undefined;
    const brandSlug = typeof metadataRecord['brand_slug'] === 'string' ? metadataRecord['brand_slug'] : undefined;

    setStringIfMissing(target, 'brand_id', brandId);
    setStringIfMissing(target, 'brand_name', brandName);
    setStringIfMissing(target, 'brand_slug', brandSlug);

    target.metadata = mergedMetadata;
  }

  return target;
};

const propagateMetadata = (
  payload: unknown,
  metadata: Record<string, unknown> | undefined,
  fallbackTitle?: string,
  fallbackModel?: string,
) => {
  if (!payload) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => attachSupplementalMetadata(item, metadata, fallbackTitle, fallbackModel));
  }

  if (typeof payload === 'object' && payload !== null && Array.isArray((payload as { data?: unknown }).data)) {
    const container = payload as { data: unknown[] } & Record<string, unknown>;
    container.data = container.data.map((item) =>
      attachSupplementalMetadata(item, metadata, fallbackTitle, fallbackModel)
    );
    return container;
  }

  return attachSupplementalMetadata(payload, metadata, fallbackTitle, fallbackModel);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_KEY not configured');
    }

    const { operation, prompt, file, videoId, idea, model, metadata, title } = await req.json();
    console.log('Sora video operation:', operation);

    let response;
    const openAIHeaders = {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'video-generation=2024-12-17',
    };

    const trimmedModel = typeof model === 'string' && model.trim().length > 0 ? model.trim() : undefined;
    const sanitizedMetadata = sanitizeMetadata(metadata);
    const trimmedTitle = typeof title === 'string' && title.trim().length > 0 ? title.trim() : undefined;

    switch (operation) {
      case 'enhance':
        console.log('Enhancing video idea:', idea);
        if (!idea || !idea.trim()) {
          throw new Error('Idea is required to enhance the prompt');
        }
        
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: openAIHeaders,
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a marketing video prompt generator for OpenAI Sora 2. Transform short marketing ideas into detailed cinematic prompts that describe visuals, camera style, lighting, and tone in 1-2 sentences.',
              },
              { role: 'user', content: idea.trim() },
            ],
          }),
        });
        break;
      case 'list':
        console.log('Fetching video list from OpenAI');
        response = await fetch('https://api.openai.com/v1/videos', {
          method: 'GET',
          headers: openAIHeaders,
        });
        break;

      case 'create':
        console.log('Creating video with prompt:', prompt);
        if (!prompt || !prompt.trim()) {
          throw new Error('Prompt is required to generate a video');
        }

        if (file) {
          // If file is provided, we need to handle multipart/form-data
          const formData = new FormData();
          formData.append('prompt', prompt.trim());
          if (trimmedModel) {
            formData.append('model', trimmedModel);
          }
          if (trimmedTitle) {
            formData.append('title', trimmedTitle);
          }
          if (sanitizedMetadata) {
            formData.append('metadata', JSON.stringify(sanitizedMetadata));
          }
          formData.append('file', file);

          response = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'OpenAI-Beta': 'video-generation=2024-12-17',
            },
            body: formData,
          });
        } else {
          const requestBody: Record<string, unknown> = {
            prompt: prompt.trim(),
          };

          if (trimmedModel) {
            requestBody.model = trimmedModel;
          }

          if (trimmedTitle) {
            requestBody.title = trimmedTitle;
          }

          if (sanitizedMetadata) {
            requestBody.metadata = sanitizedMetadata;
          }

          response = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: openAIHeaders,
            body: JSON.stringify(requestBody),
          });
        }
        break;

      case 'delete':
        console.log('Deleting video:', videoId);
        if (!videoId) {
          throw new Error('Video ID is required to delete a video');
        }
        response = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
          method: 'DELETE',
          headers: openAIHeaders,
        });
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    let data;
    if (operation === 'delete') {
      data = {};
    } else if (operation === 'enhance') {
      const rawData = await response.json();
      const content = rawData?.choices?.[0]?.message?.content || '';
      data = { enhancedPrompt: content.trim() };
    } else {
      data = await response.json();
      if (operation === 'create') {
        data = propagateMetadata(data, sanitizedMetadata, trimmedTitle, trimmedModel);
      }
    }
    console.log('OpenAI response received successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sora-video-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
