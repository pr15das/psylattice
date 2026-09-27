import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "app/researcher/page.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find app/researcher/page.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const importLine =
  'import StudyHealthPanel from "@/components/StudyHealthPanel";';

if (!source.includes(importLine)) {
  const importAnchor =
    'import ResearchStudyAssociations from "@/components/ResearchStudyAssociations";';

  if (!source.includes(importAnchor)) {
    console.error(
      "Study Health UI patch stopped: the expected ResearchStudyAssociations import was not found.",
    );
    process.exit(1);
  }

  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

if (source.includes('data-psylattice-study-health="v1"')) {
  console.log("Study Health UI v1 is already installed.");
  process.exit(0);
}

const studiesStart = source.indexOf("function Studies({");
if (studiesStart < 0) {
  console.error(
    "Study Health UI patch stopped: function Studies(...) could not be found.",
  );
  process.exit(1);
}

const studyBuilderMarker = source.indexOf(
  "STUDY BUILDER",
  studiesStart,
);
const studiesEnd =
  studyBuilderMarker >= 0 ? studyBuilderMarker : source.length;

const beforeStudies = source.slice(0, studiesStart);
let studiesBlock = source.slice(studiesStart, studiesEnd);
const afterStudies = source.slice(studiesEnd);

const anchor =
  '          <div className="mt-6 border-t border-slate-100 pt-5">';

const anchorIndex = studiesBlock.indexOf(anchor);
if (anchorIndex < 0) {
  console.error(
    "Study Health UI patch stopped: the selected-study status block anchor was not found. No file was changed.",
  );
  process.exit(1);
}

const insertion = `          <div
            className="mt-6"
            data-psylattice-study-health="v1"
          >
            <StudyHealthPanel
              studyId={selectedStudy.id}
              onNavigate={changeScreen}
            />
          </div>

`;

studiesBlock =
  studiesBlock.slice(0, anchorIndex) +
  insertion +
  studiesBlock.slice(anchorIndex);

source = beforeStudies + studiesBlock + afterStudies;

fs.writeFileSync(target, source, "utf8");
console.log("Installed Study Health UI v1 into app/researcher/page.tsx");
