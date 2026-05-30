@AGENTS.md

## gstack

For all web browsing, use the `/browse` skill from gstack. **Never use `mcp__claude-in-chrome__*` tools.**

Available gstack skills:

- `/office-hours` — guided planning session
- `/plan-ceo-review` — CEO-level plan review
- `/plan-eng-review` — engineering plan review
- `/plan-design-review` — design plan review
- `/design-consultation` — design advice and direction
- `/design-shotgun` — rapid design exploration
- `/design-html` — generate HTML designs
- `/review` — code review
- `/ship` — prepare code to ship
- `/land-and-deploy` — land PR and deploy
- `/canary` — canary deploy workflow
- `/benchmark` — performance benchmarking
- `/browse` — headless browser for all web browsing tasks
- `/connect-chrome` — connect to Chrome instance
- `/qa` — full QA pass
- `/qa-only` — QA without other steps
- `/design-review` — visual design review
- `/setup-browser-cookies` — configure browser cookies
- `/setup-deploy` — configure deployment pipeline
- `/setup-gbrain` — set up gbrain integration
- `/retro` — run a retrospective
- `/investigate` — deep investigation workflow
- `/document-release` — generate release documentation
- `/document-generate` — generate documentation
- `/codex` — codex agent workflow
- `/cso` — CSO review workflow
- `/autoplan` — automated planning
- `/plan-devex-review` — developer experience plan review
- `/devex-review` — developer experience review
- `/careful` — careful/cautious implementation mode
- `/freeze` — freeze a dependency or config
- `/guard` — add guards/safeguards
- `/unfreeze` — unfreeze a dependency or config
- `/gstack-upgrade` — upgrade gstack
- `/learn` — learning and research workflow

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
