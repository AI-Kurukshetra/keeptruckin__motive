# CHANGELOG
## 2026-03-14
- Parsed Motive/KeepTruckin blueprint PDF and replaced placeholder PRD with structured requirements in `doc/PRD.md`.
- Decomposed project backlog into phased execution tasks in `doc/TASKS.md`.
- Added core MVP Supabase migration: `supabase/migrations/20260314094800_core_mvp_tables.sql`.
- Introduced core tables: `companies`, `company_members`, `drivers`, `vehicles`, `trips`, `eld_logs`, `inspections`, `maintenance_records`, `safety_events`, `alerts`.
- Added constraints, indexes, `updated_at` trigger function, role helper function, owner auto-membership trigger, and RLS policies.
- Added onboarding invitations migration: `supabase/migrations/20260314104500_company_invitations.sql`.
- Documented schema and access model in `doc/SCHEMA.md`.
- Linked Supabase project (`uvikmlzvksuilwkxmhao`) and pushed database migrations.
- Regenerated `types/supabase.ts` from remote project schema.
- Implemented auth server actions for login/register/logout in `app/actions/auth.ts`.
- Replaced placeholder auth screens with working forms in `app/(auth)/login/page.tsx` and `app/(auth)/register/page.tsx`.
- Added server-side auth route guards in `app/page.tsx`, `app/(auth)/layout.tsx`, and `app/(dashboard)/layout.tsx`.
- Implemented onboarding server actions in `app/actions/onboarding.ts` for company creation and role-based invite creation.
- Updated dashboard home screen to include onboarding and invite workflow UI.
- Added shared API helpers in `lib/api/` and dedicated API validation schemas in `lib/validations/api.ts`.
- Implemented Phase 3 API endpoints:
  - `app/api/drivers` + `app/api/drivers/[id]`
  - `app/api/vehicles` + `app/api/vehicles/[id]`
  - `app/api/trips` + `app/api/trips/[id]`
  - `app/api/eld`
  - `app/api/inspections` + `app/api/inspections/[id]`
  - `app/api/maintenance` + `app/api/maintenance/[id]`
  - `app/api/safety` + `app/api/safety/score`
  - `app/api/alerts` + `app/api/alerts/[id]`

## Boilerplate
- Initialised Next.js 15 with App Router + Turbopack
- Installed: Supabase SSR, TanStack Query, React Hook Form, Zod, nuqs, shadcn/ui, Vitest, Playwright
- Scaffolded full folder structure per AGENTS.md spec
- Configured TypeScript strict mode
- Configured Vitest + Playwright
- Added Supabase SSR client/server/middleware pattern
- Added auth callback route handler
- Wired TanStack Query + Toaster providers

- Implemented Phase 4 dashboard frontend modules (/drivers, /vehicles, /trips, /eld, /inspections, /maintenance, /safety, /alerts) with React Query list/create flows and alerts status actions.
- Added shared dashboard/frontend helpers: lib/supabase/company.ts, lib/api/fetcher.ts, and dashboard utility components.
- Added unit tests: tests/unit/validations-auth-onboarding.test.ts, tests/unit/validations-api.test.ts, tests/unit/api-fetcher.test.ts, and tests/unit/api-drivers-route.test.ts.
- Added E2E specs: tests/e2e/auth-smoke.spec.ts and tests/e2e/dashboard-auth.spec.ts (credential-gated for authenticated flow).

- Expanded unit tests with tests/unit/api-item-routes.test.ts, tests/unit/api-request-utils.test.ts, and endpoint route tests for vehicles/trips/alerts/safety.

- Added dashboard overview analytics module with fleet metrics, fleet health score, and lightweight bar charts for safety/maintenance/inspections.
- Upgraded alerts module UI with severity badges, status/severity/search filters, and clearer resolution workflow.
- Added reusable shadcn-based loading/empty table states (components/dashboard/table-states.tsx) and integrated across dashboard modules.

- Performed final repo review: validated Phase 1-5 completion status in doc/TASKS.md (with accepted Vitest runtime exception), reconfirmed migration/schema/API alignment, and revalidated code quality via pnpm typecheck + pnpm lint (both passing).
- Fixed Tailwind v4 configuration in app/globals.css by migrating to @import "tailwindcss" and adding @theme inline mappings for shadcn color/radius tokens (card, foreground, border, input, ring, radius-*).
- Updated app/actions/auth.ts and app/(auth)/register/page.tsx so registration failures preserve and display Supabase error.message on the register screen.
- Refactored dashboard shell/layout to SaaS-style navigation with icon sidebar + active route highlighting in app/(dashboard)/layout.tsx and components/dashboard/sidebar-nav.tsx.
- Upgraded dashboard overview visuals with icon metric cards, responsive card grid, improved fleet health presentation, and preserved existing data logic in app/(dashboard)/dashboard/_components/overview-client.tsx.
- Migrated drivers/vehicles/trips/alerts tables to shadcn table components with improved card spacing and loading/empty row rendering; added reusable status badges in components/dashboard/status-badge.tsx.
- Added Recharts dependency and replaced dashboard overview mini-bars with chart cards (safety distribution, maintenance status, inspections status) in app/(dashboard)/dashboard/_components/overview-client.tsx.
- Added Quick Actions card and Recent Activity timeline card to dashboard overview using existing API data (drivers, vehicles, trips, alerts) with Lucide icons and shadcn Card/Badge/Separator composition.
- Added cmdk + shadcn Command primitives (components/ui/command.tsx) and integrated a global dashboard command palette with route/action entries + keyboard support in components/dashboard/dashboard-toolbar.tsx.
- Added app-wide theme support by wrapping providers with next-themes ThemeProvider and introduced light/dark toggle control (components/theme-provider.tsx, components/theme-toggle.tsx).
- Refined dashboard shell/header for premium UX and added scoped navbar global search that routes to /drivers|/vehicles|/trips with ?search filtering; corresponding page/client components now consume searchParams for UI-level filtering only.
- Fixed dashboard nav serialization bug: app/(dashboard)/layout.tsx now passes icon string keys, and components/dashboard/sidebar-nav.tsx maps keys to Lucide icons client-side to avoid server-to-client function prop transfer.
- Re-ran full Playwright QA suite after serialization fix; artifacts: output/playwright/qa-report-1773477890823.json and output/playwright/qa-final-1773477890823.png.
- Refactored output/playwright/full-qa-run2.js to use getByTestId()-based selectors for critical interactions and reran QA; latest artifact report: output/playwright/qa-report-1773478610055.json.
- Added Playwright-friendly data-testid hooks to key UI elements: register/login forms, dashboard metric cards, command palette trigger/items, add driver/vehicle/create trip buttons, alerts table, dark mode toggle, and global search controls.
- Added deterministic, idempotent TypeScript seed workflow in `supabase/seed/seed.ts` (production-guarded, service-role inserts, realistic Atlas Freight Logistics dataset with linked drivers/vehicles/trips/alerts/safety/maintenance) and added `db:seed` script in `package.json`.
- Fixed seed conflict strategy in `supabase/seed/seed.ts`: company/driver/vehicle upserts now target primary key `id` with stable seeded UUIDs instead of non-PK conflict columns.
- Fixed Vercel deploy blocker: updated `middleware.ts` to use relative import for `updateSession` to satisfy Edge function bundling on Vercel.
- Fixed production 500 (MIDDLEWARE_INVOCATION_FAILED): hardened `lib/supabase/middleware.ts` to fail-open when env/auth session access fails and configured required Vercel production environment variables for Supabase.
- Added `vercel.json` to force Next.js framework/build commands for Vercel Git deployments, resolving production NOT_FOUND on app routes.
- Enhanced `supabase/seed/seed.ts` to provision role-based QA users and `company_members` mappings for Atlas Freight Logistics, enabling immediate multi-role login testing.
- Stabilized `middleware.ts` for Vercel Edge: added env-variable bypass, wrapped session update in try/catch fallback, and restored broad route matcher without crashing requests.
- Added robust full-suite QA runner `output/playwright/full-qa-prod-demo.js` and generated required artifacts at `output/qa-report.json` and `output/qa-screenshots/`.
- Deployed latest stability updates to Vercel production and refreshed full QA artifacts (`output/qa-report.json`, `output/qa-screenshots/`).
- Added new premium marketing landing experience (`app/page.tsx`, `components/landing/landing-page.tsx`) with hero, product preview, features, AI intelligence cards, workflow diagram, stack section, demo credentials, and responsive footer.
- Phase 3 performance polish: introduced route-safe dynamic imports for dashboard toolbar, overview analytics, and feature module clients to reduce initial JS on non-active modules.
- Tuned React Query defaults in `components/providers.tsx` to `staleTime: 60s`, `gcTime: 5m`, `retry: 1`, and `refetchOnWindowFocus: false`; also devtools now loads only in development via dynamic import.
- Added reusable skeleton system in `components/dashboard/page-skeleton.tsx` and wired route/global loaders via `app/(dashboard)/loading.tsx` and `app/loading.tsx`.
- Added reusable actionable empty-state card (`components/dashboard/empty-state.tsx`) and integrated it in drivers/vehicles/trips/alerts modules.
- Improved dashboard UI consistency with refined `PageHeader`, badge labeling, no-company CTA, table row hover states, and card transition polish.
- Build verification note: `pnpm exec next build` currently fails in this environment with `spawn EPERM` (machine-level runtime/process restriction).
