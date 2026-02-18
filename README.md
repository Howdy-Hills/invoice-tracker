# Invoice Tracker

A construction invoice management app built with Next.js 16, Supabase, and Prisma. Track invoices, manage budgets, categorize spending, and collaborate with your team.

## Features

- **Project Management** — Create projects with budget categories, track active/completed/archived
- **Invoice Upload & Parsing** — Upload PDF invoices with automatic text extraction, or enter manually
- **AI Categorization** — Auto-categorize line items using Google Gemini or manual assignment
- **Budget Dashboard** — Real-time budget vs. actual spending with charts and breakdowns
- **Vendor Management** — Track vendors, merge duplicates, view spending history
- **Multi-User & Roles** — Owner/Admin/Viewer roles with invite links
- **Excel Exports** — Export invoices, budget reports, and vendor summaries to .xlsx

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, Server Components, Server Actions)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: Supabase Auth (email/password + magic links)
- **Storage**: Supabase Storage (PDF uploads)
- **Styling**: Tailwind CSS with warm color palette
- **AI**: Google Gemini API (optional, for invoice categorization)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- (Optional) Google Gemini API key for AI categorization

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd invoice-tracker
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL=postgresql://...        # Supabase connection string (with pgBouncer)
DIRECT_URL=postgresql://...          # Supabase direct connection (for migrations)
NEXT_PUBLIC_SUPABASE_URL=https://... # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...    # Supabase anon/public key
ENCRYPTION_KEY=...                   # 32-char key for encrypting AI API keys
```

### 3. Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

Then run these SQL files in the **Supabase SQL Editor** (Dashboard → SQL Editor):

1. `prisma/rls_org_invites.sql` — Row Level Security for org invites
2. `prisma/indexes.sql` — Performance indexes

### 4. Supabase Storage

Create a storage bucket named `invoices` in your Supabase dashboard (Storage → New Bucket). Set it to private.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an account.

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add the environment variables from step 2 above
4. Deploy — Vercel will automatically build and deploy

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated app routes
│   │   ├── dashboard/   # Budget dashboard
│   │   ├── invoices/    # Invoice list, upload, detail
│   │   ├── projects/    # Project management
│   │   ├── vendors/     # Vendor list, detail, merge
│   │   ├── exports/     # Export page
│   │   └── settings/    # Org settings, members, invites
│   ├── (auth)/          # Sign in / sign up
│   └── invite/          # Invite acceptance page
├── actions/             # Server actions (mutations)
├── queries/             # Server queries (reads)
├── components/          # Reusable UI components
├── lib/                 # Utilities (auth, prisma, roles, format)
└── scripts/             # Export scripts (Python/openpyxl)
```

## Roles

| Role   | Can View | Can Edit | Can Manage Members |
|--------|----------|----------|--------------------|
| Owner  | Yes      | Yes      | Yes                |
| Admin  | Yes      | Yes      | No                 |
| Viewer | Yes      | No       | No                 |

## License

Private — built for internal use.
