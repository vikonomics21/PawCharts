# PawChart

PawChart is a mobile-first PWA for pet care records, reminders, household sharing, and public vaccination links.

Local development keeps a rich mock-data playground for product/design work. Production is guarded so signed-out users see authentication and signed-in users load Supabase-backed data instead of demo records.

## Current Scope

- Next.js 14 App Router
- Tailwind CSS
- Shadcn-style local component setup
- PWA manifest, app icons, service worker, and iOS homescreen metadata
- Mobile app shell optimized around a 390px iPhone viewport
- Local-only mock Home, Pets, Records, and Household workflows
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

- `src/components/pawchart-app.tsx` - product UI with explicit local-demo versus production data modes
- `src/data/demo.ts` - local-only demo pets, tasks, vaccines, care events, documents, and lists
- `src/lib/brand.ts` - centralized placeholder branding
- `src/lib/supabase/` - Supabase client helpers and first persistence adapters
- `src/app/auth/` - Google OAuth server actions and callback route
- `public/manifest.json` - PWA manifest
- `public/sw.js` - basic app-shell service worker
- `supabase/migrations/0001_initial_schema.sql` - database blueprint for the future Supabase project
- `.env.local` - local-only Supabase credentials; ignored by git

## Data Modes

- Local development: loads the full demo playground from `src/data/demo.ts` so feature design stays easy to visualize.
- Production: never falls back to demo pets, records, documents, share links, or fake household access. Signed-out users see sign-in; signed-in users receive Supabase-backed initial data as each screen is migrated.
- Starter templates can remain available as product scaffolding, but fake user-owned records must stay out of production paths.

## Production Environment

Set these in Vercel for the private beta:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - browser-safe Supabase publishable key.
- `SUPABASE_SECRET_KEY` - server-only Supabase secret key for onboarding bootstrap and read-only support. `SUPABASE_SERVICE_ROLE_KEY` is accepted as a fallback name.
- `ADMIN_EMAILS` - comma-separated emails allowed to access `/support`.
- `NEXT_PUBLIC_SITE_URL` - production site URL, such as `https://pets.vikonomics.com`.

Never put secret keys in frontend code or committed files.

## OAuth Branding Checklist

Google OAuth currently redirects through Supabase Auth, so Google may show the Supabase project domain during consent. For a fully branded production flow, add a Supabase custom Auth domain such as `auth.vikonomics.com`, then add `https://auth.vikonomics.com/auth/v1/callback` to the Google OAuth client. Keep the existing Supabase callback during the transition. Also confirm Google Auth Platform branding uses `PawChart`, the PawChart logo, a support email, and the authorized domain `vikonomics.com`.

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
- Google OAuth is the current private-beta sign-in method through Supabase Auth.
