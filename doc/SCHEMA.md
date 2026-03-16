# SCHEMA
> Last updated: 2026-03-14 10:46

## Migration History
- `20260314094800_core_mvp_tables.sql`
  - Added core MVP tables, constraints, indexes, updated-at triggers, helper functions, and RLS policies.
- `20260314104500_company_invitations.sql`
  - Added onboarding invitation table and role-scoped RLS policies for owner/admin invite workflows.

## Tables (Core MVP)

### `companies`
- Tenant root record for each fleet customer.
- Key fields: `name`, `dot_number`, `fleet_size`, `created_by`.

### `company_members`
- Maps authenticated users to companies with a role.
- Roles: `owner`, `admin`, `dispatcher`, `driver`, `viewer`.
- Unique pair: (`company_id`, `user_id`).

### `company_invitations`
- Stores role-scoped invitations for onboarding members by email.
- Roles: `admin`, `dispatcher`, `driver`, `viewer`.
- Statuses: `pending`, `accepted`, `revoked`, `expired`.
- Key fields: `email`, `invite_token`, `expires_at`, `invited_by`.

### `drivers`
- Driver identity and licensing records.
- Links optional `auth_user_id` for users who can sign in.
- Unique per company: `license_number`, `employee_code`.

### `vehicles`
- Fleet vehicle records with VIN, unit number, and operating state.
- Unique per company: `vin`, `unit_number`.

### `trips`
- Trip execution records connecting `driver` + `vehicle`.
- Statuses: `planned`, `in_progress`, `completed`, `cancelled`.

### `eld_logs`
- ELD/HOS log records per driver and date.
- Duty statuses: `off_duty`, `sleeper_berth`, `on_duty`, `driving`.

### `inspections`
- DVIR inspection records with defect list and resolution metadata.
- Types: `pre_trip`, `post_trip`.

### `maintenance_records`
- Preventive/corrective maintenance scheduling and completion data.
- Statuses: `scheduled`, `completed`, `overdue`, `cancelled`.

### `safety_events`
- Safety telemetry incidents used for scoring and risk analytics.
- Event examples: speeding, harsh braking, rapid acceleration.

### `alerts`
- Actionable operational/compliance/safety alerts.
- Statuses: `open`, `acknowledged`, `resolved`.

## Helper Functions and Triggers
- `set_updated_at()` - sets `updated_at` on mutable tables.
- `has_company_role(company_id, roles[])` - role check helper for RLS policies.
- `handle_company_insert_add_owner()` - auto-creates `owner` membership for `created_by`.
- Updated-at triggers added for: `companies`, `drivers`, `vehicles`, `trips`, `eld_logs`, `inspections`, `maintenance_records`, `alerts`, `company_invitations`.

## RLS Policies
RLS enabled on all core tables.

### Read Access
- Members with role in `owner/admin/dispatcher/driver/viewer` can `select` records for their company.
- For `company_invitations`, read is allowed for `owner/admin/dispatcher/viewer`.

### Write Access
- `companies`
  - Insert: authenticated user where `created_by = auth.uid()`.
  - Update: `owner/admin`.
  - Delete: `owner` only.
- `company_members`
  - Insert/Update/Delete: `owner/admin` in that company.
- `company_invitations`
  - Insert/Update/Delete: `owner/admin` in that company.
- `drivers`, `vehicles`, `trips`, `eld_logs`, `inspections`, `maintenance_records`, `safety_events`, `alerts`
  - Insert/Update/Delete: `owner/admin/dispatcher`.

## Indexing Notes
Indexes were added for common query dimensions:
- Tenant partitioning (`company_id`)
- Operational filters (`status`, `due_at`, `log_date`)
- Time-series browsing (`started_at`, `occurred_at`, `triggered_at`, `expires_at`)
- Foreign-key lookup paths (`driver_id`, `vehicle_id`, `user_id`)

## Update (2026-03-14 18:54)
- Added migration `20260314195500_restore_operational_update_permissions.sql`.
- Operational tables `drivers`, `vehicles`, `trips`, `eld_logs`, `inspections`, `maintenance_records`, and `safety_events` enforce role-scoped writes for `owner/admin/dispatcher` with explicit `USING` + `WITH CHECK` predicates for UPDATE.
- Ownership-sensitive tables remain owner-restricted for update control:
  - `companies` update: owner-only
  - `company_members` update: owner-only

## RBAC Audit Update (2026-03-16)
- Audited role source: `company_members.role` with roles `owner`, `admin`, `dispatcher`, `driver`, `viewer`.
- Audited RLS behavior for `drivers`, `vehicles`, `trips`, `alerts`:
  - RLS remains enabled on all tables.
  - Current table policies still allow company-member SELECT for all five roles and write paths for `owner/admin/dispatcher`.
- Safety constraint for this pass: no schema/migration edits were applied.
- Effective tightening was applied at API/UI layer:
  - `driver` is own-scoped on `drivers` and `trips` API reads.
  - `dispatcher` is now alerts-view only at API/UI.
  - Delete operations on drivers/vehicles/trips are owner/admin only at API/UI.
