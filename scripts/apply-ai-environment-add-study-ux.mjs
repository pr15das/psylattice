import fs from "node:fs";
import path from "node:path";

const target = path.resolve(
  process.cwd(),
  "components/ResearchAiEnvironmentSelector.tsx",
);
const marker = "psylattice.environment-add-study-ux.v1";

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchAiEnvironmentSelector.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (source.includes(marker)) {
  console.log("AI environment Add Study UX v1 is already installed.");
  process.exit(0);
}

const backup = `${target}.before-environment-add-study-ux-v1.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

const startNeedle = `            {capacity &&
            capacity.remaining > 0 &&
            creatableStudies.length > 0 ? (`;

const endNeedle = `            {capacity && capacity.limit > 0 && capacity.remaining === 0 ? (`;

const start = source.indexOf(startNeedle);
const end = source.indexOf(endNeedle, start + 1);

if (start < 0 || end < 0) {
  console.error(
    "Could not find the current Create new environment UX block. No file was written.",
  );
  process.exit(1);
}

const replacement = `            {/* ${marker} */}
            {capacity && capacity.remaining > 0 ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setCreating((value) => !value)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-[8px] font-semibold text-violet-800 transition hover:bg-violet-100/70"
                >
                  <Plus className="h-3 w-3" />
                  {creating ? "Hide study choices" : "Add study environment"}
                </button>

                {creating ? (
                  creatableStudies.length > 0 ? (
                    <div className="mt-2 space-y-1.5">
                      {creatableStudies.map((study) => (
                        <button
                          type="button"
                          key={study.id}
                          disabled={Boolean(busyStudyId)}
                          onClick={() => void createEnvironment(study)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-violet-200 hover:bg-violet-50/40 disabled:opacity-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[9px] font-semibold text-slate-800">
                              {study.title}
                            </span>
                            <span className="mt-0.5 block text-[7.5px] text-slate-400">
                              {titleCaseStatus(study.status)}
                              {study.covered_by_study_pass
                                ? " · Covered by Study Pass"
                                : ""}
                            </span>
                          </span>

                          {busyStudyId === study.id ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-violet-700" />
                          ) : (
                            <Plus className="h-3.5 w-3.5 shrink-0 text-violet-700" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 rounded-xl border border-dashed border-violet-200 bg-violet-50/45 p-3">
                      <p className="text-[8.5px] font-semibold text-slate-700">
                        No unlinked eligible studies yet
                      </p>
                      <p className="mt-1 text-[7.5px] leading-3.5 text-slate-500">
                        {capacity.hasPro
                          ? \`Pro supports up to \${capacity.limit} study AI environments. You currently have \${capacity.used}; create another study first, then add its environment here.\`
                          : "Your Study Pass environment is tied to the study covered by that pass."}
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => void load()}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[7.5px] font-semibold text-slate-600 hover:border-violet-200 hover:text-violet-700"
                        >
                          Refresh studies
                        </button>
                        {capacity.hasPro ? (
                          <button
                            type="button"
                            onClick={() =>
                              window.location.assign("/researcher?screen=studies")
                            }
                            className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-[7.5px] font-semibold text-white"
                          >
                            Open Studies
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            ) : null}

`;

source = source.slice(0, start) + replacement + source.slice(end);

for (const required of [
  marker,
  "Add study environment",
  "No unlinked eligible studies yet",
  "Refresh studies",
]) {
  if (!source.includes(required)) {
    console.error(`Safety check failed: ${required}`);
    process.exit(1);
  }
}

fs.writeFileSync(target, source, "utf8");
console.log("Patched: components/ResearchAiEnvironmentSelector.tsx");
console.log("Pro environment UX now exposes remaining slots even before another study exists.");
