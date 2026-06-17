/**
 * BD Control Tower — Adoption Stats Export API
 * GET /analytics/ping | /analytics/health
 * GET /analytics/users/{email}
 *
 * Register API URL in Main CT: https://<project-ref>.supabase.co/functions/v1/analytics
 * Spec: CONTROL-TOWER-ADOPTION-STATS-EXPORT-API.md v1.0.0
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { validateApiSecret } from "../_shared/externalApiAuth.ts";
import {
  computeBdAdoptionMetrics,
  findProfileByEmail,
  isBdUserManager,
} from "../_shared/bd-adoption-metrics.ts";
import { toAdoptionStatsPayload } from "../_shared/ct-adoption-schema.ts";

const SERVICE_NAME = "bd-control-tower-analytics";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function badRequest(message: string) {
  return jsonResponse({ error: "bad_request", message }, 400);
}

function notFound(message: string) {
  return jsonResponse({ error: "not_found", message }, 404);
}

function unauthorized(message: string) {
  return jsonResponse({ error: "unauthorized", message }, 401);
}

function isLikelyEmail(value: string): boolean {
  return value.includes("@");
}

function routeSegmentsForFunction(url: URL, functionName: string): string[] {
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.lastIndexOf(functionName);
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed", message: "GET only" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const route = routeSegmentsForFunction(url, "analytics");

    // GET /analytics, /analytics/ping, /analytics/health
    if (route.length === 0 || route[0] === "ping" || route[0] === "health") {
      await validateApiSecret(req, supabase);
      return jsonResponse({ ok: true, service: SERVICE_NAME }, 200);
    }

    await validateApiSecret(req, supabase);

    // GET /analytics/users/:email
    if (route[0] === "users") {
      const rawEmail = route[1];
      if (!rawEmail) {
        return badRequest("Missing user email in path. Expected /analytics/users/:email");
      }

      const email = decodeURIComponent(rawEmail).trim().toLowerCase();
      if (!email || !isLikelyEmail(email)) {
        return badRequest("Invalid email in path.");
      }

      const profile = await findProfileByEmail(supabase, email);
      if (!profile) {
        return notFound("User not found");
      }

      const isManager = await isBdUserManager(supabase, profile.id);
      const metrics = await computeBdAdoptionMetrics(supabase, profile, { email, isManager });
      const payload = toAdoptionStatsPayload(metrics);

      if (!payload) {
        return jsonResponse(
          {
            lastActiveAt: profile.created_at ?? new Date().toISOString(),
            summary: metrics.summary,
            details: metrics.details,
          },
          200,
        );
      }

      return jsonResponse(payload, 200);
    }

    return jsonResponse({ error: "not_found", message: "Route not found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";

    if (message.includes("Missing API key")) {
      return unauthorized("Missing Authorization: Bearer <apiKey>");
    }
    if (message.includes("Invalid API key")) {
      return unauthorized("Invalid API key");
    }

    console.error("[analytics] Error:", error);
    return jsonResponse({ error: "server_error", message }, 500);
  }
});
