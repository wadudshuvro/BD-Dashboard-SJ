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

    const { operation, prompt, file, videoId } = await req.json();
    console.log('Sora video operation:', operation);

    let response;
    const openAIHeaders = {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    };

    switch (operation) {
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
          formData.append('file', file);
          
          response = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
            },
            body: formData,
          });
        } else {
          response = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: openAIHeaders,
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

    const data = operation === 'delete' ? {} : await response.json();
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
