import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/AnalysisLab.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/AnalysisLab.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const marker = 'data-psylattice-study-analysis-sync="v1"';
if (source.includes(marker)) {
  console.log("Study-linked Analysis Lab persistence v1 is already installed.");
  process.exit(0);
}

const importAnchor =
  'import { publishCopilotContext, deactivateCopilotContext } from "@/lib/research/copilotBridge";';
const importBlock = `${importAnchor}
import {
  deletePersistedAnalysisRecord,
  loadPersistedAnalysisRecords,
  persistAnalysisRecord,
} from "@/lib/research/analysisRecordsClient";`;

if (!source.includes(importAnchor)) {
  console.error(
    "Analysis persistence patch stopped: copilotBridge import anchor was not found.",
  );
  process.exit(1);
}
source = source.replace(importAnchor, importBlock);

const persistenceEffectAnchor = `  }, [analysisRecords, recordsHydrated]);

  const sourceRows = sourceMode === "csv" ? csvRows : rows;`;

const persistenceEffectReplacement = `  }, [analysisRecords, recordsHydrated]);

  useEffect(() => {
    if (!recordsHydrated || !selectedStudyId) return;

    let cancelled = false;

    void loadPersistedAnalysisRecords<SavedAnalysisRecord>(selectedStudyId)
      .then((remoteRecords) => {
        if (cancelled || remoteRecords.length === 0) return;

        setAnalysisRecords((current) => {
          const remoteIds = new Set(remoteRecords.map((record) => record.id));
          return [
            ...remoteRecords,
            ...current.filter((record) => !remoteIds.has(record.id)),
          ].slice(0, ANALYSIS_RECORD_LIMIT);
        });
      })
      .catch((error) => {
        console.error("Could not hydrate study-linked analysis records:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [recordsHydrated, selectedStudyId]);

  const sourceRows = sourceMode === "csv" ? csvRows : rows;`;

if (!source.includes(persistenceEffectAnchor)) {
  console.error(
    "Analysis persistence patch stopped: local record persistence effect anchor was not found.",
  );
  process.exit(1);
}
source = source.replace(persistenceEffectAnchor, persistenceEffectReplacement);

const functionAnchor = "  function saveCurrentAnalysisRecord() {";
if (!source.includes(functionAnchor)) {
  console.error(
    "Analysis persistence patch stopped: saveCurrentAnalysisRecord was not found.",
  );
  process.exit(1);
}
source = source.replace(
  functionAnchor,
  "  async function saveCurrentAnalysisRecord() {",
);

const saveTailAnchor = `    setAnalysisRecords((current) => [record, ...current.filter((item) => item.id !== record.id)].slice(0, ANALYSIS_RECORD_LIMIT));
    setRecordsOpen(true);
    setCopyStatus("Analysis record saved");
    window.setTimeout(() => setCopyStatus(""), 1900);
  }

  async function copyAnalysisRecord(record: SavedAnalysisRecord) {`;

const saveTailReplacement = `    setAnalysisRecords((current) => [record, ...current.filter((item) => item.id !== record.id)].slice(0, ANALYSIS_RECORD_LIMIT));
    setRecordsOpen(true);

    if (record.source.mode === "study" && record.source.studyId) {
      try {
        await persistAnalysisRecord(record.source.studyId, record);
        setCopyStatus("Analysis record saved to study");
      } catch (error) {
        console.error("Could not sync analysis record to study:", error);
        setCopyStatus("Saved locally · study sync failed");
      }
    } else {
      setCopyStatus("Analysis record saved locally");
    }

    window.setTimeout(() => setCopyStatus(""), 2400);
  }

  async function deleteAnalysisRecord(record: SavedAnalysisRecord) {
    if (record.source.mode === "study" && record.source.studyId) {
      try {
        await deletePersistedAnalysisRecord(record.source.studyId, record.id);
      } catch (error) {
        console.error("Could not delete synced analysis record:", error);
        setCopyStatus("Could not delete the synced record");
        window.setTimeout(() => setCopyStatus(""), 2200);
        return;
      }
    }

    setAnalysisRecords((current) =>
      current.filter((item) => item.id !== record.id),
    );
    setCopyStatus("Analysis record deleted");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  async function copyAnalysisRecord(record: SavedAnalysisRecord) {`;

if (!source.includes(saveTailAnchor)) {
  console.error(
    "Analysis persistence patch stopped: save-record tail anchor was not found.",
  );
  process.exit(1);
}
source = source.replace(saveTailAnchor, saveTailReplacement);

const saveButtonAnchor = 'onClick={saveCurrentAnalysisRecord}';
if (!source.includes(saveButtonAnchor)) {
  console.error(
    "Analysis persistence patch stopped: Save record button anchor was not found.",
  );
  process.exit(1);
}
source = source.replace(
  saveButtonAnchor,
  'onClick={() => void saveCurrentAnalysisRecord()} data-psylattice-study-analysis-sync="v1"',
);

const deleteButtonAnchor =
  'onClick={() => setAnalysisRecords((current) => current.filter((item) => item.id !== record.id))} title="Delete record"';
if (!source.includes(deleteButtonAnchor)) {
  console.error(
    "Analysis persistence patch stopped: Delete record button anchor was not found.",
  );
  process.exit(1);
}
source = source.replace(
  deleteButtonAnchor,
  'onClick={() => void deleteAnalysisRecord(record)} title="Delete record"',
);

const emptyTextAnchor =
  'PsyLattice will retain the setup and result tables in this browser.';
if (source.includes(emptyTextAnchor)) {
  source = source.replace(
    emptyTextAnchor,
    "PsyLattice keeps records locally and syncs study-data records to the study so Study Health and future reporting audits can use them.",
  );
}

fs.writeFileSync(target, source, "utf8");
console.log(
  "Installed study-linked Analysis Lab persistence v1 into components/AnalysisLab.tsx",
);
