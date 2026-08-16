# TripBoard

> Plan your trip. Make it beautiful.

A minimal, mobile-first travel itinerary planner. Create a trip, arrange your
days with a simple timeline, track your budget, and share a beautiful
read-only version with anyone — no account, no database.

Built with Next.js (App Router), TypeScript, Tailwind CSS and shadcn-style UI
components. All trip data is stored in your browser's localStorage; share
links carry the itinerary compressed inside the URL.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production

```bash
npm run build
npm run start
```

## Deploy

Deploy with Vercel:

1. Push this repository to GitHub.
2. Import it in the Vercel dashboard (framework preset: Next.js — auto-detected).
3. Optional: set the environment variable below.

### Environment variables

| Variable               | Required | Description                                                            |
| ---------------------- | -------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | No       | Absolute URL of the deployed site (used for canonical URLs & Open Graph), e.g. `https://tripboard.vercel.app`. Falls back to the current origin. |

Copy `.env.example` to `.env.local` for local overrides. Never commit
`.env.local`.

## What's inside

- `/` — landing page with a live demo timeline
- `/new` — create a trip
- `/my-trips` — your saved trips (open / duplicate / rename / delete / share)
- `/trip/[id]` — the trip editor (timeline, drag & drop, budget)
- `/share/[payload]` — public read-only itinerary (data lives in the URL)
- `/about`, `/privacy`, `/terms` — simple informational pages
- PNG export (story card 1080×1920 + full-itinerary long image)
- EN / 中文 language switch

## Scripts

```bash
npm run dev       # development server
npm run build     # production build
npm run start     # serve the production build
npm run lint      # eslint
```
