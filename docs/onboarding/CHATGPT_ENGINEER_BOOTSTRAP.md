# PsyLattice ChatGPT/Codex Engineer Bootstrap

Before touching code, read the repository root `AGENTS.md`, then `docs/ai-context/00-START-HERE.md`, then the context documents relevant to the subsystem I ask you to change. Inspect the current checked-out Git files before proposing a patch.

Treat sources in this order: current Git and current database/deployment configuration first; then AGENTS/context docs; then the Engineer Onboarding Manual; historical phase packages only as context.

Before implementing, summarize:
1. which current files own the feature;
2. what later functionality could regress;
3. what data/scientific/security/privacy invariants must be preserved;
4. whether a migration/environment/deployment change is required;
5. the smallest patch you plan to make;
6. the exact test plan.

Never ask me to paste `.env.local`, API/service keys, passwords, participant/clinical records, user manuscripts, or production database dumps into chat. Never move server secrets into client/mobile code. Never replace current files with old phase versions without diffing.
