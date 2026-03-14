# BLOCKERS
[2026-03-14 10:46] BLOCKER - codex
Problem:   `pnpm test` fails before running tests due Vitest/Vite startup error (`spawn EPERM` from externalize-deps plugin).
Attempted: Ran `pnpm test` multiple times after successful `pnpm typecheck` and `pnpm lint`.
Needs:     Environment-level fix for process spawn permissions on this machine/session to run Vitest.
