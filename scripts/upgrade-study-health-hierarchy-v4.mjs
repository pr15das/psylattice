import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/StudyHealthPanel.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/StudyHealthPanel.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (source.includes('data-psylattice-health-hierarchy="v4"')) {
  console.log("Study Health hierarchy redesign v4 is already installed.");
  process.exit(0);
}

if (!source.includes('data-psylattice-semantic-audit-panel="v2"')) {
  console.error(
    "Hierarchy redesign stopped: Semantic AI panel v2 was not found. No file was changed.",
  );
  process.exit(1);
}

if (!source.includes('data-psylattice-reference-aware-audit="v3"')) {
  console.error(
    "Hierarchy redesign stopped: reference-aware audit v3 was not found. No file was changed.",
  );
  process.exit(1);
}

function extractBalancedDiv(input, startIndex) {
  let cursor = startIndex;
  let depth = 0;
  let started = false;

  while (cursor < input.length) {
    const nextOpen = input.indexOf("<div", cursor);
    const nextClose = input.indexOf("</div>", cursor);

    if (nextOpen === -1 && nextClose === -1) break;

    if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
      depth += 1;
      started = true;
      cursor = nextOpen + 4;
      continue;
    }

    if (nextClose !== -1) {
      depth -= 1;
      cursor = nextClose + 6;

      if (started && depth === 0) {
        return {
          block: input.slice(startIndex, cursor),
          endIndex: cursor,
        };
      }
    }
  }

  throw new Error("Could not determine Semantic AI panel boundaries.");
}

const aiMarker = '        <div\n          data-psylattice-semantic-audit-panel="v2"';
const aiStart = source.indexOf(aiMarker);

if (aiStart < 0) {
  console.error(
    "Hierarchy redesign stopped: Semantic AI panel start could not be found.",
  );
  process.exit(1);
}

let aiPanel;
try {
  aiPanel = extractBalancedDiv(source, aiStart);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

let aiBlock = aiPanel.block;

// Make AI review a neutral professional tool panel. Purple remains only as
// a semantic-AI accent, not as the dominant page surface.
aiBlock = aiBlock.replace(
  'className="mb-4 overflow-hidden rounded-3xl border border-violet-200/80 bg-violet-50/70 p-4 shadow-[0_10px_30px_rgba(124,58,237,0.08)] sm:p-5"',
  'className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,.055)] sm:p-5"',
);

aiBlock = aiBlock.replace(
  'className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-violet-200 bg-white/80 px-3 py-2.5 text-left"',
  'className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-violet-200 hover:bg-violet-50/40"',
);

aiBlock = aiBlock.replaceAll(
  'rounded-full border border-violet-200 bg-white px-2.5 py-1',
  'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1',
);

// Remove AI block from its old position.
source = source.slice(0, aiStart) + source.slice(aiPanel.endIndex);

// Replace the old Recommended next steps block with a hierarchy where one
// action is clearly primary and the others remain secondary.
const recommendedStart = source.indexOf(
  '        {actionable.length > 0 ? (\n          <div className="mt-5 rounded-[22px] border border-amber-200/80 bg-amber-50/45 p-4">',
);

const detailAnchor =
  '        <div className="mt-5 space-y-2.5">';

const detailIndex = source.indexOf(detailAnchor);

if (recommendedStart < 0 || detailIndex < 0 || detailIndex <= recommendedStart) {
  console.error(
    "Hierarchy redesign stopped: Recommended next steps block could not be located. No file was changed.",
  );
  process.exit(1);
}

const recommendedBlock = `        {actionable.length > 0 ? (
          <section
            data-psylattice-health-hierarchy="v4"
            className="mt-5 overflow-hidden rounded-[26px] border border-slate-800 bg-[linear-gradient(145deg,#152033,#0f172a)] shadow-[0_12px_34px_rgba(15,23,42,.16)]"
          >
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-cyan-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-[.12em]">
                    Recommended next step
                  </span>
                </div>

                <p className="mt-3 text-[18px] font-semibold tracking-[-.02em] text-white sm:text-[20px]">
                  {actionable[0].label}
                </p>
                <p className="mt-2 max-w-2xl text-[12px] leading-5 text-slate-300">
                  {actionable[0].detail}
                </p>

                <button
                  type="button"
                  onClick={() => onNavigate(actionable[0].action.target)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[11px] font-semibold text-slate-900 shadow-sm transition hover:bg-cyan-50"
                >
                  {actionable[0].action.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="border-t border-white/10 bg-white/[.045] p-4 sm:p-5 lg:border-l lg:border-t-0">
                <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">
                  After that
                </p>

                <div className="mt-3 space-y-2">
                  {actionable.slice(1, 4).map((item) => (
                    <button
                      key={item.checkId}
                      type="button"
                      onClick={() => onNavigate(item.action.target)}
                      className="group flex w-full items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.055] p-3 text-left transition hover:border-cyan-300/30 hover:bg-white/[.09]"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-white">
                          {item.label}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400">
                          {item.detail}
                        </p>
                      </div>
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                    </button>
                  ))}

                  {actionable.length <= 1 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[.04] px-3 py-4 text-[10px] leading-4 text-slate-400">
                      No additional high-priority actions are currently queued.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

`;

source =
  source.slice(0, recommendedStart) +
  recommendedBlock +
  source.slice(detailIndex);

// Place the neutral Semantic AI tool AFTER the recommended action zone and
// BEFORE the detailed expandable checks.
const newDetailIndex = source.indexOf(detailAnchor);

if (newDetailIndex < 0) {
  console.error(
    "Hierarchy redesign stopped while repositioning the Semantic AI panel.",
  );
  process.exit(1);
}

source =
  source.slice(0, newDetailIndex) +
  aiBlock +
  "\n\n" +
  source.slice(newDetailIndex);

// Slightly deepen the four supporting metric cards, but keep them subordinate
// to Research Readiness + Recommended Next Step.
source = source.replaceAll(
  'className="rounded-2xl border border-slate-300 bg-[linear-gradient(145deg,#f8fafc,#eef2f7)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.07)]"',
  'className="rounded-2xl border border-slate-300 bg-[linear-gradient(145deg,#eef2f7,#e6ebf2)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.075)]"',
);

// If the prior metric-card class is still present instead, upgrade that too.
source = source.replaceAll(
  'className="rounded-2xl border border-slate-200 bg-white p-4"',
  'className="rounded-2xl border border-slate-300 bg-[linear-gradient(145deg,#eef2f7,#e6ebf2)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.075)]"',
);

fs.writeFileSync(target, source, "utf8");

console.log(
  "Installed Study Health hierarchy redesign v4: stronger Recommended Next Step, neutral AI panel, and deeper metric cards.",
);
