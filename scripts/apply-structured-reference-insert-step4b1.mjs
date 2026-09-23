import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (!source.includes("<ThesisCitationPanel")) {
  console.error(
    "Step 4B citation engine is not installed in ResearchWritingWorkspace.tsx.",
  );
  process.exit(1);
}

if (source.includes("insertStructuredReferenceEntries")) {
  console.log("Structured reference insertion patch is already installed.");
  process.exit(0);
}

const backup = `${target}.before-structured-reference-insert-step4b1.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

function replaceOnce(label, before, after) {
  if (!source.includes(before)) {
    console.error(`Patch stopped: could not find ${label}.`);
    console.error("No partial file was written.");
    process.exit(1);
  }
  source = source.replace(before, after);
  console.log(`Patched: ${label}`);
}

replaceOnce(
  "reference-entry row loader",
  `  async function loadCitationReferences(referenceIds: string[]) {`,
  `  async function loadDocumentReferenceEntryRows() {
    if (!selectedDocument || !userId) return [];

    const supabase = createClient();
    const { data, error: referenceEntryError } = await supabase
      .from("research_document_reference_entries")
      .select("id,reference_ids,rendered_text,created_at,updated_at")
      .eq("owner_user_id", userId)
      .eq("document_id", selectedDocument.id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (referenceEntryError) throw referenceEntryError;
    return data || [];
  }

  async function loadCitationReferences(referenceIds: string[]) {`,
);

replaceOnce(
  "standalone reference insertion",
  `  async function insertOrRefreshBibliography() {`,
  `  async function insertStructuredReferenceEntries(payload: {
    references: CitationReference[];
  }) {
    if (!selectedDocument || !userId) {
      throw new Error("Open a Thesis Builder document first.");
    }

    if (!payload.references.length) {
      throw new Error("Select at least one reference.");
    }

    const supabase = createClient();
    const citationRows = await loadDocumentCitationRows();
    const referenceEntryRows = await loadDocumentReferenceEntryRows();

    const numberMap = buildCitationNumberMap([
      ...citationRows.map((row) => ({
        reference_ids: (row.reference_ids || []) as string[],
        created_at: row.created_at,
      })),
      ...referenceEntryRows.map((row) => ({
        reference_ids: (row.reference_ids || []) as string[],
        created_at: row.created_at,
      })),
    ]);

    let nextNumber = Math.max(0, ...Array.from(numberMap.values())) + 1;
    for (const reference of payload.references) {
      if (!numberMap.has(reference.id)) {
        numberMap.set(reference.id, nextNumber);
        nextNumber += 1;
      }
    }

    const entries = formatBibliographyEntries({
      style: citationStyle,
      references: payload.references,
      numberMap,
    });

    const entryId = crypto.randomUUID();
    const renderedText = entries.map((entry) => entry.text).join("\\n");

    const { error: insertError } = await supabase
      .from("research_document_reference_entries")
      .insert({
        id: entryId,
        owner_user_id: userId,
        document_id: selectedDocument.id,
        reference_ids: payload.references.map((reference) => reference.id),
        rendered_text: renderedText,
      });

    if (insertError) throw insertError;

    restoreFormattingSelection();

    const target = editorRef.current || orderedPageElements().at(-1);
    if (!target) throw new Error("The writing cursor could not be restored.");

    target.focus({ preventScroll: true });
    editorRef.current = target;

    const html = \`<div data-psylattice-reference-entry-id="\${escapeHtml(
      entryId,
    )}" data-psylattice-reference-entry="true" contenteditable="false">\${entries
      .map(
        (entry) =>
          \`<p data-psylattice-reference-id="\${escapeHtml(
            entry.reference.id,
          )}">\${escapeHtml(entry.text)}</p>\`,
      )
      .join("")}</div>\`;

    const inserted = document.execCommand("insertHTML", false, html);

    if (!inserted) {
      const fallback = document.createElement("div");
      fallback.dataset.psylatticeReferenceEntryId = entryId;
      fallback.dataset.psylatticeReferenceEntry = "true";
      fallback.contentEditable = "false";

      for (const entry of entries) {
        const paragraph = document.createElement("p");
        paragraph.dataset.psylatticeReferenceId = entry.reference.id;
        paragraph.textContent = entry.text;
        fallback.appendChild(paragraph);
      }

      target.appendChild(fallback);
    }

    captureEditor(undefined, true);
    setNotice(
      payload.references.length === 1
        ? "Formatted reference inserted."
        : "Formatted references inserted.",
    );
  }

  async function insertOrRefreshBibliography() {`,
);

replaceOnce(
  "style-switch reference rows",
  `    const rows = await loadDocumentCitationRows();
    const allReferenceIds = Array.from(
      new Set(
        rows.flatMap((row) => (row.reference_ids || []) as string[]),
      ),
    );`,
  `    const rows = await loadDocumentCitationRows();
    const referenceEntryRows = await loadDocumentReferenceEntryRows();
    const allReferenceIds = Array.from(
      new Set([
        ...rows.flatMap((row) => (row.reference_ids || []) as string[]),
        ...referenceEntryRows.flatMap(
          (row) => (row.reference_ids || []) as string[],
        ),
      ]),
    );`,
);

replaceOnce(
  "style-switch numbering",
  `    const numberMap = buildCitationNumberMap(
      rows.map((row) => ({
        reference_ids: (row.reference_ids || []) as string[],
        created_at: row.created_at,
      })),
    );`,
  `    const numberMap = buildCitationNumberMap([
      ...rows.map((row) => ({
        reference_ids: (row.reference_ids || []) as string[],
        created_at: row.created_at,
      })),
      ...referenceEntryRows.map((row) => ({
        reference_ids: (row.reference_ids || []) as string[],
        created_at: row.created_at,
      })),
    ]);`,
);

replaceOnce(
  "style-switch standalone references",
  `    setCitationStyle(nextStyle);

    const bibliography = orderedPageElements()`,
  `    for (const row of referenceEntryRows) {
      const rowReferences = ((row.reference_ids || []) as string[])
        .map((id) => byId.get(id))
        .filter(
          (reference): reference is CitationReference => Boolean(reference),
        );

      const entries = formatBibliographyEntries({
        style: nextStyle,
        references: rowReferences,
        numberMap,
      });

      for (const page of orderedPageElements()) {
        const node = page.querySelector<HTMLElement>(
          \`[data-psylattice-reference-entry-id="\${row.id}"]\`,
        );

        if (node) {
          node.innerHTML = entries
            .map(
              (entry) =>
                \`<p data-psylattice-reference-id="\${escapeHtml(
                  entry.reference.id,
                )}">\${escapeHtml(entry.text)}</p>\`,
            )
            .join("");
        }
      }

      await supabase
        .from("research_document_reference_entries")
        .update({
          rendered_text: entries.map((entry) => entry.text).join("\\n"),
        })
        .eq("id", row.id)
        .eq("owner_user_id", userId);
    }

    setCitationStyle(nextStyle);

    const bibliography = orderedPageElements()`,
);

replaceOnce(
  "style-switch capture condition",
  `    if (rows.length) {
      captureEditor(undefined, true);
    }`,
  `    if (rows.length || referenceEntryRows.length) {
      captureEditor(undefined, true);
    }`,
);

replaceOnce(
  "reference insert callback",
  `        onInsertCitation={(payload) => insertStructuredCitation(payload)}
        onInsertBibliography={() => insertOrRefreshBibliography()}`,
  `        onInsertCitation={(payload) => insertStructuredCitation(payload)}
        onInsertReference={(payload) => insertStructuredReferenceEntries(payload)}
        onInsertBibliography={() => insertOrRefreshBibliography()}`,
);

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Structured reference insertion installed successfully.");
console.log("Modified: components/ResearchWritingWorkspace.tsx");
