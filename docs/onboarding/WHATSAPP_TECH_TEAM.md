# PsyLattice Tech Team — WhatsApp Copy

## Suggested group name

**PsyLattice · Engineering**

## Group description

PsyLattice Engineering 🧠⚙️ — development, infrastructure, deployment and technical support. Before starting work, read the Engineering Onboarding Manual + repository AI context. Current Git is the source of truth. Use Node 24 and test before deployment. Never share API keys, service-role credentials, passwords, participant/clinical data or private research documents in WhatsApp, GitHub or ChatGPT.

## Suggested pinned welcome message

Welcome to the PsyLattice Engineering team 👋

Before changing code:

1. Accept the GitHub/Supabase/Vercel access shared with you.
2. Clone the latest repository and work from current Git — not old phase ZIPs.
3. Run `nvm use`, then `npm ci` and `npm run dev`.
4. Configure `.env.local` only from credentials shared privately through the approved secret-sharing method.
5. Read root `AGENTS.md`.
6. Read `docs/ai-context/00-START-HERE.md` and the relevant subsystem docs.
7. Read `docs/onboarding/PsyLattice_Engineer_Onboarding_Manual.md`.
8. Use `docs/onboarding/CHATGPT_ENGINEER_BOOTSTRAP.md` when opening PsyLattice in ChatGPT/Codex.

PsyLattice has accumulated many interconnected systems. Never replace a current large file with an older generated version. Inspect the current implementation and make the smallest safe patch.

Normal change flow:

**understand → inspect current Git → modify → test locally → review diff → `npm run build` → commit/review → deploy → smoke-test production**

Database change flow:

**review migration → confirm environment → RLS + GRANT review → TEST path → deploy compatible code → verify production**

Do not put `.env.local`, OpenAI keys, Supabase service-role keys, Resend keys, cron secrets, participant/session tokens, identifiable participant data, clinical data, or private manuscripts in this WhatsApp group or in ChatGPT.
