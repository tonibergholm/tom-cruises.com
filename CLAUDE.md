# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tom Cruises is a Next.js 14 CMS for tracking and sharing stories about two sailing yachts: **Pamela** (self-built wooden yacht) and **Lyyli** (Albatross 26). It includes public pages (home, boat details, blog, live GPS tracking map) and an admin panel where each boat owner manages their own content.

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run start        # Start production server on port 3000
npm run db:setup     # Initialize PostgreSQL schema from db/schema.sql
```

## Architecture

- **Framework**: Next.js 14 App Router with TypeScript (strict mode)
- **Database**: PostgreSQL via raw SQL with `pg` connection pool (`lib/db.ts` exports `query()`)
- **Auth**: NextAuth.js v4 with credentials provider, JWT sessions (`lib/auth.ts`)
- **Styling**: Custom CSS only (`app/globals.css`), no Tailwind. Maritime navy blue theme (#004466)
- **Maps**: Leaflet.js loaded via CDN in `components/TrackingMap.tsx`
- **Images**: Stored on local filesystem in `public/uploads/`, unoptimized (Next.js image optimization disabled)
- **Path aliases**: `@/*` maps to project root

### Data Model

Five PostgreSQL tables (see `db/schema.sql`): `boats`, `users`, `boat_images`, `blog_posts`, `boat_tracking`. Each user is linked to one boat via `boat_id` — all admin operations verify ownership against the session's `boatId`.

### Auth Flow

Session includes custom `boatId` and `boatSlug` fields injected via JWT callbacks in `lib/auth.ts`. Admin pages and API routes check these to enforce per-boat ownership. Login page is at `/admin/login`.

### API Routes

All under `app/api/`. Most require NextAuth session and verify boat ownership. Exception: `POST /api/tracking/ingest` is a public webhook authenticated by per-boat API key (stored in `boats.api_key`).

### Legacy Static Pages

Root-level HTML files (`index.html`, `pamela.html`, `lyyli.html`, `styles.css`) and `images/` directory are remnants of the old static site, predating the Next.js rewrite.

## Environment Variables

Requires `.env.local` with: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NODE_ENV`.

## Deployment

Production runs on Ubuntu with PM2 + nginx reverse proxy + Let's Encrypt SSL. See `DEPLOY.md` for full instructions.
