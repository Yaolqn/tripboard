# TripBoard

> Plan your trip. Make it beautiful.

A minimal, mobile-first travel itinerary planner with accounts, cloud sync and
public trip pages. Create a trip, arrange your days with a simple timeline,
track your budget, publish it, and share a beautiful read-only page with
anyone.

Built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn-style UI
components and **Supabase** (Auth + PostgreSQL).

## Features

- Email + Google authentication (Supabase Auth)
- Cloud trips (PostgreSQL with Row Level Security)
- Guest mode: without signing in, trips live in localStorage as before
- One-click import of existing localStorage trips after signing in
- Public / unlisted / private trip visibility with SEO-ready public pages
- Explore page for public trips (destination + duration filters)
- Ready-made travel templates (copy one into your own trip)
- Themes (Minimal / Classic / Mono + PRO placeholders) and preset covers
- Invite links (editor / viewer roles)
- PNG export, EN / 中文 switch, offline-safe editor

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Supabase keys the app runs in guest mode.

## Supabase setup (one-time)

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run the whole file `sql/schema.sql` — it creates all
   tables (profiles, trips, trip_days, activities, trip_members, trip_invites),
   the signup profile trigger, and all Row Level Security policies.
3. Copy the **Project URL** and **anon public key** from Settings → API into
   `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. (Optional) Enable Google sign-in: Supabase Dashboard → Authentication →
   Providers → Google — add your Google OAuth Client ID/Secret, and set the
   **Redirect URL** `https://<your-domain>/auth/callback` (both on Google Cloud
   and in Supabase → Authentication → URL Configuration).

## Amap POI search (optional)

The place picker can search Amap (Gaode) POIs through the server route
`/api/places/search`. Configure the following variables in `.env.local` or your
deployment environment:

```env
# Browser JS API 2.0
NEXT_PUBLIC_AMAP_JS_KEY=
NEXT_PUBLIC_AMAP_SECURITY_CODE=

# Server-side POI search
AMAP_WEB_SERVICE_KEY=
```

`NEXT_PUBLIC_AMAP_JS_KEY` is used by the browser map loader and should be
restricted with a domain whitelist. The JS API security code must be configured
through environment variables and must never be committed to GitHub. The
`AMAP_WEB_SERVICE_KEY` is server-only and is read only by the Next.js route
`/api/places/search`; never expose it with a `NEXT_PUBLIC_` prefix. No Web
Service secret is required. If the Web Service key is not configured, users can
still type and save a location manually.

## Production

```bash
npm run build
npm run start
```

## Deploy (Vercel)

1. Push this repository to GitHub.
2. Import it in Vercel (framework: Next.js — auto-detected).
3. Add environment variables in the Vercel dashboard (Production):

| Variable                   | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | Your production URL, e.g. `https://tripboard.vercel.app`               |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL                                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key (safe for the browser; never use the service-role key) |
| `NEXT_PUBLIC_AMAP_JS_KEY` | AMap JS API 2.0 browser key; restrict it with the production/local domain whitelist |
| `NEXT_PUBLIC_AMAP_SECURITY_CODE` | AMap JS API security code; configure it in the deployment platform and never commit the value |
| `AMAP_WEB_SERVICE_KEY` | AMap Web Service key used only by the server-side `/api/places/search` route |

Never commit `.env.local` or any secret.

## What's inside

- `/` — landing page with a live demo timeline
- `/login`, `/signup` — email + Google authentication
- `/new` — create a trip (cloud when signed in, localStorage for guests)
- `/my-trips` — upcoming/past trips with status and progress
- `/trip/[uuid]` — the editor (timeline, drag & drop, budget)
- `/trip/[slug]` — public trip page with dynamic SEO metadata
- `/explore` — public trips with filters
- `/templates`, `/templates/[slug]` — ready-made itineraries
- `/invite/[token]` — join a trip via invite link
- `/share/[payload]` — URL-encoded read-only itinerary (legacy sharing)
- `/sitemap.xml`, `/robots.txt` — public content only
- `/about`, `/privacy`, `/terms`, `/settings`

## Scripts

```bash
npm run dev       # development server
npm run build     # production build (includes eslint + typecheck)
npm run start     # serve the production build
npm run lint      # eslint
```
