# 09 — Thesis Builder: Current Behavior and Non-Negotiable Editor Details

## Name and placement

The Research navigation item is **Thesis Builder**.

It was initially prototyped as “Writing Workspace” and later renamed. Do not revert the visible product name.

## Purpose

Thesis Builder is intended as a professional research-paper workspace inside PsyLattice, borrowing the clean collapsible-navigation feel of Clinical Professional Notes but with much richer document editing.

It combines:

- visual research filing;
- Word-like editing;
- academic format guidance/restructuring;
- import/export;
- tables/images;
- AI writing assistance with explicit document access control.

## Database model

Core tables created in Research Writing 1A:

### `research_writing_folders`

Owner-scoped hierarchical folders:

- `owner_user_id`
- `parent_folder_id`
- `name`
- `position`
- timestamps

Folder validation prevents self/descendant cycles and cross-owner parenting.

### `research_writing_documents`

Owner-scoped documents:

- `folder_id`
- title;
- document type;
- format style;
- `content_html`;
- `content_text`;
- `editor_settings` JSONB;
- pinned state;
- timestamps.

Format style support was later expanded to include `freeform` through the 1H migration.

### `research_writing_revisions`

Owner/document-scoped snapshots containing title/content/format/settings and revision reason.

RLS is enabled and authenticated grants are explicit.

## Visual filing system

Requirements implemented/evolved:

- folders within folders, recursively;
- create/rename/delete/move/select folders;
- visual tree with expand/collapse;
- documents may be unfiled;
- deleting a folder should not necessarily destroy contained papers; product behavior was designed so papers can become Unfiled rather than vanish;
- document search;
- pinned documents;
- the folder navigator is collapsible;
- when open, the navigator should remain sticky while the paper scrolls;
- the Research Files column uses a continuous soft-grey background through its full visible height, including empty space below content.

## Focus mode

Collapsing Files is a paper focus mode:

- large Thesis Builder introductory header is hidden;
- editor reclaims horizontal space;
- `› Files` restores the navigator;
- bottom zoom control appears;
- typical zoom range is 60%–160% in 10% increments;
- entering focus mode uses at least about 110% unless the user already chose a larger value.

## Full-screen mode

Full screen is separate from Files collapse.

It should:

- take Thesis Builder over the full browser viewport;
- hide/cover the normal Research page chrome/side navigation;
- preserve the internal Files panel option;
- preserve sticky editor controls, AI, zoom, tables, images, import/export, pagination;
- support `Esc` to exit;
- allow full screen + Files open or full screen + Files collapsed.

## Paged editor

The editor should look/behave like a document, not an infinitely elongating contenteditable sheet.

Implemented intent:

- visible page cards;
- page gaps;
- labels such as Page 1 of N;
- A4/Letter dimensions;
- page stack remains visible while scrolling;
- pagination responds to font/spacing/page/margins/content;
- block-aware pagination is acceptable, though extremely large unbreakable blocks may require future line-level refinement.

## Sticky editing controls

The document title/actions and main Word-style formatting toolbar should remain sticky while pages scroll.

Import/Export used to be a separate sticky bar. That was intentionally removed; **Import** and **Export** now belong inside the main sticky toolbar to save vertical space.

## Manual Save only — no autosave

This was an explicit correction.

Current desired behavior:

- editing changes local editor state;
- database document is updated only when the user presses **Save**;
- reopening/reloading without saving should restore the last saved state;
- warn when navigating away/reloading/switching papers with unsaved edits;
- Save control visibly indicates dirty/saved state.

**Do not reintroduce an autosave timer.**

## Free form mode

**Free form · Design it yourself** is the default for new documents and imports.

Free form must not silently inherit academic layout assumptions.

Current intended defaults:

- 0 in top/right/bottom/left margins;
- 1.0 line spacing;
- 0 first-line indent;
- researcher manually controls layout.

Academic presets may set recommended defaults, but users can still override layout controls afterward.

## Academic format presets

Current preset list:

- Free form · Design it yourself
- APA 7 · Student paper
- APA 7 · Professional paper
- MLA 9 · Research paper
- Chicago / Turabian · Academic paper
- IEEE · Conference manuscript
- Custom / institution-specific

Applying an academic format can adjust typography/layout and may offer restructuring of existing content into a typical paper section structure.

The restructuring assistant must not invent missing methods, results, statistics, references, or facts. Use placeholders when information is absent.

A recovery revision should be saved before destructive/structural AI transformations.

## Format Guide drawer

A side guide explains the selected style:

- layout;
- common section order;
- margins;
- fonts/sizing;
- spacing;
- paragraph rules;
- cautions;
- official/reference links where available.

The UI should remind researchers that journal/university/department/supervisor/conference-specific instructions override a generic preset.

## Interactive margins

Margins are first-class editor settings in **all** modes.

The toolbar has a Margins control with independent:

- Top
- Right
- Bottom
- Left

Current intended range is roughly 0–3.5 inches per side, with slider and exact numeric control.

Quick options include concepts such as:

- All 0"
- All 0.5"
- All 0.75"
- All 1"
- Reset to preset

While editing margins, a dashed cyan writable-area guide may be shown on the paper.

Changing margins must repaginate live and must also flow through PDF/Word export settings.

## Formatting toolbar

Word-like controls include:

- format preset;
- margins;
- font family;
- font size;
- paragraph/heading style;
- bold;
- italic;
- underline;
- strike-through;
- text color;
- highlight;
- alignment/justify;
- bullets/numbering;
- indent/outdent;
- line spacing;
- links/unlink;
- tables;
- paragraph/control actions;
- undo/redo;
- clear formatting;
- Import;
- Export;
- image controls.

### Critical selection/focus bug fixes

Raw native controls caused selected text to collapse when the toolbar stole focus.

Already fixed:

- Text color palette;
- Highlight palette;
- Font size.

The fix pattern is:

1. save the active browser `Range` while the selection is inside the editor;
2. do not let toolbar mouse-down collapse the selection;
3. keep custom popovers open during interaction;
4. restore the exact saved Range before applying the command;
5. for native custom-color UI, preserve Range and suppress destructive blur/repagination until the command is applied.

**Do not replace these with raw `<input type="color">` or a native `<select>` that steals focus.**

## Import existing work

Import lives in the main toolbar.

Supported implemented formats:

- DOCX (via `mammoth`);
- HTML;
- Markdown;
- TXT.

Import workflow allows choosing:

- local file;
- resulting title;
- destination folder.

Imported content becomes an editable Thesis Builder document, not merely an attachment.

Imported documents default to Free form so PsyLattice does not unexpectedly reformat existing work.

## Export

Export lives in the main toolbar.

Implemented options include:

- PDF;
- Microsoft Word `.docx`;
- US Letter;
- A4;
- option to apply export paper size to the live editor.

Packages installed for these features include:

- `mammoth`
- `html2pdf.js`
- `html-docx-js-typescript`

Export should preserve the current document styling/settings as faithfully as practical, including actual per-side margins, tables, images, text alignment, fonts/spacing, and page size.

## Tables

The table tool supports:

- choose rows/columns before insertion;
- editable cells;
- add/delete rows;
- add/delete columns;
- first-row header toggle;
- table width;
- interactive resize handle;
- delete table;
- select a table by clicking inside it.

## Images

Image editing has repeatedly been refined. Current intent:

- upload image;
- sensible downscaling of huge source images before embedding;
- click/select image;
- resize by slider and drag handle;
- left/center/right positioning where relevant;
- drag image to reposition;
- delete image from selected-image controls;
- preserve selected wrap mode.

Wrap modes include:

- In line with text;
- Square;
- Tight;
- Through;
- Top & bottom;
- Behind text;
- In front of text.

Drag behavior differs by wrap type:

- flow-like modes (Inline/Square/Tight/Through/Top & bottom): dragging relocates the image to the nearest text/document-flow position while preserving wrapping;
- Behind/In front: image can be freely positioned on the paper, including onto another visible page.

## Writing AI

A sticky **Writing AI** button opens a chat-like assistant and can be minimized.

### Document access consent

Current desired behavior:

- toggle defaults Off;
- when user turns **Allow AI to read current paper** On, ask permission once;
- after approval, all subsequent AI questions in that editor session may include the current document;
- turning Off immediately stops sending paper content;
- reload/leave resets permission;
- persistent visible indicator when paper access is On;
- visible notification when access is enabled/disabled.

This replaced an earlier one-request-at-a-time confirmation model.

### Realtime review

Realtime continuous document watching/warnings is **not yet enabled**. It is a future feature and should have its own explicit permission model.

### Server route

Writing AI uses its own server route (`app/api/writing-assistant/route.ts` in the implemented phase) and was configured with `store: false` in the OpenAI request path.

## Visual regression already fixed

The left Research Files background once stopped halfway down the workspace, leaving a white lower half. Current behavior requires the whole navigator column to remain the same soft grey through the visible height.
