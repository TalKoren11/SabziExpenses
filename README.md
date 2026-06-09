# 🥬 Sabzi Expenses

A fast, mobile-first expense tracker PWA. Add expenses in two taps, see your running
balance (income − expenses), and auto-import from Apple Pay screenshots with Claude vision.

- **One-screen quick add** — amount → category → save.
- **Hands-free Siri Shortcut** — "Hey Siri, add expense" posts to a token-authed endpoint.
- **Home-screen install** — Add to Home Screen runs full-screen like a native app.
- **Apple Pay screenshot import** — Claude reads the screenshot and bulk-adds transactions.

Stack: **Next.js 16 (App Router)** · **Supabase** (Postgres + Auth + RLS) · **Anthropic** (vision) · **Vercel**.

---

## 1. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com/dashboard).
2. In the dashboard → **SQL Editor**, paste and run the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   This creates the tables, RLS policies, and a signup trigger that seeds default
   categories + a Siri token for each new user.
3. In **Authentication → Providers → Email**, ensure email sign-in (magic link) is enabled.
4. From **Project Settings → API**, copy your `Project URL`, `anon` key, and `service_role` key.

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-only, used by the Siri webhook
ANTHROPIC_API_KEY=sk-ant-...    # server-only, used for screenshot parsing
```

Get an Anthropic key at [console.anthropic.com](https://console.anthropic.com).

## 3. Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit + API tests
```

## 4. Deploy to Vercel

1. Push this repo to GitHub, then import it at [vercel.com/new](https://vercel.com/new).
2. Add the four env vars above in the Vercel project settings.
3. Deploy. Note your HTTPS URL (e.g. `https://sabzi.vercel.app`).
4. In Supabase → **Authentication → URL Configuration**, add your Vercel URL to
   **Site URL** and **Redirect URLs** (`https://your-app.vercel.app/auth/callback`).

## 5. Install on your iPhone

Open the Vercel URL in **Safari** → Share → **Add to Home Screen**. It launches
full-screen straight into the Quick Add screen.

## 6. Set up the Siri Shortcut

In the app: **Settings → Hey Siri, add expense** shows your endpoint and token. Then in the
iOS **Shortcuts** app:

1. New Shortcut → **Ask for Input** (Number, prompt "How much?").
2. **Get Contents of URL** → your `/api/quick-add` endpoint, Method **POST**,
   Header `x-siri-token: <your token>`, Request Body **JSON**:
   `{ "amount": <Provided Input>, "note": "" }`.
3. Name it "Add expense" and trigger with "Hey Siri, add expense".

> Keep your Siri token secret — anyone with it can add expenses to your account.

---

## Project layout

| Path | Purpose |
|------|---------|
| `app/page.tsx` + `components/QuickAdd.tsx` | Quick Add home screen |
| `app/overview` + `components/Overview.tsx` | Balance, breakdown, recent list |
| `app/import` + `components/ImportScreenshot.tsx` | Apple Pay screenshot import |
| `app/settings` + `components/Settings.tsx` | Currency, categories, Siri setup |
| `app/api/quick-add/route.ts` | Token-authed Siri webhook |
| `app/api/parse-screenshot/route.ts` | Claude vision parsing |
| `lib/balance.ts` | Balance / period / breakdown / formatting (unit-tested) |
| `lib/parse-screenshot.ts` | Claude call + output normalization (unit-tested) |
| `lib/queries.ts` / `app/actions.ts` | Server reads / server-action writes |
| `supabase/migrations/0001_init.sql` | Schema, RLS, signup seed |
