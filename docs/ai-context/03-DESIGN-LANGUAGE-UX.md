# 03 — Design Language and UX Rules

## Overall feel

PsyLattice should feel:

- minimal;
- modern;
- high-end;
- calm;
- research/clinical professional;
- visually coherent across workspaces;
- approachable to non-programmers.

Preserve the PsyLattice logo and established color identity.

## Visual language

The Research UI has evolved toward:

- clean white primary surfaces;
- soft slate/grey page backgrounds;
- restrained cyan/teal accenting;
- occasional violet accent where useful;
- rounded cards and controls;
- subtle shadows rather than heavy borders;
- generous spacing;
- strong typographic hierarchy;
- compact, professional status feedback.

Examples from the current Research styling intentionally remap older generic status palettes:

- green/emerald success surfaces → soft cyan/teal family;
- amber/orange warning surfaces → restrained violet family;
- blue/sky info surfaces → cyan family;
- red/rose remains reserved for true destructive/error contexts and is visually softened.

A teal used repeatedly in the Research UI is around `#0e7490`; violet action/warning remapping has used around `#7c3aed`.

These are not a complete token system. Prefer the current code/design tokens over hardcoding new one-off colors.

## Avoid generic “AI dashboard” patterns

A repeated product preference is to avoid UI that looks auto-generated:

- giant red/green alert cards;
- excessive gradients;
- arbitrary glassmorphism everywhere;
- icon-filled cards without hierarchy;
- every action in a colored pill;
- redundant explanatory copy.

Feedback should be subtle and product-like. Inline status rows, restrained banners, small badges, and contextual messaging are preferred.

## One capable interface

Do not create separate Beginner/Advanced modes.

Instead:

- expose simple defaults;
- keep common actions obvious;
- use expandable panels/drawers/popovers for advanced controls;
- provide visual guides/manuals;
- preserve scientific controls without making the page intimidating.

## Navigation

Research sidebar labels should be clear domain terms, not internal phase names.

Current important Research navigation includes **Thesis Builder** (not “Writing Workspace”).

## Collapsible work areas

Professional Notes inspired the collapsible-navigator pattern used in Thesis Builder.

When a user is actively writing/working:

- side navigators should be collapsible;
- controls should remain accessible;
- focus/full-screen modes should reclaim space rather than simply hiding labels;
- sticky controls should prevent long documents from forcing constant scroll-to-top behavior.

## Documentation visuals

For Cognitive Lab and researcher education:

- prefer custom illustrations of task mechanisms and UI concepts;
- avoid embedding screenshots of entire application pages as the main teaching mechanism;
- explain what a participant sees and what a researcher configures.

## Accessibility/interaction

Current Research styling includes reduced-motion handling.

Interactive controls should:

- have clear hover/focus states;
- preserve keyboard behavior where possible;
- avoid menus that disappear when the pointer crosses a gap;
- avoid stealing selection/focus from contenteditable editors;
- support smaller screens when scientifically appropriate, but do not force tasks onto phones when visual validity suffers (e.g. Mental Rotation phone support is disabled by default).

## Copy style

Use concise, professional language. Avoid overly technical labels when a psychology term is clearer.

Examples:

Good: `Ready for studies`, `Participant study flow`, `Include TEST data`, `Adjusted mean pumps`, `Rotation slope (ms/degree)`.

Less desirable: internal phase labels, database jargon, or long implementation descriptions in primary UI.
