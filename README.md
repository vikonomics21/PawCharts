# PawChart

PawChart is a mobile-first PWA prototype for pet care records, reminders, household sharing, and public vaccination links.

This first version is intentionally mock-data driven so the product experience can be tested before Supabase auth and screen-level persistence are connected.

## Current Scope

- Next.js 14 App Router
- Tailwind CSS
- Shadcn-style local component setup
- PWA manifest, app icons, service worker, and iOS homescreen metadata
- Mobile app shell optimized around a 390px iPhone viewport
- Mock Home, Pets, Records, and Household tabs
- One-tap care logging interactions
- Demo dog and cat profiles with species-specific fields
- Supabase SQL migration blueprint with household roles, records, reminders, sharing, documents, and RLS policies
- Supabase project connection with the initial schema pushed remotely
- Google OAuth plumbing through Supabase Auth

## Run Locally

```bash
npm run dev
```

Open http://localhost:3000.

## Important Files

- `src/components/pawchart-app.tsx` - current mock product UI
- `src/data/demo.ts` - demo pets, tasks, vaccines, and care events
- `src/lib/brand.ts` - centralized placeholder branding
- `src/lib/supabase/` - Supabase client helpers and first persistence adapters
- `src/app/auth/` - Google OAuth server actions and callback route
- `public/manifest.json` - PWA manifest
- `public/sw.js` - basic app-shell service worker
- `supabase/migrations/0001_initial_schema.sql` - database blueprint for the future Supabase project
- `.env.local` - local-only Supabase credentials; ignored by git

## Project Memory

- `symbolic-space.md` - why PawChart should feel and behave a certain way
- `product-principles.md` - durable product rules for feature decisions
- `ux-patterns.md` - reusable interaction patterns for the app
- `mvp-scope.md` - what is in scope now versus later
- `decision.md` - concrete product and technical decisions already made

## Product Notes

- Visible branding is centralized because PawChart may be renamed later.
- Custom care events are supported in the data model but are not default UI clutter.
- Public share links are designed to stay active until revoked.
- Documents are designed to be manually attached to share links for safer UX.
- Google OAuth will be added after the core product workflow is easier to test.
