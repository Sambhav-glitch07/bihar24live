# BIHAR 24 LIVE

Bilingual Hindi/English digital news platform with a single-owner private newsroom CMS.

## Current delivery status

This continuation preserves the supplied archive SQL/UI and adds:

- Next.js App Router scaffold, TypeScript, Tailwind CSS v4 and app configuration
- Shared editorial header/footer and responsive base styling
- Database-backed latest-news homepage for Hindi and English routes
- Database-backed category and district listing routes
- Server-rendered article route with sibling-language switching
- Video and photo gallery read pages
- Search page (Hindi title search in this milestone)
- About, contact, privacy and terms placeholder pages (legal/contact copy must be completed by the owner)
- Supabase browser and server clients
- Admin login UI, middleware owner-profile gate and real-count dashboard shell
- Storage bucket setup and owner-only photo upload/update/delete policies in migration 0001
- Archive search deduplicates bilingual translations when no language filter is selected

The original migration files and archive UI were not applied to a live Supabase project. Some SQL hardening was made during continuation, including a serialized single-owner signup guard and public media visibility limited to published content.

## Verification record

**Not production-verified.** A Supabase project URL and publishable key were supplied during setup, but this source bundle has not been connected to that project from this environment. Database migrations, RLS/Auth/Storage/Realtime, and runtime behavior have not been independently verified.

- `package.json` JSON parse: passed.
- Local `@/` import path check: passed.
- TypeScript/TSX syntax transpilation: passed for 35 source files.
- `npm install --no-audit --no-fund`: timed out because package downloads could not complete in this environment.
- `tsc --noEmit`: cannot be considered a valid project typecheck because Next.js, React and Supabase dependencies are not installed; it reports missing module/type declarations.
- `next build`, browser testing and database tests: not run.

Do not treat the CMS, uploads, Realtime ticker, scheduled publishing, or deployment as complete. Those remain outstanding.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Supabase PostgreSQL, Auth, Realtime and Storage
- Cloudinary planned for video uploads
- Vercel planned for hosting

## Local setup

1. Use Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key.
4. Apply `supabase/migrations/0001_core_schema.sql` and then `0002_archive.sql` in the Supabase SQL editor. Confirm each migration succeeds before proceeding.
5. In Supabase Auth, disable public signups before creating the owner account.
6. Create exactly one owner user in the Supabase dashboard. Copy its auth user UUID.
7. In the Supabase SQL editor (trusted project-owner context), insert the matching profile row:

   ```sql
   insert into public.profiles (id, role, display_name)
   values ('OWNER_AUTH_USER_UUID', 'owner', 'BIHAR 24 LIVE Owner');
   ```

8. Run `npm run dev`.

Never put `SUPABASE_SERVICE_ROLE_KEY` in browser code or any `NEXT_PUBLIC_` variable. DNS must remain unchanged until the owner confirms registrar access and the new deployment has been verified.

## Implemented versus outstanding

### Implemented as source code (not runtime-verified)

- App scaffold and base public layout
- Initial public read pages listed above
- Admin sign-in UI and middleware owner check
- Dashboard count shell
- Archive page and SQL RPCs

### Still to build

- Full homepage editorial sections and full bilingual content rendering across every section
- Full admin article CRUD/editor, draft/schedule/publish workflows and owner settings
- Admin archive management, restore and confirmed permanent deletion
- Breaking-news CRUD and Supabase Realtime ticker with reconnect/polling fallback
- Photo upload UI, compression, metadata editing and assignment workflow
- Signed Cloudinary video uploads with progress/retry and owner-side CRUD
- Storage cleanup lifecycle and media backup tooling
- Protected cron endpoint and scheduled publishing execution
- Sitemap, news sitemap, robots, JSON-LD, complete hreflang and SEO verification
- Rate limiting, error monitoring, database/media backup automation
- RLS/Auth/Storage integration tests, UI tests, mobile browser tests and production deployment

## Scripts

- `npm run dev`
- `npm run typecheck`
- `npm run lint`
- `npm run build`


## Domain and deployment

The production domain is intentionally not configured. `NEXT_PUBLIC_SITE_URL` is set to localhost for development; change it only after the owner confirms the final domain. No DNS changes are part of this project bundle.
