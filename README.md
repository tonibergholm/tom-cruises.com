# Tom Cruises - Yacht Tracking & Stories CMS

A complete Next.js 16 content management system for tracking and sharing stories about two beautiful sailing yachts: **Pamela** (a self-built wooden yacht) and **Lyyli** (an Albatross 26).

## Features

### Public Pages
- **Home** — Browse featured boats with cover images and latest blog posts
- **Boat Detail Pages** — View complete specifications, full photo galleries, and recent stories for each boat
- **Blog** — Read stories and updates from boat owners
- **Live Tracking** — Interactive map showing current boat positions and position history

### Admin Panel
- **Dashboard** — Quick stats on photos, posts, and last tracking update
- **Boat Profile** — Edit your boat's name, specs, description, and features
- **Photo Gallery** — Upload, organize, and delete photos
- **Blog Management** — Write, edit, and publish blog posts with markdown support
- **Live Tracking** — Manually update boat position or integrate automatic GPS tracker via API

### Authentication
- Email/password login with bcrypt hashing
- Each user can only manage their own boat's content
- Session-based with JWT tokens

### GPS Integration
- Public webhook endpoint for automatic position updates from GPS trackers
- Each boat has a unique API key for tracker integration
- Support for periodic updates or real-time tracking

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with raw SQL queries
- **Auth**: NextAuth.js v4
- **Styling**: Custom CSS (no Tailwind) with maritime navy blue theme (#004466)
- **Maps**: Leaflet.js via CDN
- **Password Hashing**: bcryptjs
- **File Storage**: Local filesystem (`public/uploads/`)

## Project Structure

```
/
├── app/                           # Next.js App Router
│   ├── api/                       # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   ├── boats/[slug]/         # Boat data API
│   │   ├── photos/               # Photo upload/delete
│   │   ├── posts/                # Blog CRUD
│   │   └── tracking/             # GPS tracking endpoints
│   ├── admin/                     # Protected admin pages
│   │   ├── layout.tsx            # Admin sidebar layout
│   │   ├── login/                # Login page
│   │   ├── page.tsx              # Dashboard
│   │   ├── boat/                 # Edit boat profile
│   │   ├── photos/               # Photo management
│   │   ├── posts/                # Blog post management
│   │   └── tracking/             # Position updates
│   ├── blog/                      # Public blog pages
│   ├── [boatSlug]/               # Public boat detail pages
│   ├── tracking/                 # Public tracking map
│   ├── layout.tsx                # Root layout with Header/Footer
│   ├── page.tsx                  # Home page
│   └── globals.css               # All styles
├── components/                    # React components
│   ├── Header.tsx                # Navigation header
│   ├── Footer.tsx                # Site footer
│   ├── Gallery.tsx               # Photo gallery with lightbox
│   └── TrackingMap.tsx           # Leaflet map component
├── lib/                          # Utilities
│   ├── db.ts                     # PostgreSQL connection pool
│   └── auth.ts                   # NextAuth configuration
├── types/                        # TypeScript definitions
│   └── next-auth.d.ts            # Session/JWT type extensions
├── db/                           # Database
│   └── schema.sql                # PostgreSQL schema and seed data
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
├── .env.example                  # Example environment variables
└── DEPLOY.md                     # Complete deployment guide
```

## Getting Started

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd tom-cruises.com
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your local PostgreSQL connection string

4. **Create the database**
   ```bash
   createdb tomcruises
   npm run db:setup
   ```

5. **Create test admin user**
   ```bash
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('testpass', 10))"
   ```
   Then insert into the database with your generated hash

6. **Start the development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

### Production Deployment

See [DEPLOY.md](./DEPLOY.md) for complete step-by-step deployment instructions including:
- Setting up PostgreSQL database
- Creating admin users
- Building and deploying with PM2
- Configuring nginx reverse proxy
- Setting up HTTPS with Let's Encrypt
- GPS tracker integration
- Database backups and monitoring

## Key Files

### Database Schema (`db/schema.sql`)
- `boats` — Yacht information with API key for GPS tracking
- `users` — Admin users with bcrypt password hashes, linked to boats
- `boat_images` — Photo gallery, organized by boat
- `blog_posts` — Blog posts linked to boats, with publish status
- `boat_tracking` — GPS tracking history with lat/lng, speed, heading

### API Routes
- `GET /api/boats/[slug]` — Public boat data (no API key exposed)
- `PUT /api/boats/[slug]` — Update boat profile (auth required, ownership verified)
- `POST/GET /api/photos` — Upload/list photos (auth required)
- `DELETE /api/photos/[id]` — Delete photo (auth required, ownership verified)
- `POST/GET /api/posts` — Create/list blog posts (auth required)
- `GET/PUT/DELETE /api/posts/[id]` — Manage blog posts (ownership verified)
- `GET/POST /api/tracking` — Get/record boat positions (auth required)
- `POST /api/tracking/ingest` — Public webhook for GPS trackers (API key auth)

### Admin Pages
All under `/admin/` with session authentication and boat ownership verification:
- `/admin` — Dashboard with stats
- `/admin/boat` — Edit boat details
- `/admin/photos` — Upload/manage gallery
- `/admin/posts` — Blog post list
- `/admin/posts/new` — Create blog post
- `/admin/posts/[id]` — Edit blog post
- `/admin/tracking` — Update position, configure GPS integration

## Styling

All styles are in `app/globals.css`. The design uses:
- **Primary color**: #004466 (Navy blue)
- **Background**: #f9f9f9 (Off-white)
- **Accent**: Teal highlights for interactive elements
- **Font**: Segoe UI, sans-serif
- **Layout**: Responsive grid-based design, mobile-friendly

No external CSS frameworks — everything is custom for precise maritime theme control.

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/tomcruises
NEXTAUTH_SECRET=random-secret-key (generate: openssl rand -base64 32)
NEXTAUTH_URL=https://tom-cruises.com
NODE_ENV=production
```

## GPS Tracker Integration

To connect an automatic GPS tracker (e.g., Traccar, Gpxe, etc.):

1. Get your boat's API key from `/admin/tracking`
2. Configure your GPS device to POST to: `https://tom-cruises.com/api/tracking/ingest`
3. Send JSON with this structure:
   ```json
   {
     "apiKey": "your-boat-api-key",
     "lat": 60.123456,
     "lng": 25.123456,
     "note": "Optional note",
     "speed": 5.2,
     "heading": 180
   }
   ```

The tracking data is stored in `boat_tracking` table and displayed on the public `/tracking` page.

## Database Schema

The system uses 5 main tables:

- **boats** — Yacht profiles (Pamela, Lyyli) with full specifications
- **users** — Admin accounts, one per boat
- **boat_images** — Gallery photos, sortable and deletable
- **blog_posts** — Owner stories, draft/published status
- **boat_tracking** — GPS position history with timestamps

All foreign keys cascade on delete. Indexes optimize common queries.

## Development Notes

- TypeScript throughout with strict mode enabled
- No `any` types — proper type safety
- Raw SQL queries with parameterized statements (SQL injection safe)
- Server components by default, client components only where needed ('use client')
- Error handling with try/catch in all API routes
- Proper HTTP status codes (201 for create, 401 for auth, 404 for not found, etc.)

## Deployment

The complete deployment guide covers:
1. Copying files to server
2. Installing Node.js dependencies
3. Setting up PostgreSQL database
4. Creating admin users with bcrypt hashing
5. Building the Next.js project
6. Starting with PM2 process manager
7. Configuring nginx as reverse proxy
8. Setting up HTTPS with Let's Encrypt
9. Integrating GPS trackers
10. Database backups and monitoring

See [DEPLOY.md](./DEPLOY.md) for all detailed steps.

## Support

For issues or questions about deployment, check the Troubleshooting section in DEPLOY.md.

---

**Tom Cruises** — Tracking the maritime adventures of Pamela and Lyyli.
