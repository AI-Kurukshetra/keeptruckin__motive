# BLOCKERS
[2026-03-14 10:46] BLOCKER - codex
Problem:   `pnpm test` fails before running tests due Vitest/Vite startup error (`spawn EPERM` from externalize-deps plugin).
Attempted: Ran `pnpm test` multiple times after successful `pnpm typecheck` and `pnpm lint`.
Needs:     Environment-level fix for process spawn permissions on this machine/session to run Vitest.
[2026-03-14 18:03] BLOCKER — codex
Problem:   `pnpm exec next build` fails in local environment with `spawn EPERM` during Next.js production build process startup.
Attempted: Ran both `pnpm exec next build` and `pnpm build`; both fail consistently with identical EPERM spawn error.
Needs:     Environment-level process permission fix on this machine/session to allow Next build subprocess spawn.
