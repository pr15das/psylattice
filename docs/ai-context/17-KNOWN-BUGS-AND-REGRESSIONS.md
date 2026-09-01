# 17 — Known Bugs, Regressions Already Fixed, and How Not to Reintroduce Them

This file is especially important for AI agents. Many bugs came from replacing a current file with an older phase snapshot or from relying on browser focus behavior that looked harmless.

## 1. BART TypeScript decision narrowing

### Symptom

TS2367 errors on comparisons such as:

```ts
if (decision === "pump")
else if (decision === "cash_out")
```

### Cause

A union variable initialized as `"timeout"` was mutated inside an async Promise callback. TypeScript control-flow analysis did not treat that mutation as reliable after `await`.

### Correct pattern

Return a typed observed response from the Promise, await it, then derive the decision from the returned value.

### Do not

Cast everything to `any` or force the union with unsafe assertions.

## 2. Mental Rotation instantly completed practice

### Symptom

Preview showed `0/—` and immediately `Practice complete — Accuracy: 100%` before any trial.

### Cause

Mental Rotation fell through to the generic practice runner. The dedicated block intentionally had no generic trial-table rows, so generic code saw zero trials and treated the empty denominator as perfect accuracy.

### Fix principles

- robust dedicated-runtime detection using task/version/block identity;
- block dispatch refuses to send dedicated Mental Rotation blocks to generic runner;
- zero generic practice trials must never become 100% success.

## 3. Cognitive Battery `permission denied`

### Symptom

`permission denied for table cognitive_batteries`.

### Cause

RLS policies existed, but PostgreSQL grants to `authenticated` were missing.

### Fix

Explicit grants for battery tables; later migration reapplies them idempotently.

## 4. Massive TypeScript “Problems” cascade in Research page

### Symptom

Hundreds of implicit-any red underlines on callbacks like `report`, `state`, `group`, `row`, `itemId`.

### Cause

Typed helper dependency (`batteryReporting.ts`) missing/unresolved after a page replacement.

### Fix

Restore correct helper/import. Do not annotate every downstream callback with `any`.

## 5. Thesis Builder file navigator only grey halfway

### Symptom

Research Files column background ended after the folder/private card, leaving white empty space below.

### Fix

The full navigator column/sticky region must own the grey background/min-height, not only its content wrapper.

## 6. Thesis Builder autosave contradicted desired workflow

### Symptom

Document persisted while typing even though explicit Save behavior was desired.

### Final decision

No autosave. User explicitly presses Save. Unsaved navigation/reload warns. Last saved version is authoritative on reopen.

## 7. Free form still had academic margins

### Symptom

Free form showed inherited/default page padding despite being intended as unconstrained layout.

### Fix

Free form defaults to zero per-side margins; margin settings are explicit and persisted. Existing older Free-form docs should not silently retain a hidden global one-inch margin.

## 8. Text color/highlight selection disappeared

### Symptom

Color palette flashed/disappeared; clicking it removed selected text range.

### Cause

Raw native `<input type="color">` stole focus from the contenteditable editor; Safari made native popover behavior especially brittle.

### Fix

Selection-safe custom popovers with saved/restored browser Range; custom native color path also preserves Range and avoids destructive blur/pagination.

## 9. Font-size selector destroyed text selection

### Symptom

Selecting text and opening font-size dropdown lost selection.

### Cause

Native `<select>` stole focus.

### Fix

Selection-safe PsyLattice popover using the same saved Range system as color/highlight.

## 10. Thesis Builder separate Import/Export bar consumed space

### Decision

Import and Export belong inside the main sticky editor toolbar, not a separate top action bar.

## 11. Focus mode did not make the paper meaningfully larger

### Fix

Focus mode hides the large Thesis Builder intro card, collapses Files, reclaims width, and exposes zoom controls.

## 12. Image editor missing deletion/movement behavior

### Fix

Selected image controls include Delete image. Drag semantics depend on text-wrap mode; floating modes support free positioning, flow modes relocate through document flow.

## 13. Old phase file rollback risk

### Pattern

A phase ZIP often contains only files necessary for that phase, based on the then-current stack. Reusing it later can remove newer data/export/AI/battery/task work.

### Rule

Always patch from current Git. Historical packages are reference material only.
