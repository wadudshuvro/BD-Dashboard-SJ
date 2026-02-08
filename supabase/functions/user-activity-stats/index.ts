import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface ActivityRow {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "30d";
    const recentLimit = Number(url.searchParams.get("recentLimit") || 20);
    const userIdFilter = url.searchParams.get("userId");
    const includeAllUsers = url.searchParams.get("includeAllUsers") === "true";

    const endDate = new Date();
    const periodStart = new Date(endDate);

    switch (period) {
      case "7d":
        periodStart.setDate(periodStart.getDate() - 7);
        break;
      case "30d":
        periodStart.setDate(periodStart.getDate() - 30);
        break;
      case "90d":
        periodStart.setDate(periodStart.getDate() - 90);
        break;
      default:
        periodStart.setDate(periodStart.getDate() - 30);
    }

    const oneDayStart = new Date(endDate);
    oneDayStart.setDate(oneDayStart.getDate() - 1);

    const sevenDayStart = new Date(endDate);
    sevenDayStart.setDate(sevenDayStart.getDate() - 7);

    const thirtyDayStart = new Date(endDate);
    thirtyDayStart.setDate(thirtyDayStart.getDate() - 30);

    let activityQuery = supabase
      .from("user_activity_log")
      .select("id, user_id, action, resource_type, resource_id, metadata, created_at")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (userIdFilter) {
      activityQuery = activityQuery.eq("user_id", userIdFilter);
    }

    const { data: activityLogs, error: activityError } = await activityQuery;

    if (activityError) {
      throw activityError;
    }

    const logs = (activityLogs || []) as ActivityRow[];

    const activityBreakdown: Record<string, number> = {};
    const userStats = new Map<
      string,
      { activityCount: number; loginCount: number; lastActivityAt: string }
    >();
    const activeUsers1d = new Set<string>();
    const activeUsers7d = new Set<string>();
    const activeUsers30d = new Set<string>();

    for (const log of logs) {
      const createdAt = new Date(log.created_at);
      const userStat = userStats.get(log.user_id) || {
        activityCount: 0,
        loginCount: 0,
        lastActivityAt: log.created_at,
      };

      userStat.activityCount += 1;
      if (log.action === "login") {
        userStat.loginCount += 1;
      }
      if (createdAt > new Date(userStat.lastActivityAt)) {
        userStat.lastActivityAt = log.created_at;
      }
      userStats.set(log.user_id, userStat);

      activityBreakdown[log.action] = (activityBreakdown[log.action] || 0) + 1;

      if (createdAt >= oneDayStart) activeUsers1d.add(log.user_id);
      if (createdAt >= sevenDayStart) activeUsers7d.add(log.user_id);
      if (createdAt >= thirtyDayStart) activeUsers30d.add(log.user_id);
    }

    const userIds = Array.from(userStats.keys());
    let profileMap = new Map<string, ProfileRow>();
    if (includeAllUsers) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profileError) {
        throw profileError;
      }

      profileMap = new Map((profiles || []).map((profile: ProfileRow) => [profile.id, profile]));
    } else if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profileError) {
        throw profileError;
      }

      profileMap = new Map((profiles || []).map((profile: ProfileRow) => [profile.id, profile]));
    }

    const leaderboard = Array.from(userStats.entries())
      .map(([userId, stats]) => {
        const profile = profileMap.get(userId);
        return {
          userId,
          userName: profile?.full_name || profile?.email || "Unknown User",
          activityCount: stats.activityCount,
          loginCount: stats.loginCount,
          lastActivityAt: stats.lastActivityAt,
        };
      })
      .sort((a, b) => b.activityCount - a.activityCount || b.loginCount - a.loginCount)
      .slice(0, 10);

    const teamMembers = includeAllUsers
      ? Array.from(profileMap.entries()).map(([profileId, profile]) => {
          const stats = userStats.get(profileId);
          return {
            userId: profileId,
            userName: profile?.full_name || profile?.email || "Unknown User",
            activityCount: stats?.activityCount || 0,
            loginCount: stats?.loginCount || 0,
            lastActivityAt: stats?.lastActivityAt || null,
          };
        })
      : undefined;

    const recentActivity = logs.slice(0, recentLimit).map((log) => {
      const profile = profileMap.get(log.user_id);
      return {
        id: log.id,
        userId: log.user_id,
        userName: profile?.full_name || profile?.email || "Unknown User",
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        createdAt: log.created_at,
      };
    });

    const member = userIdFilter ? profileMap.get(userIdFilter) || null : null;
    const response = {
      summary: {
        activeUsers: {
          day: activeUsers1d.size,
          week: activeUsers7d.size,
          month: activeUsers30d.size,
        },
        totalEvents: logs.length,
        totalLogins: activityBreakdown.login || 0,
        periodStart: periodStart.toISOString(),
        periodEnd: endDate.toISOString(),
      },
      activityBreakdown,
      leaderboard,
      recentActivity,
      member,
      teamMembers,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[user-activity-stats] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
