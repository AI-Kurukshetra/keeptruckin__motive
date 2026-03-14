# DECISIONS
## [2026-03-14] Phase 3 APIs enforce tenant scope via explicit `companyId`
Reason: Every core domain table is multi-tenant. Requiring `companyId` in query/body keeps access checks explicit and aligns with RLS policies.

## [2026-03-14] API write access follows `owner/admin/dispatcher`
Reason: This matches RLS write policy design and keeps mutation authority consistent across drivers, vehicles, trips, ELD, inspections, maintenance, safety, and alerts.

## [2026-03-14] Onboarding invitations stored in DB instead of direct user provisioning
Reason: Invites should work even before invited users register. `company_invitations` allows role assignment and lifecycle tracking without requiring an existing `auth.users` row.

## [2026-03-14] Auth flow via Next.js Server Actions
Reason: Keeps credentials on the server boundary, uses existing Supabase SSR cookie handling, and avoids client-side auth state drift during redirects.

## [2026-03-14] Route protection duplicated at middleware and server layout level
Reason: Middleware handles edge redirects early; layout-level `getUser()` checks enforce protection during direct server rendering and prevent accidental exposure if middleware matcher changes.

## [2026-03-14] MVP schema starts from compliance-critical entities
Reason: PRD emphasizes FMCSA/ELD compliance and operational visibility as immediate customer value. We prioritized entities required for ELD logs, trips, inspections, safety events, maintenance, and alerts.

## [2026-03-14] Multi-tenant isolation via `companies` + `company_members`
Reason: Product is B2B SaaS for fleets. Every domain table carries `company_id`, and access is policy-gated by company membership roles.

## [2026-03-14] Role model for phase 1: `owner/admin/dispatcher/driver/viewer`
Reason: This captures core operational responsibilities without overfitting early. Write access is restricted to `owner/admin/dispatcher` for core operational tables.

## [2026-03-14] Auto-owner membership on company creation
Reason: Reduces onboarding friction and prevents orphan company records by auto-linking `created_by` as `owner`.

## [BOILERPLATE] App Router over Pages Router
Reason: Next.js 15 best practices; RSC-first architecture; better Supabase SSR integration.

## [BOILERPLATE] pnpm over npm/yarn
Reason: Faster installs, strict dependency resolution, disk efficiency for monorepos.

## [BOILERPLATE] @supabase/ssr over @supabase/auth-helpers-nextjs
Reason: auth-helpers is deprecated; @supabase/ssr is the current recommended approach.

## [BOILERPLATE] TanStack Query over SWR
Reason: More features (mutations, optimistic updates, infinite queries), better DevTools.

## [2026-03-14] Phase 4 dashboard uses React Query over client-side fetch effects
Reason: Aligns with project convention (no useEffect data fetch), gives cache invalidation after mutations, and keeps each module UI straightforward while API surface stabilizes.

## [2026-03-14] E2E authenticated spec is env-gated
Reason: Shared environments may not have fixed test credentials. Authenticated Playwright flow runs only when E2E_TEST_EMAIL and E2E_TEST_PASSWORD are provided, while unauthenticated smoke coverage always runs.

## [2026-03-14] Demo charts use lightweight CSS bars instead of charting library
Reason: For demo readiness, this avoids extra dependency risk while still providing clear visual signal for event/status distributions.

## [2026-03-14] Loading and empty states standardized via shared dashboard table-state component
Reason: Consistent UX across modules and faster iteration with less duplicated table-state markup.

## [2026-03-14] Dashboard UI uses shared status-badge + shadcn table primitives for core operational lists
Reason: Consistent visual semantics across drivers/vehicles/trips/alerts improves demo readability and reduces repeated table markup while keeping existing API behavior intact.

## [2026-03-14] Dashboard analytics visuals use Recharts for premium admin UX
Reason: Recharts provides expressive charts with minimal integration overhead in client components, improving demo readability while preserving existing API contracts and backend logic.

## [2026-03-14] Global search implemented as route-query UI filtering (no API contract changes)
Reason: Keeps backend unchanged and preserves existing API semantics while enabling fast cross-module lookup from the navbar via shared ?search= parameters and client-side filtering.

## [2026-03-14] Dashboard navigation icon metadata must remain serializable across server/client boundary
Reason: Passing Lucide component functions from a Server Component into Client Component props breaks React Server Components serialization; use icon keys and resolve to components within the client boundary instead.

## [2026-03-14] Seed data uses deterministic timestamps + natural keys for idempotency
Reason: Re-running demo seeds must not create duplicate trips/safety events; fixed time anchors and existing-row checks keep seed runs repeatable and safe.

## [2026-03-14] Seed upserts must target primary keys only
Reason: upsert conflict targets must map to unique/exclusion constraints; using stable UUID id values avoids runtime ON CONFLICT errors and keeps re-seeding deterministic.

## [2026-03-14] Heavy dashboard client modules are route-split with `next/dynamic`
Reason: Charting, command palette, and module-heavy clients were inflating initial route payloads; dynamic imports keep inactive module code off the critical path without API or behavior changes.

## [2026-03-14] React Query defaults standardized for dashboard workloads
Reason: Fleet operations screens are read-heavy but tolerant of minute-level staleness; 60s stale time + limited retries reduce network churn and UI thrash while preserving responsiveness.

## [2026-03-14] Membership role updates restricted to owners only
Reason: Allowing admins to update `company_members` rows can permit ownership-related privilege escalation paths; owner-only update policy enforces stricter org-control boundaries.

## [2026-03-14] Owner-only update control for organization-level RBAC state
Reason: Restricting updates to `company_members` and `companies` to owners eliminates admin-level privilege escalation vectors for membership and ownership metadata.
## [2026-03-14] Operational writes remain role-scoped to owner/admin/dispatcher with explicit UPDATE checks
Reason: Demo users need reliable edit flows on operational entities, while `driver`/`viewer` remain read-only and ownership-critical tables (`companies`, `company_members`) stay owner-restricted.

## [2026-03-14] Vehicles name compatibility handled at API/UI level without schema migration
Reason: Mixed environments may lack `vehicles.name`; API now safely falls back on undefined-column behavior and UI consistently renders `vehicle.name ?? vehicle.unit_number` to avoid breaking deployments while preserving data model stability.



## [2026-03-14] Marketing homepage CTA strategy removes demo-entry framing
Reason: Production positioning requires conversion-oriented navigation (/register + /login) and removal of exposed demo credentials while keeping backend/auth flows unchanged.
## [2026-03-14] Public marketing homepage moved to client-rendered motion composition\nReason: Using framer-motion for scroll reveal and interactive SaaS presentation requires a client boundary, while backend/auth/API remain unchanged and isolated from marketing UI.
