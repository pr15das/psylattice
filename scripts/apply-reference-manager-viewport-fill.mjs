import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "app/researcher/page.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find app/researcher/page.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (!source.includes('case "references":')) {
  console.error(
    'Reference Manager screen was not found in app/researcher/page.tsx. Install Step 2 first.',
  );
  process.exit(1);
}

const backup = `${target}.before-reference-manager-viewport-fill.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

let changes = 0;

function replaceOnce(before, after, label) {
  if (source.includes(after)) {
    console.log(`Already applied: ${label}`);
    return;
  }

  if (!source.includes(before)) {
    console.error(`Could not find expected block for: ${label}`);
    console.error("No file was written.");
    process.exit(1);
  }

  source = source.replace(before, after);
  changes += 1;
  console.log(`Applied: ${label}`);
}

// 1) Reference Manager should use the same compact outer padding as an immersive
// workspace instead of the normal dashboard-style page padding.
replaceOnce(
  `screen === "writing" && thesisFocusMode
              ? "p-2 sm:p-3 lg:p-4"
              : "p-5 sm:p-6 lg:p-8"`,
  `(screen === "writing" && thesisFocusMode) || screen === "references"
              ? "p-2 sm:p-3 lg:p-4"
              : "p-5 sm:p-6 lg:p-8"`,
  "compact Reference Manager outer padding",
);

// 2) Give Reference Manager the full available content width.
replaceOnce(
  `className={screen === "writing" && thesisFocusMode ? "mx-auto max-w-none" : "mx-auto max-w-[1450px]"}`,
  `className={(screen === "writing" && thesisFocusMode) || screen === "references" ? "mx-auto max-w-none" : "mx-auto max-w-[1450px]"}`,
  "full-width Reference Manager container",
);

// 3) Hide the duplicate Research-page introduction card for Reference Manager.
// Reference Manager already has its own internal title/toolbar. This lets the main
// library workspace begin immediately below the global PsyLattice navbar.
replaceOnce(
  `{!(screen === "writing" && thesisFocusMode) && (`,
  `{!(screen === "writing" && thesisFocusMode) && screen !== "references" && (`,
  "hide duplicate Reference Manager intro card",
);

if (changes === 0) {
  console.log("Reference Manager viewport-fill patch is already installed.");
  process.exit(0);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Reference Manager viewport-fill patch installed successfully.");
console.log("Modified: app/researcher/page.tsx");
console.log("The Reference Manager now starts directly below the global navbar.");
