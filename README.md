# RoofingMarketplace

A two-sided marketplace connecting **homeowners** who need roof work with **roofers** who want pre-qualified jobs.

## How it works

**For homeowners**

- Enter a property address on the homepage. An AI roof analysis runs on satellite imagery and produces a quote record with roof measurements and an estimate.
- Review the instant quote, then submit a bid request that becomes a project.
- Track the project end to end: scheduled -> materials ordered -> in progress -> inspection -> completed -> warranty — with before/after photos, a materials list, dual-signed contracts, and milestone payments.

**For roofers**

- Sign up with document verification.
- Browse and claim pre-qualified leads with roof measurements already done for them — lead assignment and lead-claim checkout are built in.
- Manage jobs from a dedicated dashboard, collect milestone payments via Stripe, and get automated daily milestone-payment reminders.

**Pages (11):** Home, QuoteResult, BidSubmission, ProjectView, HomeownerDashboard, RooferSignup, RooferProfile, RoofersList, RooferDashboard, Inbox, OAuthConsent.

## Tech stack

- Frontend: React + Vite + Tailwind CSS (Radix/shadcn UI components, lucide icons)
- Backend: Base44 platform — data entities (`base44/entities`: Project, RoofQuote, ...), serverless functions (`base44/functions`: satellite-image fetch, roofer document verification, lead assignment, lead-claim and milestone checkouts, Stripe webhooks, milestone reminders), and scheduled workflows (`base44/workflows`: daily milestone payment reminders)
- Payments: Stripe (milestone checkouts, lead-claim checkouts, webhooks)
- The frontend talks to the backend only through `@base44/sdk` (`src/api/base44Client.js`)

## Run locally

```bash
git clone https://github.com/alexwboles/RoofingMarketplace.git
cd RoofingMarketplace
npm install
```

Create `.env.local`:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

Then:

```bash
npm run dev      # local dev server
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # eslint
npm run typecheck
```

## Status

Functional prototype — the marketplace flow works end to end on the Base44-hosted backend. This repo supersedes the earlier `RoofingHelper` and `roofing` prototypes (both archived). No automated test suite yet.

## Backend lock-in: Base44 (read this before depending on it)

This product is built on a third-party backend platform, and that is its biggest risk:

- All data lives in Base44-hosted entities — there is no local schema or migration story today.
- Auth, the serverless functions, and the scheduled workflows all execute on Base44 infrastructure. If the Base44 app is decommissioned, paused, or changes terms, the backend goes with it.
- The data model and function logic are declared in the `base44/` directory of this repo (`config.jsonc`, `entities/`, `functions/`, `workflows/`), but the runtime is Base44's.

**Local-backend / export plan (plan only — no rewrite yet):**

1. **Export data first.** Pull every entity (quotes, projects, roofer profiles, leads, milestones, messages) out of Base44 to CSV/JSON while access is live, and keep exports current. The Base44 dashboard is not the database of record.
2. **Pick a free self-hosted backend.** A single SQLite-backed API keeps the zero-cost rule; stand it up alongside Base44, not in place of it.
3. **Add an API boundary in the frontend.** Introduce a data-access layer so pages call a local REST client instead of `base44.entities.*` directly; map each Base44 entity to a table.
4. **Re-host the functions.** Each `base44/functions/*` becomes a local endpoint: satellite-image fetch moves server-side, document verification becomes a document-check flow, Stripe webhook/checkout functions call the Stripe API directly, and the reminder workflow becomes a scheduled local job.
5. **Replace auth.** Swap Base44 auth for local session/JWT auth.
6. **Cut over.** Import the exported snapshot into the local backend, point the client at it, and decommission the Base44 app.
