# DECISIONS
## [BOILERPLATE] App Router over Pages Router
Reason: Next.js 15 best practices; RSC-first architecture; better Supabase SSR integration.

## [BOILERPLATE] pnpm over npm/yarn
Reason: Faster installs, strict dependency resolution, disk efficiency for monorepos.

## [BOILERPLATE] @supabase/ssr over @supabase/auth-helpers-nextjs
Reason: auth-helpers is deprecated; @supabase/ssr is the current recommended approach.

## [BOILERPLATE] TanStack Query over SWR
Reason: More features (mutations, optimistic updates, infinite queries), better DevTools.
