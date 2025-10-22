# Control Tower Synchronization

## Overview
The Control Tower synchronization layer keeps the Business Development Portal in lockstep with the external CRM. It supports hourly pull of deal metadata and push of user activity (comments, checklist completions, stage changes) back to Control Tower for full parity.

## Sync Operations

### Pull (`sync-control-tower-deals`)
- Fetches latest deals from Control Tower's `Deal` table.
- Maps stage, financials, lead source, notes, HubSpot IDs, and external workflow links.
- Stores unmapped fields inside `deals.control_tower_metadata` for diagnostics.
- Updates `deals.last_activity_at` to align UI with CRM timeline.

### Push (`push-to-control-tower`)
- Processes unsynced `deal_comments` and completed `deal_checklist_items`.
- Creates comment records inside Control Tower with author, body, and mentions.
- Marks checklist items as synced after successful push.
- Logs all actions to `control_tower_sync_log` with success or failure payloads.

### Checklist Template Apply (`apply-checklist-template`)
- Applies the stage-aware template to a deal the first time it is viewed.
- Inserts ordered checklist items via the `deal_checklist_items` table.

## Schedules

| Job | Frequency | Function |
|-----|-----------|----------|
| Pull | Every hour (top of hour) | `sync-control-tower-deals` |
| Push | Every hour at :30 | `push-to-control-tower` |

Manage schedules through the Control Tower Sync admin dashboard or directly in `cron.jobs`.

## Audit Trail

The `control_tower_sync_log` table captures every synchronization job:

- `sync_type`: `pull` or `push`
- `entity_type`: `deal`, `comment`, `checklist`, etc.
- `status`: `success`, `failed`, or `pending`
- `payload`: contextual JSON (counts, IDs)
- `error_message`: failure reason when applicable

Use the Control Tower Sync dashboard (`/adminpanel/integrations/control-tower-sync`) to filter logs by entity and status.

## Manual Sync Procedures

1. Navigate to the Control Tower Sync dashboard.
2. Click **Pull Now** to fetch latest deals.
3. Click **Push Now** to send pending comments and checklist completions.
4. Refresh the dashboard to confirm log entries and updated pending counts.

## Troubleshooting

- **Auth Errors**: Ensure the Supabase function secrets include `Controltowerurl` and `CONTROLTOWERAPIKEY`.
- **Missing Deals**: Check `deals.control_tower_metadata` for field mismatches.
- **Pending Items Never Clear**: Verify RLS policies on `deal_comments` and `deal_checklist_items`, and confirm Control Tower IDs exist on deals.
- **Failed Logs**: Review `control_tower_sync_log.error_message` for the most recent failure.

## Related Tables

- `deals`: augmented with Control Tower metadata, HubSpot references, and external links.
- `deal_comments`: includes `synced_to_control_tower`, `control_tower_comment_id`, and mention tracking.
- `deal_checklist_items`: new `control_tower_synced_at` timestamp for push confirmation.
- `checklist_templates`: admin-managed templates applied automatically to deals.
