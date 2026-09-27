import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "app/researcher/page.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find app/researcher/page.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const importLine =
  'import StudyTeamPermissions from "@/components/StudyTeamPermissions";';

if (!source.includes(importLine)) {
  const anchor =
    'import StudyHealthPanel from "@/components/StudyHealthPanel";';

  if (!source.includes(anchor)) {
    console.error(
      "Phase 4A integration stopped: StudyHealthPanel import anchor was not found. No file was changed.",
    );
    process.exit(1);
  }

  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

const casePattern =
  /case\s+"team":\s*\n\s*return\s+<TeamPermissions\s*\/>;/;

if (!casePattern.test(source)) {
  if (source.includes('return <StudyTeamPermissions />;')) {
    console.log("Phase 4A Team & Permissions is already integrated.");
    process.exit(0);
  }

  console.error(
    'Phase 4A integration stopped: the existing case "team" -> <TeamPermissions /> route was not found. No file was changed.',
  );
  process.exit(1);
}

source = source.replace(
  casePattern,
  'case "team":\n        return <StudyTeamPermissions />;',
);

fs.writeFileSync(target, source, "utf8");

console.log(
  "Integrated Phase 4A Team & Permissions. The legacy placeholder function remains unused for now; the live Governance route now renders StudyTeamPermissions.",
);
