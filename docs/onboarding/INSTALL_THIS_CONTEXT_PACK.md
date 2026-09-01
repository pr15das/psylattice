# Installing this context pack into PsyLattice

This package is an **overlay**. It contains only files that should be copied into the existing PsyLattice repository.

## Safest installation

1. Close/stop `npm run dev` if it is currently running.
2. Make sure your current PsyLattice work is saved.
3. Copy the **contents** of this ready-to-paste folder into the root of the PsyLattice project.
4. When macOS/Finder asks about `AGENTS.md`, choose **Replace**. This package's `AGENTS.md` is already the merged version of your existing Next.js-generated/PsyLattice file plus the new shared-context rules.
5. Merge the `docs` folder (do not delete any pre-existing docs that are not present in this pack).
6. Do **not** copy any `.env.local`, passwords or keys — none are included here.
7. Run `git status` and review the exact files before staging.
8. Stage only `AGENTS.md` and `docs/` when ready.

Suggested commands after copying:

```bash
git status
git diff -- AGENTS.md
git add AGENTS.md docs
git status
git commit -m "Add PsyLattice engineering context and onboarding"
git push
```

There is no application-runtime change in this pack, so a production build is not required solely for these documentation files. The next normal code change should still follow the project's usual build/test rules.
