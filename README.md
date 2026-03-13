# LearnHub — Online Course Platform

A full-stack online course marketplace built to generate **passive income**. Instructors upload and sell courses, students browse and learn, and the platform automatically earns 20% on every sale.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe |
| Video | react-player (YouTube / Vimeo / direct URL) |
| Hosting | Vercel (recommended) |

## Features

- **Landing page** with hero, features, featured courses, and instructor CTA
- **Auth** — email/password registration and login via Supabase
- **Course catalog** — search and filter by category
- **Course detail page** — curriculum, pricing, purchase CTA
- **Stripe payments** — one-time course purchases, webhook-based enrollment
- **Free courses** — instant enrollment without Stripe
- **Lesson player** — video playback with automatic progress tracking (marks complete at 90%)
- **Student dashboard** — my courses with progress bars
- **Instructor dashboard** — create/edit courses, add lessons, view earnings
- **Freemium model** — free preview lessons to convert visitors

## Monetization Model

- Students buy courses once ($9–$99 typical range)
- Platform takes **20%** of every sale automatically
- Instructors earn **80%** net revenue
- Free courses drive organic traffic and email signups

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd <project>
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
# Fill in your Supabase and Stripe credentials
```

### 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your URL and anon key to `.env.local`
3. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial.sql`

### 4. Stripe setup

1. Create an account at [stripe.com](https://stripe.com)
2. Copy your secret key and publishable key to `.env.local`
3. Set up a webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Listen for the `checkout.session.completed` event
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local development use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5. Run

```bash
npm run dev
# Open http://localhost:3000
```

## Deployment (Vercel)

```bash
vercel
# Set environment variables in Vercel dashboard
# Update NEXT_PUBLIC_SITE_URL to your production URL
# Update Stripe webhook to point to production URL
```

## Project Structure

```
app/
  page.tsx                       # Landing page
  login/page.tsx                 # Auth: login
  register/page.tsx              # Auth: register
  auth/callback/route.ts         # OAuth callback
  courses/
    page.tsx                     # Course catalog
    [slug]/
      page.tsx                   # Course detail + purchase
      learn/[lessonId]/page.tsx  # Lesson player
  dashboard/
    page.tsx                     # Student dashboard
    instructor/
      page.tsx                   # Instructor overview + earnings
      courses/new/page.tsx       # Create course
      courses/[id]/edit/page.tsx # Edit course + lessons
  api/
    stripe/checkout/route.ts     # Create Stripe session
    stripe/webhook/route.ts      # Handle payment events
    progress/route.ts            # Track lesson completion
components/
  Navbar.tsx
  CourseCard.tsx
  LessonSidebar.tsx
  VideoPlayer.tsx
  ProgressBar.tsx
  PurchaseButton.tsx
lib/
  supabase/client.ts
  supabase/server.ts
  stripe.ts
  utils.ts
types/index.ts
supabase/migrations/001_initial.sql
middleware.ts
```

## Adding Courses (Instructor Flow)

1. Register with role **Instructor**
2. Go to **Instructor Dashboard → New Course**
3. Fill in title, description, category, price, thumbnail
4. Add lessons with YouTube/Vimeo/direct video URLs
5. Mark free preview lessons (visible without enrollment)
6. Set status to **Published**

## Revenue Tracking

The instructor dashboard shows:
- Total students enrolled
- Gross revenue (before platform fee)
- Net revenue (80% payout after 20% platform cut)

For production, integrate **Stripe Connect** to automate payouts directly to instructors.
