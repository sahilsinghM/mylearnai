# How to set up a local dev environment

You'll have a running DeepPath instance at `localhost:3000` connected to a local Supabase instance.

## Prerequisites

- Node.js 20+ or Bun 1.x
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase` on macOS)
- Docker (required by Supabase CLI for local Postgres)
- An Anthropic API key (get one at console.anthropic.com)

## Steps

### 1. Clone and install dependencies

```bash
git clone <repo-url> deeppath
cd deeppath
bun install
```

### 2. Start the local Supabase stack

```bash
supabase start
```

This starts a local Postgres instance, Auth, and Storage. First run pulls Docker images and takes ~2 minutes. On success you'll see output like:

```
API URL: http://127.0.0.1:54321
anon key: eyJ...
service_role key: eyJ...
DB URL: postgresql://postgres:<local-password>@127.0.0.1:54322/postgres
```

Copy the `API URL`, `anon key`, and `service_role key` — you'll need them in the next step.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321      # from supabase start output
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                  # anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...                      # service_role key
ANTHROPIC_API_KEY=sk-ant-...                          # your Anthropic API key
```

### 4. Run database migrations

```bash
supabase db push
```

This applies all six migrations from `supabase/migrations/` in order, including the master roadmap seed data (migration 005).

### 5. Start the dev server

```bash
bun dev
```

Visit [http://localhost:3000](http://localhost:3000). You should see the landing page.

## Verification

1. Click **Sign up** and create an account.
2. You're redirected to `/onboarding`. Complete all 7 steps.
3. After submitting, you should see the roadmap reveal screen, then land on `/dashboard` with a generated weekly plan.

If step 3 fails with a 500 error, check the terminal for Claude API errors — the most common cause is an invalid or rate-limited `ANTHROPIC_API_KEY`.

## Troubleshooting

**`supabase start` fails with port conflict**

Supabase uses ports 54321 (API), 54322 (DB), 54323 (Studio), 54324 (Inbucket). If one is in use:

```bash
supabase stop
supabase start
```

Or change the ports in `supabase/config.toml`.

**Migrations fail with "relation already exists"**

The local DB has stale state. Reset it:

```bash
supabase db reset
```

This drops and recreates the local database, then re-applies all migrations and seed data. All local user data is lost.

**Claude API returns 401**

Your `ANTHROPIC_API_KEY` in `.env.local` is wrong or missing. Check that the variable name matches exactly (no extra spaces, no quotes around the value unless your key contains them).

**Onboarding completes but `/dashboard` shows no plan**

Open Supabase Studio at [http://localhost:54323](http://localhost:54323) and check:
1. `learning_plans` — does a row exist for your user?
2. `plan_days` — are 7 rows linked to the plan?
3. `tasks` — are tasks linked to each day?

If `learning_plans` has a row but `plan_days` is empty, the transaction failed partway through. Run `supabase db reset` and try onboarding again.

## Running tests

```bash
bun test
```

Tests do not require a running Supabase instance — they use mock data and pure function tests. See `src/**/__tests__/` for test files.

## Supabase Studio

While `supabase start` is running, Studio is available at [http://localhost:54323](http://localhost:54323). Use it to inspect tables, run SQL queries, and view auth users during development.
