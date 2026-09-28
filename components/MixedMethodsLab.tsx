"use client";

import {
  BarChart3,
  Blend,
  BookOpen,
  Check,
  ChevronDown,
  Database,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  Save,
  Search,
  Table2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StudyOption = {
  id: string;
  title: string;
  status: string;
  components?: Record<string, boolean>;
};

type QuantCodebookRow = {
  variable: string;
  label?: string;
  type?: string;
  source?: string;
  notes?: string;
};

type MixedTheme = {
  id: string;
  name: string;
  description?: string | null;
  color: string;
};

type ThemeEvidence = {
  codingId: string;
  excerpt: string;
  sourceId: string;
  sourceTitle: string;
  codeId: string;
  codeName: string;
  codeColor: string;
  method: string;
};

type ThemeStat = {
  themeId: string;
  themeName: string;
  color: string;
  present: boolean;
  referenceCount: number;
  sourceCount: number;
  codeCount: number;
  frameworkSummary: string;
  evidence: ThemeEvidence[];
};

type ParticipantBridge = {
  participantId: string;
  participantPublicId: string;
  participantCode: string | null;
  participantStatus: string;
  enrolledAt: string | null;
  completedAt: string | null;
  qualitativeCase: {
    id: string;
    caseKey: string;
    name: string;
    classification: string;
    attributes: Record<string, unknown>;
    notes: string;
  } | null;
  qualitativeSourceCount: number;
  qualitativeReferenceCount: number;
  themeStats: ThemeStat[];
  codeStats: Array<{
    codeId: string;
    codeName: string;
    color: string;
    referenceCount: number;
  }>;
};

type SavedDisplay = {
  id: string;
  name: string;
  description: string | null;
  row_mode: "participant";
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type IntegrationType =
  | "convergent"
  | "complementary"
  | "divergent"
  | "expansion"
  | "negative_case"
  | "unclear";

type IntegratedFinding = {
  id: string;
  title: string;
  quant_variable: string | null;
  qualitative_theme_id: string | null;
  integration_type: IntegrationType;
  quantitative_finding: string;
  qualitative_finding: string;
  integrated_interpretation: string;
  evidence_snapshot: Record<string, unknown>;
  status: "draft" | "final";
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

type GroupEvidenceSelection = {
  groupVariable: string;
  groupValue: string;
  theme: MixedTheme;
  members: Array<{
    participant: ParticipantBridge;
    stat: ThemeStat;
  }>;
} | null;

type MixedPayload = {
  ok: boolean;
  study: {
    id: string;
    title: string;
    status: string;
    components?: Record<string, boolean>;
    design?: string | null;
  };
  participantBridge: ParticipantBridge[];
  themes: MixedTheme[];
  savedDisplays: SavedDisplay[];
  integratedFindings: IntegratedFinding[];
  readiness: {
    participants: number;
    qualitativeCases: number;
    linkedParticipants: number;
    codedParticipants: number;
    themes: number;
    codings: number;
    standaloneQualitativeCases: number;
  };
};

type QualitativeMetric =
  | "presence"
  | "references"
  | "framework"
  | "evidence";

type EvidenceSelection = {
  participant: ParticipantBridge;
  theme: MixedTheme;
  stat: ThemeStat | null;
} | null;

function asRows(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return [];
  const value = payload as Record<string, unknown>;
  if (Array.isArray(value.rows)) return value.rows as Array<Record<string, unknown>>;
  if (
    value.data &&
    typeof value.data === "object" &&
    !Array.isArray(value.data) &&
    Array.isArray((value.data as Record<string, unknown>).rows)
  ) {
    return (value.data as Record<string, unknown>)
      .rows as Array<Record<string, unknown>>;
  }
  return [];
}

function asCodebook(payload: unknown): QuantCodebookRow[] {
  if (!payload || typeof payload !== "object") return [];
  const value = payload as Record<string, unknown>;
  if (Array.isArray(value.codebook)) return value.codebook as QuantCodebookRow[];
  if (
    value.data &&
    typeof value.data === "object" &&
    !Array.isArray(value.data) &&
    Array.isArray((value.data as Record<string, unknown>).codebook)
  ) {
    return (value.data as Record<string, unknown>)
      .codebook as QuantCodebookRow[];
  }
  return [];
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    return Number.isInteger(value)
      ? String(value)
      : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function truncated(value: string, max = 90) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function percent(value: number, denominator: number) {
  if (!denominator) return "0%";
  return `${Math.round((value / denominator) * 100)}%`;
}

function prettyVariable(name: string) {
  return name
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

function mean(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sampleSd(values: number[]) {
  if (values.length < 2) return null;
  const average = mean(values);
  if (average === null) return null;
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function cohenD(left: number[], right: number[]) {
  if (left.length < 2 || right.length < 2) return null;
  const leftMean = mean(left);
  const rightMean = mean(right);
  const leftSd = sampleSd(left);
  const rightSd = sampleSd(right);
  if (
    leftMean === null ||
    rightMean === null ||
    leftSd === null ||
    rightSd === null
  ) {
    return null;
  }
  const pooled = Math.sqrt(
    ((left.length - 1) * leftSd ** 2 + (right.length - 1) * rightSd ** 2) /
      (left.length + right.length - 2),
  );
  if (!Number.isFinite(pooled) || pooled === 0) return null;
  return (leftMean - rightMean) / pooled;
}

function rankValues(values: number[]) {
  const indexed = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);

  let cursor = 0;
  while (cursor < indexed.length) {
    let end = cursor + 1;
    while (end < indexed.length && indexed[end].value === indexed[cursor].value) {
      end += 1;
    }
    const averageRank = (cursor + 1 + end) / 2;
    for (let index = cursor; index < end; index += 1) {
      ranks[indexed[index].index] = averageRank;
    }
    cursor = end;
  }
  return ranks;
}

function pearson(left: number[], right: number[]) {
  const n = Math.min(left.length, right.length);
  if (n < 3) return null;
  const x = left.slice(0, n);
  const y = right.slice(0, n);
  const xMean = mean(x);
  const yMean = mean(y);
  if (xMean === null || yMean === null) return null;
  let numerator = 0;
  let leftSquares = 0;
  let rightSquares = 0;
  for (let index = 0; index < n; index += 1) {
    const dx = x[index] - xMean;
    const dy = y[index] - yMean;
    numerator += dx * dy;
    leftSquares += dx * dx;
    rightSquares += dy * dy;
  }
  const denominator = Math.sqrt(leftSquares * rightSquares);
  if (!denominator) return null;
  return numerator / denominator;
}

function spearman(left: number[], right: number[]) {
  if (left.length < 3 || right.length < 3) return null;
  return pearson(rankValues(left), rankValues(right));
}

function numericText(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function safeGroupValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Missing";
  return displayValue(value);
}


function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.05)]">
      <p className="text-[7.5px] font-bold uppercase tracking-[.09em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-[22px] font-semibold tracking-[-.025em] text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">{detail}</p>
    </div>
  );
}

export default function MixedMethodsLab() {
  const [studies, setStudies] = useState<StudyOption[]>([]);
  const [studyId, setStudyId] = useState("");
  const [mixed, setMixed] = useState<MixedPayload | null>(null);
  const [quantRows, setQuantRows] = useState<Array<Record<string, unknown>>>([]);
  const [codebook, setCodebook] = useState<QuantCodebookRow[]>([]);
  const [loadingStudies, setLoadingStudies] = useState(true);
  const [loadingStudy, setLoadingStudy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [tab, setTab] = useState<
    | "integration"
    | "joint"
    | "groups"
    | "associations"
    | "findings"
    | "profiles"
    | "saved"
  >("integration");
  const [selectedQuantVariables, setSelectedQuantVariables] = useState<string[]>(
    [],
  );
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [qualitativeMetric, setQualitativeMetric] =
    useState<QualitativeMetric>("presence");
  const [participantSearch, setParticipantSearch] = useState("");
  const [evidenceSelection, setEvidenceSelection] =
    useState<EvidenceSelection>(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [savingDisplay, setSavingDisplay] = useState(false);
  const [groupVariable, setGroupVariable] = useState("");
  const [comparisonThemeIds, setComparisonThemeIds] = useState<string[]>([]);
  const [groupEvidenceSelection, setGroupEvidenceSelection] =
    useState<GroupEvidenceSelection>(null);

  const [associationVariable, setAssociationVariable] = useState("");
  const [associationThemeId, setAssociationThemeId] = useState("");
  const [associationMode, setAssociationMode] = useState<
    "presence" | "references"
  >("presence");

  const [editingFindingId, setEditingFindingId] = useState("");
  const [findingTitle, setFindingTitle] = useState("");
  const [findingQuantVariable, setFindingQuantVariable] = useState("");
  const [findingThemeId, setFindingThemeId] = useState("");
  const [findingType, setFindingType] = useState<IntegrationType>("unclear");
  const [findingQuantitative, setFindingQuantitative] = useState("");
  const [findingQualitative, setFindingQualitative] = useState("");
  const [findingInterpretation, setFindingInterpretation] = useState("");
  const [findingStatus, setFindingStatus] = useState<"draft" | "final">(
    "draft",
  );
  const [savingFinding, setSavingFinding] = useState(false);
  const [exportingMixed, setExportingMixed] = useState(false);


  useEffect(() => {
    void loadStudies();
  }, []);

  useEffect(() => {
    if (!studyId) {
      setMixed(null);
      setQuantRows([]);
      setCodebook([]);
      return;
    }
    void loadStudy(studyId);
  }, [studyId]);

  async function loadStudies() {
    setLoadingStudies(true);
    setError("");
    try {
      const response = await fetch("/api/research/mixed-methods", {
        cache: "no-store",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.error || "PsyLattice could not load your studies.",
        );
      }

      const next = Array.isArray(payload.studies)
        ? (payload.studies as StudyOption[])
        : [];
      setStudies(next);
      setStudyId((current) => current || next[0]?.id || "");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "PsyLattice could not load Mixed Methods.",
      );
    } finally {
      setLoadingStudies(false);
    }
  }

  async function loadStudy(targetStudyId: string) {
    setLoadingStudy(true);
    setError("");
    setNotice("");

    try {
      const [mixedResponse, quantitativeResponse] = await Promise.all([
        fetch(
          `/api/research/mixed-methods?study_id=${encodeURIComponent(
            targetStudyId,
          )}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        ),
        fetch(
          `/api/research/shared-data?study_id=${encodeURIComponent(
            targetStudyId,
          )}&dataset=analysis_wide&purpose=analysis`,
          {
            cache: "no-store",
            credentials: "include",
          },
        ),
      ]);

      const mixedPayload = await mixedResponse.json().catch(() => ({}));
      const quantitativePayload = await quantitativeResponse
        .json()
        .catch(() => ({}));

      if (!mixedResponse.ok || !mixedPayload?.ok) {
        throw new Error(
          mixedPayload?.error ||
            "PsyLattice could not load the qualitative side of this study.",
        );
      }

      if (!quantitativeResponse.ok || !quantitativePayload?.ok) {
        throw new Error(
          quantitativePayload?.error ||
            "PsyLattice could not load the quantitative analysis dataset.",
        );
      }

      const rows = asRows(quantitativePayload);
      const nextCodebook = asCodebook(quantitativePayload);
      const payload = mixedPayload as MixedPayload;

      setMixed(payload);
      setQuantRows(rows);
      setCodebook(nextCodebook);

      const eligibleVariables = nextCodebook
        .map((item) => item.variable)
        .filter((variable) => variable !== "participant")
        .slice(0, 4);

      setSelectedQuantVariables((current) =>
        current.length > 0
          ? current.filter((variable) =>
              nextCodebook.some((item) => item.variable === variable),
            )
          : eligibleVariables,
      );

      setSelectedThemeIds((current) =>
        current.length > 0
          ? current.filter((themeId) =>
              payload.themes.some((theme) => theme.id === themeId),
            )
          : payload.themes.slice(0, 4).map((theme) => theme.id),
      );

      setSelectedProfileId((current) =>
        current &&
        payload.participantBridge.some(
          (participant) => participant.participantId === current,
        )
          ? current
          : payload.participantBridge[0]?.participantId || "",
      );
    } catch (failure) {
      setMixed(null);
      setQuantRows([]);
      setCodebook([]);
      setError(
        failure instanceof Error
          ? failure.message
          : "PsyLattice could not load this mixed-methods study.",
      );
    } finally {
      setLoadingStudy(false);
    }
  }

  async function post(payload: Record<string, unknown>) {
    const response = await fetch("/api/research/mixed-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "The Mixed Methods update failed.");
    }
    return data;
  }

  async function saveDisplay() {
    if (!studyId || !displayName.trim() || savingDisplay) return;
    setSavingDisplay(true);
    setError("");
    try {
      await post({
        operation: "save_display",
        studyId,
        name: displayName.trim(),
        config: {
          quantVariables: selectedQuantVariables,
          themeIds: selectedThemeIds,
          qualitativeMetric,
        },
      });
      setNotice("Joint display saved.");
      setDisplayName("");
      await loadStudy(studyId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The joint display could not be saved.",
      );
    } finally {
      setSavingDisplay(false);
    }
  }

  async function deleteDisplay(displayId: string) {
    if (!studyId) return;
    setError("");
    try {
      await post({
        operation: "delete_display",
        studyId,
        displayId,
      });
      setNotice("Saved joint display deleted.");
      await loadStudy(studyId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The joint display could not be deleted.",
      );
    }
  }


  function clearFindingEditor() {
    setEditingFindingId("");
    setFindingTitle("");
    setFindingQuantVariable(associationVariable);
    setFindingThemeId(associationThemeId);
    setFindingType("unclear");
    setFindingQuantitative("");
    setFindingQualitative("");
    setFindingInterpretation("");
    setFindingStatus("draft");
  }

  function editFinding(finding: IntegratedFinding) {
    setEditingFindingId(finding.id);
    setFindingTitle(finding.title);
    setFindingQuantVariable(finding.quant_variable || "");
    setFindingThemeId(finding.qualitative_theme_id || "");
    setFindingType(finding.integration_type);
    setFindingQuantitative(finding.quantitative_finding || "");
    setFindingQualitative(finding.qualitative_finding || "");
    setFindingInterpretation(finding.integrated_interpretation || "");
    setFindingStatus(finding.status);
    setTab("findings");
  }

  async function saveFinding(evidenceSnapshot: Record<string, unknown> = {}) {
    if (!studyId || !findingTitle.trim() || savingFinding) return;
    setSavingFinding(true);
    setError("");
    try {
      await post({
        operation: "save_finding",
        studyId,
        findingId: editingFindingId || undefined,
        title: findingTitle.trim(),
        quantVariable: findingQuantVariable,
        qualitativeThemeId: findingThemeId,
        integrationType: findingType,
        quantitativeFinding: findingQuantitative,
        qualitativeFinding: findingQualitative,
        integratedInterpretation: findingInterpretation,
        evidenceSnapshot,
        status: findingStatus,
      });
      setNotice(editingFindingId ? "Integrated finding updated." : "Integrated finding saved.");
      clearFindingEditor();
      await loadStudy(studyId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The integrated finding could not be saved.",
      );
    } finally {
      setSavingFinding(false);
    }
  }

  async function deleteFinding(findingId: string) {
    if (!studyId) return;
    setError("");
    try {
      await post({
        operation: "delete_finding",
        studyId,
        findingId,
      });
      setNotice("Integrated finding deleted.");
      if (editingFindingId === findingId) clearFindingEditor();
      await loadStudy(studyId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The integrated finding could not be deleted.",
      );
    }
  }

  function loadDisplay(display: SavedDisplay) {
    const config = display.config || {};
    const quantVariables = Array.isArray(config.quantVariables)
      ? config.quantVariables.filter(
          (item): item is string => typeof item === "string",
        )
      : [];
    const themeIds = Array.isArray(config.themeIds)
      ? config.themeIds.filter(
          (item): item is string => typeof item === "string",
        )
      : [];
    const metric =
      config.qualitativeMetric === "references" ||
      config.qualitativeMetric === "framework" ||
      config.qualitativeMetric === "evidence" ||
      config.qualitativeMetric === "presence"
        ? config.qualitativeMetric
        : "presence";

    setSelectedQuantVariables(quantVariables);
    setSelectedThemeIds(themeIds);
    setQualitativeMetric(metric);
    setDisplayName(display.name);
    setTab("joint");
    setNotice(`Loaded “${display.name}”.`);
  }

  const participantVariable =
    codebook.find((item) => item.variable === "participant")?.variable ||
    Object.keys(quantRows[0] || {}).find(
      (key) => key.toLowerCase() === "participant",
    ) ||
    Object.keys(quantRows[0] || {}).find((key) =>
      key.toLowerCase().includes("participant"),
    ) ||
    "participant";

  const quantByParticipant = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const row of quantRows) {
      const key = String(row[participantVariable] ?? "").trim();
      if (key) map.set(key, row);
    }
    return map;
  }, [quantRows, participantVariable]);

  const integratedParticipants = useMemo(() => {
    if (!mixed) return [];
    return mixed.participantBridge.map((participant) => ({
      participant,
      quantRow:
        quantByParticipant.get(participant.participantPublicId) ||
        (participant.participantCode
          ? quantByParticipant.get(participant.participantCode)
          : undefined) ||
        null,
    }));
  }, [mixed, quantByParticipant]);

  const filteredParticipants = useMemo(() => {
    const query = participantSearch.trim().toLowerCase();
    if (!query) return integratedParticipants;
    return integratedParticipants.filter(({ participant }) =>
      [
        participant.participantPublicId,
        participant.participantCode || "",
        participant.qualitativeCase?.name || "",
        participant.qualitativeCase?.caseKey || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [integratedParticipants, participantSearch]);

  const integratedCount = integratedParticipants.filter(
    ({ participant, quantRow }) =>
      Boolean(quantRow) && Boolean(participant.qualitativeCase),
  ).length;

  const quantVariables = useMemo(
    () =>
      codebook.filter(
        (item) =>
          item.variable !== participantVariable &&
          item.variable !== "participant",
      ),
    [codebook, participantVariable],
  );

  const selectedThemes = useMemo(
    () =>
      (mixed?.themes || []).filter((theme) =>
        selectedThemeIds.includes(theme.id),
      ),
    [mixed?.themes, selectedThemeIds],
  );


  const numericVariables = useMemo(
    () =>
      quantVariables.filter((variable) => {
        const observed = quantRows
          .map((row) => finiteNumber(row[variable.variable]))
          .filter((value): value is number => value !== null);
        return observed.length >= 3;
      }),
    [quantVariables, quantRows],
  );

  const categoricalVariables = useMemo(
    () =>
      quantVariables
        .map((variable) => {
          const values = integratedParticipants
            .map(({ quantRow }) =>
              quantRow ? safeGroupValue(quantRow[variable.variable]) : "",
            )
            .filter((value) => value && value !== "Missing");
          const unique = Array.from(new Set(values));
          return { variable, unique };
        })
        .filter((item) => item.unique.length >= 2 && item.unique.length <= 12)
        .sort((left, right) => left.unique.length - right.unique.length),
    [quantVariables, integratedParticipants],
  );

  useEffect(() => {
    if (
      groupVariable &&
      categoricalVariables.some(
        (item) => item.variable.variable === groupVariable,
      )
    ) {
      return;
    }
    setGroupVariable(categoricalVariables[0]?.variable.variable || "");
  }, [categoricalVariables, groupVariable]);

  useEffect(() => {
    if (!mixed?.themes?.length) {
      setComparisonThemeIds([]);
      return;
    }
    setComparisonThemeIds((current) => {
      const valid = current.filter((themeId) =>
        mixed.themes.some((theme) => theme.id === themeId),
      );
      return valid.length ? valid : mixed.themes.slice(0, 6).map((theme) => theme.id);
    });
  }, [mixed?.themes]);

  useEffect(() => {
    if (
      associationVariable &&
      numericVariables.some(
        (item) => item.variable === associationVariable,
      )
    ) {
      return;
    }
    setAssociationVariable(numericVariables[0]?.variable || "");
  }, [numericVariables, associationVariable]);

  useEffect(() => {
    if (
      associationThemeId &&
      mixed?.themes.some((theme) => theme.id === associationThemeId)
    ) {
      return;
    }
    setAssociationThemeId(mixed?.themes[0]?.id || "");
  }, [mixed?.themes, associationThemeId]);

  const comparisonThemes = useMemo(
    () =>
      (mixed?.themes || []).filter((theme) =>
        comparisonThemeIds.includes(theme.id),
      ),
    [mixed?.themes, comparisonThemeIds],
  );

  const groupComparison = useMemo(() => {
    if (!groupVariable || !mixed) return [];

    const groups = new Map<
      string,
      Array<{
        participant: ParticipantBridge;
        quantRow: Record<string, unknown>;
      }>
    >();

    for (const item of integratedParticipants) {
      if (!item.quantRow || !item.participant.qualitativeCase) continue;
      const value = safeGroupValue(item.quantRow[groupVariable]);
      if (value === "Missing") continue;
      if (!groups.has(value)) groups.set(value, []);
      groups.get(value)!.push({
        participant: item.participant,
        quantRow: item.quantRow,
      });
    }

    return Array.from(groups.entries())
      .map(([groupValue, members]) => ({
        groupValue,
        n: members.length,
        themes: comparisonThemes.map((theme) => {
          const stats = members.map(({ participant }) => ({
            participant,
            stat: themeStat(participant, theme.id),
          }));
          const present = stats.filter(
            (item): item is { participant: ParticipantBridge; stat: ThemeStat } =>
              Boolean(item.stat?.present),
          );
          const references = stats.reduce(
            (sum, item) => sum + (item.stat?.referenceCount || 0),
            0,
          );
          return {
            theme,
            presentCount: present.length,
            prevalence: members.length ? present.length / members.length : 0,
            references,
            meanReferences: members.length ? references / members.length : 0,
            present,
          };
        }),
      }))
      .sort((left, right) => left.groupValue.localeCompare(right.groupValue));
  }, [groupVariable, mixed, integratedParticipants, comparisonThemes]);

  const associationTheme =
    mixed?.themes.find((theme) => theme.id === associationThemeId) || null;

  const associationPoints = useMemo(() => {
    if (!associationVariable || !associationThemeId) return [];
    return integratedParticipants.flatMap(({ participant, quantRow }) => {
      if (!quantRow || !participant.qualitativeCase) return [];
      const quantitativeValue = finiteNumber(quantRow[associationVariable]);
      if (quantitativeValue === null) return [];
      const stat = themeStat(participant, associationThemeId);
      if (!stat) return [];
      return [{ participant, quantitativeValue, stat }];
    });
  }, [associationVariable, associationThemeId, integratedParticipants]);

  const associationSummary = useMemo(() => {
    const presentValues = associationPoints
      .filter((point) => point.stat.present)
      .map((point) => point.quantitativeValue);
    const absentValues = associationPoints
      .filter((point) => !point.stat.present)
      .map((point) => point.quantitativeValue);
    const quantitativeValues = associationPoints.map(
      (point) => point.quantitativeValue,
    );
    const referenceCounts = associationPoints.map(
      (point) => point.stat.referenceCount,
    );

    const presentMean = mean(presentValues);
    const absentMean = mean(absentValues);

    return {
      n: associationPoints.length,
      presentN: presentValues.length,
      absentN: absentValues.length,
      presentMean,
      absentMean,
      presentMedian: median(presentValues),
      absentMedian: median(absentValues),
      meanDifference:
        presentMean !== null && absentMean !== null
          ? presentMean - absentMean
          : null,
      cohenD: cohenD(presentValues, absentValues),
      spearmanRho: spearman(quantitativeValues, referenceCounts),
      referenceMean: mean(referenceCounts),
    };
  }, [associationPoints]);

  const selectedProfile =
    mixed?.participantBridge.find(
      (participant) => participant.participantId === selectedProfileId,
    ) || null;
  const selectedProfileQuant = selectedProfile
    ? quantByParticipant.get(selectedProfile.participantPublicId) ||
      (selectedProfile.participantCode
        ? quantByParticipant.get(selectedProfile.participantCode)
        : undefined) ||
      null
    : null;

  function themeStat(
    participant: ParticipantBridge,
    themeId: string,
  ): ThemeStat | null {
    return (
      participant.themeStats.find((item) => item.themeId === themeId) || null
    );
  }

  function themeCellText(stat: ThemeStat | null, metric: QualitativeMetric) {
    if (!stat) return "—";
    if (metric === "presence") return stat.present ? "Present" : "Absent";
    if (metric === "references") return String(stat.referenceCount);
    if (metric === "framework") {
      return stat.frameworkSummary
        ? truncated(stat.frameworkSummary, 80)
        : "No summary";
    }
    return stat.evidence[0]?.excerpt
      ? truncated(stat.evidence[0].excerpt, 80)
      : "No excerpt";
  }

  function toggleQuant(variable: string) {
    setSelectedQuantVariables((current) =>
      current.includes(variable)
        ? current.filter((item) => item !== variable)
        : current.length >= 8
          ? current
          : [...current, variable],
    );
  }

  function toggleTheme(themeId: string) {
    setSelectedThemeIds((current) =>
      current.includes(themeId)
        ? current.filter((item) => item !== themeId)
        : current.length >= 8
          ? current
          : [...current, themeId],
    );
  }


  function toggleComparisonTheme(themeId: string) {
    setComparisonThemeIds((current) =>
      current.includes(themeId)
        ? current.filter((item) => item !== themeId)
        : current.length >= 10
          ? current
          : [...current, themeId],
    );
  }

  function quantLabel(variable: string) {
    return (
      codebook.find((item) => item.variable === variable)?.label ||
      prettyVariable(variable)
    );
  }

  function prepareFindingFromAssociation() {
    if (!associationVariable || !associationTheme) return;
    const variableLabel = quantLabel(associationVariable);
    setEditingFindingId("");
    setFindingTitle(`${variableLabel} × ${associationTheme.name}`);
    setFindingQuantVariable(associationVariable);
    setFindingThemeId(associationTheme.id);
    setFindingType("unclear");

    if (associationMode === "presence") {
      setFindingQuantitative(
        associationSummary.presentMean !== null &&
          associationSummary.absentMean !== null
          ? `${variableLabel}: theme-present participants M=${numericText(
              associationSummary.presentMean,
            )} (n=${associationSummary.presentN}) versus theme-absent participants M=${numericText(
              associationSummary.absentMean,
            )} (n=${associationSummary.absentN}); mean difference=${numericText(
              associationSummary.meanDifference,
            )}${
              associationSummary.cohenD === null
                ? ""
                : `; Cohen's d=${numericText(associationSummary.cohenD)}`
            }.`
          : `${variableLabel}: there is not enough theme-present and theme-absent data for a stable group comparison.`,
      );
      setFindingQualitative(
        `${associationTheme.name} is present for ${associationSummary.presentN} of ${associationSummary.n} integrated participants with a usable ${variableLabel} value.`,
      );
    } else {
      setFindingQuantitative(
        `${variableLabel} and ${associationTheme.name} coded-reference count: Spearman ρ=${numericText(
          associationSummary.spearmanRho,
          3,
        )}, n=${associationSummary.n}.`,
      );
      setFindingQualitative(
        `${associationTheme.name} has a mean of ${numericText(
          associationSummary.referenceMean,
        )} coded references across participants included in this descriptive association.`,
      );
    }

    setFindingInterpretation("");
    setFindingStatus("draft");
    setTab("findings");
  }

  function currentJointDisplayRows() {
    return integratedParticipants.map(({ participant, quantRow }) => {
      const row: Record<string, unknown> = {
        Participant: participant.participantPublicId,
        Qualitative_case: participant.qualitativeCase?.name || "",
      };
      for (const variable of selectedQuantVariables) {
        row[quantLabel(variable)] = quantRow?.[variable] ?? "";
      }
      for (const theme of selectedThemes) {
        row[`Theme · ${theme.name}`] = themeCellText(
          themeStat(participant, theme.id),
          qualitativeMetric,
        );
      }
      return row;
    });
  }

  function groupComparisonRows() {
    return groupComparison.flatMap((group) =>
      group.themes.map((item) => ({
        Group_variable: quantLabel(groupVariable),
        Group: group.groupValue,
        Integrated_n: group.n,
        Theme: item.theme.name,
        Theme_present_n: item.presentCount,
        Theme_prevalence_percent: Number((item.prevalence * 100).toFixed(2)),
        Coded_references: item.references,
        Mean_references_per_participant: Number(item.meanReferences.toFixed(3)),
      })),
    );
  }

  function associationRows() {
    return associationPoints.map((point) => ({
      Participant: point.participant.participantPublicId,
      Quantitative_variable: quantLabel(associationVariable),
      Quantitative_value: point.quantitativeValue,
      Theme: associationTheme?.name || "",
      Theme_present: point.stat.present,
      Theme_reference_count: point.stat.referenceCount,
      Framework_summary: point.stat.frameworkSummary,
    }));
  }

  function findingRows() {
    return (mixed?.integratedFindings || []).map((finding) => ({
      Title: finding.title,
      Quantitative_variable: finding.quant_variable
        ? quantLabel(finding.quant_variable)
        : "",
      Qualitative_theme:
        mixed?.themes.find(
          (theme) => theme.id === finding.qualitative_theme_id,
        )?.name || "",
      Integration_type: finding.integration_type,
      Quantitative_finding: finding.quantitative_finding,
      Qualitative_finding: finding.qualitative_finding,
      Integrated_interpretation: finding.integrated_interpretation,
      Status: finding.status,
      Updated_at: finding.updated_at,
    }));
  }

  async function downloadMixedWorkbook() {
    if (!mixed || !studyId || exportingMixed) return;
    setExportingMixed(true);
    setError("");
    try {
      const response = await fetch("/api/research/export-xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workbookTitle: `${mixed.study.title} — Mixed Methods`,
          filename: `${mixed.study.title
            .replace(/[^a-zA-Z0-9._-]+/g, "-")
            .replace(/^-+|-+$/g, "") || "study"}-mixed-methods.xlsx`,
          sheets: [
            {
              name: "Overview",
              kind: "meta",
              rows: [
                { Metric: "Study", Value: mixed.study.title },
                { Metric: "Quantitative rows", Value: quantRows.length },
                { Metric: "Study participants", Value: mixed.readiness.participants },
                { Metric: "Linked qualitative cases", Value: mixed.readiness.linkedParticipants },
                { Metric: "Integrated participants", Value: integratedCount },
                { Metric: "Themes", Value: mixed.readiness.themes },
                { Metric: "Coded references", Value: mixed.readiness.codings },
                {
                  Metric: "Interpretation note",
                  Value:
                    "Mixed-methods association summaries are descriptive integration aids. Statistical inference should be run in Analysis Lab with a prespecified analysis plan.",
                },
              ],
            },
            {
              name: "Joint Display",
              kind: "clean",
              rows: currentJointDisplayRows(),
            },
            {
              name: "Group Theme",
              kind: "clean",
              rows: groupComparisonRows(),
            },
            {
              name: "Association Summary",
              kind: "meta",
              rows: [
                {
                  Quantitative_variable: associationVariable
                    ? quantLabel(associationVariable)
                    : "",
                  Theme: associationTheme?.name || "",
                  Mode: associationMode,
                  N: associationSummary.n,
                  Theme_present_n: associationSummary.presentN,
                  Theme_absent_n: associationSummary.absentN,
                  Present_mean: associationSummary.presentMean,
                  Absent_mean: associationSummary.absentMean,
                  Mean_difference: associationSummary.meanDifference,
                  Cohen_d: associationSummary.cohenD,
                  Spearman_rho_reference_count:
                    associationSummary.spearmanRho,
                },
              ],
            },
            {
              name: "Association Data",
              kind: "clean",
              rows: associationRows(),
            },
            {
              name: "Integrated Findings",
              kind: "clean",
              rows: findingRows(),
            },
          ],
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Mixed Methods workbook export failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${mixed.study.title
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "study"}-mixed-methods.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice("Mixed Methods workbook exported.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Mixed Methods workbook export failed.",
      );
    } finally {
      setExportingMixed(false);
    }
  }

  function downloadMixedJson() {
    if (!mixed) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      study: mixed.study,
      readiness: mixed.readiness,
      jointDisplay: {
        quantVariables: selectedQuantVariables,
        themeIds: selectedThemeIds,
        qualitativeMetric,
        rows: currentJointDisplayRows(),
      },
      groupThemeComparison: {
        groupVariable,
        rows: groupComparisonRows(),
      },
      association: {
        variable: associationVariable,
        themeId: associationThemeId,
        mode: associationMode,
        summary: associationSummary,
        rows: associationRows(),
      },
      integratedFindings: mixed.integratedFindings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${mixed.study.title
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "study"}-mixed-methods.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice("Mixed Methods JSON archive exported.");
  }

  if (loadingStudies) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-5 py-4 text-[11px] text-slate-500 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
          Opening Mixed Methods…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,.065)]">
        <div className="bg-[linear-gradient(115deg,#ffffff_0%,#f2fbfd_52%,#f8f5ff_100%)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.09em] text-cyan-800">
                  Mixed Methods Lab
                </span>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[8px] font-semibold text-violet-700">
                  Quantitative × qualitative
                </span>
              </div>
              <h2 className="mt-3 text-[20px] font-semibold tracking-[-.03em] text-slate-950">
                Integrate participant data with qualitative evidence
              </h2>
              <p className="mt-1 max-w-3xl text-[9px] leading-4 text-slate-500">
                Link one-row-per-participant analysis data to cases, themes,
                framework summaries and the coded excerpts behind them.
              </p>
            </div>

            <label className="relative min-w-[270px]">
              <select
                value={studyId}
                onChange={(event) => setStudyId(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-[9px] font-semibold text-slate-700 outline-none focus:border-cyan-300"
              >
                {studies.length === 0 && (
                  <option value="">No studies available</option>
                )}
                {studies.map((study) => (
                  <option key={study.id} value={study.id}>
                    {study.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </label>
          </div>
        </div>
      </section>

      {(error || notice) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[9px] text-rose-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[9px] text-emerald-700">
              {notice}
            </div>
          )}
        </div>
      )}

      {loadingStudy ? (
        <div className="flex min-h-[460px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
            Building the integrated participant view…
          </div>
        </div>
      ) : !mixed ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
          <Blend className="mx-auto h-6 w-6 text-slate-300" />
          <p className="mt-3 text-[11px] font-semibold text-slate-700">
            Select a study to begin integration
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Quantitative rows"
              value={quantRows.length}
              detail="One-row-per-participant analysis dataset"
            />
            <StatCard
              label="Participants"
              value={mixed.readiness.participants}
              detail="Eligible non-withdrawn study participants"
            />
            <StatCard
              label="Linked cases"
              value={mixed.readiness.linkedParticipants}
              detail={`${percent(
                mixed.readiness.linkedParticipants,
                mixed.readiness.participants,
              )} of participants have qualitative cases`}
            />
            <StatCard
              label="Integrated"
              value={integratedCount}
              detail="Participants with both quantitative and qualitative data"
            />
            <StatCard
              label="Themes"
              value={mixed.readiness.themes}
              detail={`${mixed.readiness.codings} coded references available`}
            />
          </section>

          {(quantRows.length === 0 ||
            mixed.readiness.linkedParticipants === 0) && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
              <p className="text-[8.5px] leading-4 text-amber-800">
                {quantRows.length === 0
                  ? "This study does not yet have participant-level quantitative analysis rows. Mixed Methods will become usable as questionnaire, cognitive or ambulatory data arrives."
                  : "Qualitative material exists, but no cases are linked to study participants yet. Link cases to participants in Qualitative Lab to integrate them here."}
              </p>
            </section>
          )}

          <section className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex flex-wrap gap-1">
              {[
                ["integration", "Integration table", Table2],
                ["joint", "Joint display", Blend],
                ["groups", "Group × theme", Users],
                ["associations", "Quant × qual", BarChart3],
                ["findings", "Integrated findings", FileText],
                ["profiles", "Participant profiles", Users],
                ["saved", "Saved displays", BookOpen],
              ].map(([id, label, Icon]) => {
                const active = tab === id;
                const IconComponent = Icon as typeof Table2;
                return (
                  <button
                    key={String(id)}
                    type="button"
                    onClick={() =>
                      setTab(
                        id as
                          | "integration"
                          | "joint"
                          | "groups"
                          | "associations"
                          | "findings"
                          | "profiles"
                          | "saved",
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[8px] font-semibold ${
                      active
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    {String(label)}
                  </button>
                );
              })}
            </div>
          </section>

          {tab === "integration" && (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="text-[11px] font-semibold text-slate-950">
                      Participant integration table
                    </h3>
                    <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
                      Quantitative participant rows are joined to qualitative
                      cases through the stable participant-case bridge.
                    </p>
                  </div>
                  <label className="relative min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={participantSearch}
                      onChange={(event) =>
                        setParticipantSearch(event.target.value)
                      }
                      placeholder="Search participant or case"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-[8.5px] outline-none focus:border-cyan-300"
                    />
                  </label>
                </div>
              </section>

              <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="sticky left-0 z-20 min-w-[170px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                          Participant
                        </th>
                        {selectedQuantVariables.slice(0, 4).map((variable) => (
                          <th
                            key={variable}
                            className="min-w-[130px] border-b border-slate-200 px-3 py-3 text-left text-[7px] font-bold uppercase tracking-[.08em] text-slate-400"
                          >
                            {codebook.find(
                              (item) => item.variable === variable,
                            )?.label || prettyVariable(variable)}
                          </th>
                        ))}
                        {selectedThemes.slice(0, 4).map((theme) => (
                          <th
                            key={theme.id}
                            className="min-w-[150px] border-b border-slate-200 px-3 py-3 text-left"
                          >
                            <span className="inline-flex items-center gap-2 text-[7.5px] font-semibold text-slate-600">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: theme.color }}
                              />
                              {theme.name}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.slice(0, 250).map(
                        ({ participant, quantRow }) => (
                          <tr
                            key={participant.participantId}
                            className="border-b border-slate-100"
                          >
                            <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3">
                              <p className="text-[8.5px] font-semibold text-slate-700">
                                {participant.participantPublicId}
                              </p>
                              <p className="mt-0.5 text-[6.5px] text-slate-400">
                                {participant.qualitativeCase
                                  ? participant.qualitativeCase.name
                                  : "No linked qualitative case"}
                              </p>
                            </td>
                            {selectedQuantVariables
                              .slice(0, 4)
                              .map((variable) => (
                                <td
                                  key={variable}
                                  className="px-3 py-3 text-[8px] text-slate-600"
                                >
                                  {quantRow
                                    ? displayValue(quantRow[variable])
                                    : "—"}
                                </td>
                              ))}
                            {selectedThemes.slice(0, 4).map((theme) => {
                              const stat = themeStat(participant, theme.id);
                              return (
                                <td key={theme.id} className="px-3 py-3">
                                  <button
                                    type="button"
                                    disabled={
                                      !stat?.present &&
                                      !stat?.frameworkSummary
                                    }
                                    onClick={() =>
                                      setEvidenceSelection({
                                        participant,
                                        theme,
                                        stat,
                                      })
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-[7.5px] font-semibold ${
                                      stat?.present
                                        ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                                        : "border-slate-200 bg-slate-50 text-slate-400"
                                    } disabled:cursor-default`}
                                  >
                                    {stat?.present
                                      ? `${stat.referenceCount} ref${
                                          stat.referenceCount === 1 ? "" : "s"
                                        }`
                                      : "Absent"}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {tab === "joint" && (
            <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
              <section className="h-fit rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-[10px] font-semibold text-slate-900">
                  Joint display builder
                </h3>
                <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
                  Choose up to eight quantitative variables and eight themes.
                </p>

                <div className="mt-4">
                  <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                    Quantitative variables
                  </p>
                  <div className="mt-2 max-h-[220px] space-y-1 overflow-y-auto">
                    {quantVariables.map((variable) => (
                      <label
                        key={variable.variable}
                        className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedQuantVariables.includes(
                            variable.variable,
                          )}
                          onChange={() => toggleQuant(variable.variable)}
                          className="mt-0.5 h-3.5 w-3.5"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[8px] font-semibold text-slate-700">
                            {variable.label ||
                              prettyVariable(variable.variable)}
                          </span>
                          <span className="mt-0.5 block truncate text-[6.5px] text-slate-400">
                            {variable.source || variable.type || "Study data"}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                    Qualitative themes
                  </p>
                  <div className="mt-2 max-h-[220px] space-y-1 overflow-y-auto">
                    {mixed.themes.map((theme) => (
                      <label
                        key={theme.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedThemeIds.includes(theme.id)}
                          onChange={() => toggleTheme(theme.id)}
                          className="h-3.5 w-3.5"
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: theme.color }}
                        />
                        <span className="min-w-0 truncate text-[8px] font-semibold text-slate-700">
                          {theme.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <label className="block">
                    <span className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                      Qualitative cell
                    </span>
                    <select
                      value={qualitativeMetric}
                      onChange={(event) =>
                        setQualitativeMetric(
                          event.target.value as QualitativeMetric,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8px]"
                    >
                      <option value="presence">Theme presence</option>
                      <option value="references">Reference count</option>
                      <option value="framework">Framework summary</option>
                      <option value="evidence">Evidence excerpt</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Joint display name"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[8px] outline-none focus:border-cyan-300"
                  />
                  <button
                    type="button"
                    disabled={!displayName.trim() || savingDisplay}
                    onClick={() => void saveDisplay()}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2.5 text-[8px] font-semibold text-white disabled:opacity-40"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingDisplay ? "Saving…" : "Save display"}
                  </button>
                </div>
              </section>

              <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-[10px] font-semibold text-slate-900">
                        {displayName.trim() || "Participant joint display"}
                      </h3>
                      <p className="mt-0.5 text-[7px] text-slate-400">
                        {selectedQuantVariables.length} quantitative ·{" "}
                        {selectedThemeIds.length} qualitative columns
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[7px] font-semibold text-cyan-800">
                      Click qualitative cells for source evidence
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="sticky left-0 z-20 min-w-[160px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                          Participant
                        </th>
                        {selectedQuantVariables.map((variable) => (
                          <th
                            key={variable}
                            className="min-w-[135px] border-b border-slate-200 px-3 py-3 text-left text-[7px] font-bold uppercase tracking-[.08em] text-slate-400"
                          >
                            {codebook.find(
                              (item) => item.variable === variable,
                            )?.label || prettyVariable(variable)}
                          </th>
                        ))}
                        {selectedThemes.map((theme) => (
                          <th
                            key={theme.id}
                            className="min-w-[180px] border-b border-slate-200 px-3 py-3 text-left"
                          >
                            <span className="inline-flex items-center gap-2 text-[7.5px] font-semibold text-slate-700">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: theme.color }}
                              />
                              {theme.name}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {integratedParticipants.slice(0, 300).map(
                        ({ participant, quantRow }) => (
                          <tr
                            key={participant.participantId}
                            className="border-b border-slate-100"
                          >
                            <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3">
                              <p className="text-[8.5px] font-semibold text-slate-700">
                                {participant.participantPublicId}
                              </p>
                              <p className="mt-0.5 text-[6.5px] text-slate-400">
                                {participant.qualitativeCase
                                  ? "Integrated"
                                  : "Quantitative only"}
                              </p>
                            </td>
                            {selectedQuantVariables.map((variable) => (
                              <td
                                key={variable}
                                className="px-3 py-3 text-[8px] text-slate-600"
                              >
                                {quantRow
                                  ? displayValue(quantRow[variable])
                                  : "—"}
                              </td>
                            ))}
                            {selectedThemes.map((theme) => {
                              const stat = themeStat(participant, theme.id);
                              return (
                                <td key={theme.id} className="px-3 py-3">
                                  <button
                                    type="button"
                                    disabled={
                                      !stat?.present &&
                                      !stat?.frameworkSummary
                                    }
                                    onClick={() =>
                                      setEvidenceSelection({
                                        participant,
                                        theme,
                                        stat,
                                      })
                                    }
                                    className={`max-w-[260px] rounded-lg border px-2.5 py-2 text-left text-[7.5px] leading-3.5 ${
                                      stat?.present
                                        ? "border-cyan-200 bg-cyan-50/60 text-cyan-900 hover:border-cyan-300"
                                        : "border-slate-200 bg-slate-50 text-slate-400"
                                    } disabled:cursor-default`}
                                  >
                                    {themeCellText(
                                      stat,
                                      qualitativeMetric,
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {tab === "groups" && (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h3 className="text-[11px] font-semibold text-slate-950">
                      Group × theme comparison
                    </h3>
                    <p className="mt-1 max-w-3xl text-[7.5px] leading-3.5 text-slate-400">
                      Compare qualitative theme prevalence and coded-reference density across a participant grouping variable. The denominator is the number of integrated participants in each displayed group.
                    </p>
                  </div>

                  <label className="min-w-[260px]">
                    <span className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                      Group by
                    </span>
                    <select
                      value={groupVariable}
                      onChange={(event) => setGroupVariable(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                    >
                      {categoricalVariables.length === 0 && (
                        <option value="">No grouping variable available</option>
                      )}
                      {categoricalVariables.map(({ variable, unique }) => (
                        <option key={variable.variable} value={variable.variable}>
                          {variable.label || prettyVariable(variable.variable)} · {unique.length} groups
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                    Themes to compare
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mixed.themes.map((theme) => {
                      const active = comparisonThemeIds.includes(theme.id);
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => toggleComparisonTheme(theme.id)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[7.5px] font-semibold ${
                            active
                              ? "border-violet-300 bg-violet-50 text-violet-800"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: theme.color }}
                          />
                          {theme.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {!groupVariable || groupComparison.length === 0 ? (
                <section className="rounded-[24px] border border-dashed border-slate-300 bg-white p-9 text-center">
                  <Users className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-[9px] font-semibold text-slate-700">
                    A grouping variable with at least two observed groups is required
                  </p>
                  <p className="mt-1 text-[7.5px] text-slate-400">
                    Demographics and categorical study variables become available here automatically when present in the analysis dataset.
                  </p>
                </section>
              ) : (
                <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="sticky left-0 z-20 min-w-[180px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                            {quantLabel(groupVariable)}
                          </th>
                          <th className="min-w-[90px] border-b border-slate-200 px-3 py-3 text-right text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                            Integrated n
                          </th>
                          {comparisonThemes.map((theme) => (
                            <th
                              key={theme.id}
                              className="min-w-[180px] border-b border-slate-200 px-3 py-3 text-left"
                            >
                              <span className="inline-flex items-center gap-2 text-[7.5px] font-semibold text-slate-700">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: theme.color }}
                                />
                                {theme.name}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupComparison.map((group) => (
                          <tr key={group.groupValue} className="border-b border-slate-100">
                            <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3 text-[8.5px] font-semibold text-slate-700">
                              {group.groupValue}
                            </td>
                            <td className="px-3 py-3 text-right text-[8px] text-slate-500">
                              {group.n}
                            </td>
                            {group.themes.map((item) => (
                              <td key={item.theme.id} className="px-3 py-3">
                                <button
                                  type="button"
                                  disabled={item.presentCount === 0}
                                  onClick={() =>
                                    setGroupEvidenceSelection({
                                      groupVariable,
                                      groupValue: group.groupValue,
                                      theme: item.theme,
                                      members: item.present,
                                    })
                                  }
                                  className={`w-full rounded-xl border p-2.5 text-left ${
                                    item.presentCount > 0
                                      ? "border-cyan-200 bg-cyan-50/45 hover:border-cyan-300"
                                      : "border-slate-200 bg-slate-50"
                                  } disabled:cursor-default`}
                                >
                                  <p className="text-[8px] font-semibold text-slate-700">
                                    {item.presentCount}/{group.n} · {percent(item.presentCount, group.n)}
                                  </p>
                                  <p className="mt-1 text-[6.5px] text-slate-400">
                                    {item.references} coded refs · {item.meanReferences.toFixed(2)} refs/person
                                  </p>
                                </button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

          {tab === "associations" && (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-[1fr_1fr_220px_auto] xl:items-end">
                  <label>
                    <span className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                      Quantitative variable
                    </span>
                    <select
                      value={associationVariable}
                      onChange={(event) => setAssociationVariable(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                    >
                      {numericVariables.length === 0 && (
                        <option value="">No numeric variable available</option>
                      )}
                      {numericVariables.map((variable) => (
                        <option key={variable.variable} value={variable.variable}>
                          {variable.label || prettyVariable(variable.variable)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                      Qualitative theme
                    </span>
                    <select
                      value={associationThemeId}
                      onChange={(event) => setAssociationThemeId(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                    >
                      {mixed.themes.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                      Compare as
                    </span>
                    <select
                      value={associationMode}
                      onChange={(event) =>
                        setAssociationMode(event.target.value as "presence" | "references")
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                    >
                      <option value="presence">Theme present vs absent</option>
                      <option value="references">Reference-count association</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    disabled={!associationVariable || !associationTheme || associationSummary.n === 0}
                    onClick={prepareFindingFromAssociation}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-[8px] font-semibold text-white disabled:opacity-35"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create finding
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/65 px-3 py-2.5 text-[7.5px] leading-3.5 text-amber-800">
                  These are descriptive integration summaries, not confirmatory statistical tests. Theme presence and coding frequency depend on the coding protocol and are not automatically psychological scale variables. Use Analysis Lab for prespecified inferential analyses.
                </div>
              </section>

              {associationVariable && associationTheme ? (
                <>
                  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard label="Usable n" value={associationSummary.n} detail="Integrated participants with a numeric value" />
                    {associationMode === "presence" ? (
                      <>
                        <StatCard
                          label="Theme present"
                          value={associationSummary.presentN}
                          detail={`M=${numericText(associationSummary.presentMean)} · median=${numericText(associationSummary.presentMedian)}`}
                        />
                        <StatCard
                          label="Theme absent"
                          value={associationSummary.absentN}
                          detail={`M=${numericText(associationSummary.absentMean)} · median=${numericText(associationSummary.absentMedian)}`}
                        />
                        <StatCard
                          label="Mean difference"
                          value={numericText(associationSummary.meanDifference)}
                          detail="Present group minus absent group"
                        />
                        <StatCard
                          label="Cohen's d"
                          value={numericText(associationSummary.cohenD, 3)}
                          detail="Descriptive standardized mean difference"
                        />
                      </>
                    ) : (
                      <>
                        <StatCard
                          label="Spearman ρ"
                          value={numericText(associationSummary.spearmanRho, 3)}
                          detail="Rank association with coded-reference count"
                        />
                        <StatCard
                          label="Mean references"
                          value={numericText(associationSummary.referenceMean)}
                          detail={`Theme: ${associationTheme.name}`}
                        />
                        <StatCard
                          label="Theme present"
                          value={associationSummary.presentN}
                          detail={percent(associationSummary.presentN, associationSummary.n)}
                        />
                        <StatCard
                          label="Theme absent"
                          value={associationSummary.absentN}
                          detail={percent(associationSummary.absentN, associationSummary.n)}
                        />
                      </>
                    )}
                  </section>

                  <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <h3 className="text-[9px] font-semibold text-slate-800">
                        Participant-level evidence table
                      </h3>
                    </div>
                    <div className="max-h-[520px] overflow-auto">
                      <table className="min-w-full border-collapse">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b border-slate-100 text-[7px] uppercase tracking-[.08em] text-slate-400">
                            <th className="px-3 py-2.5 text-left">Participant</th>
                            <th className="px-3 py-2.5 text-right">{quantLabel(associationVariable)}</th>
                            <th className="px-3 py-2.5 text-center">Theme</th>
                            <th className="px-3 py-2.5 text-right">References</th>
                            <th className="px-3 py-2.5 text-left">Evidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {associationPoints
                            .slice()
                            .sort((a, b) => b.quantitativeValue - a.quantitativeValue)
                            .map((point) => (
                              <tr key={point.participant.participantId} className="border-b border-slate-100 text-[8px]">
                                <td className="px-3 py-2.5 font-semibold text-slate-700">
                                  {point.participant.participantPublicId}
                                </td>
                                <td className="px-3 py-2.5 text-right text-slate-600">
                                  {displayValue(point.quantitativeValue)}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={`rounded-full border px-2 py-1 text-[6.5px] font-semibold ${
                                    point.stat.present
                                      ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                                      : "border-slate-200 bg-slate-50 text-slate-400"
                                  }`}>
                                    {point.stat.present ? "Present" : "Absent"}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-right text-slate-600">
                                  {point.stat.referenceCount}
                                </td>
                                <td className="px-3 py-2.5">
                                  {point.stat.present ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEvidenceSelection({
                                          participant: point.participant,
                                          theme: associationTheme,
                                          stat: point.stat,
                                        })
                                      }
                                      className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[7px] font-semibold text-cyan-800"
                                    >
                                      View excerpts
                                    </button>
                                  ) : (
                                    <span className="text-[7px] text-slate-300">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              ) : (
                <section className="rounded-[24px] border border-dashed border-slate-300 bg-white p-9 text-center text-[8.5px] text-slate-400">
                  A numeric quantitative variable and qualitative theme are required.
                </section>
              )}
            </div>
          )}

          {tab === "findings" && (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-[11px] font-semibold text-slate-950">
                      Integrated findings
                    </h3>
                    <p className="mt-1 max-w-3xl text-[7.5px] leading-3.5 text-slate-400">
                      Record the researcher’s meta-inference explicitly. PsyLattice stores quantitative and qualitative findings separately from the integration interpretation so convergence or divergence remains auditable.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={exportingMixed}
                      onClick={() => void downloadMixedWorkbook()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[7.5px] font-semibold text-cyan-800 disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {exportingMixed ? "Exporting…" : "Export workbook"}
                    </button>
                    <button
                      type="button"
                      onClick={downloadMixedJson}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[7.5px] font-semibold text-violet-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export JSON
                    </button>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
                <section className="h-fit rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-[10px] font-semibold text-slate-900">
                      {editingFindingId ? "Edit finding" : "New finding"}
                    </h4>
                    {editingFindingId && (
                      <button
                        type="button"
                        onClick={clearFindingEditor}
                        className="text-[7px] font-semibold text-slate-400 hover:text-slate-700"
                      >
                        New
                      </button>
                    )}
                  </div>

                  <input
                    value={findingTitle}
                    onChange={(event) => setFindingTitle(event.target.value)}
                    placeholder="Finding title"
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px] outline-none focus:border-cyan-300"
                  />

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <select
                      value={findingQuantVariable}
                      onChange={(event) => setFindingQuantVariable(event.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8px]"
                    >
                      <option value="">No quantitative variable</option>
                      {quantVariables.map((variable) => (
                        <option key={variable.variable} value={variable.variable}>
                          {variable.label || prettyVariable(variable.variable)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={findingThemeId}
                      onChange={(event) => setFindingThemeId(event.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8px]"
                    >
                      <option value="">No qualitative theme</option>
                      {mixed.themes.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <select
                      value={findingType}
                      onChange={(event) => setFindingType(event.target.value as IntegrationType)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8px]"
                    >
                      <option value="unclear">Unclear / not classified</option>
                      <option value="convergent">Convergent</option>
                      <option value="complementary">Complementary</option>
                      <option value="divergent">Divergent</option>
                      <option value="expansion">Expansion</option>
                      <option value="negative_case">Negative case</option>
                    </select>
                    <select
                      value={findingStatus}
                      onChange={(event) => setFindingStatus(event.target.value as "draft" | "final")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8px]"
                    >
                      <option value="draft">Draft</option>
                      <option value="final">Final</option>
                    </select>
                  </div>

                  <label className="mt-3 block">
                    <span className="text-[7px] font-semibold text-slate-600">Quantitative finding</span>
                    <textarea
                      value={findingQuantitative}
                      onChange={(event) => setFindingQuantitative(event.target.value)}
                      rows={4}
                      placeholder="What does the quantitative strand show?"
                      className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-[8px] leading-4 outline-none focus:border-cyan-300"
                    />
                  </label>

                  <label className="mt-3 block">
                    <span className="text-[7px] font-semibold text-slate-600">Qualitative finding</span>
                    <textarea
                      value={findingQualitative}
                      onChange={(event) => setFindingQualitative(event.target.value)}
                      rows={4}
                      placeholder="What does the qualitative strand show?"
                      className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-[8px] leading-4 outline-none focus:border-violet-300"
                    />
                  </label>

                  <label className="mt-3 block">
                    <span className="text-[7px] font-semibold text-slate-600">Integrated interpretation / meta-inference</span>
                    <textarea
                      value={findingInterpretation}
                      onChange={(event) => setFindingInterpretation(event.target.value)}
                      rows={5}
                      placeholder="Explain how the two strands converge, complement, diverge or expand one another."
                      className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-[8px] leading-4 outline-none focus:border-cyan-300"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={!findingTitle.trim() || savingFinding}
                    onClick={() => void saveFinding({
                      associationVariable,
                      associationThemeId,
                      associationMode,
                      associationSummary,
                    })}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-[8px] font-semibold text-white disabled:opacity-40"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingFinding ? "Saving…" : editingFindingId ? "Update finding" : "Save finding"}
                  </button>
                </section>

                <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[10px] font-semibold text-slate-900">Integration matrix</h4>
                      <p className="mt-1 text-[7px] text-slate-400">
                        {mixed.integratedFindings.length} saved finding{mixed.integratedFindings.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {mixed.integratedFindings.map((finding) => {
                      const theme = mixed.themes.find((item) => item.id === finding.qualitative_theme_id);
                      return (
                        <div key={finding.id} className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full border px-2 py-1 text-[6.5px] font-semibold ${
                                  finding.integration_type === "convergent"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : finding.integration_type === "divergent" || finding.integration_type === "negative_case"
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : "border-violet-200 bg-violet-50 text-violet-700"
                                }`}>
                                  {finding.integration_type.replaceAll("_", " ")}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[6.5px] font-semibold text-slate-500">
                                  {finding.status}
                                </span>
                              </div>
                              <p className="mt-2 text-[9.5px] font-semibold text-slate-800">{finding.title}</p>
                              <p className="mt-1 text-[7px] text-slate-400">
                                {finding.quant_variable ? quantLabel(finding.quant_variable) : "No quantitative variable"} · {theme?.name || "No qualitative theme"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => editFinding(finding)}
                                className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[7px] font-semibold text-cyan-800"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete integrated finding “${finding.title}”?`)) {
                                    void deleteFinding(finding.id);
                                  }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 lg:grid-cols-3">
                            <div className="rounded-xl border border-cyan-100 bg-cyan-50/35 p-3">
                              <p className="text-[6.5px] font-bold uppercase tracking-[.07em] text-cyan-600">Quantitative</p>
                              <p className="mt-1 text-[7.5px] leading-3.5 text-slate-600">{finding.quantitative_finding || "—"}</p>
                            </div>
                            <div className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
                              <p className="text-[6.5px] font-bold uppercase tracking-[.07em] text-violet-600">Qualitative</p>
                              <p className="mt-1 text-[7.5px] leading-3.5 text-slate-600">{finding.qualitative_finding || "—"}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
                              <p className="text-[6.5px] font-bold uppercase tracking-[.07em] text-slate-500">Meta-inference</p>
                              <p className="mt-1 text-[7.5px] leading-3.5 text-slate-600">{finding.integrated_interpretation || "—"}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {mixed.integratedFindings.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                        <FileText className="mx-auto h-5 w-5 text-slate-300" />
                        <p className="mt-2 text-[8.5px] text-slate-400">
                          No integrated findings yet. Build an association or record a researcher-defined meta-inference here.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {tab === "profiles" && (
            <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
              <section className="h-fit rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-[10px] font-semibold text-slate-900">
                  Participant profile
                </h3>
                <select
                  value={selectedProfileId}
                  onChange={(event) =>
                    setSelectedProfileId(event.target.value)
                  }
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                >
                  {mixed.participantBridge.map((participant) => (
                    <option
                      key={participant.participantId}
                      value={participant.participantId}
                    >
                      {participant.participantPublicId}
                    </option>
                  ))}
                </select>

                {selectedProfile && (
                  <div className="mt-3 space-y-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                      <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                        Qualitative case
                      </p>
                      <p className="mt-1 text-[8.5px] font-semibold text-slate-700">
                        {selectedProfile.qualitativeCase?.name || "Not linked"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                      <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                        Coded references
                      </p>
                      <p className="mt-1 text-[16px] font-semibold text-slate-900">
                        {selectedProfile.qualitativeReferenceCount}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {selectedProfile && (
                <div className="space-y-4">
                  <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-cyan-700" />
                      <h3 className="text-[10px] font-semibold text-slate-900">
                        Quantitative profile
                      </h3>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {quantVariables.slice(0, 16).map((variable) => (
                        <div
                          key={variable.variable}
                          className="rounded-xl border border-slate-200 bg-slate-50/55 p-3"
                        >
                          <p className="truncate text-[6.5px] font-bold uppercase tracking-[.07em] text-slate-400">
                            {variable.label ||
                              prettyVariable(variable.variable)}
                          </p>
                          <p className="mt-1 truncate text-[9px] font-semibold text-slate-700">
                            {selectedProfileQuant
                              ? displayValue(
                                  selectedProfileQuant[variable.variable],
                                )
                              : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-violet-700" />
                      <h3 className="text-[10px] font-semibold text-slate-900">
                        Qualitative profile
                      </h3>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {selectedProfile.themeStats
                        .filter(
                          (stat) =>
                            stat.present || Boolean(stat.frameworkSummary),
                        )
                        .map((stat) => (
                          <button
                            key={stat.themeId}
                            type="button"
                            onClick={() => {
                              const theme = mixed.themes.find(
                                (item) => item.id === stat.themeId,
                              );
                              if (!theme) return;
                              setEvidenceSelection({
                                participant: selectedProfile,
                                theme,
                                stat,
                              });
                            }}
                            className="rounded-xl border border-slate-200 p-3 text-left hover:border-cyan-200 hover:bg-cyan-50/30"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: stat.color }}
                              />
                              <p className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-slate-700">
                                {stat.themeName}
                              </p>
                              <span className="text-[7px] text-slate-400">
                                {stat.referenceCount} refs
                              </span>
                            </div>
                            {stat.frameworkSummary && (
                              <p className="mt-2 line-clamp-3 text-[7.5px] leading-3.5 text-slate-500">
                                {stat.frameworkSummary}
                              </p>
                            )}
                          </button>
                        ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {tab === "saved" && (
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <h3 className="text-[10px] font-semibold text-slate-900">
                  Saved joint displays
                </h3>
                <p className="mt-1 text-[7.5px] text-slate-400">
                  Reopen a participant-level integration setup without
                  rebuilding the column selection.
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {mixed.savedDisplays.map((display) => (
                  <div
                    key={display.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-[9px] font-semibold text-slate-800">
                      {display.name}
                    </p>
                    <p className="mt-1 text-[7px] text-slate-400">
                      Updated{" "}
                      {new Date(display.updated_at).toLocaleDateString()}
                    </p>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => loadDisplay(display)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[7.5px] font-semibold text-cyan-800"
                      >
                        <Eye className="h-3 w-3" />
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete saved joint display “${display.name}”?`,
                            )
                          ) {
                            void deleteDisplay(display.id);
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {mixed.savedDisplays.length === 0 && (
                  <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                    <BookOpen className="mx-auto h-5 w-5 text-slate-300" />
                    <p className="mt-2 text-[8.5px] text-slate-400">
                      No joint displays saved yet.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {groupEvidenceSelection && (
        <div className="fixed inset-0 z-[235] flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Close group evidence"
            onClick={() => setGroupEvidenceSelection(null)}
            className="absolute inset-0"
          />
          <aside className="relative z-10 h-full w-full max-w-[620px] overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-[-24px_0_70px_rgba(15,23,42,.16)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: groupEvidenceSelection.theme.color }}
                  />
                  <h3 className="text-[13px] font-semibold text-slate-950">
                    {groupEvidenceSelection.theme.name}
                  </h3>
                </div>
                <p className="mt-1 text-[8px] text-slate-400">
                  {quantLabel(groupEvidenceSelection.groupVariable)} = {groupEvidenceSelection.groupValue} · {groupEvidenceSelection.members.length} theme-positive participant{groupEvidenceSelection.members.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGroupEvidenceSelection(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {groupEvidenceSelection.members.map(({ participant, stat }) => (
                <section key={participant.participantId} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-semibold text-slate-800">
                        {participant.participantPublicId}
                      </p>
                      <p className="mt-0.5 text-[7px] text-slate-400">
                        {participant.qualitativeCase?.name || "Qualitative case"} · {stat.referenceCount} refs
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGroupEvidenceSelection(null);
                        setEvidenceSelection({
                          participant,
                          theme: groupEvidenceSelection.theme,
                          stat,
                        });
                      }}
                      className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[7px] font-semibold text-cyan-800"
                    >
                      Open evidence
                    </button>
                  </div>
                  {stat.frameworkSummary && (
                    <p className="mt-2 text-[7.5px] leading-3.5 text-slate-500">
                      {stat.frameworkSummary}
                    </p>
                  )}
                  <div className="mt-3 space-y-2">
                    {stat.evidence.slice(0, 3).map((item) => (
                      <div key={item.codingId} className="rounded-xl bg-slate-50/70 p-3">
                        <p className="font-serif text-[9.5px] leading-4 text-slate-700">“{item.excerpt}”</p>
                        <p className="mt-1 text-[6.5px] text-slate-400">
                          {item.codeName} · {item.sourceTitle}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </aside>
        </div>
      )}

      {evidenceSelection && (
        <div className="fixed inset-0 z-[240] flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Close evidence"
            onClick={() => setEvidenceSelection(null)}
            className="absolute inset-0"
          />
          <aside className="relative z-10 h-full w-full max-w-[520px] overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-[-24px_0_70px_rgba(15,23,42,.16)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: evidenceSelection.theme.color }}
                  />
                  <h3 className="text-[13px] font-semibold text-slate-950">
                    {evidenceSelection.theme.name}
                  </h3>
                </div>
                <p className="mt-1 text-[8px] text-slate-400">
                  {evidenceSelection.participant.participantPublicId} ·{" "}
                  {evidenceSelection.participant.qualitativeCase?.name ||
                    "No linked case"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceSelection(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[6.5px] uppercase tracking-[.08em] text-slate-400">
                  References
                </p>
                <p className="mt-1 text-[15px] font-semibold text-slate-900">
                  {evidenceSelection.stat?.referenceCount || 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[6.5px] uppercase tracking-[.08em] text-slate-400">
                  Sources
                </p>
                <p className="mt-1 text-[15px] font-semibold text-slate-900">
                  {evidenceSelection.stat?.sourceCount || 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[6.5px] uppercase tracking-[.08em] text-slate-400">
                  Codes
                </p>
                <p className="mt-1 text-[15px] font-semibold text-slate-900">
                  {evidenceSelection.stat?.codeCount || 0}
                </p>
              </div>
            </div>

            {evidenceSelection.stat?.frameworkSummary && (
              <section className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                <p className="text-[7px] font-bold uppercase tracking-[.08em] text-violet-600">
                  Framework summary
                </p>
                <p className="mt-2 text-[9px] leading-5 text-slate-700">
                  {evidenceSelection.stat.frameworkSummary}
                </p>
              </section>
            )}

            <section className="mt-5">
              <h4 className="text-[9px] font-semibold text-slate-900">
                Underlying coded evidence
              </h4>
              <div className="mt-3 space-y-3">
                {(evidenceSelection.stat?.evidence || []).map((item) => (
                  <div
                    key={item.codingId}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.codeColor }}
                      />
                      <span className="text-[7px] font-semibold text-slate-600">
                        {item.codeName}
                      </span>
                      <span className="text-[6.5px] text-slate-400">
                        {item.sourceTitle}
                      </span>
                    </div>
                    <p className="mt-2 font-serif text-[11px] leading-5 text-slate-700">
                      “{item.excerpt}”
                    </p>
                  </div>
                ))}

                {!evidenceSelection.stat?.evidence?.length && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-[8px] text-slate-400">
                    No coded excerpt is attached to this cell.
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
