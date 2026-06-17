# Emploid App Audit: SEO and Security

Scope: Part B3 and B4 only. This is report-only; no routing, permission, webhook, or security behavior was changed in this pass.

## Critical

### 1. Public job detail API exposes recruiter PII

- Location: `app/api/jobs/[id]/route.ts:20`, `lib/appwrite-server.ts:88`
- Why it is a problem: the public job detail API selects `job_recruiters(recruiters(*))`. The Appwrite compatibility layer hydrates those relations with the server admin key, so unauthenticated callers of `/api/jobs/[id]` can receive recruiter fields such as `email`, `linkedin_url`, and `source`.
- Proposed fix: remove `job_recruiters(recruiters(*))` from public job detail responses. Return only non-PII hiring-contact signals publicly. If recruiter contact data is a product feature, expose it through a separate authenticated route with explicit authorization.

### 2. Appwrite permissions are bypassed by public server routes

- Location: `lib/appwrite-server.ts:17`, `lib/appwrite-server.ts:241`, `scripts/setup-appwrite.mjs:163`
- Why it is a problem: browser code does not directly ship an Appwrite service key, but `createClient()` uses `createAdminServices()` even for public API routes. That means collection permissions or an Appwrite "anon role" are not the effective protection boundary for public reads; every public route must be treated as a hand-written allowlist. The recruiter leak above is a concrete example.
- Proposed fix: split public read clients from admin/service clients. Public routes should either use a least-privileged Appwrite session/client or hardcode safe field selections and safe relation hydration. Admin clients should be reserved for authenticated writes, internal jobs, and webhook handlers.

## High

### 3. Job detail pages are not server-rendered or crawlable as job pages

- Location: `app/legacy-page.tsx:22`, `app/page.tsx:18`, `app/[page]/page.tsx:42`, `app/api/jobs/[id]/route.ts:11`
- Why it is a problem: the App Router pages render static legacy HTML via `dangerouslySetInnerHTML` and rely on `public/main.js` for client-side job modal/detail behavior. There is an API route at `/api/jobs/[id]`, but no real `app/jobs/[id]/page.tsx` server page for crawlers to index as a job detail page.
- Proposed fix: add real `/jobs/[id]` App Router pages backed by Appwrite. Render the job title, company, location, description excerpt, apply URL, and trust state server-side. Keep the current modal/client behavior as an enhancement, not the only job detail surface.

### 4. JobPosting JSON-LD and Likely Ghost noindex are missing

- Location: `app/sitemap.ts:4`, `app/robots.ts:4`, missing `app/jobs/[id]/page.tsx`
- Why it is a problem: the sitemap only lists static marketing/product pages, and there is no job-specific metadata layer. Target behavior is `JobPosting` JSON-LD for indexable listings and `noindex` for `ghost_label === "Likely Ghost"`.
- Proposed fix: once `/jobs/[id]` exists, generate per-job metadata and JSON-LD from Appwrite fields. Include only indexable active jobs in the sitemap. Set `robots: { index: false, follow: true }` for Likely Ghost listings and any inactive/expired listings.

### 5. Stripe checkout trusts request origin for return URLs

- Location: `app/api/stripe/create-checkout/route.ts:51`
- Why it is a problem: checkout `success_url` and `cancel_url` are built from the incoming `Origin` header. If Stripe accepts the value, a hostile origin could influence post-checkout redirects.
- Proposed fix: derive checkout return URLs from a configured canonical site URL, or validate `Origin` against an explicit allowlist before using it.

## Medium

### 6. Stripe webhook logic trusts event arrival order

- Location: `app/api/stripe/webhook/route.ts:35`, `app/api/stripe/webhook/route.ts:57`
- Why it is a problem: the current two-event surface is simple: checkout completion upgrades, subscription deletion downgrades. If a third subscription event is added, out-of-order delivery could incorrectly set `is_pro` if the handler trusts the payload as current state.
- Proposed fix: before adding more subscription lifecycle events, re-read the subscription/customer state from Stripe and derive `is_pro` from Stripe's current canonical status.

### 7. Internal ghost-score endpoints rely on shared internal keys

- Location: `app/api/ghost-score/calculate/route.ts:28`, `app/api/ghost-score/batch/route.ts:33`
- Why it is a problem: these routes are server-only and require `INTERNAL_API_KEY`, so there is no immediate client-bundle leak. The operational risk is that a leaked shared key grants service-level mutation ability.
- Proposed fix: keep the key out of client code, rotate it periodically, and consider moving batch scoring behind scheduled infrastructure or Appwrite/server-side execution with tighter network controls.

## Low

### 8. Secret-bearing environment variables are not client-shipped in the app bundle

- Location: `lib/appwrite-server.ts:6`, `app/api/jobs/route.ts:433`, `app/api/stripe/webhook/route.ts:6`, `app/api/auth/config/route.ts:6`
- Why it is a problem: no direct leak was found. `APPWRITE_API_KEY`, `RAPIDAPI_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` are referenced from server modules/routes, not from `public/` or client components. `app/api/auth/config` returns only the Google client ID and booleans.
- Proposed fix: keep this pattern. Avoid adding any non-`NEXT_PUBLIC_` secret to `public/main.js`, client components, or responses that expose raw configuration values.

### 9. Legacy Supabase naming increases audit risk

- Location: `app/api/jobs/route.ts:611`, `app/api/stripe/webhook/route.ts:32`, `scripts/migrate-supabase-to-appwrite.mjs:4`
- Why it is a problem: the app is Appwrite-backed, but local variables and migration scripts still use Supabase naming. This already caused confusion during implementation and can lead future reviewers to inspect the wrong permission model.
- Proposed fix: rename handler locals from `supabase` to `db` or `appwrite` in a mechanical cleanup. Move historical Supabase import scripts into an archived/migration folder with clear comments that they are not the live app data path.

## Confirmed

- Browser code does not import the Node Appwrite SDK or receive `APPWRITE_API_KEY`.
- `RAPIDAPI_KEY` is used only in server-side route code for the gated JSearch supplement.
- Stripe webhook signatures are verified with `stripe.webhooks.constructEvent(...)` before event handling.
- The current SEO gap is not metadata polish; it is the absence of a real server-rendered job detail route.
