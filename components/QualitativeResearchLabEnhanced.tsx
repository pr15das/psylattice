"use client";

import {
  BookOpenText,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Save,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import LegacyQualitativeResearchLab from "./QualitativeResearchLabLegacy";

type Study = {
  id: string;
  title: string;
  status: string;
  components: Record<string, boolean>;
};

type Participant = {
  id: string;
  public_id: string;
  status: string;
  is_test: boolean;
  enrolled_at: string;
  completed_at: string | null;
};

type QualitativeCase = {
  id: string;
  participant_id: string | null;
  case_key: string;
  name: string;
  classification: string;
  attributes: Record<string, unknown>;
  notes: string | null;
  updated_at: string;
};

type QualitativeMaterial = {
  id: string;
  case_id: string;
  source_type: string;
  title: string;
  content_text: string;
  updated_at: string;
};

type StudyPayload = {
  ok?: boolean;
  study: Study;
  participants: Participant[];
  cases: QualitativeCase[];
  sources: QualitativeMaterial[];
};

type BillingEntitlements = {
  plan: "free" | "study-pass" | "pro-monthly" | "pro-annual";
  planName: string;
  hasPro: boolean;
  selectedStudyHasPass: boolean;
};

type Props = {
  initialStudyId?: string;
  onStudyIdChange?: (studyId: string) => void;
  apiBase?: string;
  importApiBase?: string;
  exportApiBase?: string;
  lockedStudyId?: string;
  lockedStudyTitle?: string;
  readOnly?: boolean;
  allowImport?: boolean;
  allowExport?: boolean;
  sharedMode?: boolean;
  canReview?: boolean;
  canManageStructure?: boolean;
};

const MATERIAL_OPTIONS = [
  ["transcript", "Interview transcript"],
  ["interview", "Interview notes"],
  ["focus_group", "Focus group transcript"],
  ["field_note", "Field notes"],
  ["diary", "Diary / journal text"],
  ["document", "Document text"],
  ["other", "Other text"],
] as const;

const WORD_LIMITS = {
  free: 5_000,
  "study-pass": 15_000,
  "pro-monthly": 30_000,
  "pro-annual": 30_000,
} as const;

function wordCount(value: string) {
  return (
    value
      .toLocaleLowerCase()
      .match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []
  ).length;
}

function planLabel(entitlements: BillingEntitlements | null) {
  if (entitlements?.hasPro) return "Pro";
  if (entitlements?.selectedStudyHasPass) return "Study Pass";
  return "Free";
}

function materialLimit(entitlements: BillingEntitlements | null) {
  if (!entitlements) return WORD_LIMITS.free;
  return WORD_LIMITS[entitlements.plan] ?? WORD_LIMITS.free;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

export default function QualitativeResearchLabEnhanced(props: Props) {
  const {
    initialStudyId = "",
    onStudyIdChange,
    apiBase = "/api/research/qualitative",
    importApiBase = "/api/research/qualitative/import",
    exportApiBase = "/api/research/qualitative/export",
    lockedStudyId = "",
    lockedStudyTitle = "",
    readOnly = false,
    allowExport = true,
    sharedMode = false,
    canReview = true,
    canManageStructure = true,
  } = props;

  // Shared/supervisor surfaces can have different ownership semantics. Keep the
  // existing implementation there unchanged; this first installation targets
  // the researcher's own Qualitative Lab.
  const useEnhancedWorkspace =
    !sharedMode && !lockedStudyId && apiBase === "/api/research/qualitative";

  const [advancedWorkspace, setAdvancedWorkspace] = useState(false);
  const [studies, setStudies] = useState<Study[]>([]);
  const [studyId, setStudyId] = useState(initialStudyId);
  const [data, setData] = useState<StudyPayload | null>(null);
  const [entitlements, setEntitlements] = useState<BillingEntitlements | null>(null);
  const [loadingStudies, setLoadingStudies] = useState(true);
  const [loadingStudy, setLoadingStudy] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [query, setQuery] = useState("");
  const [expandedCaseIds, setExpandedCaseIds] = useState<string[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");

  const [showCaseForm, setShowCaseForm] = useState(false);
  const [caseMode, setCaseMode] = useState<"participant" | "standalone">(
    "participant",
  );
  const [caseParticipantId, setCaseParticipantId] = useState("");
  const [caseName, setCaseName] = useState("");

  const [creatingMaterial, setCreatingMaterial] = useState(false);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState("transcript");
  const [materialContent, setMaterialContent] = useState("");
  const [materialDirty, setMaterialDirty] = useState(false);

  const limitedApiBase = "/api/research/qualitative/limited";
  const materialApiBase = "/api/research/qualitative/materials";

  const currentPlanLabel = planLabel(entitlements);
  const currentWordLimit = materialLimit(entitlements);
  const currentWordCount = useMemo(
    () => wordCount(materialContent),
    [materialContent],
  );
  const overWordLimit = currentWordCount > currentWordLimit;
  const overBy = Math.max(0, currentWordCount - currentWordLimit);

  const selectedCase = useMemo(
    () => data?.cases.find((item) => item.id === selectedCaseId) || null,
    [data, selectedCaseId],
  );
  const selectedMaterial = useMemo(
    () =>
      data?.sources.find((item) => item.id === selectedMaterialId) || null,
    [data, selectedMaterialId],
  );
  const selectedParticipant = useMemo(
    () =>
      selectedCase?.participant_id
        ? data?.participants.find(
            (participant) => participant.id === selectedCase.participant_id,
          ) || null
        : null,
    [data, selectedCase],
  );

  const linkedParticipantIds = useMemo(
    () =>
      new Set(
        (data?.cases || [])
          .map((item) => item.participant_id)
          .filter((value): value is string => Boolean(value)),
      ),
    [data],
  );

  const availableParticipants = useMemo(
    () =>
      (data?.participants || []).filter(
        (participant) =>
          !participant.is_test && !linkedParticipantIds.has(participant.id),
      ),
    [data, linkedParticipantIds],
  );

  const filteredCases = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return data?.cases || [];

    return (data?.cases || []).filter((item) => {
      const participant = item.participant_id
        ? data?.participants.find((entry) => entry.id === item.participant_id)
        : null;
      const caseMatch = `${item.name} ${item.case_key} ${item.classification} ${participant?.public_id || ""}`
        .toLocaleLowerCase()
        .includes(needle);
      const materialMatch = (data?.sources || []).some(
        (material) =>
          material.case_id === item.id &&
          `${material.title} ${material.source_type}`
            .toLocaleLowerCase()
            .includes(needle),
      );
      return caseMatch || materialMatch;
    });
  }, [data, query]);

  async function postJson(
    url: string,
    payload: Record<string, unknown>,
  ) {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || "The Qualitative Lab could not be updated.");
    }
    return result;
  }

  async function loadStudies() {
    setLoadingStudies(true);
    setError("");
    try {
      const response = await fetch(apiBase, {
        cache: "no-store",
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Qualitative studies could not be loaded.");
      }

      const nextStudies = Array.isArray(result.studies)
        ? (result.studies as Study[])
        : [];
      setStudies(nextStudies);

      const preferred =
        initialStudyId &&
        nextStudies.some((study) => study.id === initialStudyId)
          ? initialStudyId
          : studyId && nextStudies.some((study) => study.id === studyId)
            ? studyId
            : nextStudies[0]?.id || "";

      setStudyId(preferred);
      if (preferred) onStudyIdChange?.(preferred);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Qualitative studies could not be loaded.",
      );
    } finally {
      setLoadingStudies(false);
    }
  }

  async function loadStudy(target = studyId, preferredMaterialId = "") {
    if (!target) {
      setData(null);
      return;
    }

    setLoadingStudy(true);
    setError("");
    try {
      const response = await fetch(
        `${apiBase}?study_id=${encodeURIComponent(target)}`,
        { cache: "no-store", credentials: "include" },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Qualitative study data could not be loaded.");
      }

      const next = result as StudyPayload;
      setData(next);

      const preferredMaterial = preferredMaterialId
        ? next.sources.find((item) => item.id === preferredMaterialId) || null
        : null;
      const nextCaseId = preferredMaterial
        ? preferredMaterial.case_id
        : next.cases.some((item) => item.id === selectedCaseId)
          ? selectedCaseId
          : next.cases[0]?.id || "";
      const caseMaterials = next.sources.filter(
        (item) => item.case_id === nextCaseId,
      );
      const nextMaterialId = preferredMaterial
        ? preferredMaterial.id
        : caseMaterials.some((item) => item.id === selectedMaterialId)
          ? selectedMaterialId
          : caseMaterials[0]?.id || "";

      setSelectedCaseId(nextCaseId);
      setSelectedMaterialId(nextMaterialId);
      if (nextCaseId) {
        setExpandedCaseIds((previous) =>
          previous.includes(nextCaseId)
            ? previous
            : [...previous, nextCaseId],
        );
      }
    } catch (failure) {
      setData(null);
      setError(
        failure instanceof Error
          ? failure.message
          : "Qualitative study data could not be loaded.",
      );
    } finally {
      setLoadingStudy(false);
    }
  }

  async function loadEntitlements(target = studyId) {
    if (!target) {
      setEntitlements(null);
      return;
    }
    try {
      const response = await fetch(
        `/api/billing/me?studyId=${encodeURIComponent(target)}`,
        { cache: "no-store", credentials: "include" },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok || !result?.entitlements) {
        setEntitlements(null);
        return;
      }
      setEntitlements(result.entitlements as BillingEntitlements);
    } catch {
      // Safe fallback: the UI uses the Free limit. The material API remains the
      // authoritative server-side enforcement layer.
      setEntitlements(null);
    }
  }

  useEffect(() => {
    if (!useEnhancedWorkspace) return;
    void loadStudies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useEnhancedWorkspace]);

  useEffect(() => {
    if (!useEnhancedWorkspace || !studyId) return;
    void Promise.all([loadStudy(studyId), loadEntitlements(studyId)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId, useEnhancedWorkspace]);

  useEffect(() => {
    if (creatingMaterial) return;
    if (!selectedMaterial) {
      setMaterialTitle("");
      setMaterialType("transcript");
      setMaterialContent("");
      setMaterialDirty(false);
      return;
    }
    setMaterialTitle(selectedMaterial.title);
    setMaterialType(selectedMaterial.source_type || "transcript");
    setMaterialContent(selectedMaterial.content_text || "");
    setMaterialDirty(false);
  }, [selectedMaterial, creatingMaterial]);

  function confirmDiscard() {
    return !materialDirty || window.confirm("Discard unsaved material edits?");
  }

  function toggleCase(caseId: string) {
    setExpandedCaseIds((previous) =>
      previous.includes(caseId)
        ? previous.filter((id) => id !== caseId)
        : [...previous, caseId],
    );
  }

  function chooseCase(caseId: string) {
    if (!confirmDiscard()) return;
    setCreatingMaterial(false);
    setSelectedCaseId(caseId);
    setExpandedCaseIds((previous) =>
      previous.includes(caseId) ? previous : [...previous, caseId],
    );
    const firstMaterial =
      data?.sources.find((item) => item.case_id === caseId) || null;
    setSelectedMaterialId(firstMaterial?.id || "");
  }

  function chooseMaterial(material: QualitativeMaterial) {
    if (!confirmDiscard()) return;
    setCreatingMaterial(false);
    setSelectedCaseId(material.case_id);
    setSelectedMaterialId(material.id);
    setExpandedCaseIds((previous) =>
      previous.includes(material.case_id)
        ? previous
        : [...previous, material.case_id],
    );
  }

  function beginMaterial(caseId: string) {
    if (!confirmDiscard()) return;
    setSelectedCaseId(caseId);
    setSelectedMaterialId("");
    setCreatingMaterial(true);
    setMaterialTitle("");
    setMaterialType("transcript");
    setMaterialContent("");
    setMaterialDirty(false);
    setExpandedCaseIds((previous) =>
      previous.includes(caseId) ? previous : [...previous, caseId],
    );
  }

  async function createCase(event: FormEvent) {
    event.preventDefault();
    if (!studyId || busy) return;
    setBusy("case");
    setError("");
    setNotice("");
    try {
      const result = await postJson(limitedApiBase, {
        operation: "create_case",
        studyId,
        participantId: caseMode === "participant" ? caseParticipantId : "",
        name: caseName,
      });
      setShowCaseForm(false);
      setCaseParticipantId("");
      setCaseName("");
      setSelectedCaseId(result.case.id);
      setSelectedMaterialId("");
      setExpandedCaseIds((previous) =>
        previous.includes(result.case.id)
          ? previous
          : [...previous, result.case.id],
      );
      setCreatingMaterial(true);
      setNotice(
        result.existing
          ? "That participant already has a qualitative case."
          : "Case created. Add the first text material when ready.",
      );
      await loadStudy(studyId);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The case could not be created.",
      );
    } finally {
      setBusy("");
    }
  }

  async function syncParticipants() {
    if (!studyId || busy) return;
    setBusy("sync");
    setError("");
    setNotice("");
    try {
      const result = await postJson(limitedApiBase, {
        operation: "sync_participant_cases",
        studyId,
        includeTest: false,
      });
      setNotice(
        result.created
          ? `${result.created} participant case${result.created === 1 ? "" : "s"} created.`
          : "All live participants already have qualitative cases.",
      );
      await loadStudy(studyId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Participant cases could not be created.",
      );
    } finally {
      setBusy("");
    }
  }

  async function saveMaterial() {
    if (!studyId || !selectedCaseId || busy || readOnly) return;
    if (!materialTitle.trim()) {
      setError("Give this material a clear title before saving it.");
      return;
    }
    if (!materialContent.trim()) {
      setError("Paste text into the material before saving it.");
      return;
    }
    if (overWordLimit) {
      setError(
        `This material exceeds your ${currentPlanLabel} plan limit by ${formatNumber(overBy)} word${overBy === 1 ? "" : "s"}.`,
      );
      return;
    }

    const operation = creatingMaterial ? "create_material" : "update_material";
    if (!creatingMaterial && !selectedMaterialId) return;

    setBusy("material");
    setError("");
    setNotice("");
    try {
      const result = await postJson(materialApiBase, {
        operation,
        studyId,
        caseId: selectedCaseId,
        sourceId: creatingMaterial ? "" : selectedMaterialId,
        sourceType: materialType,
        title: materialTitle.trim(),
        content: materialContent,
      });
      const nextMaterialId = result.source?.id || selectedMaterialId;
      setCreatingMaterial(false);
      setSelectedMaterialId(nextMaterialId);
      setMaterialDirty(false);
      setNotice(
        operation === "create_material"
          ? "Text material added to this case."
          : "Text material saved.",
      );
      await Promise.all([
        loadStudy(studyId, nextMaterialId),
        loadEntitlements(studyId),
      ]);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The text material could not be saved.",
      );
    } finally {
      setBusy("");
    }
  }

  if (!useEnhancedWorkspace) {
    return (
      <LegacyQualitativeResearchLab
        {...props}
        allowImport={false}
      />
    );
  }

  if (advancedWorkspace) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-900">
              Coding & analysis workspace
            </p>
            <p className="mt-0.5 text-[7.5px] text-slate-400">
              All existing coding, analysis, synthesis and reliability tools remain intact.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdvancedWorkspace(false)}
            className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[8px] font-semibold text-cyan-800"
          >
            Back to Cases & Materials
          </button>
        </div>
        <LegacyQualitativeResearchLab
          {...props}
          initialStudyId={studyId || initialStudyId}
          onStudyIdChange={(nextStudyId) => {
            setStudyId(nextStudyId);
            onStudyIdChange?.(nextStudyId);
          }}
          apiBase={limitedApiBase}
          importApiBase={importApiBase}
          exportApiBase={exportApiBase}
          allowImport={false}
          allowExport={allowExport}
          readOnly={readOnly}
          canReview={canReview}
          canManageStructure={canManageStructure}
        />
      </div>
    );
  }

  if (loadingStudies) {
    return (
      <div className="flex min-h-[360px] items-center justify-center gap-2 rounded-[26px] border border-slate-200 bg-white text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
        Loading Qualitative Lab…
      </div>
    );
  }

  if (studies.length === 0) {
    return (
      <div className="rounded-[26px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <BookOpenText className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">
            No qualitative study yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enable Qualitative data in Study Builder. The study will then appear here for cases, participants and text materials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4 text-cyan-700" />
              <h2 className="text-[14px] font-semibold text-slate-950">
                Qualitative Lab
              </h2>
            </div>
            <p className="mt-1 max-w-2xl text-[9px] leading-4 text-slate-500">
              Organise each participant or case first, then keep its transcripts and other text materials directly underneath it.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <span className="rounded-lg bg-white px-3 py-1.5 text-[8px] font-semibold text-cyan-800 shadow-sm">
                Cases & Materials
              </span>
              <button
                type="button"
                onClick={() => setAdvancedWorkspace(true)}
                className="rounded-lg px-3 py-1.5 text-[8px] font-semibold text-slate-500 hover:text-slate-900"
              >
                Coding & Analysis
              </button>
            </div>

            <select
              value={studyId}
              onChange={(event) => {
                if (!confirmDiscard()) return;
                const next = event.target.value;
                setStudyId(next);
                setSelectedCaseId("");
                setSelectedMaterialId("");
                setCreatingMaterial(false);
                onStudyIdChange?.(next);
              }}
              className="min-w-[250px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold text-slate-700 outline-none focus:border-cyan-300"
            >
              {studies.map((study) => (
                <option key={study.id} value={study.id}>
                  {study.title}
                </option>
              ))}
            </select>

            <span className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-[8px] font-semibold text-violet-800">
              {currentPlanLabel} · {formatNumber(currentWordLimit)} words / material
            </span>
          </div>
        </div>
      </section>

      {(error || notice) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[9px] text-rose-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700">
              {notice}
            </div>
          )}
        </div>
      )}

      {loadingStudy && !data ? (
        <div className="flex min-h-[520px] items-center justify-center gap-2 rounded-[26px] border border-slate-200 bg-white text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
          Loading qualitative study…
        </div>
      ) : data ? (
        <div className="grid min-h-[760px] gap-3 xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-950">
                    Cases & Materials
                  </p>
                  <p className="mt-0.5 text-[7.5px] leading-3.5 text-slate-400">
                    Participants and their pasted text materials
                  </p>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setShowCaseForm((value) => !value)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700"
                    title="Add case or participant"
                    aria-label="Add case or participant"
                  >
                    {showCaseForm ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search cases & materials"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-[8.5px] outline-none focus:border-cyan-300"
                />
              </div>
            </div>

            {!readOnly && showCaseForm && (
              <form
                onSubmit={createCase}
                className="border-b border-cyan-100 bg-cyan-50/35 p-4"
              >
                <p className="text-[8px] font-semibold text-slate-700">
                  Add case / participant
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {(["participant", "standalone"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCaseMode(mode)}
                      className={`rounded-lg border px-2 py-2 text-[7.5px] font-semibold ${
                        caseMode === mode
                          ? "border-cyan-300 bg-white text-cyan-800"
                          : "border-transparent text-slate-400"
                      }`}
                    >
                      {mode === "participant" ? "Participant" : "Standalone case"}
                    </button>
                  ))}
                </div>

                {caseMode === "participant" && (
                  <select
                    value={caseParticipantId}
                    onChange={(event) => setCaseParticipantId(event.target.value)}
                    required
                    className="mt-2.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                  >
                    <option value="">Choose participant…</option>
                    {availableParticipants.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.public_id}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  value={caseName}
                  onChange={(event) => setCaseName(event.target.value)}
                  placeholder={
                    caseMode === "participant"
                      ? "Optional display name"
                      : "Case name"
                  }
                  required={caseMode === "standalone"}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px] outline-none focus:border-cyan-300"
                />

                <button
                  type="submit"
                  disabled={
                    busy === "case" ||
                    (caseMode === "participant" && !caseParticipantId)
                  }
                  className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2.5 text-[8px] font-semibold text-white disabled:opacity-40"
                >
                  {busy === "case" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  Create case
                </button>
              </form>
            )}

            {!readOnly && data.participants.some((participant) => !participant.is_test) && (
              <div className="border-b border-slate-100 p-3">
                <button
                  type="button"
                  disabled={busy === "sync"}
                  onClick={() => void syncParticipants()}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[7.5px] font-semibold text-violet-700 disabled:opacity-40"
                >
                  {busy === "sync" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Users className="h-3 w-3" />
                  )}
                  Create cases from live participants
                </button>
              </div>
            )}

            <div className="max-h-[670px] overflow-y-auto [scrollbar-width:thin]">
              {filteredCases.length === 0 ? (
                <div className="p-8 text-center">
                  <UserRound className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-[8.5px] text-slate-400">
                    {query.trim()
                      ? "No cases or materials match this search."
                      : "No cases yet. Add a participant or standalone case first."}
                  </p>
                </div>
              ) : (
                filteredCases.map((item) => {
                  const participant = item.participant_id
                    ? data.participants.find(
                        (entry) => entry.id === item.participant_id,
                      ) || null
                    : null;
                  const materials = data.sources.filter(
                    (material) => material.case_id === item.id,
                  );
                  const expanded =
                    expandedCaseIds.includes(item.id) || Boolean(query.trim());
                  const activeCase = selectedCaseId === item.id;

                  return (
                    <div key={item.id} className="border-b border-slate-100">
                      <div
                        className={`flex items-center gap-1.5 px-2 py-2 ${
                          activeCase ? "bg-cyan-50/55" : "bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCase(item.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
                          aria-label={expanded ? "Collapse case" : "Expand case"}
                        >
                          {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => chooseCase(item.id)}
                          className="min-w-0 flex-1 rounded-lg px-1.5 py-1.5 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                participant
                                  ? "bg-cyan-100 text-cyan-700"
                                  : "bg-violet-100 text-violet-700"
                              }`}
                            >
                              {participant ? (
                                <UserRound className="h-3.5 w-3.5" />
                              ) : (
                                <BookOpenText className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[8.5px] font-semibold text-slate-850">
                                {item.name}
                              </span>
                              <span className="mt-0.5 block truncate text-[6.8px] text-slate-400">
                                {participant?.public_id || item.case_key} · {materials.length} material{materials.length === 1 ? "" : "s"}
                              </span>
                            </span>
                          </div>
                        </button>

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => beginMaterial(item.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-400 hover:border-cyan-200 hover:bg-white hover:text-cyan-700"
                            title="Add text material"
                            aria-label="Add text material"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {expanded && (
                        <div className="bg-slate-50/35 pb-2 pl-11 pr-2">
                          {materials.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => !readOnly && beginMaterial(item.id)}
                              disabled={readOnly}
                              className="w-full rounded-lg border border-dashed border-slate-200 px-3 py-2 text-left text-[7px] text-slate-400 disabled:cursor-default"
                            >
                              No text materials yet{readOnly ? "." : " · Add one"}
                            </button>
                          ) : (
                            <div className="space-y-1">
                              {materials.map((material) => {
                                const active = selectedMaterialId === material.id;
                                const words = wordCount(material.content_text || "");
                                return (
                                  <button
                                    key={material.id}
                                    type="button"
                                    onClick={() => chooseMaterial(material)}
                                    className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left ${
                                      active
                                        ? "border-cyan-200 bg-white text-cyan-900 shadow-sm"
                                        : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white"
                                    }`}
                                  >
                                    <FileText className={`h-3.5 w-3.5 shrink-0 ${active ? "text-cyan-700" : "text-slate-400"}`} />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[7.8px] font-semibold">
                                        {material.title}
                                      </span>
                                      <span className="mt-0.5 block text-[6.5px] text-slate-400">
                                        {formatNumber(words)} words
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {!readOnly && materials.length > 0 && (
                            <button
                              type="button"
                              onClick={() => beginMaterial(item.id)}
                              className="mt-1.5 inline-flex items-center gap-1 px-1 py-1 text-[7px] font-semibold text-cyan-700"
                            >
                              <Plus className="h-3 w-3" />
                              Add material
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <main className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            {!selectedCase ? (
              <div className="flex min-h-[680px] items-center justify-center p-8 text-center">
                <div className="max-w-md">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[12px] font-semibold text-slate-900">
                    Start with a case or participant
                  </h3>
                  <p className="mt-2 text-[9px] leading-4 text-slate-500">
                    Create or select a case on the left. Each transcript or text material will stay organised underneath the person or case it belongs to.
                  </p>
                </div>
              </div>
            ) : creatingMaterial ? (
              <div>
                <div className="border-b border-slate-100 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[7px] font-bold uppercase tracking-[.1em] text-cyan-600">
                        {selectedParticipant ? "Participant" : "Case"}
                      </p>
                      <h3 className="mt-1 text-[12px] font-semibold text-slate-950">
                        {selectedCase.name}
                      </h3>
                      <p className="mt-0.5 text-[7.5px] text-slate-400">
                        Add a new pasted-text material
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirmDiscard()) return;
                        setCreatingMaterial(false);
                        const first = data.sources.find(
                          (item) => item.case_id === selectedCase.id,
                        );
                        setSelectedMaterialId(first?.id || "");
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px] font-semibold text-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <MaterialEditor
                  title="Add text material"
                  planLabel={currentPlanLabel}
                  wordLimit={currentWordLimit}
                  wordCount={currentWordCount}
                  overBy={overBy}
                  overLimit={overWordLimit}
                  materialTitle={materialTitle}
                  materialType={materialType}
                  materialContent={materialContent}
                  dirty={materialDirty}
                  busy={busy === "material"}
                  readOnly={readOnly}
                  submitLabel="Add material"
                  onTitleChange={(value) => {
                    setMaterialTitle(value);
                    setMaterialDirty(true);
                  }}
                  onTypeChange={(value) => {
                    setMaterialType(value);
                    setMaterialDirty(true);
                  }}
                  onContentChange={(value) => {
                    setMaterialContent(value);
                    setMaterialDirty(true);
                  }}
                  onSave={() => void saveMaterial()}
                />
              </div>
            ) : !selectedMaterial ? (
              <div className="flex min-h-[680px] items-center justify-center p-8 text-center">
                <div className="max-w-md">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <FileText className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[12px] font-semibold text-slate-900">
                    {selectedCase.name} has no material yet
                  </h3>
                  <p className="mt-2 text-[9px] leading-4 text-slate-500">
                    Add the transcript or another text material by pasting the text directly into PsyLattice.
                  </p>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => beginMaterial(selectedCase.id)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-[8.5px] font-semibold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add text material
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-100 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[7px] font-bold uppercase tracking-[.1em] text-cyan-600">
                          {selectedParticipant ? selectedParticipant.public_id : selectedCase.case_key}
                        </p>
                        <span className="text-[7px] text-slate-300">/</span>
                        <p className="text-[7px] font-semibold text-slate-400">
                          {selectedCase.name}
                        </p>
                      </div>
                      <h3 className="mt-1 text-[12px] font-semibold text-slate-950">
                        {selectedMaterial.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdvancedWorkspace(true)}
                      className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[8px] font-semibold text-violet-800"
                    >
                      Open coding & analysis
                    </button>
                  </div>
                </div>

                <MaterialEditor
                  title="Text material"
                  planLabel={currentPlanLabel}
                  wordLimit={currentWordLimit}
                  wordCount={currentWordCount}
                  overBy={overBy}
                  overLimit={overWordLimit}
                  materialTitle={materialTitle}
                  materialType={materialType}
                  materialContent={materialContent}
                  dirty={materialDirty}
                  busy={busy === "material"}
                  readOnly={readOnly}
                  submitLabel="Save material"
                  onTitleChange={(value) => {
                    setMaterialTitle(value);
                    setMaterialDirty(true);
                  }}
                  onTypeChange={(value) => {
                    setMaterialType(value);
                    setMaterialDirty(true);
                  }}
                  onContentChange={(value) => {
                    setMaterialContent(value);
                    setMaterialDirty(true);
                  }}
                  onSave={() => void saveMaterial()}
                />
              </div>
            )}
          </main>
        </div>
      ) : null}
    </div>
  );
}

function MaterialEditor({
  title,
  planLabel,
  wordLimit,
  wordCount: currentWordCount,
  overBy,
  overLimit,
  materialTitle,
  materialType,
  materialContent,
  dirty,
  busy,
  readOnly,
  submitLabel,
  onTitleChange,
  onTypeChange,
  onContentChange,
  onSave,
}: {
  title: string;
  planLabel: string;
  wordLimit: number;
  wordCount: number;
  overBy: number;
  overLimit: boolean;
  materialTitle: string;
  materialType: string;
  materialContent: string;
  dirty: boolean;
  busy: boolean;
  readOnly: boolean;
  submitLabel: string;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
}) {
  const limitPercentage = Math.min(100, (currentWordCount / wordLimit) * 100);

  return (
    <div className="p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-700" />
            <h4 className="text-[10px] font-semibold text-slate-900">{title}</h4>
          </div>
          <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
            Text-only for now. Paste the complete transcript or other qualitative text directly below.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <p className={`text-[9px] font-semibold ${overLimit ? "text-rose-700" : "text-slate-800"}`}>
            {formatNumber(currentWordCount)} / {formatNumber(wordLimit)} words
          </p>
          <p className="mt-0.5 text-[6.5px] text-slate-400">
            {planLabel} plan · per material
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="block">
          <span className="text-[7.5px] font-semibold text-slate-600">Material title</span>
          <input
            value={materialTitle}
            onChange={(event) => onTitleChange(event.target.value)}
            disabled={readOnly}
            placeholder="e.g. Initial Interview, Follow-up Interview"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold outline-none focus:border-cyan-300 disabled:bg-slate-50"
          />
        </label>

        <label className="block">
          <span className="text-[7.5px] font-semibold text-slate-600">Text material type</span>
          <select
            value={materialType}
            onChange={(event) => onTypeChange(event.target.value)}
            disabled={readOnly}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px] disabled:bg-slate-50"
          >
            {MATERIAL_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-[7.5px] font-semibold text-slate-600">Paste text</span>
        <textarea
          value={materialContent}
          onChange={(event) => onContentChange(event.target.value)}
          disabled={readOnly}
          placeholder="Paste transcript or qualitative text here…"
          rows={28}
          spellCheck
          className={`mt-1.5 min-h-[620px] w-full resize-y rounded-2xl border bg-white px-7 py-6 font-serif text-[15px] leading-7 text-slate-800 outline-none focus:ring-4 disabled:bg-slate-50 ${
            overLimit
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-50"
              : "border-slate-200 focus:border-cyan-300 focus:ring-cyan-50"
          }`}
        />
      </label>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${overLimit ? "bg-rose-500" : limitPercentage > 85 ? "bg-amber-500" : "bg-cyan-500"}`}
          style={{ width: `${Math.max(currentWordCount > 0 ? 1 : 0, limitPercentage)}%` }}
        />
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/65 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {overLimit ? (
            <p className="text-[8.5px] font-semibold text-rose-700">
              This material exceeds your {planLabel} plan limit by {formatNumber(overBy)} word{overBy === 1 ? "" : "s"}.
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-[8px] font-semibold text-slate-600">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {formatNumber(Math.max(0, wordLimit - currentWordCount))} words remaining for this material
            </p>
          )}
          <p className="mt-1 text-[7px] text-slate-400">
            PsyLattice never truncates an over-limit transcript. Shorten it or use a plan with a higher material limit.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            disabled={
              busy ||
              overLimit ||
              !materialTitle.trim() ||
              !materialContent.trim() ||
              !dirty
            }
            onClick={onSave}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-[8.5px] font-semibold text-white disabled:opacity-35"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
