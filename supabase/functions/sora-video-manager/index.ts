import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { operation, prompt, file, videoId, idea } = await req.json();
    console.log('Sora video operation:', operation);

    let response;
    const baseHeaders = {
      'Authorization': `Bearer ${openAIApiKey}`,
      'OpenAI-Beta': 'video-generation=2024-12-17',
    };
    const jsonHeaders = {
      ...baseHeaders,
      'Content-Type': 'application/json',
    };

    switch (operation) {
      case 'enhance':
        console.log('Enhancing video idea:', idea);
        if (!idea || !idea.trim()) {
          throw new Error('Idea is required to enhance the prompt');
        }
        
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: jsonHeaders,
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
          headers: jsonHeaders,
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
          formData.append('file', file);
          
          response = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: baseHeaders,
            body: formData,
          });
        } else {
          response = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ prompt: prompt.trim() }),
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
          headers: jsonHeaders,
        });
        break;

      case 'retrieve':
        console.log('Retrieving video:', videoId);
        if (!videoId) {
          throw new Error('Video ID is required to retrieve a video');
        }
        response = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
          method: 'GET',
          headers: jsonHeaders,
        });
        break;

      case 'thumbnail':
        console.log('Fetching thumbnail for video:', videoId);
        if (!videoId) {
          throw new Error('Video ID is required to fetch a thumbnail');
        }
        response = await fetch(`https://api.openai.com/v1/videos/${videoId}/content?variant=thumbnail`, {
          method: 'GET',
          headers: baseHeaders,
        });
        break;

      case 'content':
        console.log('Downloading content for video:', videoId);
        if (!videoId) {
          throw new Error('Video ID is required to download video content');
        }
        response = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
          method: 'GET',
          headers: baseHeaders,
        });
        break;

      case 'remix':
        console.log('Remixing video:', videoId);
        if (!videoId) {
          throw new Error('Video ID is required to remix a video');
        }
        if (!prompt || !prompt.trim()) {
          throw new Error('Prompt is required to remix a video');
        }
        response = await fetch(`https://api.openai.com/v1/videos/${videoId}/remix`, {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ prompt: prompt.trim() }),
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
    } else if (operation === 'thumbnail' || operation === 'content') {
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Data = btoa(binary);
      data = {
        base64Data,
        contentType: response.headers.get('content-type') ?? undefined,
      };
    } else {
      data = await response.json();
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
