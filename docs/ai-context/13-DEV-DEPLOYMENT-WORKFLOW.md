# 13 — Development, Git, Node, Build, and Deployment Workflow

## Local runtime

PsyLattice was upgraded to **Node 24 LTS** on 2026-09-01.

Recommended:

```bash
nvm use
node -v
npm -v
npm ci
npm run dev
```

`.nvmrc` should contain:

```text
24
```

Before deployment:

```bash
npm run build
```

## Why Node 24 matters

Before the upgrade the local machine was on Node 20.12.2 and npm showed `EBADENGINE` warnings for modern Supabase/OpenAI/eslint dependencies requiring newer runtimes.

Do not downgrade Node casually.

## Dependency installation

Use `npm ci` for a clean lockfile-respecting install in reproducible environments.

Do not delete `package-lock.json` without a deliberate dependency update plan.

Avoid:

```bash
npm audit fix --force
```

as a reflex. It may introduce breaking upgrades. Inspect advisories and update intentionally.

## Thesis Builder document dependencies

The import/export work introduced packages including:

- `mammoth`
- `html2pdf.js`
- `html-docx-js-typescript`

There is/was a local TypeScript declaration helper for these import/export dependencies. Confirm current package/type configuration before removing it.

## Git discipline

Typical branch in recent development: `main`.

Recommended change flow for the new engineer:

1. pull latest;
2. `nvm use`;
3. `npm ci` when lockfile changed or environment is fresh;
4. create a branch for nontrivial work;
5. patch current files;
6. run local tests;
7. run `npm run build`;
8. review migration/security impact;
9. commit with a meaningful message;
10. PR/review or approved push process;
11. verify Vercel/Render logs after deploy.

## Vercel

The web app is deployed on Vercel.

Ensure the production/preview runtime uses a compatible Node version (Node 24 target) so local and deployed behavior are not unnecessarily different.

Do not expose secrets as `NEXT_PUBLIC_*` unless they are genuinely intended to be public.

## Render/FastAPI

A FastAPI backend on Render was part of the established architecture.

Before operations:

- verify current Render service name/URL;
- verify which frontend/API routes still call it;
- verify Python/runtime/dependencies;
- verify health checks/logs;
- do not delete the service because Next.js now has some API routes.

## Database migration discipline

Migrations should be:

- idempotent where feasible;
- explicit about prerequisites;
- safe for existing researcher-owned rows;
- tested in development/staging;
- accompanied by grants/RLS;
- reviewed for destructive statements.

System-template migrations often use fixed IDs and `ON CONFLICT` metadata refresh while preserving immutable published versions.

## Test routes/modes

Use:

- Cognitive Preview;
- cognitive pilot links;
- TEST Study participant links;
- `Include TEST data` in Research Data;
- local dummy/test users.

Do not verify a new task only by checking that the Builder renders; test participant runtime and stored data.

## TypeScript diagnostics

A syntax-only transpile is not enough for TypeScript semantics.

Past examples:

- BART code was syntactically valid but had TS2367 narrowing errors;
- missing helper imports produced hundreds of downstream implicit-any problems.

Use the real project type/build pipeline before calling a phase complete.
