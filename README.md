# DeepPath

A personalized AI/ML curriculum for engineers who want to **build with AI**. DeepPath is builder-first: a required spine takes you from working with LLMs through RAG, agents, evaluation, and production, with optional depth tracks (math foundations, model internals, classical ML) for those headed toward research. It builds a roadmap from your background and goal, adapts it as you learn, and ends every Socratic tutoring session with a proof artifact — a GitHub-ready project spec and LinkedIn post draft.

**Tech:** Next.js 16 · Supabase · Anthropic SDK (claude-sonnet-4-6) · TypeScript · Tailwind · Vitest

## Quick start

```bash
# Install dependencies
bun install

# Copy env vars and fill in values (see docs/howto-local-setup.md)
cp .env.example .env.local

# Run database migrations
supabase db push

# Start dev server
bun dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Documentation

| Document | What it covers |
|----------|---------------|
| [docs/architecture.md](docs/architecture.md) | System overview, data flow, key design decisions |
| [docs/reference-api.md](docs/reference-api.md) | All API routes — endpoints, request/response shapes |
| [docs/reference-database.md](docs/reference-database.md) | Database tables, columns, RLS policies, migrations |
| [docs/howto-local-setup.md](docs/howto-local-setup.md) | Getting a local dev environment running |
| [docs/howto-add-roadmap-node.md](docs/howto-add-roadmap-node.md) | Adding or editing nodes in the Master Roadmap |

## Project structure

```
src/
  app/
    api/              Route handlers (onboarding, tutor, plan, roadmap, proof)
    (app)/            Authenticated pages (dashboard, tutor, project)
    (auth)/           Sign-in / sign-up pages
    roadmap/          Public roadmap visualization
    onboarding/       Onboarding wizard
  components/         React components by feature
  lib/
    anthropic/        Claude client, prompt builders, response schemas
    roadmap/          Roadmap graph logic, adaptation agent, personalization
    tutor/            Tutor context, rate limiting, mastery tooltip, migration banner
    auth/             Public path list, auth utilities
    supabase/         Supabase client factories
  types/              Shared TypeScript types
supabase/migrations/  SQL migrations (run in order 001–006)
docs/                 Architecture, reference, and how-to documentation
```

## Running tests

```bash
bun test
```

Tests live in `src/**/__tests__/`. Coverage targets: roadmap logic, adaptation agent, tutor utilities.

## Domain glossary

See [CONTEXT.md](CONTEXT.md) for definitions of Master Roadmap, Personalized Roadmap, Adaptation Agent, Active Node, Weekly Plan, and other domain terms.
