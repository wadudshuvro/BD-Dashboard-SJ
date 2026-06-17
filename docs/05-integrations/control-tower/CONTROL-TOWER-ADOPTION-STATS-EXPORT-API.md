# Control Tower — Adoption Stats Export API

**Audience:** Developers of Business Development CT, Developer CT, HR CT, Finance CT, and every pod-specific Control Tower  
**Consumer:** SJ Main Control Tower (`adoption-report` edge function, Usage Analytics enrichment)  
**Purpose:** Define the HTTP API each Control Tower must expose so Main CT can pull per-user adoption metrics and produce org-wide leadership reports  
**Last updated:** June 2026  
**Owner:** SJ Control Tower platform team  
**Spec version:** 1.0.0

---

## 1. Overview

SJ Main Control Tower aggregates adoption metrics across the organization. Each satellite Control Tower (BD CT, Dev CT, HR CT, pod CTs, etc.) **implements this Stats Export API** as a **provider**. Main CT is the **consumer**.

| Role | Responsibility |
|---|---|
| **CT owner (you)** | Expose `/analytics/*` endpoints; issue read-only API keys |
| **Main CT admin** | Register your CT at **Admin → Reports & Analytics → Control Towers** (`/admin/control-towers`) |
| **Main CT platform** | Pulls stats on demand; normalizes; rolls up by department |

**What Main CT produces from your data:**

- Org-wide login % (30 / 60 / 90 days)
- Department breakdown (PM, QA, HR, Finance, Sales/Marketing, etc.)
- Module usage (Tasks, EOS, OKRs, Meetings, etc.)
- Manager weekly task-update compliance
- Gaps (zero-adoption departments, unmapped users, API errors)

---

## 2. Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Main Control      │  HTTPS  │  Your Control Tower  │
│   Tower             │ ──────► │  (BD / Dev / Pod…)   │
│                     │         │                      │
│  control_towers DB  │         │  GET /analytics/ping │
│  adoption-report    │         │  GET /analytics/     │
│  Usage Analytics    │         │      users/{email}   │
└─────────────────────┘         └──────────────────────┘
```

**Pull sequence:**

1. Main CT resolves which external CT serves a user (user override → POD `team_key` → none).
2. Main CT calls `GET {apiUrl}/analytics/ping` (or `/health`) to verify connectivity.
3. Main CT calls `GET {apiUrl}/analytics/users/{email}` for each user.
4. Main CT normalizes the response into `AdoptionStatsPayload` and merges with local Main CT activity.

---

## 3. Registration in Main CT

Before Main CT can pull your stats, an admin must register your tower:

1. Log in to Main CT as **admin**.
2. Navigate to **Business Operations → Reports & Analytics → Control Towers** (`/admin/control-towers`).
3. Click **Add Control Tower**.
4. Fill in:

| Field | Required | Description |
|---|---|---|
| **Name** | Yes | Unique display name (e.g. `BD Control Tower`) |
| **API URL** | Yes | Base URL of your CT API (no trailing slash required) |
| **API Key** | Yes (on create) | Read-only analytics key (see §4) |
| **Team mapping** | No | POD UUID — default CT for all members of that POD |
| **Enabled** | Yes | Disabled CTs are skipped |

5. Click **Test Connection** — Main CT calls `/analytics/ping` then `/health`.
6. Optional: per-user overrides are managed in **Usage Analytics → Users** tab.

**Mapping priority (per user):**

1. `user_control_tower_mappings` (explicit user → CT override)
2. `control_towers.team_key` = user's POD id
3. No mapping → user shows `MISSING` in adoption reports

---

## 4. Authentication

| Method | Header | Used for |
|---|---|---|
| **Bearer (default)** | `Authorization: Bearer {api_key}` | All `/analytics/*` endpoints |
| **API key alt** | `x-api-key: {api_key}` | Optional; document in your CT if supported |

**Rules:**

- Issue keys scoped **read-only** (`analytics:read`) from your CT admin panel.
- Main CT stores keys encrypted (`control_towers.api_key_encrypted`) — never returned to the browser.
- **TLS required.** Do not accept API keys in query strings.
- Return `401` or `403` for invalid or missing keys.

---

## 5. Required endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `{baseUrl}/analytics/ping` | GET | Lightweight liveness check (**preferred**) |
| `{baseUrl}/health` | GET | Fallback liveness check |
| `{baseUrl}/analytics/users/{identifier}` | GET | **Primary Stats Export** — per-user adoption payload |

### `GET /analytics/users/{identifier}`

- `{identifier}` = **lowercase, trimmed work email** (e.g. `jane.doe@sjinnovation.com`).
- Return **404** if the user is unknown to your CT (not an error for Main CT).
- Return **200** with `AdoptionStatsPayload` (§7) for known users.
- Response time: **≤ 12 seconds** (Main CT timeout).

### Ping / health

Return **200** with any small JSON body, e.g.:

```json
{ "ok": true, "service": "bd-control-tower-analytics" }
```

---

## 6. Optional endpoints (v1.1)

Main CT v1 only requires §5. These are recommended for scale:

| Endpoint | Method | Purpose |
|---|---|---|
| `{baseUrl}/analytics/teams/{teamKey}/summary` | GET | POD/department rollup without N per-user calls |
| `{baseUrl}/analytics/org/summary` | GET | CT-wide totals for health dashboard |

---

## 7. Response schema — `AdoptionStatsPayload`

### Full example

```json
{
  "lastActiveAt": "2026-06-15T10:30:00Z",
  "summary": {
    "controlTowerName": "BD Control Tower",
    "controlTowerVersion": "1.0.0",
    "employeeEmail": "jane.doe@sjinnovation.com",
    "department": "Sales/Marketing",
    "logins": { "d7": 3, "d30": 12, "d60": 20, "d90": 28 },
    "pageViews": { "d7": 15, "d30": 80, "d60": 140, "d90": 200 },
    "actions": { "d7": 5, "d30": 22, "d60": 40, "d90": 55 },
    "modules": [
      {
        "name": "Business Opportunities",
        "pageViews": 45,
        "actions": 12,
        "lastUsedAt": "2026-06-14T16:00:00Z"
      },
      {
        "name": "Contacts",
        "pageViews": 20,
        "actions": 5,
        "lastUsedAt": "2026-06-13T11:00:00Z"
      }
    ],
    "managerCompliance": {
      "isManager": false,
      "weeklyTaskUpdate": null,
      "lastTaskUpdateAt": null
    }
  },
  "details": {
    "recentLogins": ["2026-06-15T09:00:00Z", "2026-06-14T08:30:00Z"],
    "topPages": [{ "path": "/deals", "views": 20 }],
    "topActions": [{ "name": "deal_created", "count": 3 }]
  }
}
```

### Field reference

| Field | Type | Required | Description |
|---|---|---|---|
| `lastActiveAt` | ISO 8601 string | **Yes** | Most recent meaningful activity in this CT |
| `summary` | object | **Yes** | Normalized adoption summary |
| `summary.controlTowerName` | string | No | Display name of your CT |
| `summary.controlTowerVersion` | string | No | Semver of your analytics API |
| `summary.employeeEmail` | string | No | Echo of requested email |
| `summary.department` | string | No | HR department label if known |
| `summary.logins` | object | **Yes** | Distinct login sessions per rolling window |
| `summary.logins.d7` | integer ≥ 0 | **Yes** | Logins in last 7 days |
| `summary.logins.d30` | integer ≥ 0 | **Yes** | Logins in last 30 days |
| `summary.logins.d60` | integer ≥ 0 | **Yes** | Logins in last 60 days |
| `summary.logins.d90` | integer ≥ 0 | **Yes** | Logins in last 90 days |
| `summary.pageViews` | object | **Yes** | Same `d7`/`d30`/`d60`/`d90` keys |
| `summary.actions` | object | **Yes** | Same `d7`/`d30`/`d60`/`d90` keys |
| `summary.modules` | array | **Yes** | Per-module usage (empty array if none) |
| `summary.modules[].name` | string | **Yes** | Standard module name (§8) |
| `summary.modules[].pageViews` | integer ≥ 0 | **Yes** | Page views in last 90 days (or all-time if easier) |
| `summary.modules[].actions` | integer ≥ 0 | **Yes** | Actions in last 90 days |
| `summary.modules[].lastUsedAt` | ISO 8601 | No | Last activity in this module |
| `summary.managerCompliance` | object | **Yes** | Manager task-update compliance |
| `summary.managerCompliance.isManager` | boolean | **Yes** | `true` if user manages others in this CT |
| `summary.managerCompliance.weeklyTaskUpdate` | boolean \| null | **Yes** | `true`/`false` for managers; `null` if not a manager |
| `summary.managerCompliance.lastTaskUpdateAt` | ISO 8601 \| null | No | Most recent task create/update/complete |
| `details` | object | No | Drill-down data; not required for rollups |

### Accepted aliases (backward compatibility)

Main CT's parser also accepts:

| Alias | Maps to |
|---|---|
| `last_active_at` | `lastActiveAt` |
| `summary.login_count_7d` | `summary.logins.d7` |
| `summary.login_count_30d` | `summary.logins.d30` |
| `summary.login_count_60d` | `summary.logins.d60` |
| `summary.login_count_90d` | `summary.logins.d90` |
| Same pattern for `page_view_count_*` and `action_count_*` | `pageViews.*` / `actions.*` |

### Partial compliance

If you only track `lastActiveAt` today, return a minimal payload:

```json
{
  "lastActiveAt": "2026-06-15T10:30:00Z",
  "summary": {
    "logins": { "d7": 0, "d30": 0, "d60": 0, "d90": 0 },
    "pageViews": { "d7": 0, "d30": 0, "d60": 0, "d90": 0 },
    "actions": { "d7": 0, "d30": 0, "d60": 0, "d90": 0 },
    "modules": [],
    "managerCompliance": { "isManager": false, "weeklyTaskUpdate": null, "lastTaskUpdateAt": null }
  }
}
```

Main CT flags these as `partial: true`. **Full compliance** (all period fields + modules) is required for leadership module breakdown reports.

---

## 8. Standard module names

Use these canonical names (aligned with Main CT navigation). Main CT groups adoption by these labels.

| Module name | Typical CT |
|---|---|
| `Dashboard` | All CTs |
| `Actions` | All CTs (alias: `Tasks`) |
| `Meetings` | Main, pod CTs |
| `Productivity` | Main, HR CT |
| `Projects` | Dev CT, pod CTs |
| `EOS` | Main, management CTs |
| `OKRs` | Main |
| `Business Opportunities` | **BD CT** |
| `Contacts` | **BD CT** |
| `Clients` | BD CT, Main |
| `Finance` | Finance CT |
| `Knowledge` | All CTs |
| `CollabAI` | CollabAI integration |
| `HR` | HR CT |

**CT-specific modules:** prefix with your CT code, e.g. `BD:Lead Follow-Up`, `Dev:Doc Health`.

---

## 9. Manager compliance rules

| Field | Rule |
|---|---|
| `isManager` | `true` when user has direct reports in your CT **or** is flagged manager in employee master |
| `weeklyTaskUpdate` | `true` if user created, updated, or completed at least one **assigned** task in the **current ISO week** (Monday–Sunday UTC) |
| `lastTaskUpdateAt` | Timestamp of the most recent task mutation |
| Non-managers | `weeklyTaskUpdate` must be `null` (not `false`) |

Main CT also checks its own `task_updated` / `task_created` / `task_completed` action logs. When your CT provides `managerCompliance`, **your value wins** for the external CT column.

---

## 10. Error responses

| HTTP | Meaning | Main CT behavior |
|---|---|---|
| **200** | Success | Parse and merge |
| **404** | User not in this CT | `notFound: true` — not treated as CT error |
| **401 / 403** | Auth failure | CT status `ERROR`; shown in Adoption Report gaps |
| **429** | Rate limited | Retry with backoff (max 3 attempts) |
| **5xx** | Server error | CT status `ERROR`; per-user error stored |

**Standard error body:**

```json
{
  "error": "unauthorized",
  "message": "Invalid API key"
}
```

---

## 11. Rate limits and performance

| Guideline | Value |
|---|---|
| Recommended rate limit | 60 requests/min per API key |
| Main CT request timeout | **12 seconds** |
| Main CT batch concurrency | 4 parallel requests per CT |
| Main CT cache | 10 minutes per `{ctId}:{email}` (best-effort) |
| `details` array limits | Max 50 items each for `recentLogins`, `topPages`, `topActions` |

---

## 12. How to compute metrics (implementer guide)

All windows are **rolling from UTC now** (not calendar month).

| Metric | How to count |
|---|---|
| **Login** | Distinct auth session starts or `activity_type = login` events in window |
| **Page view** | Route-change events or explicit `page_view` logs |
| **Action** | Explicit tracked actions (`task_created`, `deal_stage_changed`, etc.) |
| **lastActiveAt** | `MAX(timestamp)` across all event types |
| **Module usage** | Group page views and actions by `module_name` |
| **weeklyTaskUpdate** | Any task mutation by user on an assigned task in current ISO week |

**Active user definition (for your own dashboards):** user with `lastActiveAt` within last 14 days (Main CT default `TEAM_CT_INACTIVE_DAYS`).

---

## 13. BD Control Tower — reference implementation

### Modules to report

- `Business Opportunities`
- `Contacts`
- `Clients`
- `BD:Lead Follow-Up` (or `Lead Follow-Up` with BD prefix)

### Actions to count

| Action name | Module |
|---|---|
| `deal_created` | Business Opportunities |
| `deal_stage_changed` | Business Opportunities |
| `contact_created` | Contacts |
| `lead_followup_updated` | Contacts |

### Sample request

```bash
curl -s "https://bd-ct.example.com/analytics/users/jane.doe@sjinnovation.com" \
  -H "Authorization: Bearer sk_bd_ct_analytics_key" \
  -H "Accept: application/json"
```

### Sample compliant response

```json
{
  "lastActiveAt": "2026-06-15T09:15:00Z",
  "summary": {
    "controlTowerName": "BD Control Tower",
    "controlTowerVersion": "1.0.0",
    "employeeEmail": "jane.doe@sjinnovation.com",
    "department": "Sales/Marketing",
    "logins": { "d7": 4, "d30": 18, "d60": 32, "d90": 45 },
    "pageViews": { "d7": 22, "d30": 95, "d60": 180, "d90": 260 },
    "actions": { "d7": 8, "d30": 35, "d60": 62, "d90": 88 },
    "modules": [
      { "name": "Business Opportunities", "pageViews": 60, "actions": 20, "lastUsedAt": "2026-06-15T09:10:00Z" },
      { "name": "Contacts", "pageViews": 25, "actions": 10, "lastUsedAt": "2026-06-14T14:00:00Z" },
      { "name": "Clients", "pageViews": 10, "actions": 5, "lastUsedAt": "2026-06-12T10:00:00Z" }
    ],
    "managerCompliance": {
      "isManager": true,
      "weeklyTaskUpdate": true,
      "lastTaskUpdateAt": "2026-06-14T16:30:00Z"
    }
  },
  "details": {
    "topActions": [
      { "name": "deal_created", "count": 3 },
      { "name": "deal_stage_changed", "count": 7 }
    ]
  }
}
```

### Registration example

| Field | Value |
|---|---|
| Name | `BD Control Tower` |
| API URL | `https://bd-ct.example.com` |
| Team mapping | POD id for Business Development (or leave blank if org-wide) |

---

## 14. Other Control Tower variants

### Developer CT

- **Modules:** `Projects`, `Dev:Doc Health`, `Actions`, `Meetings`
- **Optional `details.github`:** commits, merged PRs, lines added/deleted (from existing `get-github-activity` API)
- **Separate endpoint:** `GET /get-github-activity?email=&range=7d` (uses `x-internal-api-key` header) — not part of adoption Stats Export but consumed by Main CT project views

### HR CT

- **Modules:** `HR`, `Productivity`
- **No** deal/contact/client modules

### Finance CT

- **Modules:** `Finance`, `Clients`

### Pod delivery CTs (DevSquad, AllGoRhythm, CodeKnights, Avengers, etc.)

- **Modules:** `Projects`, `Actions`, `Meetings`, `EOS`
- Map via **Team mapping** = POD UUID in Main CT registry

---

## 15. Main CT reference implementation

Main CT implements the **same contract** so other systems can query Main CT adoption symmetrically.

| Item | Location |
|---|---|
| Edge function | `supabase/functions/analytics-users/index.ts` |
| Public URL | `{MAIN_CT_BASE_URL}/analytics-users/{email}` |
| Data source | `user_activity_logs`, `user_activity_summary` |
| Parser / types | `supabase/functions/_shared/ct-adoption-schema.ts` |

Main CT's internal adoption report reads from the database directly for performance; the edge function is the **gold-standard reference** for CT implementers.

---

## 16. Testing checklist

Before handing your API URL and key to Main CT admin, verify:

- [ ] `GET /analytics/ping` returns **200** with valid key
- [ ] `GET /analytics/users/{known-email}` returns full `summary` with all `d7`/`d30`/`d60`/`d90` fields
- [ ] `GET /analytics/users/{unknown-email}` returns **404**
- [ ] Invalid key returns **401** or **403**
- [ ] `lastActiveAt` updates after a test login in your CT
- [ ] Module names match §8 enum
- [ ] Register in Main CT **Control Towers** → **Test Connection** passes
- [ ] Main CT **Usage Analytics → Users** tab shows parsed metrics for a test user
- [ ] Main CT **Adoption Report** (`/admin/reports/adoption`) includes your CT in health strip

---

## 17. Versioning

| Field | Purpose |
|---|---|
| `summary.controlTowerVersion` | Semver string (e.g. `1.0.0`) |

- **Patch:** backward-compatible field additions
- **Minor:** new optional endpoints (e.g. §6 team summary)
- **Major:** breaking schema changes — coordinate with Main CT platform team

### Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-06 | Initial Stats Export API spec |

---

## 18. Next steps for CT dev teams

1. Implement `GET /analytics/ping` and `GET /analytics/users/:email` per this spec.
2. Issue a read-only analytics API key from your CT admin panel.
3. Send **base URL** and **API key** to Main CT admin for registry at `/admin/control-towers`.
4. Complete the testing checklist (§16).
5. Share this document with your team; keep `controlTowerVersion` updated when you ship changes.

**Contacts (Main CT side):** Platform team via `#control-tower` Slack channel.

---

## Related documentation

- Main CT Control Towers registry: `/admin/control-towers`
- Main CT Adoption Report: `/admin/reports/adoption`
- Main CT Usage Analytics (POD view): `/admin/reports/usage-analytics`
- HR data export (inverse direction): [`HR-CONTROL-TOWER-EMPLOYEE-DATA-EXPORT.md`](./HR-CONTROL-TOWER-EMPLOYEE-DATA-EXPORT.md)
- Dev CT doc health (push pattern): [`doc-health.md`](./doc-health.md)
- Control Tower API index: [`../control-tower-api/control-tower-api-README.md`](../control-tower-api/control-tower-api-README.md)
