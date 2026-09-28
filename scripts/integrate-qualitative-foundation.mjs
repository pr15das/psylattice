import fs from "node:fs";

const file = "app/researcher/page.tsx";

if (!fs.existsSync(file)) {
  console.error(`Could not find ${file}. Run this from the PsyLattice project root.`);
  process.exit(1);
}

let text = fs.readFileSync(file, "utf8");
const original = text;

function replaceOnce(label, before, after) {
  if (!text.includes(before)) {
    console.error(`Integration stopped: could not find ${label}.`);
    process.exit(1);
  }
  text = text.replace(before, after);
}

if (text.includes('import QualitativeResearchLab from "@/components/QualitativeResearchLab";')) {
  console.log("Qualitative Lab is already integrated.");
  process.exit(0);
}

replaceOnce(
  "Qualitative Lab import",
  'import StudyTeamPermissions from "@/components/StudyTeamPermissions";',
  'import StudyTeamPermissions from "@/components/StudyTeamPermissions";\nimport QualitativeResearchLab from "@/components/QualitativeResearchLab";',
);

replaceOnce(
  "Screen type",
  '  | "cognitive"\n  | "references"',
  '  | "cognitive"\n  | "qualitative"\n  | "references"',
);

replaceOnce(
  "Research navigation",
  '  { id: "cognitive", label: "Cognitive Lab", group: "Research" },',
  '  { id: "cognitive", label: "Cognitive Lab", group: "Research" },\n  { id: "qualitative", label: "Qualitative Lab", group: "Research" },',
);

replaceOnce(
  "Sidebar icon",
  '  cognitive: BrainCircuit,\n  references: BookOpen,',
  '  cognitive: BrainCircuit,\n  qualitative: FileText,\n  references: BookOpen,',
);

replaceOnce(
  "StudyComponents type",
  '    cognitive: boolean;\n    ambulatory: boolean;',
  '    cognitive: boolean;\n    qualitative: boolean;\n    ambulatory: boolean;',
);

replaceOnce(
  "StudyComponents defaults",
  '    cognitive: false,\n    ambulatory: false,',
  '    cognitive: false,\n    qualitative: false,\n    ambulatory: false,',
);

replaceOnce(
  "StudyComponents hydration",
  '        cognitive: savedComponents.cognitive ?? false,\n        ambulatory: savedComponents.ambulatory ?? false,',
  '        cognitive: savedComponents.cognitive ?? false,\n        qualitative: savedComponents.qualitative ?? false,\n        ambulatory: savedComponents.ambulatory ?? false,',
);

replaceOnce(
  "Study Builder step list",
  '    ...(components.cognitive\n      ? [{ key: "cognitive", label: "Cognitive tasks" }]\n      : []),\n    ...(components.ambulatory',
  '    ...(components.cognitive\n      ? [{ key: "cognitive", label: "Cognitive tasks" }]\n      : []),\n    ...(components.qualitative\n      ? [{ key: "qualitative", label: "Qualitative data" }]\n      : []),\n    ...(components.ambulatory',
);

replaceOnce(
  "Research Assistant workflow context",
  '          { key: "cognitive", label: "Cognitive tasks", enabled: components.cognitive },\n          { key: "ambulatory",',
  '          { key: "cognitive", label: "Cognitive tasks", enabled: components.cognitive },\n          { key: "qualitative", label: "Qualitative data", enabled: components.qualitative },\n          { key: "ambulatory",',
);

replaceOnce(
  "Study component card",
  '    { key: "cognitive", title: "Cognitive tasks", text: "Reusable tasks from your personal Cognitive Task Library, pinned to a frozen study-ready version." },',
  '    { key: "cognitive", title: "Cognitive tasks", text: "Reusable tasks from your personal Cognitive Task Library, pinned to a frozen study-ready version." },\n    { key: "qualitative", title: "Qualitative data", text: "Participant-linked or standalone interviews, transcripts, diaries, field notes and other qualitative sources." },',
);

replaceOnce(
  "Qualitative Study Builder panel",
  '          {currentStep.key === "ambulatory" && (',
  `          {currentStep.key === "qualitative" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)]">
                <p className="font-medium text-cyan-950">Qualitative data</p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                  Add interviews, transcripts, diaries, field notes and other qualitative sources. A qualitative case can link directly to an existing PsyLattice participant or remain standalone.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Participant-linked cases</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Link qualitative material to participant records so quantitative, cognitive and EMA data can later be integrated without manually merging identifiers.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Standalone cases</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Keep cases independent when a source is not tied to a study participant, then link it later if needed.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void saveStudyDraft()}
                  disabled={savingStudy}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {savingStudy ? "Saving…" : "Save study"}
                </button>
                <button
                  type="button"
                  onClick={() => changeScreen("qualitative")}
                  className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-semibold text-cyan-800"
                >
                  Open Qualitative Lab
                </button>
              </div>
            </div>
          )}

          {currentStep.key === "ambulatory" && (`,
);

replaceOnce(
  "Qualitative workspace route",
  '      case "cognitive":\n        return <CognitiveLab />;\n\n      case "references":',
  '      case "cognitive":\n        return <CognitiveLab />;\n\n      case "qualitative":\n        return (\n          <QualitativeResearchLab\n            initialStudyId={editingStudyId}\n            onStudyIdChange={setEditingStudyId}\n          />\n        );\n\n      case "references":',
);

replaceOnce(
  "Qualitative workspace description",
  '    cognitive:\n      "Create reusable cognitive task definitions, start from PsyLattice templates, and prepare versioned tasks for experiments and longitudinal research.",',
  '    cognitive:\n      "Create reusable cognitive task definitions, start from PsyLattice templates, and prepare versioned tasks for experiments and longitudinal research.",\n    qualitative:\n      "Organise qualitative cases and sources, link participants, build a codebook and code research material.",',
);

// Make the new component visible in existing study-summary labels.
text = text.replace(
  '      ["ambulatory", "EMA / ESM"],',
  '      ["qualitative", "Qualitative"],\n      ["ambulatory", "EMA / ESM"],',
);
text = text.replace(
  '      ["ambulatory", "Ambulatory / EMA"],',
  '      ["qualitative", "Qualitative"],\n      ["ambulatory", "Ambulatory / EMA"],',
);

if (text === original) {
  console.error("No changes were produced.");
  process.exit(1);
}

fs.writeFileSync(file, text, "utf8");
console.log("Integrated Qualitative Lab into app/researcher/page.tsx");
