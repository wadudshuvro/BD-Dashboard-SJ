/**
 * BD Control Tower adoption metrics from user_activity_log.
 * Spec: CONTROL-TOWER-ADOPTION-STATS-EXPORT-API.md v1.0.0
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  BD_CONTROL_TOWER_NAME,
  BD_CONTROL_TOWER_VERSION,
  type AdoptionDetails,
  type CtAdoptionMetrics,
  type ModuleUsage,
  type PeriodCounts,
  parseAdoptionMetrics,
} from "./ct-adoption-schema.ts";

interface ActivityRow {
  action: string;
  resource_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  last_login: string | null;
  last_seen: string | null;
  created_at?: string | null;
}

const LOGIN_ACTIONS = new Set(["login"]);
const PAGE_VIEW_ACTIONS = new Set(["page_view"]);
const EXCLUDED_ACTIONS = new Set(["login", "logout", "session_restore", "page_view"]);

const ACTION_MODULE_MAP: Record<string, string> = {
  deal_created: "Business Opportunities",
  deal_updated: "Business Opportunities",
  deal_stage_changed: "Business Opportunities",
  contact_created: "Contacts",
  lead_followup_updated: "BD:Lead Follow-Up",
  campaign_created: "Contacts",
  campaign_updated: "Contacts",
  task_created: "Actions",
  task_completed: "Actions",
  dhs_submitted: "Dashboard",
  dhs_updated: "Dashboard",
  accountability_goal_created: "Dashboard",
  accountability_goal_updated: "Dashboard",
  accountability_activity_created: "Dashboard",
  accountability_update_submitted: "Dashboard",
  ai_agent_run: "CollabAI",
};

const RESOURCE_MODULE_MAP: Record<string, string> = {
  deal: "Business Opportunities",
  contact: "Contacts",
  client: "Clients",
  followup: "BD:Lead Follow-Up",
  task: "Actions",
  campaign: "Contacts",
};

const PATH_MODULE_MAP: Array<{ prefix: string; module: string }> = [
  { prefix: "/deals", module: "Business Opportunities" },
  { prefix: "/bd/pipeline", module: "Business Opportunities" },
  { prefix: "/contacts", module: "Contacts" },
  { prefix: "/clients", module: "Clients" },
  { prefix: "/followups", module: "BD:Lead Follow-Up" },
  { prefix: "/tasks", module: "Actions" },
  { prefix: "/bd/dhs", module: "Dashboard" },
  { prefix: "/bd/accountability", module: "Dashboard" },
  { prefix: "/admin", module: "Dashboard" },
];

const MANAGER_ROLES = new Set(["manager", "admin", "super_admin"]);
const TASK_ACTIONS = new Set(["task_created", "task_completed", "task_updated"]);
const MAX_DETAIL_ITEMS = 50;

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function startOfIsoWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function countByWindow(rows: Array<{ created_at: string }>): PeriodCounts {
  const now = Date.now();
  const counts: PeriodCounts = { d7: 0, d30: 0, d60: 0, d90: 0 };

  for (const row of rows) {
    const ts = Date.parse(row.created_at);
    if (Number.isNaN(ts)) continue;
    const days = (now - ts) / (1000 * 60 * 60 * 24);
    if (days <= 7) counts.d7 += 1;
    if (days <= 30) counts.d30 += 1;
    if (days <= 60) counts.d60 += 1;
    if (days <= 90) counts.d90 += 1;
  }

  return counts;
}

function resolveModule(action: string, resourceType: string | null, metadata: Record<string, unknown> | null): string {
  if (typeof metadata?.module === "string" && metadata.module.trim()) {
    return metadata.module.trim();
  }

  const path = typeof metadata?.path === "string" ? metadata.path : null;
  if (path) {
    for (const entry of PATH_MODULE_MAP) {
      if (path.startsWith(entry.prefix)) return entry.module;
    }
  }

  if (ACTION_MODULE_MAP[action]) return ACTION_MODULE_MAP[action];
  if (resourceType && RESOURCE_MODULE_MAP[resourceType]) return RESOURCE_MODULE_MAP[resourceType];
  return "Dashboard";
}

function isPageViewRow(row: ActivityRow): boolean {
  if (PAGE_VIEW_ACTIONS.has(row.action)) return true;
  return row.metadata?.event_type === "page_view" || row.metadata?.page_view === true;
}

function isActionRow(row: ActivityRow): boolean {
  return !EXCLUDED_ACTIONS.has(row.action);
}

async function fetchUserLogs(supabase: SupabaseClient, userId: string, sinceIso: string): Promise<ActivityRow[]> {
  const rows: ActivityRow[] = [];
  let from = 0;
  const pageSize = 1000;

  for (;;) {
    const { data, error } = await supabase
      .from("user_activity_log")
      .select("action, resource_type, metadata, created_at")
      .eq("user_id", userId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Failed to load user activity logs: ${error.message}`);
    if (!data?.length) break;

    rows.push(...(data as ActivityRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function resolveDepartment(supabase: SupabaseClient, email: string): Promise<string | null> {
  const { data: employee } = await supabase
    .from("employees")
    .select("department")
    .ilike("email", email)
    .eq("is_active", true)
    .maybeSingle();

  if (employee?.department) return employee.department;

  const { data: userRow } = await supabase
    .from("users")
    .select("department")
    .ilike("email", email)
    .maybeSingle();

  return userRow?.department ?? null;
}

export async function isBdUserManager(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", Array.from(MANAGER_ROLES));

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

interface ManagerTaskCompliance {
  weeklyTaskUpdate: boolean;
  lastTaskUpdateAt: string | null;
}

async function computeManagerTaskCompliance(
  supabase: SupabaseClient,
  userId: string,
  activityRows: ActivityRow[],
): Promise<ManagerTaskCompliance> {
  const weekStart = startOfIsoWeek().toISOString();

  const weeklyActivityUpdates = activityRows.filter(
    (row) => row.created_at >= weekStart && TASK_ACTIONS.has(row.action),
  );

  const { data: assignedTasks, error } = await supabase
    .from("project_tasks")
    .select("id, created_at, updated_at, completed_at")
    .eq("assigned_to", userId)
    .or(`created_at.gte."${weekStart}",updated_at.gte."${weekStart}",completed_at.gte."${weekStart}"`);

  if (error) {
    throw new Error(`Failed to load assigned tasks: ${error.message}`);
  }

  const taskTimestamps: string[] = [];
  for (const task of assignedTasks ?? []) {
    if (task.created_at && task.created_at >= weekStart) taskTimestamps.push(task.created_at);
    if (task.updated_at && task.updated_at >= weekStart) taskTimestamps.push(task.updated_at);
    if (task.completed_at && task.completed_at >= weekStart) taskTimestamps.push(task.completed_at);
  }

  for (const row of activityRows) {
    if (TASK_ACTIONS.has(row.action)) taskTimestamps.push(row.created_at);
  }

  const lastTaskUpdateAt = taskTimestamps.length > 0
    ? taskTimestamps.reduce((max, ts) => (ts > max ? ts : max), taskTimestamps[0])
    : null;

  const weeklyTaskUpdate = weeklyActivityUpdates.length > 0 || (assignedTasks?.length ?? 0) > 0;

  return { weeklyTaskUpdate, lastTaskUpdateAt };
}

function buildModuleUsage(rows: ActivityRow[]): ModuleUsage[] {
  const moduleMap = new Map<string, { pageViews: number; actions: number; lastUsedAt: string | null }>();

  for (const row of rows) {
    const moduleName = resolveModule(row.action, row.resource_type, row.metadata);
    const existing = moduleMap.get(moduleName) ?? { pageViews: 0, actions: 0, lastUsedAt: null };

    if (isPageViewRow(row)) existing.pageViews += 1;
    if (isActionRow(row)) existing.actions += 1;

    if ((isPageViewRow(row) || isActionRow(row)) &&
      (!existing.lastUsedAt || row.created_at > existing.lastUsedAt)) {
      existing.lastUsedAt = row.created_at;
    }

    moduleMap.set(moduleName, existing);
  }

  return Array.from(moduleMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .filter((module) => module.pageViews > 0 || module.actions > 0)
    .sort((a, b) => b.pageViews + b.actions - (a.pageViews + a.actions));
}

function buildDetails(rows: ActivityRow[]): AdoptionDetails {
  const recentLogins = rows
    .filter((row) => LOGIN_ACTIONS.has(row.action))
    .map((row) => row.created_at)
    .slice(0, MAX_DETAIL_ITEMS);

  const pageCounts = new Map<string, number>();
  for (const row of rows) {
    if (!isPageViewRow(row)) continue;
    const path = typeof row.metadata?.path === "string" ? row.metadata.path : row.resource_type ?? "unknown";
    pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);
  }

  const topPages = Array.from(pageCounts.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, MAX_DETAIL_ITEMS);

  const actionCounts = new Map<string, number>();
  for (const row of rows) {
    if (!isActionRow(row)) continue;
    actionCounts.set(row.action, (actionCounts.get(row.action) ?? 0) + 1);
  }

  const topActions = Array.from(actionCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_DETAIL_ITEMS);

  return {
    recentLogins,
    topPages,
    topActions,
  };
}

function resolveLastActiveAt(profile: ProfileRow, rows: ActivityRow[]): string | null {
  let lastActiveAt: string | null = profile.last_seen ?? profile.last_login ?? profile.created_at ?? null;

  for (const row of rows) {
    if (!lastActiveAt || row.created_at > lastActiveAt) {
      lastActiveAt = row.created_at;
    }
  }

  return lastActiveAt;
}

export async function computeBdAdoptionMetrics(
  supabase: SupabaseClient,
  profile: ProfileRow,
  options?: { email?: string | null; department?: string | null; isManager?: boolean },
): Promise<CtAdoptionMetrics> {
  const since90 = isoDaysAgo(90);
  const rows = await fetchUserLogs(supabase, profile.id, since90);

  const loginRows = rows.filter((row) => LOGIN_ACTIONS.has(row.action));
  const pageViewRows = rows.filter((row) => isPageViewRow(row));
  const actionRows = rows.filter((row) => isActionRow(row));

  const email = options?.email ?? profile.email;
  const department = options?.department ?? await resolveDepartment(supabase, email);
  const isManager = options?.isManager ?? await isBdUserManager(supabase, profile.id);

  const taskCompliance = isManager
    ? await computeManagerTaskCompliance(supabase, profile.id, rows)
    : null;

  const lastActiveAt = resolveLastActiveAt(profile, rows);

  const payload = {
    lastActiveAt,
    summary: {
      controlTowerName: BD_CONTROL_TOWER_NAME,
      controlTowerVersion: BD_CONTROL_TOWER_VERSION,
      employeeEmail: email,
      department,
      logins: countByWindow(loginRows),
      pageViews: countByWindow(pageViewRows),
      actions: countByWindow(actionRows),
      modules: buildModuleUsage(rows),
      managerCompliance: {
        isManager,
        weeklyTaskUpdate: taskCompliance?.weeklyTaskUpdate ?? null,
        lastTaskUpdateAt: taskCompliance?.lastTaskUpdateAt ?? null,
      },
    },
    details: buildDetails(rows),
  };

  return parseAdoptionMetrics(payload as Record<string, unknown>);
}

export async function findProfileByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, last_login, last_seen, created_at")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return (data as ProfileRow | null) ?? null;
}
