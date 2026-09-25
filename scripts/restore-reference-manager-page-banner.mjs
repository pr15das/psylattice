import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "app/researcher/page.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find app/researcher/page.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");
const backup = `${target}.before-reference-manager-banner-restore.bak`;

if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

let changes = 0;

function restore(modified, original, label) {
  if (source.includes(original)) {
    console.log(`Already correct: ${label}`);
    return;
  }

  if (source.includes(modified)) {
    source = source.replace(modified, original);
    changes += 1;
    console.log(`Restored: ${label}`);
    return;
  }

  console.log(`Skipped: ${label} (pattern not found; leaving file untouched)`);
}

// Undo ONLY the previous viewport-fill patch, if it was applied.
// This keeps the normal Research page banner/header so it can naturally
// scroll behind the global sticky navbar.

restore(
  `(screen === "writing" && thesisFocusMode) || screen === "references"
              ? "p-2 sm:p-3 lg:p-4"
              : "p-5 sm:p-6 lg:p-8"`,
  `screen === "writing" && thesisFocusMode
              ? "p-2 sm:p-3 lg:p-4"
              : "p-5 sm:p-6 lg:p-8"`,
  "normal Research page padding",
);

restore(
  `className={(screen === "writing" && thesisFocusMode) || screen === "references" ? "mx-auto max-w-none" : "mx-auto max-w-[1450px]"}`,
  `className={screen === "writing" && thesisFocusMode ? "mx-auto max-w-none" : "mx-auto max-w-[1450px]"}`,
  "normal Research content width",
);

restore(
  `{!(screen === "writing" && thesisFocusMode) && screen !== "references" && (`,
  `{!(screen === "writing" && thesisFocusMode) && (`,
  "Reference Manager page banner",
);

if (changes > 0) {
  fs.writeFileSync(target, source, "utf8");
  console.log("");
  console.log("Reference Manager banner/layout restored successfully.");
} else {
  console.log("");
  console.log("No previous viewport-fill changes were found. Nothing needed restoring.");
}
