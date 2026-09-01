# 02 — Technical Architecture

## Current known web stack

The established web architecture is:

- **Next.js 16.x App Router + TypeScript** application. Verify the exact installed version in `package.json`/lockfile and follow the repository root `AGENTS.md` requirement to read the matching docs under `node_modules/next/dist/docs/` before using version-sensitive APIs.
- Tailwind-based component styling, with shadcn/ui-style conventions in parts of the product.
- **Vercel** deployment for the web application.
- **Supabase** for PostgreSQL, Auth, Storage, Row Level Security, RPCs/functions, and much of the application data model.
- Server-side OpenAI integration through API routes and/or backend services.
- A **FastAPI** service on Render was part of the backend architecture in the late-August 2026 handoff, running Python 3.11 and previously referenced at `https://psylattice-api.onrender.com`.

### Important: backend ownership is mixed / must be verified

The modern repository also contains Next.js API routes such as research export, research assistant, writing assistant, media, messages, auth callbacks, and other server surfaces.

Therefore:

**Do not assume all backend logic lives in FastAPI, and do not assume FastAPI is obsolete. Inspect current route usage, environment variables, frontend callers, Render, and Vercel before migrating/removing anything.**

## Runtime

On 2026-09-01 the local project runtime was upgraded from Node 20.12.2 to **Node 24 LTS** using nvm.

The repository should contain:

```text
.nvmrc -> 24
```

Typical setup:

```bash
nvm use
npm ci
npm run dev
npm run build
```

The Node upgrade was motivated by dependency engine requirements from recent Supabase/OpenAI/eslint packages and produced a noticeable local responsiveness improvement.

## Repository

Recent local Git output showed a remote under `github.com/pr15das/psylattice.git` on branch `main`.

Older project handoff material referred to a repository named `PsyLattice-Research-Platform` with root folder `psylattice`.

**VERIFY CURRENT:** treat `git remote -v` as authoritative and update this doc if the canonical repository name has changed.

## Frontend route/workspace pattern

Major route families observed/developed include:

- `/researcher`
- `/self`
- `/clinician`
- `/study/[token]`
- auth/sign-in/reset/onboarding routes
- `/api/...` server routes

The project historically aimed for role/workspace separation so unauthorized workspace options are not casually exposed.

## Supabase conventions

### RLS is a core architectural control

Owner-based rows generally use `owner_user_id = auth.uid()` or study/role-specific policies.

When adding tables:

1. create schema/constraints/indexes;
2. enable RLS;
3. create explicit policies;
4. add explicit PostgreSQL grants to the intended role;
5. test using the application’s normal authenticated/public path;
6. reload PostgREST schema when necessary.

A real Battery Builder regression demonstrated that correct RLS without `GRANT` still produces `permission denied for table ...`.

### Security-definer RPCs

Participant/public workflows may use security-definer RPCs when participants should not receive direct write access to sensitive orchestration tables. Battery assignment is an example.

Audit these functions carefully:

- fixed/search_path discipline;
- validate authentication or token/session ownership;
- validate input IDs belong to the intended study/researcher;
- avoid broad service-role bypasses in client code.

## Versioned research definitions

The cognitive system includes entities analogous to:

- `cognitive_tasks`
- `cognitive_task_versions`
- `cognitive_task_blocks`
- `cognitive_task_references`
- `cognitive_task_sessions`
- `cognitive_trial_results`
- cognitive pilot links/sessions

Published versions are intended to be immutable/pinned.

The battery system adds versioned batteries and participant-specific assignment records. See `07-BATTERY-BUILDER.md`.

The Thesis Builder uses owner-scoped research writing tables. See `09-THESIS-BUILDER.md` and `21-DATABASE-SURFACE-MAP.md`.

## Mobile architecture

Android development is separate from the Next.js web application and has used native Android/Kotlin/Compose-style code.

Health Connect is the Android wearable bridge. Native push has intentionally been deferred.

## Large-file warning

`app/researcher/page.tsx` became a very large, feature-dense file during rapid development. It contains Study Builder, Research Data, export, analysis, battery integration, and workspace UI logic.

A future refactor into domain modules is desirable, but do not perform a “cleanup rewrite” casually. The file has accumulated many later features, and old phase files are not safe replacements.

Refactor incrementally with tests/snapshots and preserve behavior.
