/**
 * Control Tower Adoption Stats Export API — shared schema (spec v1.0.0)
 * @see docs/05-integrations/control-tower/CONTROL-TOWER-ADOPTION-STATS-EXPORT-API.md
 */

export interface PeriodCounts {
  d7: number;
  d30: number;
  d60: number;
  d90: number;
}

export interface ModuleUsage {
  name: string;
  pageViews: number;
  actions: number;
  lastUsedAt?: string | null;
}

export interface ManagerCompliance {
  isManager: boolean;
  weeklyTaskUpdate: boolean | null;
  lastTaskUpdateAt?: string | null;
}

export interface AdoptionSummary {
  controlTowerName?: string | null;
  controlTowerVersion?: string | null;
  employeeEmail?: string | null;
  department?: string | null;
  logins: PeriodCounts;
  pageViews: PeriodCounts;
  actions: PeriodCounts;
  modules: ModuleUsage[];
  managerCompliance: ManagerCompliance;
}

export interface AdoptionDetails {
  recentLogins?: string[];
  topPages?: Array<{ path: string; views: number }>;
  topActions?: Array<{ name: string; count: number }>;
  github?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AdoptionStatsPayload {
  lastActiveAt: string;
  summary: AdoptionSummary;
  details?: AdoptionDetails | null;
}

export interface CtAdoptionMetrics {
  lastActiveAt: string | null;
  summary: AdoptionSummary;
  details: AdoptionDetails | null;
  partial: boolean;
}

export const BD_CONTROL_TOWER_NAME = "BD Control Tower";
export const BD_CONTROL_TOWER_VERSION = "1.0.0";

export const EMPTY_PERIOD_COUNTS: PeriodCounts = { d7: 0, d30: 0, d60: 0, d90: 0 };

export const EMPTY_MANAGER_COMPLIANCE: ManagerCompliance = {
  isManager: false,
  weeklyTaskUpdate: null,
  lastTaskUpdateAt: null,
};

export function emptyAdoptionMetrics(): CtAdoptionMetrics {
  return {
    lastActiveAt: null,
    summary: {
      logins: { ...EMPTY_PERIOD_COUNTS },
      pageViews: { ...EMPTY_PERIOD_COUNTS },
      actions: { ...EMPTY_PERIOD_COUNTS },
      modules: [],
      managerCompliance: { ...EMPTY_MANAGER_COMPLIANCE },
    },
    details: null,
    partial: true,
  };
}

function readNonNegInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return Math.floor(value);
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return 0;
}

function parsePeriodCounts(
  obj: Record<string, unknown> | null | undefined,
  flatPrefix: string,
  parent: Record<string, unknown>,
): PeriodCounts {
  const source = obj && typeof obj === "object" ? obj : parent;
  return {
    d7: readNonNegInt(source.d7 ?? source[`${flatPrefix}_7d`] ?? source[`${flatPrefix}7d`]),
    d30: readNonNegInt(source.d30 ?? source[`${flatPrefix}_30d`] ?? source[`${flatPrefix}30d`]),
    d60: readNonNegInt(source.d60 ?? source[`${flatPrefix}_60d`] ?? source[`${flatPrefix}60d`]),
    d90: readNonNegInt(source.d90 ?? source[`${flatPrefix}_90d`] ?? source[`${flatPrefix}90d`]),
  };
}

function parseModules(raw: unknown): ModuleUsage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && typeof m === "object")
    .map((m) => {
      const row = m as Record<string, unknown>;
      return {
        name: typeof row.name === "string" ? row.name : "Unknown",
        pageViews: readNonNegInt(row.pageViews ?? row.page_views),
        actions: readNonNegInt(row.actions),
        lastUsedAt:
          typeof row.lastUsedAt === "string" ? row.lastUsedAt :
          typeof row.last_used_at === "string" ? row.last_used_at :
          null,
      };
    });
}

function parseManagerCompliance(raw: unknown): ManagerCompliance {
  if (!raw || typeof raw !== "object") return { ...EMPTY_MANAGER_COMPLIANCE };
  const mc = raw as Record<string, unknown>;
  const isManager = mc.isManager === true || mc.is_manager === true;
  let weeklyTaskUpdate: boolean | null = null;
  if (mc.weeklyTaskUpdate === true || mc.weekly_task_update === true) weeklyTaskUpdate = true;
  else if (mc.weeklyTaskUpdate === false || mc.weekly_task_update === false) weeklyTaskUpdate = false;
  else if (!isManager) weeklyTaskUpdate = null;

  return {
    isManager,
    weeklyTaskUpdate,
    lastTaskUpdateAt:
      typeof mc.lastTaskUpdateAt === "string" ? mc.lastTaskUpdateAt :
      typeof mc.last_task_update_at === "string" ? mc.last_task_update_at :
      null,
  };
}

/** Parse raw JSON from GET /analytics/users/:email into normalized metrics. */
export function parseAdoptionMetrics(json: Record<string, unknown>): CtAdoptionMetrics {
  const lastActiveAt =
    typeof json.lastActiveAt === "string" ? json.lastActiveAt :
    typeof json.last_active_at === "string" ? json.last_active_at :
    null;

  const summaryRaw =
    json.summary && typeof json.summary === "object" ? (json.summary as Record<string, unknown>) : {};

  const logins = parsePeriodCounts(
    summaryRaw.logins as Record<string, unknown> | undefined,
    "login_count",
    summaryRaw,
  );
  const pageViews = parsePeriodCounts(
    summaryRaw.pageViews as Record<string, unknown> | undefined,
    "page_view_count",
    summaryRaw,
  );
  const actions = parsePeriodCounts(
    summaryRaw.actions as Record<string, unknown> | undefined,
    "action_count",
    summaryRaw,
  );

  const modules = parseModules(summaryRaw.modules);
  const managerCompliance = parseManagerCompliance(summaryRaw.managerCompliance ?? summaryRaw.manager_compliance);

  const details =
    json.details && typeof json.details === "object" ? (json.details as AdoptionDetails) : null;

  const hasPeriodData =
    logins.d30 > 0 || pageViews.d30 > 0 || actions.d30 > 0 || modules.length > 0;
  const partial = !lastActiveAt || !hasPeriodData;

  return {
    lastActiveAt,
    summary: {
      controlTowerName:
        typeof summaryRaw.controlTowerName === "string" ? summaryRaw.controlTowerName :
        typeof summaryRaw.control_tower_name === "string" ? summaryRaw.control_tower_name :
        null,
      controlTowerVersion:
        typeof summaryRaw.controlTowerVersion === "string" ? summaryRaw.controlTowerVersion :
        typeof summaryRaw.control_tower_version === "string" ? summaryRaw.control_tower_version :
        null,
      employeeEmail:
        typeof summaryRaw.employeeEmail === "string" ? summaryRaw.employeeEmail :
        typeof summaryRaw.employee_email === "string" ? summaryRaw.employee_email :
        null,
      department: typeof summaryRaw.department === "string" ? summaryRaw.department : null,
      logins,
      pageViews,
      actions,
      modules,
      managerCompliance,
    },
    details,
    partial,
  };
}

export function toAdoptionStatsPayload(metrics: CtAdoptionMetrics): AdoptionStatsPayload | null {
  if (!metrics.lastActiveAt) return null;
  return {
    lastActiveAt: metrics.lastActiveAt,
    summary: metrics.summary,
    details: metrics.details,
  };
}
