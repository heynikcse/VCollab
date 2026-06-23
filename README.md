# VCollab

College-exclusive social & collaboration platform for VIT Bhopal.
Built with React + Vite + Tailwind CSS, backed by Supabase (Postgres + Auth + Storage + Realtime).

**Note on this build:** the anonymous posting system (Option 2 / Soft Anonymous) described in
the original v2.0 doc has been removed. Posts always show the author's real identity. The
generic "report a post" flow still exists, with auto-hide at 3 reports.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `vcollab`, set a database password (save it), pick a nearby region
3. Wait ~2 min for it to provision

## 2. Run the database setup

In **SQL Editor → New Query**, run these files **in order**, each as its own query:

1. `supabase/01_schema.sql` — tables, indexes, triggers
2. `supabase/02_rls_policies.sql` — row-level security on every table
3. `supabase/03_domain_enforcement.sql` — blocks signups outside `@vitbhopal.ac.in` at the database level
4. `supabase/05_messages.sql` — direct messages table, RLS, and Realtime publication (run after step 3 / storage setup below — order relative to `04_storage_policies.sql` doesn't matter)

## 3. Set up Storage buckets

In **Storage**, create four buckets, each with **Public bucket** turned ON:

- `avatars`
- `post-images`
- `event-posters`
- `community-banners`

Then run `supabase/04_storage_policies.sql` in the SQL Editor.

## 4. Get your API keys

**Project Settings → API**, copy:
- **Project URL**
- **anon public key**

## 5. Configure the frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Install and run

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## 7. Make yourself an admin (optional, for testing Communities/Events admin features)

After signing up once through the app, run this in SQL Editor (replace the email):

```sql
update public.users set role = 'admin' where email = 'you@vitbhopal.ac.in';
```

---

## Project structure

```
supabase/
  01_schema.sql              tables, triggers, auto-profile-creation
  02_rls_policies.sql        row-level security
  03_domain_enforcement.sql  @vitbhopal.ac.in enforcement at the DB level
  04_storage_policies.sql    storage bucket access rules
  05_messages.sql            direct_messages table + RLS + Realtime publication

frontend/
  src/
    lib/supabase.js          Supabase client + email domain validator
    lib/storage.js           image upload/delete helpers
    lib/github.js            public GitHub REST API helpers (top repos, contribution graph)
    context/AuthContext.jsx  session + profile state, sign up/in/out
    components/              AppShell, Sidebar, PostCard, ProjectCard, GithubPanel, etc.
    pages/                   one file per page (Login, Feed, Connect, Community, Events, Messages, Profile)
```

## What's built (Phase 1 + Phase 2 + part of Phase 3)

- Login/signup, password-based, restricted to college email both client-side and at the DB level
- Profile setup + edit: name, branch, year, bio, skills, GitHub, avatar
- Feed: composer (text + image), Latest / Trending / Network tabs, like, comment, report, delete
- Connect: create projects, skill filters, search, request-to-join flow, owner accept/decline panel, simple skill-match sorting
- Community: admin-created communities, join/leave, member-only community feed, pinned posts
- Events: create (admin/club only), register/unregister, Upcoming / Popular / My events tabs, category filters
- Right sidebar: trending hashtags, active projects, top contributor, next event
- **GitHub profile graph (Phase 3):** profile page shows a public contribution graph and the student's
  top repositories (by stars), pulled live from the GitHub REST API — no token needed, works for any
  public username
- **Direct messaging (Phase 3):** 1:1 chat between students via a `direct_messages` table, Supabase
  Realtime for instant delivery, unread indicator in the nav bar, "Message" button on every profile

## Not yet built (remaining Phase 3 items)

- Weekly email digest for events (needs Supabase Edge Functions + a cron trigger)
- Multi-institution domain support (currently hard-coded to `@vitbhopal.ac.in` client-side and in `03_domain_enforcement.sql`)
- Feed/Connect/Community currently re-fetch on action rather than subscribing to Realtime (only
  direct messages and the unread badge use Realtime so far)
