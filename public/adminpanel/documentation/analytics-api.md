# Analytics API (Usage Export)

_Last Updated: 2026-06-17_

## What this module does

This module lets you **share user usage analytics** with other projects in three ways:

- **Main CT Adoption Stats Export** (`analytics` edge function) — per-user `AdoptionStatsPayload` for SJ Main Control Tower adoption reports.
- **Pull** (`external-analytics-api`) — email-keyed per-user stats by period (daily / weekly / monthly / all).
- **Push** (`push-analytics-to-consumers`) — POST the same stats to registered consumer webhooks (with retries + delivery status tracking).

## Where to configure (Admin UI)

- **Admin page**: `/adminpanel/analytics-api-consumers`
- Purpose: Create and manage authorized “consumers” (external projects) and configure optional webhook push delivery.

### Consumer fields (high level)

Each consumer is stored in `public.analytics_api_consumers` with:

- `api_secret_hash`: SHA-256 hash of the **API secret** shown once in the UI
- `allowed_periods`: which periods that consumer is allowed to request (`daily|weekly|monthly|all`)
- Push settings: `push_enabled`, `push_frequency`, `webhook_url`, `webhook_secret`
- Delivery tracking: `last_push_at`, `last_push_status`

## Database migration

Run this migration in Supabase:

- `supabase/migrations/20260208000000_create_analytics_api_consumers.sql`

It creates:

- Table: `public.analytics_api_consumers`
- RLS: **Admin / Super Admin only**
- Trigger: updates `updated_at` via `public.update_updated_at_column()`

## Edge functions to deploy

This module adds these edge functions:

0. `analytics` (Control Tower contract)
1. `external-analytics-api` (Pull API)
2. `push-analytics-to-consumers` (Push API / webhook delivery)

### Supabase config

In `supabase/config.toml` these are configured as:

- `verify_jwt = false`

Reason: These endpoints use **shared-secret authentication** (not user JWTs) and use a service-role Supabase client inside the function.

## Authentication model

### Pull API auth (external callers)

External callers must send:

- Preferred header: `Authorization: Bearer <plaintext-secret>`
- Main CT header (also accepted): `x-api-key: <plaintext-secret>`
- Legacy header (still accepted): `x-api-secret: <plaintext-secret>`

Implementation detail:

- Only the **SHA-256 hash** is stored in the database (`api_secret_hash`).
- The plaintext secret is displayed **once** at consumer creation/regeneration time.

### Push webhook auth (your system → external receiver)

When pushing to a consumer webhook, the request includes:

- Header: `x-webhook-secret: <consumer.webhook_secret>`

The receiver should verify this header before accepting the payload.

## Control Tower Adoption Stats Export: `analytics`

Implements **CONTROL-TOWER-ADOPTION-STATS-EXPORT-API.md v1.0.0** for Main CT registration at `/admin/control-towers`.

**Register this base URL in Main CT:**

`https://<project-ref>.supabase.co/functions/v1/analytics`

Issue a read-only API key from **Admin → Analytics API Consumers** (`/adminpanel/analytics-api-consumers`).

### Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /functions/v1/analytics/ping` | Liveness check (preferred) |
| `GET /functions/v1/analytics/health` | Liveness check (fallback) |
| `GET /functions/v1/analytics/users/:email` | Per-user adoption stats (`AdoptionStatsPayload`) |

### Health / ping

Returns `200` with `{ "ok": true, "service": "bd-control-tower-analytics" }` when the API key is valid.

```bash
curl -X GET "https://<project-ref>.supabase.co/functions/v1/analytics/ping" \
  -H "Authorization: Bearer <YOUR_SECRET>"
```

### User adoption stats by email

`GET /functions/v1/analytics/users/:email` — email must be lowercase, trimmed work email.

Returns **404** if the user is unknown to BD CT. Returns **200** with `AdoptionStatsPayload`:

```json
{
  "lastActiveAt": "2026-06-15T09:15:00Z",
  "summary": {
    "controlTowerName": "BD Control Tower",
    "controlTowerVersion": "1.0.0",
    "employeeEmail": "jane.doe@sjinnovation.com",
    "department": "Sales/Marketing",
    "logins": { "d7": 4, "d30": 18, "d60": 32, "d90": 45 },
    "pageViews": { "d7": 0, "d30": 0, "d60": 0, "d90": 0 },
    "actions": { "d7": 8, "d30": 35, "d60": 62, "d90": 88 },
    "modules": [
      { "name": "Business Opportunities", "pageViews": 0, "actions": 20, "lastUsedAt": "2026-06-15T09:10:00Z" },
      { "name": "Contacts", "pageViews": 0, "actions": 10, "lastUsedAt": "2026-06-14T14:00:00Z" }
    ],
    "managerCompliance": {
      "isManager": true,
      "weeklyTaskUpdate": true,
      "lastTaskUpdateAt": "2026-06-14T16:30:00Z"
    }
  },
  "details": {
    "recentLogins": ["2026-06-15T09:00:00Z"],
    "topActions": [{ "name": "deal_created", "count": 3 }]
  }
}
```

**BD modules reported:** `Business Opportunities`, `Contacts`, `Clients`, `BD:Lead Follow-Up`, `Actions`, `Dashboard`, `CollabAI`.

**Data sources:** `user_activity_log`, `profiles`, `employees`, `user_roles`, `project_tasks`.

Example:

```bash
curl -X GET "https://<project-ref>.supabase.co/functions/v1/analytics/users/jane.doe%40sjinnovation.com" \
  -H "Authorization: Bearer <YOUR_SECRET>" \
  -H "Accept: application/json"
```

## Pull API: `external-analytics-api`

### Endpoint

`GET /functions/v1/external-analytics-api`

### Query parameters

| Param | Required | Values | Notes |
| --- | --- | --- | --- |
| `period` | Yes | `daily|weekly|monthly|all` | Defines the time window |
| `date` | No | `YYYY-MM-DD` | Reference date; defaults to “now” |
| `page` | No | integer >= 1 | Default `1` |
| `page_size` | No | 1–200 | Default `50` |
| `email` | No | email OR comma-separated OR repeated param | Filters to specific users by email (case-insensitive) |

### Period windows

- `daily`: last 24 hours
- `weekly`: last 7 days
- `monthly`: last 30 days
- `all`: last 90 days

### Response format (email-keyed)

Top-level response:

- `meta`: request metadata and pagination
- `summary`: totals
- `users`: **object keyed by email**

Per-user fields (values are within the requested period window):

- `last_active_at`: most recent activity timestamp (any action)
- `last_login_at`: most recent login timestamp (action=`login`)
- `inactive_for_seconds`: seconds since `last_active_at`, calculated relative to `meta.period_end` (null if unknown)

Important notes:

- If a user has no email in `profiles.email`, they appear as `unknown-<user_id>` keys.
- The response is sorted by `activity_score` desc (then `activity_count`) before pagination.

### Example curl

```bash
curl -X GET "https://<project-ref>.supabase.co/functions/v1/external-analytics-api?period=weekly&page=1&page_size=50" \
  -H "Authorization: Bearer <YOUR_SECRET>" \
  -H "Content-Type: application/json"
```

### Example curl (filter by email)

Single email:

```bash
curl -X GET "https://<project-ref>.supabase.co/functions/v1/external-analytics-api?period=weekly&email=paresh@sjinnovation.com" \
  -H "Authorization: Bearer <YOUR_SECRET>" \
  -H "Content-Type: application/json"
```

Multiple emails (comma-separated):

```bash
curl -X GET "https://<project-ref>.supabase.co/functions/v1/external-analytics-api?period=weekly&email=paresh@sjinnovation.com,jane@sjinnovation.com" \
  -H "Authorization: Bearer <YOUR_SECRET>" \
  -H "Content-Type: application/json"
```

### Errors (common)

- `401`: missing/invalid API key (`Authorization: Bearer ...` preferred; `x-api-secret` legacy accepted)
- `403`: consumer not allowed to request that `period`
- `400`: invalid parameters

## Push API: `push-analytics-to-consumers`

### Endpoint

`POST /functions/v1/push-analytics-to-consumers`

### Optional request body

To push a single consumer (used by Admin UI “Manual Push”):

```json
{ "consumer_id": "<uuid>" }
```

### Behavior

- Finds consumers where `is_active=true AND push_enabled=true` (or a single `consumer_id`).
- Determines period from `push_frequency`:
  - `daily` → `daily`
  - `weekly` → `weekly`
  - `monthly` → `monthly`
  - anything else → `monthly`
- Sends payload via HTTP POST to `webhook_url`.
- Includes `x-webhook-secret` header.
- Retries up to **3 attempts** with exponential backoff (1s, 2s, 4s).
- Updates `last_push_at` and `last_push_status` for each consumer.

### Receiver requirements

Your webhook endpoint should:

- Verify `x-webhook-secret`
- Return a **2xx** response quickly
- Accept JSON payload that matches the Pull API response

## Data sources and scoring

This API aggregates from:

- `public.user_activity_log` (events)
- `public.profiles` (user name + email)

Activity score is a weighted sum. Example weights include:

- `deal_created`: 5
- `campaign_created`: 4
- `task_completed`: 4
- `login`: 1

(See edge function shared module `_shared/analyticsAggregator.ts`.)

## Troubleshooting

### Empty stats

Check:

- Are events being written into `user_activity_log`?
- Does the calling period include the time you expect?

### Push shows `failed: ...`

Check:

- `webhook_url` reachable from Supabase edge runtime
- Receiver returns 2xx quickly (timeouts are enforced)
- Receiver validates `x-webhook-secret` correctly

### 403 forbidden on Pull API

Check:

- The consumer’s `allowed_periods` includes the requested `period`.

