"use client";

import {
  BarChart3,
  BookOpenText,
  Check,
  ChevronDown,
  Download,
  FileText,
  FolderSearch,
  FolderUp,
  GitMerge,
  Link2,
  Loader2,
  Maximize2,
  Minimize2,
  Layers3,
  NotebookPen,
  Plus,
  Save,
  Search,
  Sparkles,
  Table2,
  Tags,
  Unlink,
  UserRound,
  Network,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

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

type QualitativeSource = {
  id: string;
  case_id: string;
  source_type: string;
  title: string;
  content_text: string;
  language: string | null;
  original_filename?: string | null;
  mime_type?: string | null;
  metadata?: Record<string, unknown>;
  updated_at: string;
};

type QualitativeCode = {
  id: string;
  parent_code_id: string | null;
  name: string;
  description: string | null;
  color: string;
  position: number;
};

type QualitativeCoding = {
  id: string;
  case_id: string;
  source_id: string;
  code_id: string;
  coder_identity_id: string | null;
  method: "manual" | "ai_suggestion_accepted";
  start_offset: number;
  end_offset: number;
  excerpt: string;
  note: string | null;
  created_at: string;
};

type CaseClassification = {
  id: string;
  name: string;
  description: string | null;
  position: number;
};

type AttributeDefinition = {
  id: string;
  classification_id: string;
  field_key: string;
  name: string;
  data_type: "text" | "number" | "boolean" | "date" | "select";
  options: string[];
  required: boolean;
  position: number;
};

type QualitativeMemo = {
  id: string;
  case_id: string | null;
  source_id: string | null;
  code_id: string | null;
  memo_type: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type QualitativeAnnotation = {
  id: string;
  case_id: string;
  source_id: string;
  start_offset: number;
  end_offset: number;
  excerpt: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type QualitativeSavedQuery = {
  id: string;
  name: string;
  query_type: "word_frequency" | "coding_query" | "matrix" | "cooccurrence";
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type QualitativeCodingSuggestion = {
  id: string;
  case_id: string;
  source_id: string;
  suggested_code_id: string | null;
  suggested_code_name: string;
  suggested_color: string;
  start_offset: number;
  end_offset: number;
  excerpt: string;
  rationale: string | null;
  confidence: number | null;
  model: string | null;
  status: "pending" | "accepted" | "rejected";
  accepted_coding_id: string | null;
  created_at: string;
  updated_at: string;
};

type QualitativeCoderIdentity = {
  id: string;
  linked_user_id: string | null;
  label: string;
  email: string | null;
  identity_type: "owner" | "collaborator" | "external";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

type QualitativeCoderAssignment = {
  id: string;
  source_id: string;
  coder_identity_id: string;
  blind_coding: boolean;
  status: "assigned" | "completed";
  created_at: string;
  updated_at: string;
};

type QualitativeReconciliation = {
  id: string;
  source_id: string;
  case_id: string;
  code_id: string;
  coder_a_identity_id: string;
  coder_b_identity_id: string;
  unit_key: string;
  start_offset: number;
  end_offset: number;
  excerpt: string;
  coder_a_present: boolean;
  coder_b_present: boolean;
  final_present: boolean;
  resolved_by_user_id: string;
  rationale: string | null;
  created_at: string;
  updated_at: string;
};

type StudyCollaboratorSummary = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  status: string;
};

type QualitativeTheme = {
  id: string;
  parent_theme_id: string | null;
  name: string;
  description: string | null;
  color: string;
  position: number;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

type QualitativeThemeCode = {
  id: string;
  theme_id: string;
  code_id: string;
  created_at: string;
};

type QualitativeFrameworkSummary = {
  id: string;
  case_id: string;
  theme_id: string | null;
  code_id: string | null;
  summary: string;
  evidence_coding_ids: string[];
  created_at: string;
  updated_at: string;
};

type QualitativeCodeMergeHistory = {
  id: string;
  source_code_id: string;
  target_code_id: string;
  source_name: string;
  target_name: string;
  moved_coding_count: number;
  merged_by_user_id: string;
  created_at: string;
};

type QualitativeSet = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

type QualitativeSetItem = {
  id: string;
  set_id: string;
  item_type: "case" | "source";
  item_id: string;
  created_at: string;
};

type QualitativeRelationship = {
  id: string;
  from_type: "case" | "source" | "code" | "theme" | "memo" | "coding" | "annotation";
  from_id: string;
  to_type: "case" | "source" | "code" | "theme" | "memo" | "coding" | "annotation";
  to_id: string;
  relationship_type:
    | "relates_to"
    | "supports"
    | "contradicts"
    | "precedes"
    | "explains"
    | "causes"
    | "custom";
  custom_label: string | null;
  note: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

type QualitativeAuditEntry = {
  id: string;
  actor_user_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
};

type StudyPayload = {
  study: Study;
  participants: Participant[];
  cases: QualitativeCase[];
  sources: QualitativeSource[];
  codes: QualitativeCode[];
  archivedCodes: QualitativeCode[];
  codings: QualitativeCoding[];
  classifications: CaseClassification[];
  attributeDefinitions: AttributeDefinition[];
  memos: QualitativeMemo[];
  annotations: QualitativeAnnotation[];
  savedQueries: QualitativeSavedQuery[];
  codingSuggestions: QualitativeCodingSuggestion[];
  coderIdentities: QualitativeCoderIdentity[];
  coderAssignments: QualitativeCoderAssignment[];
  reconciliations: QualitativeReconciliation[];
  collaborators: StudyCollaboratorSummary[];
  themes: QualitativeTheme[];
  themeCodes: QualitativeThemeCode[];
  frameworkSummaries: QualitativeFrameworkSummary[];
  codeMergeHistory: QualitativeCodeMergeHistory[];
  sets: QualitativeSet[];
  setItems: QualitativeSetItem[];
  relationships: QualitativeRelationship[];
  auditLog: QualitativeAuditEntry[];
  currentCoderIdentityId?: string;
  sharedAccess?: {
    readOnly?: boolean;
    canReview?: boolean;
    canManageStructure?: boolean;
    canExport?: boolean;
    blindCodingActive?: boolean;
  };
};

const SOURCE_OPTIONS = [
  ["interview", "Interview"],
  ["transcript", "Transcript"],
  ["focus_group", "Focus group"],
  ["diary", "Diary"],
  ["field_note", "Field note"],
  ["document", "Document"],
  ["other", "Other"],
] as const;

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "cyan" | "violet";
}) {
  const classes = {
    slate: "border-slate-200 bg-slate-50 text-slate-500",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[7.5px] font-semibold ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function flattenCodeTree(codes: QualitativeCode[]) {
  const children = new Map<string | null, QualitativeCode[]>();
  for (const code of codes) {
    const key = code.parent_code_id || null;
    const list = children.get(key) || [];
    list.push(code);
    children.set(key, list);
  }
  for (const list of children.values()) {
    list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  }

  const rows: Array<{ code: QualitativeCode; depth: number }> = [];
  const visited = new Set<string>();
  function walk(parentId: string | null, depth: number) {
    for (const code of children.get(parentId) || []) {
      if (visited.has(code.id)) continue;
      visited.add(code.id);
      rows.push({ code, depth });
      walk(code.id, depth + 1);
    }
  }
  walk(null, 0);
  for (const code of codes) {
    if (!visited.has(code.id)) rows.push({ code, depth: 0 });
  }
  return rows;
}


const DEFAULT_STOP_WORDS = new Set([
  "a", "about", "after", "again", "against", "all", "am", "an", "and", "any",
  "are", "as", "at", "be", "because", "been", "before", "being", "between",
  "both", "but", "by", "can", "could", "did", "do", "does", "doing", "down",
  "during", "each", "few", "for", "from", "further", "had", "has", "have",
  "having", "he", "her", "here", "hers", "herself", "him", "himself", "his",
  "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
  "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off",
  "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out",
  "over", "own", "same", "she", "should", "so", "some", "such", "than",
  "that", "the", "their", "theirs", "them", "themselves", "then", "there",
  "these", "they", "this", "those", "through", "to", "too", "under", "until",
  "up", "very", "was", "we", "were", "what", "when", "where", "which",
  "while", "who", "whom", "why", "will", "with", "would", "you", "your",
  "yours", "yourself", "yourselves",
]);

function wordTokens(text: string) {
  return (
    text
      .toLocaleLowerCase()
      .match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []
  );
}

function codingWordCount(excerpt: string) {
  return wordTokens(excerpt).length;
}

function rangesOverlap(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
) {
  return leftStart < rightEnd && rightStart < leftEnd;
}

function QualitativeAnalysisPanel({
  data,
  selectedCaseId,
  selectedSourceId,
  onOpenEvidence,
  onSaveQuery,
  onDeleteSavedQuery,
}: {
  data: StudyPayload;
  selectedCaseId: string;
  selectedSourceId: string;
  onOpenEvidence: (caseId: string, sourceId: string) => void;
  onSaveQuery: (
    name: string,
    queryType: QualitativeSavedQuery["query_type"],
    config: Record<string, unknown>,
  ) => Promise<void>;
  onDeleteSavedQuery: (savedQueryId: string) => Promise<void>;
}) {
  const [analysisTab, setAnalysisTab] = useState<
    "word_frequency" | "coding_query" | "matrix" | "cooccurrence"
  >("word_frequency");

  const [scopeMode, setScopeMode] = useState<"all" | "case" | "source">("all");
  const [scopeCaseId, setScopeCaseId] = useState(selectedCaseId || "");
  const [scopeSourceId, setScopeSourceId] = useState(selectedSourceId || "");
  const [topN, setTopN] = useState(30);
  const [minWordLength, setMinWordLength] = useState(3);
  const [customStopWords, setCustomStopWords] = useState("");

  const [queryCodeA, setQueryCodeA] = useState(data.codes[0]?.id || "");
  const [queryCodeB, setQueryCodeB] = useState(data.codes[1]?.id || "");
  const [queryOperator, setQueryOperator] = useState<"AND" | "OR" | "NOT">("AND");
  const [queryCaseId, setQueryCaseId] = useState("");

  const [matrixRowMode, setMatrixRowMode] = useState<"case" | "attribute">("case");
  const [matrixAttributeId, setMatrixAttributeId] = useState("");
  const [matrixMetric, setMatrixMetric] = useState<"references" | "presence" | "words">("references");
  const [matrixAllCodes, setMatrixAllCodes] = useState(false);

  const [cooccurrenceMode, setCooccurrenceMode] = useState<"overlap" | "source">("overlap");
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);

  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const caseMap = useMemo(
    () => new Map(data.cases.map((item) => [item.id, item])),
    [data.cases],
  );
  const sourceMap = useMemo(
    () => new Map(data.sources.map((item) => [item.id, item])),
    [data.sources],
  );
  const codeMap = useMemo(
    () => new Map(data.codes.map((item) => [item.id, item])),
    [data.codes],
  );

  const scopeSources = useMemo(() => {
    if (scopeMode === "case") {
      return data.sources.filter((source) => source.case_id === scopeCaseId);
    }
    if (scopeMode === "source") {
      return data.sources.filter((source) => source.id === scopeSourceId);
    }
    return data.sources;
  }, [data.sources, scopeMode, scopeCaseId, scopeSourceId]);

  const wordFrequency = useMemo(() => {
    const custom = new Set(
      customStopWords
        .split(/[,\n;]+/)
        .map((value) => value.trim().toLocaleLowerCase())
        .filter(Boolean),
    );
    const counts = new Map<string, number>();
    let total = 0;

    for (const source of scopeSources) {
      for (const token of wordTokens(source.content_text || "")) {
        const cleaned = token.replace(/^['’-]+|['’-]+$/g, "");
        if (cleaned.length < minWordLength) continue;
        if (DEFAULT_STOP_WORDS.has(cleaned) || custom.has(cleaned)) continue;
        counts.set(cleaned, (counts.get(cleaned) || 0) + 1);
        total += 1;
      }
    }

    return [...counts.entries()]
      .map(([word, count]) => ({
        word,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
      .slice(0, Math.max(5, Math.min(100, topN)));
  }, [scopeSources, minWordLength, customStopWords, topN]);

  const queryResults = useMemo(() => {
    if (!queryCodeA) return [];

    const allowedCaseIds = queryCaseId ? new Set([queryCaseId]) : null;
    return data.sources
      .filter((source) => !allowedCaseIds || allowedCaseIds.has(source.case_id))
      .map((source) => {
        const sourceCodings = data.codings.filter(
          (coding) => coding.source_id === source.id,
        );
        const a = sourceCodings.filter((coding) => coding.code_id === queryCodeA);
        const b = queryCodeB
          ? sourceCodings.filter((coding) => coding.code_id === queryCodeB)
          : [];

        const matches =
          queryOperator === "AND"
            ? a.length > 0 && b.length > 0
            : queryOperator === "OR"
              ? a.length > 0 || b.length > 0
              : a.length > 0 && b.length === 0;

        return {
          source,
          caseItem: caseMap.get(source.case_id) || null,
          a,
          b,
          matches,
        };
      })
      .filter((item) => item.matches);
  }, [
    data.sources,
    data.codings,
    queryCodeA,
    queryCodeB,
    queryOperator,
    queryCaseId,
    caseMap,
  ]);

  const matrixCodes = useMemo(() => {
    const topLevel = data.codes.filter((code) => !code.parent_code_id);
    return matrixAllCodes || topLevel.length === 0 ? data.codes : topLevel;
  }, [data.codes, matrixAllCodes]);

  const selectedAttribute = useMemo(
    () =>
      data.attributeDefinitions.find(
        (definition) => definition.id === matrixAttributeId,
      ) || null,
    [data.attributeDefinitions, matrixAttributeId],
  );

  const matrixRows = useMemo(() => {
    if (matrixRowMode === "attribute" && selectedAttribute) {
      const grouped = new Map<string, string[]>();
      for (const item of data.cases) {
        const raw = item.attributes?.[selectedAttribute.field_key];
        const label =
          raw === null || raw === undefined || raw === ""
            ? "Not specified"
            : String(raw);
        const ids = grouped.get(label) || [];
        ids.push(item.id);
        grouped.set(label, ids);
      }
      return [...grouped.entries()]
        .map(([label, caseIds]) => ({ id: `attribute:${label}`, label, caseIds }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    return data.cases.map((item) => ({
      id: item.id,
      label: item.name,
      caseIds: [item.id],
    }));
  }, [data.cases, matrixRowMode, selectedAttribute]);

  function matrixCell(caseIds: string[], codeId: string) {
    const caseSet = new Set(caseIds);
    const matches = data.codings.filter(
      (coding) => caseSet.has(coding.case_id) && coding.code_id === codeId,
    );
    if (matrixMetric === "presence") return matches.length > 0 ? 1 : 0;
    if (matrixMetric === "words") {
      return matches.reduce(
        (sum, coding) => sum + codingWordCount(coding.excerpt),
        0,
      );
    }
    return matches.length;
  }

  function firstMatrixEvidence(caseIds: string[], codeId: string) {
    const caseSet = new Set(caseIds);
    return (
      data.codings.find(
        (coding) => caseSet.has(coding.case_id) && coding.code_id === codeId,
      ) || null
    );
  }

  const cooccurrence = useMemo(() => {
    const pairMap = new Map<
      string,
      {
        a: string;
        b: string;
        count: number;
        examples: QualitativeCoding[];
      }
    >();

    for (let i = 0; i < data.codes.length; i += 1) {
      for (let j = i + 1; j < data.codes.length; j += 1) {
        const a = data.codes[i];
        const b = data.codes[j];
        let count = 0;
        const examples: QualitativeCoding[] = [];

        if (cooccurrenceMode === "source") {
          for (const source of data.sources) {
            const aRefs = data.codings.filter(
              (coding) =>
                coding.source_id === source.id && coding.code_id === a.id,
            );
            const bRefs = data.codings.filter(
              (coding) =>
                coding.source_id === source.id && coding.code_id === b.id,
            );
            if (aRefs.length && bRefs.length) {
              count += 1;
              examples.push(aRefs[0]);
            }
          }
        } else {
          const aRefs = data.codings.filter((coding) => coding.code_id === a.id);
          const bRefs = data.codings.filter((coding) => coding.code_id === b.id);
          for (const left of aRefs) {
            for (const right of bRefs) {
              if (
                left.source_id === right.source_id &&
                rangesOverlap(
                  left.start_offset,
                  left.end_offset,
                  right.start_offset,
                  right.end_offset,
                )
              ) {
                count += 1;
                if (examples.length < 20) examples.push(left);
              }
            }
          }
        }

        if (count > 0) {
          pairMap.set(`${a.id}:${b.id}`, {
            a: a.id,
            b: b.id,
            count,
            examples,
          });
        }
      }
    }

    return [...pairMap.values()].sort(
      (left, right) =>
        right.count - left.count ||
        (codeMap.get(left.a)?.name || "").localeCompare(
          codeMap.get(right.a)?.name || "",
        ),
    );
  }, [data.codes, data.sources, data.codings, cooccurrenceMode, codeMap]);

  const selectedPairResult = useMemo(() => {
    if (!selectedPair) return null;
    return (
      cooccurrence.find(
        (item) =>
          (item.a === selectedPair[0] && item.b === selectedPair[1]) ||
          (item.a === selectedPair[1] && item.b === selectedPair[0]),
      ) || null
    );
  }, [cooccurrence, selectedPair]);

  function currentConfig() {
    if (analysisTab === "word_frequency") {
      return {
        scopeMode,
        scopeCaseId,
        scopeSourceId,
        topN,
        minWordLength,
        customStopWords,
      };
    }
    if (analysisTab === "coding_query") {
      return {
        queryCodeA,
        queryCodeB,
        queryOperator,
        queryCaseId,
      };
    }
    if (analysisTab === "matrix") {
      return {
        matrixRowMode,
        matrixAttributeId,
        matrixMetric,
        matrixAllCodes,
      };
    }
    return { cooccurrenceMode };
  }

  function applySaved(saved: QualitativeSavedQuery) {
    const config = saved.config || {};
    setAnalysisTab(saved.query_type);

    if (saved.query_type === "word_frequency") {
      if (config.scopeMode === "all" || config.scopeMode === "case" || config.scopeMode === "source") {
        setScopeMode(config.scopeMode);
      }
      setScopeCaseId(String(config.scopeCaseId || ""));
      setScopeSourceId(String(config.scopeSourceId || ""));
      setTopN(Number(config.topN || 30));
      setMinWordLength(Number(config.minWordLength || 3));
      setCustomStopWords(String(config.customStopWords || ""));
    } else if (saved.query_type === "coding_query") {
      setQueryCodeA(String(config.queryCodeA || data.codes[0]?.id || ""));
      setQueryCodeB(String(config.queryCodeB || data.codes[1]?.id || ""));
      if (config.queryOperator === "AND" || config.queryOperator === "OR" || config.queryOperator === "NOT") {
        setQueryOperator(config.queryOperator);
      }
      setQueryCaseId(String(config.queryCaseId || ""));
    } else if (saved.query_type === "matrix") {
      if (config.matrixRowMode === "case" || config.matrixRowMode === "attribute") {
        setMatrixRowMode(config.matrixRowMode);
      }
      setMatrixAttributeId(String(config.matrixAttributeId || ""));
      if (
        config.matrixMetric === "references" ||
        config.matrixMetric === "presence" ||
        config.matrixMetric === "words"
      ) {
        setMatrixMetric(config.matrixMetric);
      }
      setMatrixAllCodes(config.matrixAllCodes === true);
    } else if (
      config.cooccurrenceMode === "overlap" ||
      config.cooccurrenceMode === "source"
    ) {
      setCooccurrenceMode(config.cooccurrenceMode);
    }
  }

  async function saveCurrent() {
    if (!saveName.trim() || saving) return;
    setSaving(true);
    try {
      await onSaveQuery(saveName.trim(), analysisTab, currentConfig());
      setSaveName("");
    } finally {
      setSaving(false);
    }
  }

  const maxWordCount = Math.max(1, ...wordFrequency.map((item) => item.count));

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-700" />
              <h3 className="text-[12px] font-semibold text-slate-950">
                Qualitative analysis
              </h3>
            </div>
            <p className="mt-1 text-[8.5px] leading-4 text-slate-500">
              Explore language, coding patterns, case differences and relationships
              without disconnecting results from their underlying evidence.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              ["word_frequency", "Word frequency", Search],
              ["coding_query", "Coding query", Tags],
              ["matrix", "Matrix coding", Table2],
              ["cooccurrence", "Co-occurrence", Network],
            ].map(([id, label, Icon]) => {
              const active = analysisTab === id;
              const IconComponent = Icon as typeof Search;
              return (
                <button
                  key={String(id)}
                  type="button"
                  onClick={() =>
                    setAnalysisTab(
                      id as
                        | "word_frequency"
                        | "coding_query"
                        | "matrix"
                        | "cooccurrence",
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[8px] font-semibold ${
                    active
                      ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  <IconComponent className="h-3 w-3" />
                  {String(label)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[7.5px] font-semibold uppercase tracking-[.1em] text-slate-400">
              Saved analyses
            </span>
            {data.savedQueries.length === 0 ? (
              <span className="text-[7.5px] text-slate-400">None yet</span>
            ) : (
              data.savedQueries.slice(0, 8).map((saved) => (
                <span key={saved.id} className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => applySaved(saved)}
                    className="px-2 py-1.5 text-[7.5px] font-semibold text-slate-600 hover:text-cyan-700"
                  >
                    {saved.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteSavedQuery(saved.id)}
                    className="border-l border-slate-200 px-1.5 py-1.5 text-slate-300 hover:text-rose-600"
                    title="Delete saved analysis"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              placeholder="Name this setup"
              className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-[8px] outline-none focus:border-cyan-300"
            />
            <button
              type="button"
              disabled={!saveName.trim() || saving}
              onClick={() => void saveCurrent()}
              className="rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-35"
            >
              {saving ? "Saving…" : "Save setup"}
            </button>
          </div>
        </div>
      </section>

      {analysisTab === "word_frequency" && (
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-[10px] font-semibold text-slate-900">
              Word-frequency settings
            </h4>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[8px] font-semibold text-slate-600">Scope</span>
                <select
                  value={scopeMode}
                  onChange={(event) =>
                    setScopeMode(event.target.value as "all" | "case" | "source")
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                >
                  <option value="all">All qualitative sources</option>
                  <option value="case">One case</option>
                  <option value="source">One source</option>
                </select>
              </label>

              {scopeMode === "case" && (
                <select
                  value={scopeCaseId}
                  onChange={(event) => setScopeCaseId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                >
                  <option value="">Choose case…</option>
                  {data.cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}

              {scopeMode === "source" && (
                <select
                  value={scopeSourceId}
                  onChange={(event) => setScopeSourceId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                >
                  <option value="">Choose source…</option>
                  {data.sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title}
                    </option>
                  ))}
                </select>
              )}

              <label className="block">
                <span className="text-[8px] font-semibold text-slate-600">
                  Top words
                </span>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={topN}
                  onChange={(event) =>
                    setTopN(Math.max(5, Math.min(100, Number(event.target.value) || 30)))
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px]"
                />
              </label>

              <label className="block">
                <span className="text-[8px] font-semibold text-slate-600">
                  Minimum word length
                </span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={minWordLength}
                  onChange={(event) =>
                    setMinWordLength(
                      Math.max(1, Math.min(20, Number(event.target.value) || 3)),
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px]"
                />
              </label>

              <label className="block">
                <span className="text-[8px] font-semibold text-slate-600">
                  Additional stop words
                </span>
                <textarea
                  value={customStopWords}
                  onChange={(event) => setCustomStopWords(event.target.value)}
                  placeholder="e.g. interviewer, participant, okay"
                  rows={4}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px] leading-4 outline-none focus:border-cyan-300"
                />
              </label>
            </div>
          </section>

          <div className="space-y-4">
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-[10px] font-semibold text-slate-900">Word cloud</h4>
                  <p className="mt-1 text-[7.5px] text-slate-400">
                    Font size represents frequency in the selected material.
                  </p>
                </div>
                <Badge tone="cyan">{scopeSources.length} source{scopeSources.length === 1 ? "" : "s"}</Badge>
              </div>

              <div className="mt-4 flex min-h-[180px] flex-wrap content-center items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-slate-100 bg-slate-50/55 p-5 text-center">
                {wordFrequency.length === 0 ? (
                  <p className="text-[8.5px] text-slate-400">No words match the current settings.</p>
                ) : (
                  wordFrequency.map((item, index) => (
                    <span
                      key={item.word}
                      className={index < 6 ? "font-semibold text-slate-800" : "text-slate-500"}
                      style={{
                        fontSize: `${10 + (item.count / maxWordCount) * 22}px`,
                        lineHeight: 1.05,
                      }}
                      title={`${item.count} occurrences · ${item.percentage.toFixed(2)}%`}
                    >
                      {item.word}
                    </span>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div>
                  <h4 className="text-[10px] font-semibold text-slate-900">
                    Frequency table
                  </h4>
                  <div className="mt-3 max-h-[340px] overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr className="text-[7px] uppercase tracking-[.08em] text-slate-400">
                          <th className="px-3 py-2">Word</th>
                          <th className="px-3 py-2 text-right">Count</th>
                          <th className="px-3 py-2 text-right">Weighted %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wordFrequency.map((item) => (
                          <tr key={item.word} className="border-t border-slate-100 text-[8.5px]">
                            <td className="px-3 py-2 font-medium text-slate-700">{item.word}</td>
                            <td className="px-3 py-2 text-right text-slate-500">{item.count}</td>
                            <td className="px-3 py-2 text-right text-slate-500">{item.percentage.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold text-slate-900">Treemap</h4>
                  <div className="mt-3 flex min-h-[340px] flex-wrap content-start gap-1.5 rounded-xl border border-slate-200 bg-slate-50/45 p-2">
                    {wordFrequency.slice(0, 24).map((item, index) => (
                      <div
                        key={item.word}
                        className="flex min-h-[54px] items-end rounded-lg border border-slate-200 bg-white p-2"
                        style={{
                          flexGrow: Math.max(1, Math.round((item.count / maxWordCount) * 8)),
                          flexBasis: `${72 + Math.round((item.count / maxWordCount) * 110)}px`,
                        }}
                        title={`${item.count} occurrences`}
                      >
                        <div>
                          <p className="text-[8px] font-semibold text-slate-700">{item.word}</p>
                          <p className="mt-0.5 text-[6.5px] text-slate-400">{item.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {analysisTab === "coding_query" && (
        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-[10px] font-semibold text-slate-900">Coding query</h4>
            <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
              Find sources coded to one or two codes. AND/OR/NOT are evaluated
              within the same qualitative source.
            </p>

            <div className="mt-4 space-y-3">
              <select
                value={queryCodeA}
                onChange={(event) => setQueryCodeA(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
              >
                <option value="">Choose first code…</option>
                {data.codes.map((code) => (
                  <option key={code.id} value={code.id}>{code.name}</option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-1.5">
                {(["AND", "OR", "NOT"] as const).map((operator) => (
                  <button
                    key={operator}
                    type="button"
                    onClick={() => setQueryOperator(operator)}
                    className={`rounded-lg border px-2 py-2 text-[8px] font-semibold ${
                      queryOperator === operator
                        ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {operator}
                  </button>
                ))}
              </div>

              <select
                value={queryCodeB}
                onChange={(event) => setQueryCodeB(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
              >
                <option value="">Choose second code…</option>
                {data.codes.map((code) => (
                  <option key={code.id} value={code.id}>{code.name}</option>
                ))}
              </select>

              <select
                value={queryCaseId}
                onChange={(event) => setQueryCaseId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
              >
                <option value="">All cases</option>
                {data.cases.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-semibold text-slate-900">Matching evidence</h4>
                <p className="mt-1 text-[7.5px] text-slate-400">
                  {queryResults.length} source{queryResults.length === 1 ? "" : "s"} match this query.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {queryResults.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-[8.5px] text-slate-400">
                  No qualitative sources match the current query.
                </div>
              ) : (
                queryResults.map((result) => (
                  <button
                    key={result.source.id}
                    type="button"
                    onClick={() => onOpenEvidence(result.source.case_id, result.source.id)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-cyan-200 hover:bg-cyan-50/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-semibold text-slate-800">{result.source.title}</p>
                        <p className="mt-0.5 truncate text-[7.5px] text-slate-400">{result.caseItem?.name || "Case"}</p>
                      </div>
                      <Badge tone="cyan">{result.a.length + result.b.length} refs</Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      {[...result.a, ...result.b].slice(0, 3).map((coding) => (
                        <p key={coding.id} className="truncate text-[7.5px] text-slate-500">
                          “{coding.excerpt}”
                        </p>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {analysisTab === "matrix" && (
        <div className="space-y-4">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-cyan-700" />
                  <h4 className="text-[10px] font-semibold text-slate-900">
                    {matrixRowMode === "case" && !matrixAllCodes
                      ? "Case × theme matrix"
                      : "Matrix coding"}
                  </h4>
                </div>
                <p className="mt-1 text-[7.5px] text-slate-400">
                  Click a populated cell to return to its underlying coded evidence.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={matrixRowMode}
                  onChange={(event) =>
                    setMatrixRowMode(event.target.value as "case" | "attribute")
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
                >
                  <option value="case">Rows: cases</option>
                  <option value="attribute">Rows: case attribute</option>
                </select>

                {matrixRowMode === "attribute" && (
                  <select
                    value={matrixAttributeId}
                    onChange={(event) => setMatrixAttributeId(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
                  >
                    <option value="">Choose attribute…</option>
                    {data.attributeDefinitions.map((definition) => (
                      <option key={definition.id} value={definition.id}>
                        {definition.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={matrixMetric}
                  onChange={(event) =>
                    setMatrixMetric(
                      event.target.value as "references" | "presence" | "words",
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
                >
                  <option value="references">Cell: coding references</option>
                  <option value="presence">Cell: presence / absence</option>
                  <option value="words">Cell: words coded</option>
                </select>

                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={matrixAllCodes}
                    onChange={(event) => setMatrixAllCodes(event.target.checked)}
                    className="h-3 w-3"
                  />
                  Include child codes
                </label>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[7px] uppercase tracking-[.08em] text-slate-400">
                    <th className="sticky left-0 z-10 min-w-[180px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left">
                      {matrixRowMode === "case" ? "Case" : selectedAttribute?.name || "Attribute value"}
                    </th>
                    {matrixCodes.map((code) => (
                      <th key={code.id} className="min-w-[125px] border-b border-slate-200 px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: code.color }} />
                          {code.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <th className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2.5 text-left text-[8.5px] font-semibold text-slate-700">
                        {row.label}
                      </th>
                      {matrixCodes.map((code) => {
                        const value = matrixCell(row.caseIds, code.id);
                        const evidence = firstMatrixEvidence(row.caseIds, code.id);
                        return (
                          <td key={code.id} className="px-2 py-2 text-center">
                            <button
                              type="button"
                              disabled={!evidence}
                              onClick={() => evidence && onOpenEvidence(evidence.case_id, evidence.source_id)}
                              className={`min-w-[54px] rounded-lg px-2 py-2 text-[8.5px] font-semibold ${
                                evidence
                                  ? "bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                                  : "bg-slate-50 text-slate-300"
                              }`}
                            >
                              {matrixMetric === "presence" ? (value ? "Yes" : "—") : value}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {matrixRows.length === 0 && (
                    <tr>
                      <td colSpan={matrixCodes.length + 1} className="px-4 py-12 text-center text-[8.5px] text-slate-400">
                        No cases are available for this matrix.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {analysisTab === "cooccurrence" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-cyan-700" />
                  <h4 className="text-[10px] font-semibold text-slate-900">Code co-occurrence</h4>
                </div>
                <p className="mt-1 text-[7.5px] text-slate-400">
                  Find codes that overlap in the same passage or appear in the same source.
                </p>
              </div>

              <select
                value={cooccurrenceMode}
                onChange={(event) =>
                  setCooccurrenceMode(event.target.value as "overlap" | "source")
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
              >
                <option value="overlap">Overlapping coded passages</option>
                <option value="source">Same source</option>
              </select>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cooccurrence.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-dashed border-slate-200 p-10 text-center text-[8.5px] text-slate-400">
                  No code pairs meet this co-occurrence rule yet.
                </div>
              ) : (
                cooccurrence.map((pair) => {
                  const codeA = codeMap.get(pair.a);
                  const codeB = codeMap.get(pair.b);
                  const active =
                    selectedPair &&
                    ((selectedPair[0] === pair.a && selectedPair[1] === pair.b) ||
                      (selectedPair[0] === pair.b && selectedPair[1] === pair.a));
                  return (
                    <button
                      key={`${pair.a}:${pair.b}`}
                      type="button"
                      onClick={() => setSelectedPair([pair.a, pair.b])}
                      className={`rounded-xl border p-3 text-left ${
                        active
                          ? "border-cyan-300 bg-cyan-50/70"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: codeA?.color || "#06b6d4" }} />
                        <span className="truncate text-[8.5px] font-semibold text-slate-700">{codeA?.name || "Code"}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: codeB?.color || "#8b5cf6" }} />
                        <span className="truncate text-[8.5px] font-semibold text-slate-700">{codeB?.name || "Code"}</span>
                      </div>
                      <p className="mt-2 text-[7.5px] text-slate-400">
                        {pair.count} {cooccurrenceMode === "source" ? "shared source" : "overlap"}{pair.count === 1 ? "" : "s"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-[10px] font-semibold text-slate-900">Underlying evidence</h4>
            {!selectedPairResult ? (
              <p className="mt-3 text-[8.5px] leading-4 text-slate-400">
                Select a code pair to inspect the qualitative evidence behind the relationship.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {selectedPairResult.examples.slice(0, 12).map((coding) => {
                  const source = sourceMap.get(coding.source_id);
                  const caseItem = caseMap.get(coding.case_id);
                  return (
                    <button
                      key={`${coding.id}-${source?.id || ""}`}
                      type="button"
                      onClick={() => onOpenEvidence(coding.case_id, coding.source_id)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-cyan-200 hover:bg-cyan-50/30"
                    >
                      <p className="truncate text-[8px] font-semibold text-slate-700">
                        {source?.title || "Source"}
                      </p>
                      <p className="mt-0.5 truncate text-[7px] text-slate-400">
                        {caseItem?.name || "Case"}
                      </p>
                      <p className="mt-1.5 line-clamp-3 text-[7.5px] leading-3.5 text-slate-500">
                        “{coding.excerpt}”
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}


type SentenceReliabilityUnit = {
  source_id: string;
  case_id: string;
  unit_key: string;
  start_offset: number;
  end_offset: number;
  excerpt: string;
};

function sentenceReliabilityUnits(source: QualitativeSource): SentenceReliabilityUnit[] {
  const content = source.content_text || "";
  const units: SentenceReliabilityUnit[] = [];
  let segmentStart = 0;
  let index = 0;

  function pushSegment(rawStart: number, rawEnd: number) {
    let start = rawStart;
    let end = rawEnd;
    while (start < end && /\s/.test(content[start] || "")) start += 1;
    while (end > start && /\s/.test(content[end - 1] || "")) end -= 1;
    if (end <= start) return;

    units.push({
      source_id: source.id,
      case_id: source.case_id,
      unit_key: `${source.id}:${start}:${end}`,
      start_offset: start,
      end_offset: end,
      excerpt: content.slice(start, end),
    });
  }

  while (index < content.length) {
    const char = content[index];
    const isSentenceEnd = char === "." || char === "!" || char === "?";
    const isLineEnd = char === "\n";

    if (isSentenceEnd) {
      let end = index + 1;
      while (
        end < content.length &&
        (content[end] === "." || content[end] === "!" || content[end] === "?")
      ) {
        end += 1;
      }
      pushSegment(segmentStart, end);
      segmentStart = end;
      index = end;
      continue;
    }

    if (isLineEnd) {
      pushSegment(segmentStart, index);
      segmentStart = index + 1;
    }

    index += 1;
  }

  pushSegment(segmentStart, content.length);
  return units;
}

function calculateKappa(left: boolean[], right: boolean[]) {
  const total = Math.min(left.length, right.length);
  if (total === 0) {
    return { total: 0, agreement: 0, kappa: null as number | null };
  }

  let bothYes = 0;
  let leftYesRightNo = 0;
  let leftNoRightYes = 0;
  let bothNo = 0;

  for (let index = 0; index < total; index += 1) {
    if (left[index] && right[index]) bothYes += 1;
    else if (left[index] && !right[index]) leftYesRightNo += 1;
    else if (!left[index] && right[index]) leftNoRightYes += 1;
    else bothNo += 1;
  }

  const observed = (bothYes + bothNo) / total;
  const leftYes = (bothYes + leftYesRightNo) / total;
  const rightYes = (bothYes + leftNoRightYes) / total;
  const expected = leftYes * rightYes + (1 - leftYes) * (1 - rightYes);
  const kappa =
    Math.abs(1 - expected) < 1e-12 ? null : (observed - expected) / (1 - expected);

  return {
    total,
    agreement: observed,
    kappa,
    bothYes,
    leftYesRightNo,
    leftNoRightYes,
    bothNo,
  };
}


function FrameworkSummaryCell({
  initialValue,
  evidenceCount,
  onSave,
}: {
  initialValue: string;
  evidenceCount: number;
  onSave: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const dirty = value !== initialValue;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-[220px] p-2">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Write a concise case-by-theme summary…"
        rows={5}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8.5px] leading-4 text-slate-700 outline-none focus:border-cyan-300"
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[6.5px] text-slate-400">
          {evidenceCount} coded reference{evidenceCount === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => void save()}
          className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-[7px] font-semibold text-white disabled:opacity-30"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function QualitativeExplorationPanel({
  data,
  onOpenEvidence,
  onCreateSet,
  onUpdateSet,
  onArchiveSet,
  onToggleSetItem,
  onCreateRelationship,
  onDeleteRelationship,
}: {
  data: StudyPayload;
  onOpenEvidence: (caseId: string, sourceId: string) => void;
  onCreateSet: (input: {
    name: string;
    description: string;
    color: string;
  }) => Promise<void>;
  onUpdateSet: (input: {
    setId: string;
    name: string;
    description: string;
    color: string;
  }) => Promise<void>;
  onArchiveSet: (setId: string) => Promise<void>;
  onToggleSetItem: (input: {
    setId: string;
    itemType: "case" | "source";
    itemId: string;
    enabled: boolean;
  }) => Promise<void>;
  onCreateRelationship: (input: {
    fromType: QualitativeRelationship["from_type"];
    fromId: string;
    toType: QualitativeRelationship["to_type"];
    toId: string;
    relationshipType: QualitativeRelationship["relationship_type"];
    customLabel: string;
    note: string;
  }) => Promise<void>;
  onDeleteRelationship: (relationshipId: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<
    "search" | "sets" | "relationships" | "visualizations" | "history"
  >("search");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"contains" | "all_words">(
    "contains",
  );
  const [searchType, setSearchType] = useState("all");
  const [searchCaseId, setSearchCaseId] = useState("");
  const [searchSourceId, setSearchSourceId] = useState("");
  const [searchCodeId, setSearchCodeId] = useState("");
  const [searchThemeId, setSearchThemeId] = useState("");
  const [searchSetId, setSearchSetId] = useState("");

  const [selectedSetId, setSelectedSetId] = useState(data.sets[0]?.id || "");
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");
  const [newSetColor, setNewSetColor] = useState("#06b6d4");
  const [setName, setSetName] = useState("");
  const [setDescription, setSetDescription] = useState("");
  const [setColor, setSetColor] = useState("#06b6d4");
  const [setBusy, setSetBusy] = useState(false);

  const [relationshipFrom, setRelationshipFrom] = useState("");
  const [relationshipTo, setRelationshipTo] = useState("");
  const [relationshipType, setRelationshipType] =
    useState<QualitativeRelationship["relationship_type"]>("relates_to");
  const [relationshipCustomLabel, setRelationshipCustomLabel] = useState("");
  const [relationshipNote, setRelationshipNote] = useState("");
  const [relationshipBusy, setRelationshipBusy] = useState(false);

  const [visualization, setVisualization] = useState<
    "heatmap" | "density" | "hierarchy" | "network"
  >("heatmap");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyEntityType, setHistoryEntityType] = useState("all");

  const caseMap = useMemo(
    () => new Map(data.cases.map((item) => [item.id, item])),
    [data.cases],
  );
  const sourceMap = useMemo(
    () => new Map(data.sources.map((item) => [item.id, item])),
    [data.sources],
  );
  const codeMap = useMemo(
    () =>
      new Map(
        [...data.codes, ...data.archivedCodes].map((item) => [item.id, item]),
      ),
    [data.codes, data.archivedCodes],
  );
  const themeMap = useMemo(
    () => new Map(data.themes.map((item) => [item.id, item])),
    [data.themes],
  );

  const selectedSet =
    data.sets.find((item) => item.id === selectedSetId) || null;

  useEffect(() => {
    if (!selectedSet) {
      if (data.sets[0]) setSelectedSetId(data.sets[0].id);
      setSetName("");
      setSetDescription("");
      setSetColor("#06b6d4");
      return;
    }
    setSetName(selectedSet.name);
    setSetDescription(selectedSet.description || "");
    setSetColor(selectedSet.color);
  }, [selectedSet, data.sets]);

  const selectedSetItems = useMemo(
    () => data.setItems.filter((item) => item.set_id === selectedSetId),
    [data.setItems, selectedSetId],
  );

  const setCaseIds = useMemo(
    () =>
      new Set(
        selectedSetItems
          .filter((item) => item.item_type === "case")
          .map((item) => item.item_id),
      ),
    [selectedSetItems],
  );
  const setSourceIds = useMemo(
    () =>
      new Set(
        selectedSetItems
          .filter((item) => item.item_type === "source")
          .map((item) => item.item_id),
      ),
    [selectedSetItems],
  );

  const searchSetItems = useMemo(
    () => data.setItems.filter((item) => item.set_id === searchSetId),
    [data.setItems, searchSetId],
  );
  const searchSetCaseIds = useMemo(
    () =>
      new Set(
        searchSetItems
          .filter((item) => item.item_type === "case")
          .map((item) => item.item_id),
      ),
    [searchSetItems],
  );
  const searchSetSourceIds = useMemo(
    () =>
      new Set(
        searchSetItems
          .filter((item) => item.item_type === "source")
          .map((item) => item.item_id),
      ),
    [searchSetItems],
  );

  type SearchResult = {
    key: string;
    type: "case" | "source" | "coding" | "memo" | "annotation" | "code" | "theme";
    title: string;
    snippet: string;
    caseId?: string;
    sourceId?: string;
    codeId?: string;
    themeId?: string;
  };

  function normalizedMatch(value: unknown, query: string) {
    const haystack = String(value ?? "").toLocaleLowerCase();
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return false;
    if (searchMode === "contains") return haystack.includes(needle);
    return needle
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => haystack.includes(token));
  }

  function sourceSnippet(content: string, query: string) {
    const compact = content.replace(/\s+/g, " ").trim();
    const needle = query.trim().toLocaleLowerCase();
    const index = compact.toLocaleLowerCase().indexOf(needle);
    if (index < 0) return compact.slice(0, 220);
    const start = Math.max(0, index - 90);
    const end = Math.min(compact.length, index + needle.length + 130);
    return `${start > 0 ? "…" : ""}${compact.slice(start, end)}${
      end < compact.length ? "…" : ""
    }`;
  }

  function resultPassesFilters(result: SearchResult) {
    if (searchType !== "all" && result.type !== searchType) return false;
    if (searchCaseId && result.caseId !== searchCaseId) return false;
    if (searchSourceId && result.sourceId !== searchSourceId) return false;

    if (searchSetId) {
      const inSetBySource =
        Boolean(result.sourceId) && searchSetSourceIds.has(result.sourceId || "");
      const inSetByCase =
        Boolean(result.caseId) && searchSetCaseIds.has(result.caseId || "");
      if (!inSetBySource && !inSetByCase) return false;
    }

    if (searchCodeId) {
      if (result.codeId === searchCodeId) {
        // direct code result or coded reference
      } else if (
        result.sourceId &&
        data.codings.some(
          (coding) =>
            coding.source_id === result.sourceId &&
            coding.code_id === searchCodeId,
        )
      ) {
        // source connected to this code
      } else if (
        result.caseId &&
        data.codings.some(
          (coding) =>
            coding.case_id === result.caseId && coding.code_id === searchCodeId,
        )
      ) {
        // case connected to this code
      } else {
        return false;
      }
    }

    if (searchThemeId) {
      const themeCodeIds = new Set(
        data.themeCodes
          .filter((mapping) => mapping.theme_id === searchThemeId)
          .map((mapping) => mapping.code_id),
      );
      if (result.themeId === searchThemeId) {
        // direct theme result
      } else if (result.codeId && themeCodeIds.has(result.codeId)) {
        // code/coding mapped to theme
      } else if (
        result.sourceId &&
        data.codings.some(
          (coding) =>
            coding.source_id === result.sourceId &&
            themeCodeIds.has(coding.code_id),
        )
      ) {
        // source has theme evidence
      } else if (
        result.caseId &&
        data.codings.some(
          (coding) =>
            coding.case_id === result.caseId &&
            themeCodeIds.has(coding.code_id),
        )
      ) {
        // case has theme evidence
      } else {
        return false;
      }
    }

    return true;
  }

  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [] as SearchResult[];
    const rows: SearchResult[] = [];

    for (const item of data.cases) {
      const searchable = [
        item.name,
        item.case_key,
        item.classification,
        item.notes || "",
        JSON.stringify(item.attributes || {}),
      ].join(" ");
      if (normalizedMatch(searchable, query)) {
        rows.push({
          key: `case:${item.id}`,
          type: "case",
          title: item.name,
          snippet: [item.case_key, item.classification, item.notes]
            .filter(Boolean)
            .join(" · "),
          caseId: item.id,
        });
      }
    }

    for (const source of data.sources) {
      if (
        normalizedMatch(source.title, query) ||
        normalizedMatch(source.content_text, query) ||
        normalizedMatch(source.original_filename || "", query)
      ) {
        rows.push({
          key: `source:${source.id}`,
          type: "source",
          title: source.title,
          snippet: sourceSnippet(source.content_text || source.title, query),
          caseId: source.case_id,
          sourceId: source.id,
        });
      }
    }

    for (const coding of data.codings) {
      const code = codeMap.get(coding.code_id);
      if (
        normalizedMatch(coding.excerpt, query) ||
        normalizedMatch(coding.note || "", query) ||
        normalizedMatch(code?.name || "", query)
      ) {
        rows.push({
          key: `coding:${coding.id}`,
          type: "coding",
          title: code?.name || "Coded reference",
          snippet: coding.excerpt,
          caseId: coding.case_id,
          sourceId: coding.source_id,
          codeId: coding.code_id,
        });
      }
    }

    for (const memo of data.memos) {
      if (
        normalizedMatch(memo.title, query) ||
        normalizedMatch(memo.content, query)
      ) {
        const source = memo.source_id ? sourceMap.get(memo.source_id) : null;
        rows.push({
          key: `memo:${memo.id}`,
          type: "memo",
          title: memo.title,
          snippet: memo.content,
          caseId: memo.case_id || source?.case_id || undefined,
          sourceId: memo.source_id || undefined,
          codeId: memo.code_id || undefined,
        });
      }
    }

    for (const annotation of data.annotations) {
      if (
        normalizedMatch(annotation.content, query) ||
        normalizedMatch(annotation.excerpt, query)
      ) {
        rows.push({
          key: `annotation:${annotation.id}`,
          type: "annotation",
          title: "Annotation",
          snippet: `${annotation.content} · “${annotation.excerpt}”`,
          caseId: annotation.case_id,
          sourceId: annotation.source_id,
        });
      }
    }

    for (const code of [...data.codes, ...data.archivedCodes]) {
      if (
        normalizedMatch(code.name, query) ||
        normalizedMatch(code.description || "", query)
      ) {
        rows.push({
          key: `code:${code.id}`,
          type: "code",
          title: code.name,
          snippet: code.description || "Codebook entry",
          codeId: code.id,
        });
      }
    }

    for (const theme of data.themes) {
      if (
        normalizedMatch(theme.name, query) ||
        normalizedMatch(theme.description || "", query)
      ) {
        rows.push({
          key: `theme:${theme.id}`,
          type: "theme",
          title: theme.name,
          snippet: theme.description || "Theme",
          themeId: theme.id,
        });
      }
    }

    return rows.filter(resultPassesFilters).slice(0, 250);
  }, [
    searchQuery,
    searchMode,
    searchType,
    searchCaseId,
    searchSourceId,
    searchCodeId,
    searchThemeId,
    searchSetId,
    searchSetCaseIds,
    searchSetSourceIds,
    data,
    codeMap,
    sourceMap,
  ]);

  function openSearchResult(result: SearchResult) {
    if (result.caseId && result.sourceId) {
      onOpenEvidence(result.caseId, result.sourceId);
      return;
    }
    if (result.caseId) {
      const firstSource = data.sources.find(
        (source) => source.case_id === result.caseId,
      );
      if (firstSource) onOpenEvidence(result.caseId, firstSource.id);
    }
  }

  async function createSet() {
    if (!newSetName.trim() || setBusy) return;
    setSetBusy(true);
    try {
      await onCreateSet({
        name: newSetName.trim(),
        description: newSetDescription,
        color: newSetColor,
      });
      setNewSetName("");
      setNewSetDescription("");
    } finally {
      setSetBusy(false);
    }
  }

  async function updateSet() {
    if (!selectedSet || !setName.trim() || setBusy) return;
    setSetBusy(true);
    try {
      await onUpdateSet({
        setId: selectedSet.id,
        name: setName.trim(),
        description: setDescription,
        color: setColor,
      });
    } finally {
      setSetBusy(false);
    }
  }

  const relationshipEntities = useMemo(() => {
    const rows: Array<{
      value: string;
      type: QualitativeRelationship["from_type"];
      id: string;
      label: string;
    }> = [];
    for (const item of data.cases) {
      rows.push({ value: `case:${item.id}`, type: "case", id: item.id, label: `Case · ${item.name}` });
    }
    for (const item of data.sources) {
      rows.push({ value: `source:${item.id}`, type: "source", id: item.id, label: `Source · ${item.title}` });
    }
    for (const item of data.codes) {
      rows.push({ value: `code:${item.id}`, type: "code", id: item.id, label: `Code · ${item.name}` });
    }
    for (const item of data.themes) {
      rows.push({ value: `theme:${item.id}`, type: "theme", id: item.id, label: `Theme · ${item.name}` });
    }
    for (const item of data.memos) {
      rows.push({ value: `memo:${item.id}`, type: "memo", id: item.id, label: `Memo · ${item.title}` });
    }
    for (const item of data.codings.slice(0, 200)) {
      rows.push({
        value: `coding:${item.id}`,
        type: "coding",
        id: item.id,
        label: `Evidence · ${item.excerpt.slice(0, 80)}`,
      });
    }
    for (const item of data.annotations.slice(0, 200)) {
      rows.push({
        value: `annotation:${item.id}`,
        type: "annotation",
        id: item.id,
        label: `Annotation · ${item.content.slice(0, 80)}`,
      });
    }
    return rows;
  }, [data]);

  const relationshipEntityMap = useMemo(
    () => new Map(relationshipEntities.map((item) => [item.value, item])),
    [relationshipEntities],
  );

  function relationshipLabel(type: string, id: string) {
    return (
      relationshipEntityMap.get(`${type}:${id}`)?.label ||
      `${type} · ${id.slice(0, 8)}`
    );
  }

  async function createRelationship() {
    if (!relationshipFrom || !relationshipTo || relationshipBusy) return;
    const from = relationshipEntityMap.get(relationshipFrom);
    const to = relationshipEntityMap.get(relationshipTo);
    if (!from || !to || from.value === to.value) return;

    setRelationshipBusy(true);
    try {
      await onCreateRelationship({
        fromType: from.type,
        fromId: from.id,
        toType: to.type,
        toId: to.id,
        relationshipType,
        customLabel: relationshipCustomLabel,
        note: relationshipNote,
      });
      setRelationshipNote("");
      setRelationshipCustomLabel("");
    } finally {
      setRelationshipBusy(false);
    }
  }

  const relationshipNodes = useMemo(() => {
    const seen = new Map<string, { key: string; type: string; id: string; label: string }>();
    for (const relationship of data.relationships) {
      const leftKey = `${relationship.from_type}:${relationship.from_id}`;
      const rightKey = `${relationship.to_type}:${relationship.to_id}`;
      if (!seen.has(leftKey)) {
        seen.set(leftKey, {
          key: leftKey,
          type: relationship.from_type,
          id: relationship.from_id,
          label: relationshipLabel(relationship.from_type, relationship.from_id),
        });
      }
      if (!seen.has(rightKey)) {
        seen.set(rightKey, {
          key: rightKey,
          type: relationship.to_type,
          id: relationship.to_id,
          label: relationshipLabel(relationship.to_type, relationship.to_id),
        });
      }
    }
    return [...seen.values()].slice(0, 24);
  }, [data.relationships, relationshipEntityMap]);

  const relationshipNodePositions = useMemo(() => {
    const width = 760;
    const height = 380;
    const radius = 135;
    const centerX = width / 2;
    const centerY = height / 2;
    const positions = new Map<string, { x: number; y: number }>();
    relationshipNodes.forEach((node, index) => {
      const angle =
        relationshipNodes.length <= 1
          ? 0
          : (Math.PI * 2 * index) / relationshipNodes.length - Math.PI / 2;
      positions.set(node.key, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });
    return positions;
  }, [relationshipNodes]);

  const visualizationColumns = useMemo(() => {
    if (data.themes.length > 0) {
      return data.themes.map((theme) => ({
        id: theme.id,
        label: theme.name,
        color: theme.color,
        codeIds: new Set(
          data.themeCodes
            .filter((mapping) => mapping.theme_id === theme.id)
            .map((mapping) => mapping.code_id),
        ),
      }));
    }
    const top = data.codes.filter((code) => !code.parent_code_id);
    const codes = top.length > 0 ? top : data.codes;
    return codes.map((code) => ({
      id: code.id,
      label: code.name,
      color: code.color,
      codeIds: new Set([code.id]),
    }));
  }, [data.themes, data.themeCodes, data.codes]);

  const heatmapMax = useMemo(() => {
    let maximum = 0;
    for (const item of data.cases) {
      for (const column of visualizationColumns) {
        const count = data.codings.filter(
          (coding) =>
            coding.case_id === item.id && column.codeIds.has(coding.code_id),
        ).length;
        maximum = Math.max(maximum, count);
      }
    }
    return Math.max(1, maximum);
  }, [data.cases, data.codings, visualizationColumns]);

  const densityRows = useMemo(() => {
    const rows = data.sources.map((source) => ({
      source,
      count: data.codings.filter((coding) => coding.source_id === source.id)
        .length,
    }));
    return rows.sort((left, right) => right.count - left.count);
  }, [data.sources, data.codings]);
  const densityMax = Math.max(1, ...densityRows.map((row) => row.count));

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLocaleLowerCase();
    return data.auditLog.filter((item) => {
      if (historyEntityType !== "all" && item.entity_type !== historyEntityType) {
        return false;
      }
      if (!query) return true;
      return `${item.summary} ${item.action_type} ${item.entity_type}`
        .toLocaleLowerCase()
        .includes(query);
    });
  }, [data.auditLog, historyEntityType, historyQuery]);

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-cyan-700" />
              <h3 className="text-[12px] font-semibold text-slate-950">
                Explore qualitative evidence
              </h3>
            </div>
            <p className="mt-1 text-[8.5px] leading-4 text-slate-500">
              Search the project, group cases and sources, map relationships,
              inspect patterns and review project history.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              ["search", "Search", Search],
              ["sets", "Sets", FolderSearch],
              ["relationships", "Relationships", Network],
              ["visualizations", "Visualizations", BarChart3],
              ["history", "History", BookOpenText],
            ].map(([id, label, Icon]) => {
              const active = tab === id;
              const IconComponent = Icon as typeof Search;
              return (
                <button
                  key={String(id)}
                  type="button"
                  onClick={() =>
                    setTab(
                      id as
                        | "search"
                        | "sets"
                        | "relationships"
                        | "visualizations"
                        | "history",
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[8px] font-semibold ${
                    active
                      ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  <IconComponent className="h-3 w-3" />
                  {String(label)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {tab === "search" && (
        <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-[10px] font-semibold text-slate-900">
              Search project
            </h4>
            <div className="mt-3 space-y-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search transcripts, memos, codes, themes…"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-[9px] outline-none focus:border-cyan-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSearchMode("contains")}
                  className={`rounded-xl border px-2 py-2 text-[7.5px] font-semibold ${
                    searchMode === "contains"
                      ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  Exact phrase / contains
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode("all_words")}
                  className={`rounded-xl border px-2 py-2 text-[7.5px] font-semibold ${
                    searchMode === "all_words"
                      ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  All words
                </button>
              </div>

              <select
                value={searchType}
                onChange={(event) => setSearchType(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
              >
                <option value="all">All content types</option>
                <option value="source">Sources / transcripts</option>
                <option value="coding">Coded references</option>
                <option value="memo">Memos</option>
                <option value="annotation">Annotations</option>
                <option value="case">Cases</option>
                <option value="code">Codes</option>
                <option value="theme">Themes</option>
              </select>

              <select
                value={searchSetId}
                onChange={(event) => setSearchSetId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
              >
                <option value="">All sets / collections</option>
                {data.sets.map((item) => (
                  <option key={item.id} value={item.id}>
                    Set: {item.name}
                  </option>
                ))}
              </select>

              <select
                value={searchCaseId}
                onChange={(event) => setSearchCaseId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
              >
                <option value="">All cases</option>
                {data.cases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={searchSourceId}
                onChange={(event) => setSearchSourceId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
              >
                <option value="">All sources</option>
                {data.sources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>

              <select
                value={searchCodeId}
                onChange={(event) => setSearchCodeId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
              >
                <option value="">All codes</option>
                {data.codes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={searchThemeId}
                onChange={(event) => setSearchThemeId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
              >
                <option value="">All themes</option>
                {data.themes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-[10px] font-semibold text-slate-900">
                  Results
                </h4>
                <p className="mt-1 text-[7.5px] text-slate-400">
                  {searchQuery.trim()
                    ? `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`
                    : "Enter a search term to explore the project."}
                </p>
              </div>
            </div>

            <div className="mt-4 max-h-[660px] space-y-2 overflow-y-auto">
              {!searchQuery.trim() ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                  <Search className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-[8.5px] text-slate-400">
                    Search transcript text, coded excerpts, annotations, memos,
                    cases, codes and themes.
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-[8.5px] text-slate-400">
                  No project material matches the current search and filters.
                </div>
              ) : (
                searchResults.map((result) => {
                  const clickable = Boolean(result.caseId);
                  return (
                    <button
                      key={result.key}
                      type="button"
                      disabled={!clickable}
                      onClick={() => openSearchResult(result)}
                      className={`w-full rounded-xl border p-3 text-left ${
                        clickable
                          ? "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/30"
                          : "border-slate-200 bg-slate-50/45"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge tone={result.type === "theme" ? "violet" : result.type === "coding" ? "cyan" : "slate"}>
                              {result.type}
                            </Badge>
                            <p className="truncate text-[8.5px] font-semibold text-slate-800">
                              {result.title}
                            </p>
                          </div>
                          <p className="mt-2 line-clamp-4 text-[7.5px] leading-4 text-slate-500">
                            {result.snippet || "Matching project item"}
                          </p>
                        </div>
                        {clickable && (
                          <span className="shrink-0 text-[7px] font-semibold text-cyan-700">
                            Open evidence
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "sets" && (
        <div className="grid gap-4 xl:grid-cols-[310px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-[10px] font-semibold text-slate-900">
              Sets & collections
            </h4>
            <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
              Group cases and sources for focused searches and later mixed-methods comparisons.
            </p>

            <div className="mt-3 max-h-[300px] space-y-1.5 overflow-y-auto">
              {data.sets.map((item) => {
                const count = data.setItems.filter(
                  (setItem) => setItem.set_id === item.id,
                ).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSetId(item.id)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      selectedSetId === item.id
                        ? "border-cyan-300 bg-cyan-50/70"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="text-[7px] text-slate-400">{count}</span>
                    </div>
                  </button>
                );
              })}
              {data.sets.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-[8px] text-slate-400">
                  No sets yet.
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[8px] font-semibold text-slate-700">
                New set
              </p>
              <input
                value={newSetName}
                onChange={(event) => setNewSetName(event.target.value)}
                placeholder="e.g. High-stress participants"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[8.5px] outline-none focus:border-cyan-300"
              />
              <textarea
                value={newSetDescription}
                onChange={(event) => setNewSetDescription(event.target.value)}
                placeholder="Purpose or inclusion rule"
                rows={3}
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-[8px] leading-4 outline-none focus:border-cyan-300"
              />
              <div className="mt-2 flex gap-2">
                <input
                  type="color"
                  value={newSetColor}
                  onChange={(event) => setNewSetColor(event.target.value)}
                  className="h-9 w-11 rounded-lg border border-slate-200 bg-white p-1"
                />
                <button
                  type="button"
                  disabled={!newSetName.trim() || setBusy}
                  onClick={() => void createSet()}
                  className="flex-1 rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-40"
                >
                  Create set
                </button>
              </div>
            </div>
          </section>

          {!selectedSet ? (
            <section className="flex min-h-[480px] items-center justify-center rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-[8.5px] text-slate-400">
                Create or select a set to organise project material.
              </p>
            </section>
          ) : (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={setName}
                    onChange={(event) => setSetName(event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px] outline-none focus:border-cyan-300"
                  />
                  <input
                    value={setDescription}
                    onChange={(event) => setSetDescription(event.target.value)}
                    placeholder="Description"
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px] outline-none focus:border-cyan-300"
                  />
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={setColor}
                      onChange={(event) => setSetColor(event.target.value)}
                      className="h-10 w-11 rounded-lg border border-slate-200 bg-white p-1"
                    />
                    <button
                      type="button"
                      disabled={!setName.trim() || setBusy}
                      onClick={() => void updateSet()}
                      className="rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Archive set “${selectedSet.name}”? Its project data will not be deleted.`,
                        )
                      ) {
                        void onArchiveSet(selectedSet.id);
                      }
                    }}
                    className="text-[7.5px] font-semibold text-rose-600"
                  >
                    Archive set
                  </button>
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-semibold text-slate-900">
                      Cases
                    </h4>
                    <Badge tone="cyan">{setCaseIds.size} selected</Badge>
                  </div>
                  <div className="mt-3 max-h-[440px] space-y-1 overflow-y-auto">
                    {data.cases.map((item) => {
                      const checked = setCaseIds.has(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 ${
                            checked
                              ? "border-cyan-300 bg-cyan-50/55"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              void onToggleSetItem({
                                setId: selectedSet.id,
                                itemType: "case",
                                itemId: item.id,
                                enabled: event.target.checked,
                              })
                            }
                            className="mt-0.5 h-3.5 w-3.5"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[8.5px] font-semibold text-slate-700">
                              {item.name}
                            </span>
                            <span className="mt-0.5 block text-[7px] text-slate-400">
                              {item.case_key} · {item.classification}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-semibold text-slate-900">
                      Sources
                    </h4>
                    <Badge tone="violet">{setSourceIds.size} selected</Badge>
                  </div>
                  <div className="mt-3 max-h-[440px] space-y-1 overflow-y-auto">
                    {data.sources.map((item) => {
                      const checked = setSourceIds.has(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 ${
                            checked
                              ? "border-violet-300 bg-violet-50/55"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              void onToggleSetItem({
                                setId: selectedSet.id,
                                itemType: "source",
                                itemId: item.id,
                                enabled: event.target.checked,
                              })
                            }
                            className="mt-0.5 h-3.5 w-3.5"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[8.5px] font-semibold text-slate-700">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[7px] text-slate-400">
                              {caseMap.get(item.case_id)?.name || "Case"} · {item.source_type}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "relationships" && (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-[10px] font-semibold text-slate-900">
              Create relationship
            </h4>
            <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
              Explicitly connect cases, sources, codes, themes, memos and evidence.
            </p>

            <div className="mt-4 space-y-2.5">
              <select
                value={relationshipFrom}
                onChange={(event) => setRelationshipFrom(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8px]"
              >
                <option value="">From…</option>
                {relationshipEntities.map((item) => (
                  <option key={`from:${item.value}`} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={relationshipType}
                onChange={(event) =>
                  setRelationshipType(
                    event.target.value as QualitativeRelationship["relationship_type"],
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8px]"
              >
                <option value="relates_to">relates to</option>
                <option value="supports">supports</option>
                <option value="contradicts">contradicts</option>
                <option value="precedes">precedes</option>
                <option value="explains">explains</option>
                <option value="causes">causes</option>
                <option value="custom">custom relationship</option>
              </select>

              {relationshipType === "custom" && (
                <input
                  value={relationshipCustomLabel}
                  onChange={(event) =>
                    setRelationshipCustomLabel(event.target.value)
                  }
                  placeholder="Custom relationship label"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px] outline-none focus:border-cyan-300"
                />
              )}

              <select
                value={relationshipTo}
                onChange={(event) => setRelationshipTo(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8px]"
              >
                <option value="">To…</option>
                {relationshipEntities.map((item) => (
                  <option key={`to:${item.value}`} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <textarea
                value={relationshipNote}
                onChange={(event) => setRelationshipNote(event.target.value)}
                placeholder="Optional analytic note"
                rows={4}
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-[8px] leading-4 outline-none focus:border-cyan-300"
              />

              <button
                type="button"
                disabled={
                  !relationshipFrom ||
                  !relationshipTo ||
                  relationshipFrom === relationshipTo ||
                  (relationshipType === "custom" &&
                    !relationshipCustomLabel.trim()) ||
                  relationshipBusy
                }
                onClick={() => void createRelationship()}
                className="w-full rounded-xl bg-slate-950 px-3 py-2.5 text-[8px] font-semibold text-white disabled:opacity-40"
              >
                Create relationship
              </button>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-[10px] font-semibold text-slate-900">
                  Relationship map
                </h4>
                <p className="mt-1 text-[7.5px] text-slate-400">
                  {data.relationships.length} explicit relationship
                  {data.relationships.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {data.relationships.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-[8.5px] text-slate-400">
                Create a relationship to build an explicit analytic map.
              </div>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/45 p-2">
                  <svg viewBox="0 0 760 380" className="h-[380px] min-w-[680px] w-full">
                    {data.relationships.slice(0, 80).map((relationship) => {
                      const from = relationshipNodePositions.get(
                        `${relationship.from_type}:${relationship.from_id}`,
                      );
                      const to = relationshipNodePositions.get(
                        `${relationship.to_type}:${relationship.to_id}`,
                      );
                      if (!from || !to) return null;
                      return (
                        <line
                          key={relationship.id}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke="#94a3b8"
                          strokeWidth="1.4"
                          strokeOpacity="0.65"
                        />
                      );
                    })}
                    {relationshipNodes.map((node) => {
                      const position = relationshipNodePositions.get(node.key);
                      if (!position) return null;
                      const fill =
                        node.type === "theme"
                          ? "#8b5cf6"
                          : node.type === "code"
                            ? "#06b6d4"
                            : node.type === "case"
                              ? "#0f172a"
                              : "#64748b";
                      return (
                        <g key={node.key}>
                          <circle
                            cx={position.x}
                            cy={position.y}
                            r="23"
                            fill={fill}
                            fillOpacity="0.9"
                          />
                          <text
                            x={position.x}
                            y={position.y + 38}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#475569"
                          >
                            {node.label.replace(/^(Case|Source|Code|Theme|Memo|Evidence|Annotation) · /, "").slice(0, 24)}
                          </text>
                          <text
                            x={position.x}
                            y={position.y + 3}
                            textAnchor="middle"
                            fontSize="7"
                            fill="white"
                            fontWeight="600"
                          >
                            {node.type.slice(0, 6)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="mt-4 max-h-[300px] space-y-2 overflow-y-auto">
                  {data.relationships.map((relationship) => (
                    <div
                      key={relationship.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[8px] font-semibold text-slate-700">
                          {relationshipLabel(
                            relationship.from_type,
                            relationship.from_id,
                          )}
                        </p>
                        <p className="my-1 text-[7px] font-semibold text-violet-600">
                          {relationship.relationship_type === "custom"
                            ? relationship.custom_label || "custom"
                            : relationship.relationship_type.replaceAll("_", " ")}
                        </p>
                        <p className="text-[8px] font-semibold text-slate-700">
                          {relationshipLabel(
                            relationship.to_type,
                            relationship.to_id,
                          )}
                        </p>
                        {relationship.note && (
                          <p className="mt-2 text-[7.5px] leading-3.5 text-slate-400">
                            {relationship.note}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void onDeleteRelationship(relationship.id)
                        }
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                        title="Delete relationship"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {tab === "visualizations" && (
        <div className="space-y-4">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {[
                ["heatmap", "Case × theme heatmap"],
                ["density", "Coding density"],
                ["hierarchy", "Code hierarchy"],
                ["network", "Relationship network"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setVisualization(
                      id as "heatmap" | "density" | "hierarchy" | "network",
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-[8px] font-semibold ${
                    visualization === id
                      ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {visualization === "heatmap" && (
            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="sticky left-0 z-10 min-w-[180px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left text-[7px] uppercase tracking-[.08em] text-slate-400">
                        Case
                      </th>
                      {visualizationColumns.map((column) => (
                        <th
                          key={column.id}
                          className="min-w-[120px] border-b border-slate-200 px-3 py-3 text-center text-[7.5px] font-semibold text-slate-600"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.cases.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <th className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2.5 text-left text-[8.5px] font-semibold text-slate-700">
                          {item.name}
                        </th>
                        {visualizationColumns.map((column) => {
                          const count = data.codings.filter(
                            (coding) =>
                              coding.case_id === item.id &&
                              column.codeIds.has(coding.code_id),
                          ).length;
                          const intensity = count / heatmapMax;
                          return (
                            <td key={column.id} className="px-2 py-2 text-center">
                              <div
                                className="mx-auto flex h-10 min-w-[56px] items-center justify-center rounded-lg text-[8.5px] font-semibold"
                                style={{
                                  backgroundColor:
                                    count > 0
                                      ? `rgba(6, 182, 212, ${0.1 + intensity * 0.65})`
                                      : "rgba(248,250,252,1)",
                                  color: count > 0 && intensity > 0.55 ? "white" : "#475569",
                                }}
                              >
                                {count || "—"}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {visualization === "density" && (
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-[10px] font-semibold text-slate-900">
                Coding density by source
              </h4>
              <div className="mt-4 space-y-3">
                {densityRows.map(({ source, count }) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => onOpenEvidence(source.case_id, source.id)}
                    className="w-full text-left"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="truncate text-[8px] font-semibold text-slate-700">
                        {source.title}
                      </span>
                      <span className="text-[7px] text-slate-400">
                        {count} reference{count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-cyan-500"
                        style={{ width: `${Math.max(2, (count / densityMax) * 100)}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {visualization === "hierarchy" && (
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-[10px] font-semibold text-slate-900">
                Code hierarchy
              </h4>
              <div className="mt-4 max-w-3xl space-y-1.5">
                {flattenCodeTree(data.codes).map(({ code, depth }) => {
                  const count = data.codings.filter(
                    (coding) => coding.code_id === code.id,
                  ).length;
                  return (
                    <div
                      key={code.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                      style={{ marginLeft: `${Math.min(depth, 6) * 24}px` }}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: code.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-slate-700">
                        {code.name}
                      </span>
                      <Badge tone="slate">{count} refs</Badge>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {visualization === "network" && (
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              {data.relationships.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-[8.5px] text-slate-400">
                  Create explicit relationships to populate this network.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/45 p-2">
                  <svg viewBox="0 0 760 380" className="h-[380px] min-w-[680px] w-full">
                    {data.relationships.slice(0, 80).map((relationship) => {
                      const from = relationshipNodePositions.get(
                        `${relationship.from_type}:${relationship.from_id}`,
                      );
                      const to = relationshipNodePositions.get(
                        `${relationship.to_type}:${relationship.to_id}`,
                      );
                      if (!from || !to) return null;
                      return (
                        <line
                          key={relationship.id}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke="#94a3b8"
                          strokeWidth="1.4"
                        />
                      );
                    })}
                    {relationshipNodes.map((node) => {
                      const position = relationshipNodePositions.get(node.key);
                      if (!position) return null;
                      return (
                        <g key={node.key}>
                          <circle
                            cx={position.x}
                            cy={position.y}
                            r="23"
                            fill={node.type === "theme" ? "#8b5cf6" : node.type === "code" ? "#06b6d4" : "#334155"}
                          />
                          <text
                            x={position.x}
                            y={position.y + 38}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#475569"
                          >
                            {node.label.replace(/^(Case|Source|Code|Theme|Memo|Evidence|Annotation) · /, "").slice(0, 24)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {tab === "history" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h4 className="text-[10px] font-semibold text-slate-900">
                Project history
              </h4>
              <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
                Tracks qualitative structure, coding, theme, reconciliation,
                set and relationship changes without duplicating full transcript text.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Filter history"
                className="rounded-xl border border-slate-200 px-3 py-2 text-[8px] outline-none focus:border-cyan-300"
              />
              <select
                value={historyEntityType}
                onChange={(event) => setHistoryEntityType(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
              >
                <option value="all">All entities</option>
                {Array.from(new Set(data.auditLog.map((item) => item.entity_type)))
                  .sort()
                  .map((entityType) => (
                    <option key={entityType} value={entityType}>
                      {entityType}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="mt-4 max-h-[680px] space-y-2 overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-[8.5px] text-slate-400">
                No project history matches the current filter. New changes made after this update will appear here.
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={item.entity_type === "theme" ? "violet" : item.entity_type === "coding" ? "cyan" : "slate"}>
                          {item.entity_type}
                        </Badge>
                        <p className="text-[8.5px] font-semibold text-slate-700">
                          {item.summary}
                        </p>
                      </div>
                      <p className="mt-1 text-[7px] text-slate-400">
                        {item.action_type.replaceAll("_", " ")}
                      </p>
                    </div>
                    <time className="shrink-0 text-[7px] text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </time>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function QualitativeSynthesisPanel({
  studyId,
  data,
  onUpdateCode,
  onArchiveCode,
  onMergeCodes,
  onSplitCode,
  onCreateTheme,
  onUpdateTheme,
  onArchiveTheme,
  onSetThemeCode,
  onSaveFrameworkSummary,
  onOpenEvidence,
  exportApiBase = "/api/research/qualitative/export",
  canManageStructure = true,
  allowExport = true,
}: {
  studyId: string;
  data: StudyPayload;
  onUpdateCode: (input: {
    codeId: string;
    name: string;
    description: string;
    color: string;
    parentCodeId: string;
  }) => Promise<void>;
  onArchiveCode: (codeId: string) => Promise<void>;
  onMergeCodes: (sourceCodeId: string, targetCodeId: string) => Promise<void>;
  onSplitCode: (input: {
    sourceCodeId: string;
    name: string;
    description: string;
    color: string;
    codingIds: string[];
  }) => Promise<void>;
  onCreateTheme: (input: {
    name: string;
    description: string;
    color: string;
    parentThemeId: string;
  }) => Promise<void>;
  onUpdateTheme: (input: {
    themeId: string;
    name: string;
    description: string;
    color: string;
    parentThemeId: string;
  }) => Promise<void>;
  onArchiveTheme: (themeId: string) => Promise<void>;
  onSetThemeCode: (themeId: string, codeId: string, enabled: boolean) => Promise<void>;
  onSaveFrameworkSummary: (input: {
    caseId: string;
    themeId?: string;
    codeId?: string;
    summary: string;
    evidenceCodingIds: string[];
  }) => Promise<void>;
  onOpenEvidence: (caseId: string, sourceId: string) => void;
  exportApiBase?: string;
  canManageStructure?: boolean;
  allowExport?: boolean;
}) {
  const [tab, setTab] = useState<
    "codebook" | "themes" | "cases" | "framework" | "export"
  >("codebook");

  const [selectedCodeId, setSelectedCodeId] = useState(data.codes[0]?.id || "");
  const selectedCode =
    data.codes.find((code) => code.id === selectedCodeId) || null;
  const [codeName, setCodeName] = useState(selectedCode?.name || "");
  const [codeDescription, setCodeDescription] = useState(
    selectedCode?.description || "",
  );
  const [codeColor, setCodeColor] = useState(selectedCode?.color || "#06b6d4");
  const [codeParentId, setCodeParentId] = useState(
    selectedCode?.parent_code_id || "",
  );
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [savingCode, setSavingCode] = useState(false);

  const [splitName, setSplitName] = useState("");
  const [splitDescription, setSplitDescription] = useState("");
  const [splitColor, setSplitColor] = useState("#8b5cf6");
  const [splitCodingIds, setSplitCodingIds] = useState<string[]>([]);
  const [splitting, setSplitting] = useState(false);

  const [selectedThemeId, setSelectedThemeId] = useState(
    data.themes[0]?.id || "",
  );
  const selectedTheme =
    data.themes.find((theme) => theme.id === selectedThemeId) || null;
  const [themeName, setThemeName] = useState(selectedTheme?.name || "");
  const [themeDescription, setThemeDescription] = useState(
    selectedTheme?.description || "",
  );
  const [themeColor, setThemeColor] = useState(
    selectedTheme?.color || "#8b5cf6",
  );
  const [themeParentId, setThemeParentId] = useState(
    selectedTheme?.parent_theme_id || "",
  );
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeDescription, setNewThemeDescription] = useState("");
  const [newThemeColor, setNewThemeColor] = useState("#8b5cf6");
  const [newThemeParentId, setNewThemeParentId] = useState("");
  const [themeBusy, setThemeBusy] = useState(false);

  const [selectedCaseId, setSelectedCaseId] = useState(data.cases[0]?.id || "");
  const selectedCase =
    data.cases.find((item) => item.id === selectedCaseId) || null;

  useEffect(() => {
    const next = data.codes.find((code) => code.id === selectedCodeId);
    if (!next) {
      const first = data.codes[0];
      setSelectedCodeId(first?.id || "");
      return;
    }
    setCodeName(next.name);
    setCodeDescription(next.description || "");
    setCodeColor(next.color);
    setCodeParentId(next.parent_code_id || "");
    setMergeTargetId((current) =>
      current && current !== next.id ? current : "",
    );
    setSplitCodingIds([]);
  }, [selectedCodeId, data.codes]);

  useEffect(() => {
    const next = data.themes.find((theme) => theme.id === selectedThemeId);
    if (!next) {
      const first = data.themes[0];
      setSelectedThemeId(first?.id || "");
      return;
    }
    setThemeName(next.name);
    setThemeDescription(next.description || "");
    setThemeColor(next.color);
    setThemeParentId(next.parent_theme_id || "");
  }, [selectedThemeId, data.themes]);

  useEffect(() => {
    if (
      selectedCaseId &&
      !data.cases.some((item) => item.id === selectedCaseId)
    ) {
      setSelectedCaseId(data.cases[0]?.id || "");
    }
  }, [selectedCaseId, data.cases]);

  const codeById = useMemo(
    () => new Map(data.codes.map((code) => [code.id, code])),
    [data.codes],
  );
  const themeById = useMemo(
    () => new Map(data.themes.map((theme) => [theme.id, theme])),
    [data.themes],
  );
  const sourceById = useMemo(
    () => new Map(data.sources.map((source) => [source.id, source])),
    [data.sources],
  );

  const codeDepth = (code: QualitativeCode) => {
    let depth = 0;
    let cursor = code.parent_code_id
      ? codeById.get(code.parent_code_id) || null
      : null;
    const seen = new Set<string>();
    while (cursor && depth < 8 && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      depth += 1;
      cursor = cursor.parent_code_id
        ? codeById.get(cursor.parent_code_id) || null
        : null;
    }
    return depth;
  };

  const themeDepth = (theme: QualitativeTheme) => {
    let depth = 0;
    let cursor = theme.parent_theme_id
      ? themeById.get(theme.parent_theme_id) || null
      : null;
    const seen = new Set<string>();
    while (cursor && depth < 8 && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      depth += 1;
      cursor = cursor.parent_theme_id
        ? themeById.get(cursor.parent_theme_id) || null
        : null;
    }
    return depth;
  };

  const selectedCodeRefs = useMemo(
    () =>
      data.codings.filter((coding) => coding.code_id === selectedCodeId),
    [data.codings, selectedCodeId],
  );

  const mappedCodesForSelectedTheme = useMemo(
    () =>
      new Set(
        data.themeCodes
          .filter((mapping) => mapping.theme_id === selectedThemeId)
          .map((mapping) => mapping.code_id),
      ),
    [data.themeCodes, selectedThemeId],
  );

  function themeCodingIds(themeId: string, caseId?: string) {
    const codeIds = new Set(
      data.themeCodes
        .filter((mapping) => mapping.theme_id === themeId)
        .map((mapping) => mapping.code_id),
    );
    return data.codings
      .filter(
        (coding) =>
          codeIds.has(coding.code_id) &&
          (!caseId || coding.case_id === caseId),
      )
      .map((coding) => coding.id);
  }

  const selectedCaseSources = useMemo(
    () =>
      selectedCase
        ? data.sources.filter((source) => source.case_id === selectedCase.id)
        : [],
    [data.sources, selectedCase],
  );

  const selectedCaseCodings = useMemo(
    () =>
      selectedCase
        ? data.codings.filter((coding) => coding.case_id === selectedCase.id)
        : [],
    [data.codings, selectedCase],
  );

  const selectedCaseMemos = useMemo(
    () =>
      selectedCase
        ? data.memos.filter(
            (memo) =>
              memo.case_id === selectedCase.id ||
              (memo.source_id &&
                selectedCaseSources.some(
                  (source) => source.id === memo.source_id,
                )),
          )
        : [],
    [data.memos, selectedCase, selectedCaseSources],
  );

  const selectedCaseThemeStats = useMemo(
    () =>
      data.themes
        .map((theme) => {
          const ids = new Set(
            data.themeCodes
              .filter((mapping) => mapping.theme_id === theme.id)
              .map((mapping) => mapping.code_id),
          );
          const refs = selectedCaseCodings.filter((coding) =>
            ids.has(coding.code_id),
          );
          return { theme, refs };
        })
        .filter((item) => item.refs.length > 0)
        .sort((a, b) => b.refs.length - a.refs.length),
    [data.themes, data.themeCodes, selectedCaseCodings],
  );

  const frameworkColumns = useMemo(() => {
    if (data.themes.length > 0) {
      return data.themes.map((theme) => ({
        type: "theme" as const,
        id: theme.id,
        name: theme.name,
        color: theme.color,
      }));
    }
    const topLevel = data.codes.filter((code) => !code.parent_code_id);
    const codes = topLevel.length > 0 ? topLevel : data.codes;
    return codes.map((code) => ({
      type: "code" as const,
      id: code.id,
      name: code.name,
      color: code.color,
    }));
  }, [data.themes, data.codes]);

  async function saveCode() {
    if (!selectedCode || !codeName.trim() || savingCode) return;
    setSavingCode(true);
    try {
      await onUpdateCode({
        codeId: selectedCode.id,
        name: codeName.trim(),
        description: codeDescription,
        color: codeColor,
        parentCodeId: codeParentId,
      });
    } finally {
      setSavingCode(false);
    }
  }

  async function mergeCode() {
    if (!selectedCode || !mergeTargetId || savingCode) return;
    const target = codeById.get(mergeTargetId);
    if (
      !window.confirm(
        `Merge “${selectedCode.name}” into “${target?.name || "selected code"}”? Coded references will move to the target code and the source code will be archived.`,
      )
    ) {
      return;
    }
    setSavingCode(true);
    try {
      await onMergeCodes(selectedCode.id, mergeTargetId);
      setSelectedCodeId(mergeTargetId);
      setMergeTargetId("");
    } finally {
      setSavingCode(false);
    }
  }

  async function splitCode() {
    if (
      !selectedCode ||
      !splitName.trim() ||
      splitCodingIds.length === 0 ||
      splitting
    ) {
      return;
    }
    setSplitting(true);
    try {
      await onSplitCode({
        sourceCodeId: selectedCode.id,
        name: splitName.trim(),
        description: splitDescription,
        color: splitColor,
        codingIds: splitCodingIds,
      });
      setSplitName("");
      setSplitDescription("");
      setSplitCodingIds([]);
    } finally {
      setSplitting(false);
    }
  }

  async function createTheme() {
    if (!newThemeName.trim() || themeBusy) return;
    setThemeBusy(true);
    try {
      await onCreateTheme({
        name: newThemeName.trim(),
        description: newThemeDescription,
        color: newThemeColor,
        parentThemeId: newThemeParentId,
      });
      setNewThemeName("");
      setNewThemeDescription("");
      setNewThemeParentId("");
    } finally {
      setThemeBusy(false);
    }
  }

  async function saveTheme() {
    if (!selectedTheme || !themeName.trim() || themeBusy) return;
    setThemeBusy(true);
    try {
      await onUpdateTheme({
        themeId: selectedTheme.id,
        name: themeName.trim(),
        description: themeDescription,
        color: themeColor,
        parentThemeId: themeParentId,
      });
    } finally {
      setThemeBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-violet-700" />
              <h3 className="text-[12px] font-semibold text-slate-950">
                Synthesis & project structure
              </h3>
            </div>
            <p className="mt-1 text-[8.5px] leading-4 text-slate-500">
              Refine the codebook, build themes, inspect cases, write framework
              summaries and export the qualitative project.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              ["codebook", "Codebook", Tags],
              ["themes", "Themes", Layers3],
              ["cases", "Case explorer", FolderSearch],
              ["framework", "Framework matrix", Table2],
              ...(allowExport ? ([["export", "Export", Download]] as const) : []),
            ].map(([id, label, Icon]) => {
              const active = tab === id;
              const IconComponent = Icon as typeof Tags;
              return (
                <button
                  key={String(id)}
                  type="button"
                  onClick={() =>
                    setTab(
                      id as
                        | "codebook"
                        | "themes"
                        | "cases"
                        | "framework"
                        | "export",
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[8px] font-semibold ${
                    active
                      ? "border-violet-300 bg-violet-50 text-violet-800"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  <IconComponent className="h-3 w-3" />
                  {String(label)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {tab === "codebook" && (
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-semibold text-slate-900">
                  Codebook
                </h4>
                <p className="mt-1 text-[7.5px] text-slate-400">
                  {data.codes.length} active code{data.codes.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="mt-3 max-h-[660px] space-y-1.5 overflow-y-auto">
              {data.codes.map((code) => {
                const references = data.codings.filter(
                  (coding) => coding.code_id === code.id,
                ).length;
                const active = selectedCodeId === code.id;
                return (
                  <button
                    key={code.id}
                    type="button"
                    onClick={() => setSelectedCodeId(code.id)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left ${
                      active
                        ? "border-cyan-300 bg-cyan-50/70"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                    style={{
                      marginLeft: `${Math.min(codeDepth(code), 4) * 10}px`,
                      width: `calc(100% - ${Math.min(codeDepth(code), 4) * 10}px)`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: code.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-slate-800">
                        {code.name}
                      </span>
                      <span className="text-[7px] text-slate-400">
                        {references}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {data.codeMergeHistory.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                  Recent merges
                </p>
                <div className="mt-2 space-y-1.5">
                  {data.codeMergeHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/55 px-2.5 py-2"
                    >
                      <p className="text-[7.5px] font-semibold text-slate-600">
                        {item.source_name} → {item.target_name}
                      </p>
                      <p className="mt-0.5 text-[6.5px] text-slate-400">
                        {item.moved_coding_count} moved reference
                        {item.moved_coding_count === 1 ? "" : "s"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {!selectedCode ? (
            <section className="flex min-h-[520px] items-center justify-center rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-[9px] text-slate-400">
                Select a code to manage the codebook.
              </p>
            </section>
          ) : (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: selectedCode.color }}
                  />
                  <h4 className="text-[10px] font-semibold text-slate-900">
                    Edit code
                  </h4>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
                  <label className="block">
                    <span className="text-[7.5px] font-semibold text-slate-600">
                      Name
                    </span>
                    <input
                      value={codeName}
                      onChange={(event) => setCodeName(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px] outline-none focus:border-cyan-300"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[7.5px] font-semibold text-slate-600">
                      Parent code
                    </span>
                    <select
                      value={codeParentId}
                      onChange={(event) => setCodeParentId(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                    >
                      <option value="">Top-level code</option>
                      {data.codes
                        .filter((code) => code.id !== selectedCode.id)
                        .map((code) => (
                          <option key={code.id} value={code.id}>
                            {code.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <label className="mt-3 block">
                  <span className="text-[7.5px] font-semibold text-slate-600">
                    Description / operational definition
                  </span>
                  <textarea
                    value={codeDescription}
                    onChange={(event) => setCodeDescription(event.target.value)}
                    rows={4}
                    className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px] leading-4 outline-none focus:border-cyan-300"
                  />
                </label>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="color"
                    value={codeColor}
                    onChange={(event) => setCodeColor(event.target.value)}
                    className="h-9 w-11 rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <button
                    type="button"
                    disabled={!codeName.trim() || savingCode}
                    onClick={() => void saveCode()}
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-[8px] font-semibold text-white disabled:opacity-40"
                  >
                    {savingCode ? "Saving…" : "Save code"}
                  </button>
                  {canManageStructure && (
                    <button
                      type="button"
                      disabled={savingCode}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Archive “${selectedCode.name}”? Existing coded references are preserved.`,
                          )
                        ) {
                          void onArchiveCode(selectedCode.id);
                        }
                      }}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[8px] font-semibold text-rose-700 disabled:opacity-40"
                    >
                      Archive code
                    </button>
                  )}
                </div>
              </section>

              {canManageStructure && (
              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <GitMerge className="h-4 w-4 text-violet-700" />
                    <h4 className="text-[10px] font-semibold text-slate-900">
                      Merge code
                    </h4>
                  </div>
                  <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
                    Move all coded references into another code, retain a merge
                    audit record, and archive this source code.
                  </p>

                  <select
                    value={mergeTargetId}
                    onChange={(event) => setMergeTargetId(event.target.value)}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                  >
                    <option value="">Merge into…</option>
                    {data.codes
                      .filter((code) => code.id !== selectedCode.id)
                      .map((code) => (
                        <option key={code.id} value={code.id}>
                          {code.name}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    disabled={!mergeTargetId || savingCode}
                    onClick={() => void mergeCode()}
                    className="mt-2 w-full rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-[8px] font-semibold text-violet-800 disabled:opacity-40"
                  >
                    Merge code
                  </button>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-[10px] font-semibold text-slate-900">
                    Split selected references
                  </h4>
                  <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
                    Create a new code and move only the references you select.
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      value={splitName}
                      onChange={(event) => setSplitName(event.target.value)}
                      placeholder="New code name"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-[8.5px] outline-none focus:border-cyan-300"
                    />
                    <input
                      type="color"
                      value={splitColor}
                      onChange={(event) => setSplitColor(event.target.value)}
                      className="h-9 w-11 rounded-lg border border-slate-200 bg-white p-1"
                    />
                  </div>
                  <input
                    value={splitDescription}
                    onChange={(event) => setSplitDescription(event.target.value)}
                    placeholder="Optional description"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[8px] outline-none focus:border-cyan-300"
                  />

                  <div className="mt-3 max-h-[180px] space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
                    {selectedCodeRefs.length === 0 ? (
                      <p className="p-3 text-center text-[7.5px] text-slate-400">
                        This code has no coded references.
                      </p>
                    ) : (
                      selectedCodeRefs.map((coding) => (
                        <label
                          key={coding.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={splitCodingIds.includes(coding.id)}
                            onChange={(event) =>
                              setSplitCodingIds((previous) =>
                                event.target.checked
                                  ? [...previous, coding.id]
                                  : previous.filter((id) => id !== coding.id),
                              )
                            }
                            className="mt-0.5 h-3 w-3"
                          />
                          <span className="min-w-0">
                            <span className="block text-[7.5px] leading-3.5 text-slate-600">
                              “{coding.excerpt}”
                            </span>
                            <span className="mt-0.5 block truncate text-[6.5px] text-slate-400">
                              {sourceById.get(coding.source_id)?.title || "Source"}
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      !splitName.trim() ||
                      splitCodingIds.length === 0 ||
                      splitting
                    }
                    onClick={() => void splitCode()}
                    className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-[8px] font-semibold text-white disabled:opacity-40"
                  >
                    {splitting
                      ? "Splitting…"
                      : `Create code from ${splitCodingIds.length} selected reference${splitCodingIds.length === 1 ? "" : "s"}`}
                  </button>
                </div>
              </section>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "themes" && (
        <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-[10px] font-semibold text-slate-900">
              Theme structure
            </h4>
            <p className="mt-1 text-[7.5px] text-slate-400">
              Themes sit above codes and can also be nested.
            </p>

            <div className="mt-3 max-h-[340px] space-y-1.5 overflow-y-auto">
              {data.themes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-[8px] text-slate-400">
                  Create the first theme from your codebook.
                </p>
              ) : (
                data.themes.map((theme) => {
                  const mapped = data.themeCodes.filter(
                    (mapping) => mapping.theme_id === theme.id,
                  ).length;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left ${
                        selectedThemeId === theme.id
                          ? "border-violet-300 bg-violet-50/70"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                      style={{
                        marginLeft: `${Math.min(themeDepth(theme), 4) * 10}px`,
                        width: `calc(100% - ${Math.min(themeDepth(theme), 4) * 10}px)`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: theme.color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-slate-800">
                          {theme.name}
                        </span>
                        <span className="text-[7px] text-slate-400">
                          {mapped}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[8px] font-semibold text-slate-700">
                New theme
              </p>
              <input
                value={newThemeName}
                onChange={(event) => setNewThemeName(event.target.value)}
                placeholder="Theme name"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[8.5px] outline-none focus:border-violet-300"
              />
              <textarea
                value={newThemeDescription}
                onChange={(event) =>
                  setNewThemeDescription(event.target.value)
                }
                placeholder="Theme definition"
                rows={3}
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-[8px] leading-4 outline-none focus:border-violet-300"
              />
              <select
                value={newThemeParentId}
                onChange={(event) =>
                  setNewThemeParentId(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
              >
                <option value="">Top-level theme</option>
                {data.themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  type="color"
                  value={newThemeColor}
                  onChange={(event) => setNewThemeColor(event.target.value)}
                  className="h-9 w-11 rounded-lg border border-slate-200 bg-white p-1"
                />
                <button
                  type="button"
                  disabled={!newThemeName.trim() || themeBusy}
                  onClick={() => void createTheme()}
                  className="flex-1 rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-40"
                >
                  Create theme
                </button>
              </div>
            </div>
          </section>

          {!selectedTheme ? (
            <section className="flex min-h-[520px] items-center justify-center rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-[9px] text-slate-400">
                Create or select a theme.
              </p>
            </section>
          ) : (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: selectedTheme.color }}
                  />
                  <h4 className="text-[10px] font-semibold text-slate-900">
                    Theme definition
                  </h4>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    value={themeName}
                    onChange={(event) => setThemeName(event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px] outline-none focus:border-violet-300"
                  />
                  <select
                    value={themeParentId}
                    onChange={(event) => setThemeParentId(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                  >
                    <option value="">Top-level theme</option>
                    {data.themes
                      .filter((theme) => theme.id !== selectedTheme.id)
                      .map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name}
                        </option>
                      ))}
                  </select>
                </div>

                <textarea
                  value={themeDescription}
                  onChange={(event) =>
                    setThemeDescription(event.target.value)
                  }
                  rows={4}
                  placeholder="Describe what this theme means and its boundaries."
                  className="mt-3 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-[8.5px] leading-4 outline-none focus:border-violet-300"
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(event) => setThemeColor(event.target.value)}
                    className="h-9 w-11 rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <button
                    type="button"
                    disabled={!themeName.trim() || themeBusy}
                    onClick={() => void saveTheme()}
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-[8px] font-semibold text-white disabled:opacity-40"
                  >
                    Save theme
                  </button>
                  {canManageStructure && (
                    <button
                      type="button"
                      disabled={themeBusy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Archive theme “${selectedTheme.name}”? Code mappings remain available in export history but the theme leaves the active workspace.`,
                          )
                        ) {
                          void onArchiveTheme(selectedTheme.id);
                        }
                      }}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[8px] font-semibold text-rose-700"
                    >
                      Archive theme
                    </button>
                  )}
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-[10px] font-semibold text-slate-900">
                      Codes in this theme
                    </h4>
                    <p className="mt-1 text-[7.5px] text-slate-400">
                      A code can contribute to more than one theme.
                    </p>
                  </div>
                  <Badge tone="violet">
                    {mappedCodesForSelectedTheme.size} mapped
                  </Badge>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {data.codes.map((code) => {
                    const checked =
                      mappedCodesForSelectedTheme.has(code.id);
                    const refs = data.codings.filter(
                      (coding) => coding.code_id === code.id,
                    ).length;
                    return (
                      <label
                        key={code.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 ${
                          checked
                            ? "border-violet-300 bg-violet-50/60"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            void onSetThemeCode(
                              selectedTheme.id,
                              code.id,
                              event.target.checked,
                            )
                          }
                          className="mt-0.5 h-3.5 w-3.5"
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: code.color }}
                            />
                            <span className="truncate text-[8.5px] font-semibold text-slate-700">
                              {code.name}
                            </span>
                          </span>
                          <span className="mt-1 block text-[7px] text-slate-400">
                            {refs} reference{refs === 1 ? "" : "s"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {tab === "cases" && (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-[10px] font-semibold text-slate-900">
              Cases
            </h4>
            <div className="mt-3 max-h-[680px] space-y-1.5 overflow-y-auto">
              {data.cases.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`w-full rounded-xl border p-3 text-left ${
                    selectedCaseId === item.id
                      ? "border-cyan-300 bg-cyan-50/70"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="truncate text-[8.5px] font-semibold text-slate-800">
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate text-[7px] text-slate-400">
                    {item.participant_id
                      ? "Participant-linked"
                      : "Standalone"}{" "}
                    · {item.case_key}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {!selectedCase ? (
            <section className="flex min-h-[520px] items-center justify-center rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-[9px] text-slate-400">
                Select a case to explore its evidence.
              </p>
            </section>
          ) : (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-cyan-700" />
                      <h4 className="text-[11px] font-semibold text-slate-950">
                        {selectedCase.name}
                      </h4>
                    </div>
                    <p className="mt-1 text-[7.5px] text-slate-400">
                      {selectedCase.case_key} · {selectedCase.classification}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={selectedCase.participant_id ? "cyan" : "violet"}>
                      {selectedCase.participant_id
                        ? "Participant-linked"
                        : "Standalone"}
                    </Badge>
                    <Badge tone="slate">
                      {selectedCaseSources.length} source
                      {selectedCaseSources.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </div>

                {data.attributeDefinitions.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {data.attributeDefinitions.map((definition) => {
                      const value =
                        selectedCase.attributes?.[definition.field_key];
                      return (
                        <div
                          key={definition.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/55 p-3"
                        >
                          <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                            {definition.name}
                          </p>
                          <p className="mt-1 text-[8.5px] font-semibold text-slate-700">
                            {value === undefined ||
                            value === null ||
                            value === ""
                              ? "Not specified"
                              : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedCase.notes && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                      Case note
                    </p>
                    <p className="mt-1 text-[8px] leading-4 text-slate-600">
                      {selectedCase.notes}
                    </p>
                  </div>
                )}
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-[10px] font-semibold text-slate-900">
                    Sources
                  </h4>
                  <div className="mt-3 space-y-2">
                    {selectedCaseSources.map((source) => {
                      const refs = selectedCaseCodings.filter(
                        (coding) => coding.source_id === source.id,
                      ).length;
                      return (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() =>
                            onOpenEvidence(selectedCase.id, source.id)
                          }
                          className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-cyan-200 hover:bg-cyan-50/30"
                        >
                          <p className="truncate text-[8.5px] font-semibold text-slate-700">
                            {source.title}
                          </p>
                          <p className="mt-0.5 text-[7px] text-slate-400">
                            {source.source_type} · {refs} coded reference
                            {refs === 1 ? "" : "s"}
                          </p>
                        </button>
                      );
                    })}
                    {selectedCaseSources.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-[8px] text-slate-400">
                        No sources in this case.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-[10px] font-semibold text-slate-900">
                    Themes represented
                  </h4>
                  <div className="mt-3 space-y-2">
                    {selectedCaseThemeStats.map(({ theme, refs }) => (
                      <div
                        key={theme.id}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: theme.color }}
                          />
                          <p className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-slate-700">
                            {theme.name}
                          </p>
                          <span className="text-[7px] text-slate-400">
                            {refs.length}
                          </span>
                        </div>
                      </div>
                    ))}
                    {selectedCaseThemeStats.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-[8px] text-slate-400">
                        No theme-linked coding yet.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-[10px] font-semibold text-slate-900">
                  Research notes & memos
                </h4>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {selectedCaseMemos.map((memo) => (
                    <div
                      key={memo.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/55 p-3"
                    >
                      <p className="text-[8.5px] font-semibold text-slate-700">
                        {memo.title}
                      </p>
                      <p className="mt-1 line-clamp-4 text-[7.5px] leading-3.5 text-slate-500">
                        {memo.content}
                      </p>
                    </div>
                  ))}
                  {selectedCaseMemos.length === 0 && (
                    <p className="md:col-span-2 rounded-xl border border-dashed border-slate-200 p-5 text-center text-[8px] text-slate-400">
                      No memos linked to this case or its sources.
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {tab === "framework" && (
        <div className="space-y-4">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Table2 className="h-4 w-4 text-cyan-700" />
              <div>
                <h4 className="text-[10px] font-semibold text-slate-900">
                  Framework matrix
                </h4>
                <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
                  Rows are cases. Columns use active themes when available,
                  otherwise top-level codes. Summaries stay linked to the
                  underlying coding evidence.
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="sticky left-0 z-20 min-w-[190px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                      Case
                    </th>
                    {frameworkColumns.map((column) => (
                      <th
                        key={`${column.type}:${column.id}`}
                        className="min-w-[240px] border-b border-slate-200 px-3 py-3 text-left"
                      >
                        <span className="inline-flex items-center gap-2 text-[8px] font-semibold text-slate-700">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: column.color }}
                          />
                          {column.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.cases.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <th className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3 text-left align-top">
                        <p className="text-[8.5px] font-semibold text-slate-700">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[6.5px] text-slate-400">
                          {item.case_key}
                        </p>
                      </th>
                      {frameworkColumns.map((column) => {
                        const existing =
                          data.frameworkSummaries.find(
                            (summary) =>
                              summary.case_id === item.id &&
                              (column.type === "theme"
                                ? summary.theme_id === column.id
                                : summary.code_id === column.id),
                          ) || null;

                        const evidenceCodingIds =
                          column.type === "theme"
                            ? themeCodingIds(column.id, item.id)
                            : data.codings
                                .filter(
                                  (coding) =>
                                    coding.case_id === item.id &&
                                    coding.code_id === column.id,
                                )
                                .map((coding) => coding.id);

                        return (
                          <td
                            key={`${item.id}:${column.type}:${column.id}`}
                            className="border-r border-slate-100 align-top"
                          >
                            <FrameworkSummaryCell
                              initialValue={existing?.summary || ""}
                              evidenceCount={evidenceCodingIds.length}
                              onSave={(summary) =>
                                onSaveFrameworkSummary({
                                  caseId: item.id,
                                  themeId:
                                    column.type === "theme"
                                      ? column.id
                                      : undefined,
                                  codeId:
                                    column.type === "code"
                                      ? column.id
                                      : undefined,
                                  summary,
                                  evidenceCodingIds,
                                })
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {frameworkColumns.length === 0 && (
              <div className="p-10 text-center text-[8.5px] text-slate-400">
                Create at least one code or theme to build the framework matrix.
              </div>
            )}
          </section>
        </div>
      )}

      {allowExport && tab === "export" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <Download className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-[11px] font-semibold text-slate-950">
              Research workbook
            </h4>
            <p className="mt-1 text-[8.5px] leading-4 text-slate-500">
              Download an XLSX workbook containing the codebook, themes, cases,
              coded excerpts, framework matrix, reconciliation records and
              code-merge history.
            </p>
            <a
              href={`${exportApiBase}?study_id=${encodeURIComponent(
                studyId,
              )}&format=xlsx`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[8.5px] font-semibold text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Export XLSX
            </a>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <FileText className="h-4 w-4" />
            </div>
            <h4 className="mt-3 text-[11px] font-semibold text-slate-950">
              Project archive
            </h4>
            <p className="mt-1 text-[8.5px] leading-4 text-slate-500">
              Export the structured qualitative project as JSON for archival,
              reproducibility or future migration. This includes coding,
              themes, memos, annotations and framework summaries.
            </p>
            <a
              href={`${exportApiBase}?study_id=${encodeURIComponent(
                studyId,
              )}&format=json`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-[8.5px] font-semibold text-violet-800"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </a>
          </section>

          <section className="lg:col-span-2 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-[10px] font-semibold text-slate-900">
              Export contents
            </h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Cases", data.cases.length],
                ["Codes", data.codes.length],
                ["Themes", data.themes.length],
                ["Coded references", data.codings.length],
                ["Sources", data.sources.length],
                ["Framework summaries", data.frameworkSummaries.length],
                ["Memos", data.memos.length],
                ["Reconciliations", data.reconciliations.length],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-slate-200 bg-slate-50/55 p-3"
                >
                  <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-[16px] font-semibold text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function QualitativeReliabilityPanel({
  data,
  onCreateCoder,
  onAssignCoder,
  onDeleteAssignment,
  onResolve,
  onOpenEvidence,
}: {
  data: StudyPayload;
  onCreateCoder: (input: {
    label?: string;
    email?: string;
    linkedUserId?: string;
  }) => Promise<void>;
  onAssignCoder: (input: {
    sourceId: string;
    coderIdentityId: string;
    blindCoding: boolean;
    status: "assigned" | "completed";
  }) => Promise<void>;
  onDeleteAssignment: (assignmentId: string) => Promise<void>;
  onResolve: (input: {
    sourceId: string;
    caseId: string;
    codeId: string;
    coderAIdentityId: string;
    coderBIdentityId: string;
    unitKey: string;
    startOffset: number;
    endOffset: number;
    excerpt: string;
    coderAPresent: boolean;
    coderBPresent: boolean;
    finalPresent: boolean;
    rationale?: string;
  }) => Promise<void>;
  onOpenEvidence: (caseId: string, sourceId: string) => void;
}) {
  const [newCoderName, setNewCoderName] = useState("");
  const [newCoderEmail, setNewCoderEmail] = useState("");
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState("");
  const [creatingCoder, setCreatingCoder] = useState(false);

  const [assignmentSourceId, setAssignmentSourceId] = useState(data.sources[0]?.id || "");
  const [assignmentCoderId, setAssignmentCoderId] = useState(data.coderIdentities[0]?.id || "");
  const [assignmentBlind, setAssignmentBlind] = useState(true);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [coderAId, setCoderAId] = useState(data.coderIdentities[0]?.id || "");
  const [coderBId, setCoderBId] = useState(data.coderIdentities[1]?.id || "");
  const [comparisonSourceId, setComparisonSourceId] = useState("");
  const [reconciliationRationale, setReconciliationRationale] = useState<
    Record<string, string>
  >({});
  const [resolvingKey, setResolvingKey] = useState("");

  useEffect(() => {
    if (!coderAId && data.coderIdentities[0]) {
      setCoderAId(data.coderIdentities[0].id);
    }
    if (
      (!coderBId || coderBId === coderAId) &&
      data.coderIdentities.find((item) => item.id !== coderAId)
    ) {
      setCoderBId(
        data.coderIdentities.find((item) => item.id !== coderAId)?.id || "",
      );
    }
  }, [data.coderIdentities, coderAId, coderBId]);

  const coderMap = useMemo(
    () => new Map(data.coderIdentities.map((item) => [item.id, item])),
    [data.coderIdentities],
  );
  const sourceMap = useMemo(
    () => new Map(data.sources.map((item) => [item.id, item])),
    [data.sources],
  );
  const caseMap = useMemo(
    () => new Map(data.cases.map((item) => [item.id, item])),
    [data.cases],
  );

  const availableCollaborators = useMemo(
    () =>
      data.collaborators.filter(
        (collaborator) =>
          !data.coderIdentities.some(
            (identity) => identity.linked_user_id === collaborator.user_id,
          ),
      ),
    [data.collaborators, data.coderIdentities],
  );

  const comparisonSources = useMemo(
    () =>
      comparisonSourceId
        ? data.sources.filter((source) => source.id === comparisonSourceId)
        : data.sources,
    [data.sources, comparisonSourceId],
  );

  const comparisonUnits = useMemo(
    () => comparisonSources.flatMap((source) => sentenceReliabilityUnits(source)),
    [comparisonSources],
  );

  function coderDecision(
    coderIdentityId: string,
    codeId: string,
    unit: SentenceReliabilityUnit,
  ) {
    return data.codings.some(
      (coding) =>
        coding.coder_identity_id === coderIdentityId &&
        coding.code_id === codeId &&
        coding.source_id === unit.source_id &&
        rangesOverlap(
          coding.start_offset,
          coding.end_offset,
          unit.start_offset,
          unit.end_offset,
        ),
    );
  }

  const perCodeReliability = useMemo(() => {
    if (!coderAId || !coderBId || coderAId === coderBId) return [];

    return data.codes
      .map((code) => {
        const left = comparisonUnits.map((unit) =>
          coderDecision(coderAId, code.id, unit),
        );
        const right = comparisonUnits.map((unit) =>
          coderDecision(coderBId, code.id, unit),
        );
        const stats = calculateKappa(left, right);
        const positiveUnits = left.reduce(
          (sum, value, index) => sum + (value || right[index] ? 1 : 0),
          0,
        );
        return { code, ...stats, positiveUnits };
      })
      .filter((item) => item.positiveUnits > 0)
      .sort(
        (left, right) =>
          (right.kappa ?? -2) - (left.kappa ?? -2) ||
          left.code.name.localeCompare(right.code.name),
      );
  }, [coderAId, coderBId, data.codes, data.codings, comparisonUnits]);

  const overallReliability = useMemo(() => {
    if (!coderAId || !coderBId || coderAId === coderBId) {
      return { total: 0, agreement: 0, kappa: null as number | null };
    }

    const left: boolean[] = [];
    const right: boolean[] = [];
    for (const code of data.codes) {
      for (const unit of comparisonUnits) {
        left.push(coderDecision(coderAId, code.id, unit));
        right.push(coderDecision(coderBId, code.id, unit));
      }
    }
    return calculateKappa(left, right);
  }, [coderAId, coderBId, data.codes, data.codings, comparisonUnits]);

  const disagreements = useMemo(() => {
    if (!coderAId || !coderBId || coderAId === coderBId) return [];

    const rows: Array<{
      key: string;
      sourceId: string;
      caseId: string;
      unit: SentenceReliabilityUnit;
      code: QualitativeCode;
      coderAPresent: boolean;
      coderBPresent: boolean;
      reconciliation: QualitativeReconciliation | null;
    }> = [];

    for (const code of data.codes) {
      for (const unit of comparisonUnits) {
        const coderAPresent = coderDecision(coderAId, code.id, unit);
        const coderBPresent = coderDecision(coderBId, code.id, unit);
        if (coderAPresent === coderBPresent) continue;

        const reconciliation =
          data.reconciliations.find(
            (item) =>
              item.source_id === unit.source_id &&
              item.code_id === code.id &&
              item.unit_key === unit.unit_key &&
              ((item.coder_a_identity_id === coderAId &&
                item.coder_b_identity_id === coderBId) ||
                (item.coder_a_identity_id === coderBId &&
                  item.coder_b_identity_id === coderAId)),
          ) || null;

        rows.push({
          key: `${unit.unit_key}:${code.id}`,
          sourceId: unit.source_id,
          caseId: unit.case_id,
          unit,
          code,
          coderAPresent,
          coderBPresent,
          reconciliation,
        });
      }
    }

    return rows;
  }, [
    coderAId,
    coderBId,
    data.codes,
    data.codings,
    data.reconciliations,
    comparisonUnits,
  ]);

  async function createExternalCoder() {
    if (!newCoderName.trim() || creatingCoder) return;
    setCreatingCoder(true);
    try {
      await onCreateCoder({
        label: newCoderName.trim(),
        email: newCoderEmail.trim(),
      });
      setNewCoderName("");
      setNewCoderEmail("");
    } finally {
      setCreatingCoder(false);
    }
  }

  async function addCollaboratorCoder() {
    if (!selectedCollaboratorId || creatingCoder) return;
    setCreatingCoder(true);
    try {
      await onCreateCoder({ linkedUserId: selectedCollaboratorId });
      setSelectedCollaboratorId("");
    } finally {
      setCreatingCoder(false);
    }
  }

  async function saveAssignment() {
    if (!assignmentSourceId || !assignmentCoderId || savingAssignment) return;
    setSavingAssignment(true);
    try {
      await onAssignCoder({
        sourceId: assignmentSourceId,
        coderIdentityId: assignmentCoderId,
        blindCoding: assignmentBlind,
        status: "assigned",
      });
    } finally {
      setSavingAssignment(false);
    }
  }

  async function resolveRow(
    row: (typeof disagreements)[number],
    finalPresent: boolean,
  ) {
    if (!coderAId || !coderBId || resolvingKey) return;
    setResolvingKey(row.key);
    try {
      await onResolve({
        sourceId: row.sourceId,
        caseId: row.caseId,
        codeId: row.code.id,
        coderAIdentityId: coderAId,
        coderBIdentityId: coderBId,
        unitKey: row.unit.unit_key,
        startOffset: row.unit.start_offset,
        endOffset: row.unit.end_offset,
        excerpt: row.unit.excerpt,
        coderAPresent: row.coderAPresent,
        coderBPresent: row.coderBPresent,
        finalPresent,
        rationale: reconciliationRationale[row.key] || "",
      });
      setReconciliationRationale((previous) => ({
        ...previous,
        [row.key]: "",
      }));
    } finally {
      setResolvingKey("");
    }
  }

  const resolvedCount = disagreements.filter((item) => item.reconciliation).length;
  const unresolvedCount = disagreements.length - resolvedCount;
  const coderA = coderMap.get(coderAId);
  const coderB = coderMap.get(coderBId);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-700" />
            <div>
              <h3 className="text-[11px] font-semibold text-slate-950">
                Coders
              </h3>
              <p className="mt-0.5 text-[7.5px] text-slate-400">
                Use linked collaborators or create an external coding identity.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.coderIdentities.map((coder) => {
              const codingCount = data.codings.filter(
                (coding) => coding.coder_identity_id === coder.id,
              ).length;
              return (
                <div
                  key={coder.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/55 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-semibold text-slate-800">
                        {coder.label}
                      </p>
                      <p className="mt-0.5 truncate text-[7px] text-slate-400">
                        {coder.email || coder.identity_type}
                      </p>
                    </div>
                    <Badge tone={coder.identity_type === "owner" ? "cyan" : "violet"}>
                      {coder.identity_type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[7.5px] text-slate-500">
                    {codingCount} coded reference{codingCount === 1 ? "" : "s"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-2">
            <div>
              <p className="text-[8px] font-semibold text-slate-700">
                Add external coder
              </p>
              <div className="mt-2 space-y-2">
                <input
                  value={newCoderName}
                  onChange={(event) => setNewCoderName(event.target.value)}
                  placeholder="Coder name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[8.5px] outline-none focus:border-cyan-300"
                />
                <input
                  value={newCoderEmail}
                  onChange={(event) => setNewCoderEmail(event.target.value)}
                  placeholder="Email (optional)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[8.5px] outline-none focus:border-cyan-300"
                />
                <button
                  type="button"
                  disabled={!newCoderName.trim() || creatingCoder}
                  onClick={() => void createExternalCoder()}
                  className="w-full rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-40"
                >
                  Add coder
                </button>
              </div>
            </div>

            <div>
              <p className="text-[8px] font-semibold text-slate-700">
                Add study collaborator as coder
              </p>
              <div className="mt-2 space-y-2">
                <select
                  value={selectedCollaboratorId}
                  onChange={(event) => setSelectedCollaboratorId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8.5px]"
                >
                  <option value="">Choose collaborator…</option>
                  {availableCollaborators.map((collaborator) => (
                    <option key={collaborator.user_id} value={collaborator.user_id}>
                      {collaborator.display_name || collaborator.email}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedCollaboratorId || creatingCoder}
                  onClick={() => void addCollaboratorCoder()}
                  className="w-full rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[8px] font-semibold text-cyan-800 disabled:opacity-40"
                >
                  Add collaborator coder
                </button>
                {availableCollaborators.length === 0 && (
                  <p className="text-[7px] leading-3.5 text-slate-400">
                    All active collaborators are already coder identities, or this study has no active collaborators.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-[11px] font-semibold text-slate-950">
            Source assignments
          </h3>
          <p className="mt-1 text-[7.5px] leading-3.5 text-slate-400">
            Blind coding hides other coder highlights while the selected identity codes an assigned source.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <select
              value={assignmentSourceId}
              onChange={(event) => setAssignmentSourceId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
            >
              <option value="">Choose source…</option>
              {data.sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title}
                </option>
              ))}
            </select>

            <select
              value={assignmentCoderId}
              onChange={(event) => setAssignmentCoderId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
            >
              <option value="">Choose coder…</option>
              {data.coderIdentities.map((coder) => (
                <option key={coder.id} value={coder.id}>
                  {coder.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-[8px] text-slate-600">
              <input
                type="checkbox"
                checked={assignmentBlind}
                onChange={(event) => setAssignmentBlind(event.target.checked)}
                className="h-3.5 w-3.5"
              />
              Blind coding
            </label>
            <button
              type="button"
              disabled={
                !assignmentSourceId ||
                !assignmentCoderId ||
                savingAssignment
              }
              onClick={() => void saveAssignment()}
              className="rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-40"
            >
              {savingAssignment ? "Saving…" : "Assign source"}
            </button>
          </div>

          <div className="mt-4 max-h-[220px] space-y-1.5 overflow-y-auto">
            {data.coderAssignments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-[8px] text-slate-400">
                No coder assignments yet.
              </p>
            ) : (
              data.coderAssignments.map((assignment) => {
                const source = sourceMap.get(assignment.source_id);
                const coder = coderMap.get(assignment.coder_identity_id);
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[8.5px] font-semibold text-slate-700">
                        {coder?.label || "Coder"} → {source?.title || "Source"}
                      </p>
                      <p className="mt-0.5 text-[7px] text-slate-400">
                        {assignment.blind_coding ? "Blind coding" : "Shared coding"} · {assignment.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onDeleteAssignment(assignment.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                      title="Remove assignment"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-[11px] font-semibold text-slate-950">
              Coder comparison
            </h3>
            <p className="mt-1 max-w-3xl text-[7.5px] leading-3.5 text-slate-400">
              Cohen’s κ is calculated on sentence-level binary coding decisions for each code.
              This keeps the unit of analysis explicit instead of treating arbitrary highlight lengths as interchangeable.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={coderAId}
              onChange={(event) => setCoderAId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
            >
              <option value="">Coder A…</option>
              {data.coderIdentities.map((coder) => (
                <option key={coder.id} value={coder.id}>
                  {coder.label}
                </option>
              ))}
            </select>

            <select
              value={coderBId}
              onChange={(event) => setCoderBId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
            >
              <option value="">Coder B…</option>
              {data.coderIdentities
                .filter((coder) => coder.id !== coderAId)
                .map((coder) => (
                  <option key={coder.id} value={coder.id}>
                    {coder.label}
                  </option>
                ))}
            </select>

            <select
              value={comparisonSourceId}
              onChange={(event) => setComparisonSourceId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
            >
              <option value="">All sources</option>
              {data.sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {data.coderIdentities.length < 2 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <Users className="mx-auto h-5 w-5 text-slate-300" />
            <p className="mt-2 text-[9px] font-semibold text-slate-700">
              Add a second coder to compare coding decisions
            </p>
            <p className="mt-1 text-[7.5px] text-slate-400">
              The original coder’s work remains untouched when another coder is added.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  "Sentence units",
                  overallReliability.total
                    ? Math.round(overallReliability.total / Math.max(1, data.codes.length))
                    : 0,
                ],
                [
                  "Percent agreement",
                  overallReliability.total
                    ? `${(overallReliability.agreement * 100).toFixed(1)}%`
                    : "—",
                ],
                [
                  "Cohen’s κ",
                  overallReliability.kappa === null
                    ? "—"
                    : overallReliability.kappa.toFixed(3),
                ],
                [
                  "Unresolved differences",
                  unresolvedCount,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-slate-200 bg-slate-50/55 p-3"
                >
                  <p className="text-[7px] font-bold uppercase tracking-[.08em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-[17px] font-semibold text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                  <p className="text-[9px] font-semibold text-slate-800">
                    Reliability by code
                  </p>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-100 text-[7px] uppercase tracking-[.08em] text-slate-400">
                        <th className="px-3 py-2 text-left">Code</th>
                        <th className="px-3 py-2 text-right">Agreement</th>
                        <th className="px-3 py-2 text-right">κ</th>
                        <th className="px-3 py-2 text-right">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perCodeReliability.map((row) => (
                        <tr
                          key={row.code.id}
                          className="border-b border-slate-100 text-[8.5px]"
                        >
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: row.code.color }}
                              />
                              {row.code.name}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-500">
                            {(row.agreement * 100).toFixed(1)}%
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                            {row.kappa === null ? "—" : row.kappa.toFixed(3)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-400">
                            {row.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/45 p-4">
                <p className="text-[9px] font-semibold text-slate-800">
                  Comparison
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/65 p-3">
                    <p className="text-[7px] uppercase tracking-[.08em] text-cyan-600">
                      Coder A
                    </p>
                    <p className="mt-1 truncate text-[9px] font-semibold text-cyan-900">
                      {coderA?.label || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-violet-200 bg-violet-50/65 p-3">
                    <p className="text-[7px] uppercase tracking-[.08em] text-violet-600">
                      Coder B
                    </p>
                    <p className="mt-1 truncate text-[9px] font-semibold text-violet-900">
                      {coderB?.label || "—"}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-[7.5px] leading-4 text-slate-500">
                  Agreement statistics are descriptive of the selected sentence-unit coding scheme.
                  Interpretation still depends on the codebook, sampling and coding protocol.
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {data.coderIdentities.length >= 2 && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[11px] font-semibold text-slate-950">
                Reconciliation
              </h3>
              <p className="mt-1 text-[7.5px] text-slate-400">
                Resolve coder differences while preserving both original decisions.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge tone="violet">{unresolvedCount} unresolved</Badge>
              <Badge tone="cyan">{resolvedCount} resolved</Badge>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {disagreements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <Check className="mx-auto h-5 w-5 text-cyan-600" />
                <p className="mt-2 text-[9px] font-semibold text-slate-700">
                  No coding disagreements in this comparison
                </p>
              </div>
            ) : (
              disagreements.slice(0, 120).map((row) => {
                const source = sourceMap.get(row.sourceId);
                const caseItem = caseMap.get(row.caseId);
                const resolved = row.reconciliation;
                return (
                  <div
                    key={row.key}
                    className={`rounded-2xl border p-4 ${
                      resolved
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: row.code.color }}
                          />
                          <p className="text-[9px] font-semibold text-slate-800">
                            {row.code.name}
                          </p>
                          <Badge tone="slate">
                            {caseItem?.name || "Case"} · {source?.title || "Source"}
                          </Badge>
                          {resolved && (
                            <Badge tone="cyan">
                              Reconciled: {resolved.final_present ? "coded" : "not coded"}
                            </Badge>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenEvidence(row.caseId, row.sourceId)}
                          className="mt-2 text-left font-serif text-[11px] leading-5 text-slate-700 hover:text-cyan-800"
                        >
                          “{row.unit.excerpt}”
                        </button>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-xl border border-cyan-200 bg-cyan-50/55 p-3">
                            <p className="text-[7px] font-semibold text-cyan-700">
                              {coderA?.label || "Coder A"}
                            </p>
                            <p className="mt-1 text-[9px] font-semibold text-cyan-950">
                              {row.coderAPresent ? "Applied code" : "Did not apply code"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-violet-200 bg-violet-50/55 p-3">
                            <p className="text-[7px] font-semibold text-violet-700">
                              {coderB?.label || "Coder B"}
                            </p>
                            <p className="mt-1 text-[9px] font-semibold text-violet-950">
                              {row.coderBPresent ? "Applied code" : "Did not apply code"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {!resolved && (
                        <div className="w-full shrink-0 xl:w-[270px]">
                          <input
                            value={reconciliationRationale[row.key] || ""}
                            onChange={(event) =>
                              setReconciliationRationale((previous) => ({
                                ...previous,
                                [row.key]: event.target.value,
                              }))
                            }
                            placeholder="Resolution note (optional)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[8px] outline-none focus:border-cyan-300"
                          />

                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={Boolean(resolvingKey)}
                              onClick={() =>
                                void resolveRow(row, row.coderAPresent)
                              }
                              className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[7.5px] font-semibold text-cyan-800 disabled:opacity-40"
                            >
                              Use {coderA?.label || "Coder A"}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(resolvingKey)}
                              onClick={() =>
                                void resolveRow(row, row.coderBPresent)
                              }
                              className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[7.5px] font-semibold text-violet-800 disabled:opacity-40"
                            >
                              Use {coderB?.label || "Coder B"}
                            </button>
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={Boolean(resolvingKey)}
                              onClick={() => void resolveRow(row, true)}
                              className="rounded-xl bg-slate-950 px-3 py-2 text-[7.5px] font-semibold text-white disabled:opacity-40"
                            >
                              Final: coded
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(resolvingKey)}
                              onClick={() => void resolveRow(row, false)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[7.5px] font-semibold text-slate-600 disabled:opacity-40"
                            >
                              Final: not coded
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function CodingTextView({
  text,
  codings,
  annotations,
  codes,
  suggestions,
}: {
  text: string;
  codings: QualitativeCoding[];
  annotations: QualitativeAnnotation[];
  codes: QualitativeCode[];
  suggestions: QualitativeCodingSuggestion[];
}) {
  const codeMap = new Map(codes.map((code) => [code.id, code]));
  const points = new Set<number>([0, text.length]);

  for (const coding of codings) {
    points.add(Math.max(0, Math.min(text.length, coding.start_offset)));
    points.add(Math.max(0, Math.min(text.length, coding.end_offset)));
  }
  for (const annotation of annotations) {
    points.add(Math.max(0, Math.min(text.length, annotation.start_offset)));
    points.add(Math.max(0, Math.min(text.length, annotation.end_offset)));
  }
  for (const suggestion of suggestions) {
    points.add(Math.max(0, Math.min(text.length, suggestion.start_offset)));
    points.add(Math.max(0, Math.min(text.length, suggestion.end_offset)));
  }

  const boundaries = [...points].sort((a, b) => a - b);
  const evidenceRows = [
    ...codings.map((coding) => ({
      id: coding.id,
      start: coding.start_offset,
      excerpt: coding.excerpt,
      label: codeMap.get(coding.code_id)?.name || "Code",
      color: codeMap.get(coding.code_id)?.color || "#06b6d4",
      kind: coding.method === "ai_suggestion_accepted" ? "ai_accepted" : "coding",
    })),
    ...suggestions.map((suggestion) => ({
      id: suggestion.id,
      start: suggestion.start_offset,
      excerpt: suggestion.excerpt,
      label: suggestion.suggested_code_name,
      color: suggestion.suggested_color || "#8b5cf6",
      kind: "ai_suggestion",
    })),
  ].sort((a, b) => a.start - b.start);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/65 px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-[7.5px] font-semibold text-slate-600">
          <span className="h-3 w-5 rounded-sm bg-cyan-100 shadow-[inset_0_-2px_0_#06b6d4]" />
          Coded passage
        </span>
        <span className="inline-flex items-center gap-1.5 text-[7.5px] font-semibold text-slate-600">
          <span className="h-3 w-5 rounded-sm bg-violet-50 [border-bottom:2px_dashed_#8b5cf6]" />
          AI suggestion
        </span>
        <span className="ml-auto text-[7px] text-slate-400">
          Accepted AI suggestions become ordinary coded references but retain AI provenance.
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
        <div className="min-h-[560px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white px-6 py-6 font-serif text-[15px] leading-7 text-slate-800">
          {boundaries.slice(0, -1).map((start, index) => {
            const end = boundaries[index + 1];
            const segment = text.slice(start, end);

            const activeCodings = codings.filter(
              (coding) => coding.start_offset < end && coding.end_offset > start,
            );
            const activeSuggestions = suggestions.filter(
              (suggestion) =>
                suggestion.start_offset < end && suggestion.end_offset > start,
            );
            const activeAnnotations = annotations.filter(
              (annotation) =>
                annotation.start_offset < end && annotation.end_offset > start,
            );

            const activeCodes = activeCodings
              .map((coding) => codeMap.get(coding.code_id))
              .filter((code): code is QualitativeCode => Boolean(code));
            const primaryCode = activeCodes[0];
            const primarySuggestion = activeSuggestions[0];

            const title = [
              activeCodes.length
                ? `Codes: ${activeCodes.map((code) => code.name).join(", ")}`
                : "",
              activeSuggestions.length
                ? `AI suggestions: ${activeSuggestions
                    .map((suggestion) => suggestion.suggested_code_name)
                    .join(", ")}`
                : "",
              activeSuggestions
                .map((suggestion) => suggestion.rationale)
                .filter(Boolean)
                .length
                ? `Rationale: ${activeSuggestions
                    .map((suggestion) => suggestion.rationale)
                    .filter(Boolean)
                    .join(" · ")}`
                : "",
              activeAnnotations.length
                ? `Annotations: ${activeAnnotations
                    .map((item) => item.content)
                    .join(" · ")}`
                : "",
            ]
              .filter(Boolean)
              .join("\n");

            const coded = activeCodings.length > 0;
            const suggested = activeSuggestions.length > 0;

            return (
              <span
                key={`${start}-${end}`}
                title={title || undefined}
                className={coded || suggested || activeAnnotations.length ? "rounded-[3px]" : undefined}
                style={
                  coded
                    ? {
                        backgroundColor: primaryCode
                          ? `${primaryCode.color}24`
                          : "rgba(6,182,212,.12)",
                        boxShadow: primaryCode
                          ? `inset 0 -2px 0 ${primaryCode.color}`
                          : "inset 0 -2px 0 #06b6d4",
                      }
                    : suggested
                      ? {
                          backgroundColor: primarySuggestion
                            ? `${primarySuggestion.suggested_color || "#8b5cf6"}16`
                            : "rgba(139,92,246,.08)",
                          borderBottom: `2px dashed ${
                            primarySuggestion?.suggested_color || "#8b5cf6"
                          }`,
                        }
                      : activeAnnotations.length
                        ? {
                            backgroundColor: "rgba(139,92,246,.08)",
                            boxShadow: "inset 0 -2px 0 rgba(139,92,246,.55)",
                          }
                        : undefined
                }
              >
                {segment}
              </span>
            );
          })}
        </div>

        <div className="hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5 lg:block">
          <p className="text-[7px] font-bold uppercase tracking-[.1em] text-slate-400">
            Coding stripes
          </p>
          <div className="mt-2 max-h-[535px] space-y-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {evidenceRows.length === 0 ? (
              <p className="py-4 text-[7px] leading-3.5 text-slate-400">
                No coded or suggested passages in this source.
              </p>
            ) : (
              evidenceRows.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  title={item.excerpt}
                  className={`rounded-lg bg-white px-2 py-2 ${
                    item.kind === "ai_suggestion"
                      ? "border border-dashed border-violet-300"
                      : "border border-slate-200"
                  }`}
                  style={{
                    borderLeft:
                      item.kind === "ai_suggestion"
                        ? `4px dashed ${item.color}`
                        : `4px solid ${item.color}`,
                  }}
                >
                  <div className="flex items-center gap-1">
                    {item.kind !== "coding" && (
                      <Sparkles className="h-2.5 w-2.5 text-violet-600" />
                    )}
                    <p className="min-w-0 truncate text-[7px] font-semibold text-slate-700">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-[6.5px] text-slate-400">
                    {item.excerpt}
                  </p>
                  {item.kind === "ai_suggestion" && (
                    <p className="mt-1 text-[6px] font-semibold uppercase tracking-[.08em] text-violet-500">
                      AI suggestion
                    </p>
                  )}
                  {item.kind === "ai_accepted" && (
                    <p className="mt-1 text-[6px] font-semibold uppercase tracking-[.08em] text-violet-500">
                      AI accepted
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QualitativeResearchLab({
  initialStudyId = "",
  onStudyIdChange,
  apiBase = "/api/research/qualitative",
  importApiBase = "/api/research/qualitative/import",
  exportApiBase = "/api/research/qualitative/export",
  lockedStudyId = "",
  lockedStudyTitle = "",
  readOnly = false,
  allowImport = true,
  allowExport = true,
  sharedMode = false,
  canReview = true,
  canManageStructure = true,
}: {
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
}) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [studies, setStudies] = useState<Study[]>([]);
  const [studyId, setStudyId] = useState(lockedStudyId || initialStudyId);
  const [data, setData] = useState<StudyPayload | null>(null);
  const [loadingStudies, setLoadingStudies] = useState(true);
  const [loadingStudy, setLoadingStudy] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [documentMode, setDocumentMode] = useState<"edit" | "coding">("edit");
  const [workspaceMode, setWorkspaceMode] = useState<"workspace" | "analysis" | "explore" | "synthesis" | "reliability">("workspace");
  const [activeCoderIdentityId, setActiveCoderIdentityId] = useState("");
  const [rightPanel, setRightPanel] = useState<"codes" | "case" | "memos">("codes");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importTargetMode, setImportTargetMode] = useState<"existing" | "participant" | "standalone">("standalone");
  const [importCaseId, setImportCaseId] = useState("");
  const [importParticipantId, setImportParticipantId] = useState("");
  const [importStandaloneName, setImportStandaloneName] = useState("");
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [isImportDragging, setIsImportDragging] = useState(false);

  const [caseQuery, setCaseQuery] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [selectedCodeId, setSelectedCodeId] = useState("");

  const [showCaseForm, setShowCaseForm] = useState(false);
  const [caseMode, setCaseMode] = useState<"participant" | "standalone">(
    "participant",
  );
  const [caseParticipantId, setCaseParticipantId] = useState("");
  const [caseName, setCaseName] = useState("");

  const [showSourceForm, setShowSourceForm] = useState(false);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceType, setSourceType] = useState("transcript");
  const [sourceContent, setSourceContent] = useState("");

  const [editorTitle, setEditorTitle] = useState("");
  const [editorType, setEditorType] = useState("transcript");
  const [editorContent, setEditorContent] = useState("");
  const [editorDirty, setEditorDirty] = useState(false);
  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
    text: "",
  });

  const [newCodeName, setNewCodeName] = useState("");
  const [newCodeDescription, setNewCodeDescription] = useState("");
  const [newCodeColor, setNewCodeColor] = useState("#06b6d4");

  const [newCodeParentId, setNewCodeParentId] = useState("");

  const [newClassificationName, setNewClassificationName] = useState("");
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeType, setNewAttributeType] = useState<AttributeDefinition["data_type"]>("text");
  const [newAttributeOptions, setNewAttributeOptions] = useState("");
  const [caseClassificationId, setCaseClassificationId] = useState("");
  const [caseAttributeValues, setCaseAttributeValues] = useState<Record<string, unknown>>({});
  const [caseNotes, setCaseNotes] = useState("");

  const [memoTitle, setMemoTitle] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [memoType, setMemoType] = useState("analytic");
  const [editingMemoId, setEditingMemoId] = useState("");
  const [annotationDraft, setAnnotationDraft] = useState("");

  async function post(payload: Record<string, unknown>) {
    if (readOnly) {
      throw new Error("You have read-only access to this qualitative study.");
    }
    const response = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || "The qualitative workspace could not be updated.");
    }
    return result;
  }

  async function loadStudies() {
    setLoadingStudies(true);
    setError("");

    if (lockedStudyId) {
      setStudies([
        {
          id: lockedStudyId,
          title: lockedStudyTitle || "Shared qualitative study",
          status: "active",
          components: { qualitative: true },
        },
      ]);
      setStudyId(lockedStudyId);
      onStudyIdChange?.(lockedStudyId);
      setLoadingStudies(false);
      return;
    }

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

  async function loadStudy(target = studyId) {
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

      const next = result as StudyPayload & { ok: true };
      setData(next);

      const nextCaseId = next.cases.some((c) => c.id === selectedCaseId)
        ? selectedCaseId
        : next.cases[0]?.id || "";
      setSelectedCaseId(nextCaseId);

      const eligible = next.sources.filter((source) => source.case_id === nextCaseId);
      const nextSourceId = eligible.some((source) => source.id === selectedSourceId)
        ? selectedSourceId
        : eligible[0]?.id || "";
      setSelectedSourceId(nextSourceId);

      setSelectedCodeId(
        next.codes.some((code) => code.id === selectedCodeId)
          ? selectedCodeId
          : next.codes[0]?.id || "",
      );
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

  useEffect(() => {
    void loadStudies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (studyId) void loadStudy(studyId);
    else setData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  const selectedCase = useMemo(
    () => data?.cases.find((item) => item.id === selectedCaseId) || null,
    [data, selectedCaseId],
  );
  const selectedSource = useMemo(
    () => data?.sources.find((item) => item.id === selectedSourceId) || null,
    [data, selectedSourceId],
  );
  const selectedParticipant = useMemo(
    () =>
      selectedCase?.participant_id
        ? data?.participants.find((p) => p.id === selectedCase.participant_id) || null
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
          !linkedParticipantIds.has(participant.id) ||
          participant.id === selectedCase?.participant_id,
      ),
    [data, linkedParticipantIds, selectedCase],
  );
  const visibleCases = useMemo(() => {
    const needle = caseQuery.trim().toLowerCase();
    return (data?.cases || []).filter((item) =>
      !needle
        ? true
        : `${item.name} ${item.case_key} ${item.classification}`
            .toLowerCase()
            .includes(needle),
    );
  }, [data, caseQuery]);
  const caseSources = useMemo(
    () => (data?.sources || []).filter((source) => source.case_id === selectedCaseId),
    [data, selectedCaseId],
  );
  const sourceAllCodings = useMemo(
    () => (data?.codings || []).filter((coding) => coding.source_id === selectedSourceId),
    [data, selectedSourceId],
  );
  const activeCoderAssignment = useMemo(
    () =>
      (data?.coderAssignments || []).find(
        (assignment) =>
          assignment.source_id === selectedSourceId &&
          assignment.coder_identity_id === activeCoderIdentityId,
      ) || null,
    [data, selectedSourceId, activeCoderIdentityId],
  );
  const sourceCodings = useMemo(
    () =>
      activeCoderAssignment?.blind_coding
        ? sourceAllCodings.filter(
            (coding) => coding.coder_identity_id === activeCoderIdentityId,
          )
        : sourceAllCodings,
    [sourceAllCodings, activeCoderAssignment, activeCoderIdentityId],
  );

  const sourceAnnotations = useMemo(
    () => (data?.annotations || []).filter((item) => item.source_id === selectedSourceId),
    [data, selectedSourceId],
  );
  const sourceSuggestions = useMemo(
    () =>
      (data?.codingSuggestions || []).filter(
        (item) => item.source_id === selectedSourceId && item.status === "pending",
      ),
    [data, selectedSourceId],
  );
  const allCodeDefinitions = useMemo(
    () => [...(data?.codes || []), ...(data?.archivedCodes || [])],
    [data?.codes, data?.archivedCodes],
  );
  const visibleMemos = useMemo(
    () =>
      (data?.memos || []).filter(
        (memo) =>
          (!selectedCaseId || memo.case_id === selectedCaseId || memo.case_id === null) &&
          (!selectedSourceId || memo.source_id === selectedSourceId || memo.source_id === null),
      ),
    [data, selectedCaseId, selectedSourceId],
  );
  const codeRows = useMemo(() => flattenCodeTree(data?.codes || []), [data]);
  const selectedClassification = useMemo(
    () => data?.classifications.find((item) => item.id === caseClassificationId) || null,
    [data, caseClassificationId],
  );
  const activeAttributeDefinitions = useMemo(
    () =>
      (data?.attributeDefinitions || []).filter(
        (definition) => definition.classification_id === caseClassificationId,
      ),
    [data, caseClassificationId],
  );

  useEffect(() => {
    if (!selectedCase || !data) {
      setCaseClassificationId("");
      setCaseAttributeValues({});
      setCaseNotes("");
      return;
    }
    const classification =
      data.classifications.find((item) => item.name === selectedCase.classification) ||
      data.classifications[0] ||
      null;
    setCaseClassificationId(classification?.id || "");
    setCaseAttributeValues(selectedCase.attributes || {});
    setCaseNotes(selectedCase.notes || "");
  }, [selectedCase, data]);

  useEffect(() => {
    if (!selectedSource) {
      setEditorTitle("");
      setEditorType("transcript");
      setEditorContent("");
      setEditorDirty(false);
      setSelection({ start: 0, end: 0, text: "" });
      return;
    }
    setEditorTitle(selectedSource.title);
    setEditorType(selectedSource.source_type);
    setEditorContent(selectedSource.content_text || "");
    setEditorDirty(false);
    setSelection({ start: 0, end: 0, text: "" });
  }, [selectedSource]);

  useEffect(() => {
    if (!selectedSourceId) return;
    const hasVisualCoding =
      (data?.codings || []).some((item) => item.source_id === selectedSourceId) ||
      (data?.codingSuggestions || []).some(
        (item) => item.source_id === selectedSourceId && item.status === "pending",
      );
    setDocumentMode(hasVisualCoding ? "coding" : "edit");
  }, [selectedSourceId, data?.codings, data?.codingSuggestions]);

  useEffect(() => {
    if (!data?.coderIdentities?.length) {
      setActiveCoderIdentityId("");
      return;
    }

    if (
      sharedMode &&
      data.currentCoderIdentityId &&
      data.coderIdentities.some(
        (identity) => identity.id === data.currentCoderIdentityId,
      )
    ) {
      setActiveCoderIdentityId(data.currentCoderIdentityId);
      return;
    }

    const stillAvailable = data.coderIdentities.some(
      (identity) => identity.id === activeCoderIdentityId,
    );
    if (stillAvailable) return;

    const ownerIdentity =
      data.coderIdentities.find((identity) => identity.identity_type === "owner") ||
      data.coderIdentities[0];
    setActiveCoderIdentityId(ownerIdentity?.id || "");
  }, [
    data?.coderIdentities,
    data?.currentCoderIdentityId,
    activeCoderIdentityId,
    sharedMode,
  ]);

  function chooseCase(caseId: string) {
    if (editorDirty && !window.confirm("Discard unsaved source edits?")) return;
    setSelectedCaseId(caseId);
    setSelectedSourceId(
      (data?.sources || []).find((source) => source.case_id === caseId)?.id || "",
    );
  }

  async function createCase(event: FormEvent) {
    event.preventDefault();
    if (!studyId || busy) return;
    setBusy("case");
    setError("");
    setNotice("");
    try {
      const result = await post({
        operation: "create_case",
        studyId,
        participantId: caseMode === "participant" ? caseParticipantId : "",
        name: caseName,
      });
      setShowCaseForm(false);
      setCaseName("");
      setCaseParticipantId("");
      setSelectedCaseId(result.case.id);
      setNotice(result.existing ? "That participant already has a qualitative case." : "Qualitative case created.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The case could not be created.");
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
      const result = await post({
        operation: "sync_participant_cases",
        studyId,
        includeTest: false,
      });
      setNotice(
        result.created
          ? `${result.created} participant-linked case${result.created === 1 ? "" : "s"} created.`
          : "All live participants already have qualitative cases.",
      );
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Participant cases could not be created.");
    } finally {
      setBusy("");
    }
  }

  async function linkCase(participantId: string) {
    if (!studyId || !selectedCase || busy) return;
    setBusy("link");
    setError("");
    setNotice("");
    try {
      await post({
        operation: "link_case",
        studyId,
        caseId: selectedCase.id,
        participantId,
      });
      setNotice(participantId ? "Case linked to participant." : "Participant link removed.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The case link could not be updated.");
    } finally {
      setBusy("");
    }
  }

  async function createSource(event: FormEvent) {
    event.preventDefault();
    if (!studyId || !selectedCase || busy) return;
    setBusy("source");
    setError("");
    setNotice("");
    try {
      const result = await post({
        operation: "create_source",
        studyId,
        caseId: selectedCase.id,
        sourceType,
        title: sourceTitle,
        content: sourceContent,
      });
      setShowSourceForm(false);
      setSourceTitle("");
      setSourceType("transcript");
      setSourceContent("");
      setSelectedSourceId(result.source.id);
      setNotice("Qualitative source created.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The source could not be created.");
    } finally {
      setBusy("");
    }
  }

  function openImportDialog(preferredCaseId?: string) {
    const caseId = preferredCaseId || selectedCase?.id || "";
    setImportFiles([]);
    setImportStandaloneName("");
    setImportParticipantId("");

    if (caseId) {
      setImportTargetMode("existing");
      setImportCaseId(caseId);
    } else if (availableParticipants.some((participant) => !participant.is_test)) {
      setImportTargetMode("participant");
      setImportCaseId("");
    } else {
      setImportTargetMode("standalone");
      setImportCaseId("");
    }

    setShowImportDialog(true);
  }

  function collectImportFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const allowed = incoming.filter((file) => {
      const name = file.name.toLowerCase();
      return (
        name.endsWith(".pdf") ||
        name.endsWith(".docx") ||
        name.endsWith(".txt") ||
        name.endsWith(".md")
      );
    });

    if (allowed.length !== incoming.length) {
      setError("Only PDF, DOCX, TXT and Markdown files can be imported here.");
    }

    setImportFiles((previous) => {
      const next = [...previous];
      for (const file of allowed) {
        const duplicate = next.some(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified,
        );
        if (!duplicate) next.push(file);
      }
      return next.slice(0, 20);
    });
  }

  async function importSelectedFiles() {
    if (!studyId || importFiles.length === 0 || busy) return;

    if (importTargetMode === "existing" && !importCaseId) {
      setError("Choose an existing case for these files.");
      return;
    }
    if (importTargetMode === "participant" && !importParticipantId) {
      setError("Choose the participant these files belong to.");
      return;
    }
    if (importTargetMode === "standalone" && !importStandaloneName.trim()) {
      setError("Give the new standalone case a name.");
      return;
    }

    setBusy("import-source");
    setError("");
    setNotice("");

    let resolvedCaseId = importTargetMode === "existing" ? importCaseId : "";
    let lastSourceId = "";
    let truncatedAny = false;

    try {
      for (const file of importFiles) {
        const form = new FormData();
        form.set("studyId", studyId);
        form.set("file", file);

        if (resolvedCaseId) {
          form.set("caseId", resolvedCaseId);
        } else if (importTargetMode === "participant") {
          form.set("participantId", importParticipantId);
        } else {
          form.set("standaloneName", importStandaloneName.trim());
        }

        const response = await fetch(importApiBase, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.ok) {
          throw new Error(
            result?.error || `The file “${file.name}” could not be imported.`,
          );
        }

        resolvedCaseId = result.case?.id || resolvedCaseId;
        lastSourceId = result.source?.id || lastSourceId;
        truncatedAny = truncatedAny || result.truncated === true;
      }

      if (resolvedCaseId) setSelectedCaseId(resolvedCaseId);
      if (lastSourceId) setSelectedSourceId(lastSourceId);

      setNotice(
        truncatedAny
          ? `${importFiles.length} file${importFiles.length === 1 ? "" : "s"} imported. At least one very long document was truncated to the qualitative source limit.`
          : `${importFiles.length} file${importFiles.length === 1 ? "" : "s"} imported successfully.`,
      );

      setShowImportDialog(false);
      setImportFiles([]);
      setImportStandaloneName("");
      setImportParticipantId("");
      if (importInputRef.current) importInputRef.current.value = "";
      await loadStudy();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The files could not be imported.",
      );
    } finally {
      setBusy("");
    }
  }

  async function createClassification(event: FormEvent) {
    event.preventDefault();
    if (!studyId || !newClassificationName.trim() || busy) return;
    setBusy("classification");
    setError("");
    try {
      const result = await post({
        operation: "create_classification",
        studyId,
        name: newClassificationName,
      });
      setNewClassificationName("");
      setCaseClassificationId(result.classification.id);
      setNotice("Case classification created.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The classification could not be created.");
    } finally {
      setBusy("");
    }
  }

  async function createAttributeDefinition(event: FormEvent) {
    event.preventDefault();
    if (!studyId || !caseClassificationId || !newAttributeName.trim() || busy) return;
    setBusy("attribute");
    setError("");
    try {
      await post({
        operation: "create_attribute_definition",
        studyId,
        classificationId: caseClassificationId,
        name: newAttributeName,
        dataType: newAttributeType,
        options:
          newAttributeType === "select"
            ? newAttributeOptions.split(",").map((item) => item.trim()).filter(Boolean)
            : [],
      });
      setNewAttributeName("");
      setNewAttributeOptions("");
      setNotice("Case attribute added.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The case attribute could not be created.");
    } finally {
      setBusy("");
    }
  }

  async function saveCaseProfile() {
    if (!studyId || !selectedCase || !caseClassificationId || busy) return;
    setBusy("case-profile");
    setError("");
    try {
      await post({
        operation: "update_case_profile",
        studyId,
        caseId: selectedCase.id,
        classificationId: caseClassificationId,
        attributes: caseAttributeValues,
        notes: caseNotes,
      });
      setNotice("Case classification and attributes saved.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The case profile could not be saved.");
    } finally {
      setBusy("");
    }
  }

  async function createMemo(event: FormEvent) {
    event.preventDefault();
    if (!studyId || !memoTitle.trim() || busy) return;
    setBusy("memo");
    setError("");
    try {
      await post(
        editingMemoId
          ? {
              operation: "update_memo",
              studyId,
              memoId: editingMemoId,
              title: memoTitle,
              content: memoContent,
            }
          : {
              operation: "create_memo",
              studyId,
              caseId: selectedCaseId || "",
              sourceId: selectedSourceId || "",
              codeId: memoType === "code" ? selectedCodeId || "" : "",
              memoType,
              title: memoTitle,
              content: memoContent,
            },
      );
      setMemoTitle("");
      setMemoContent("");
      setEditingMemoId("");
      setNotice(editingMemoId ? "Memo updated." : "Memo saved.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The memo could not be saved.");
    } finally {
      setBusy("");
    }
  }

  async function deleteMemo(memoId: string) {
    if (!studyId || busy) return;
    setBusy(memoId);
    setError("");
    try {
      await post({ operation: "delete_memo", studyId, memoId });
      if (editingMemoId === memoId) {
        setEditingMemoId("");
        setMemoTitle("");
        setMemoContent("");
      }
      setNotice("Memo deleted.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The memo could not be deleted.");
    } finally {
      setBusy("");
    }
  }

  async function createAnnotation() {
    if (!studyId || !selectedSource || !selection.text.trim() || !annotationDraft.trim() || busy) return;
    if (editorDirty) {
      setError("Save the source before annotating newly edited text.");
      return;
    }
    setBusy("annotation");
    setError("");
    try {
      await post({
        operation: "create_annotation",
        studyId,
        sourceId: selectedSource.id,
        startOffset: selection.start,
        endOffset: selection.end,
        content: annotationDraft,
      });
      setAnnotationDraft("");
      setSelection({ start: 0, end: 0, text: "" });
      setNotice("Annotation added.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The annotation could not be added.");
    } finally {
      setBusy("");
    }
  }

  async function deleteAnnotation(annotationId: string) {
    if (!studyId || busy) return;
    setBusy(annotationId);
    setError("");
    try {
      await post({ operation: "delete_annotation", studyId, annotationId });
      setNotice("Annotation removed.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The annotation could not be removed.");
    } finally {
      setBusy("");
    }
  }

  async function saveSource() {
    if (!studyId || !selectedSource || busy || !editorDirty) return;
    setBusy("save-source");
    setError("");
    setNotice("");
    try {
      await post({
        operation: "update_source",
        studyId,
        sourceId: selectedSource.id,
        sourceType: editorType,
        title: editorTitle,
        content: editorContent,
      });
      setEditorDirty(false);
      setNotice("Source saved.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The source could not be saved.");
    } finally {
      setBusy("");
    }
  }

  async function createCode(event: FormEvent) {
    event.preventDefault();
    if (!studyId || busy || !newCodeName.trim()) return;
    setBusy("code");
    setError("");
    setNotice("");
    try {
      const result = await post({
        operation: "create_code",
        studyId,
        name: newCodeName,
        description: newCodeDescription,
        color: newCodeColor,
        parentCodeId: newCodeParentId,
      });
      setNewCodeName("");
      setNewCodeDescription("");
      setNewCodeParentId("");
      setSelectedCodeId(result.code.id);
      setNotice("Code created.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The code could not be created.");
    } finally {
      setBusy("");
    }
  }

  function captureSelection() {
    const element = editorRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    setSelection({ start, end, text: editorContent.slice(start, end) });
  }

  async function codeSelection() {
    if (!studyId || !selectedSource || !selectedCodeId || busy || !selection.text.trim()) return;
    if (editorDirty) {
      setError("Save the source before coding newly edited text.");
      return;
    }

    setBusy("coding");
    setError("");
    setNotice("");
    try {
      await post({
        operation: "create_coding",
        studyId,
        sourceId: selectedSource.id,
        codeId: selectedCodeId,
        coderIdentityId: activeCoderIdentityId,
        startOffset: selection.start,
        endOffset: selection.end,
      });
      setSelection({ start: 0, end: 0, text: "" });
      setDocumentMode("coding");
      setNotice("Selected text coded and highlighted.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The text could not be coded.");
    } finally {
      setBusy("");
    }
  }

  async function removeCoding(codingId: string) {
    if (!studyId || busy) return;
    setBusy(codingId);
    setError("");
    try {
      await post({ operation: "delete_coding", studyId, codingId });
      setNotice("Coding removed.");
      await loadStudy();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The coding could not be removed.");
    } finally {
      setBusy("");
    }
  }

  async function saveAnalysisQuery(
    name: string,
    queryType: QualitativeSavedQuery["query_type"],
    config: Record<string, unknown>,
  ) {
    if (!studyId) return;
    setError("");
    const result = await post({
      operation: "save_analysis_query",
      studyId,
      name,
      queryType,
      config,
    });
    setNotice(result.updated ? "Saved analysis updated." : "Analysis setup saved.");
    await loadStudy();
  }

  async function deleteAnalysisQuery(savedQueryId: string) {
    if (!studyId) return;
    setError("");
    await post({
      operation: "delete_analysis_query",
      studyId,
      savedQueryId,
    });
    setNotice("Saved analysis removed.");
    await loadStudy();
  }

  function openAnalysisEvidence(caseId: string, sourceId: string) {
    setSelectedCaseId(caseId);
    setSelectedSourceId(sourceId);
    setDocumentMode("coding");
    setWorkspaceMode("workspace");
  }

  async function createCoderIdentity(input: {
    label?: string;
    email?: string;
    linkedUserId?: string;
  }) {
    if (!studyId) return;
    setError("");
    const result = await post({
      operation: "create_coder_identity",
      studyId,
      ...input,
    });
    setNotice(result.existing ? "That collaborator is already a coder." : "Coder added.");
    await loadStudy();
  }

  async function updateCoderAssignment(input: {
    sourceId: string;
    coderIdentityId: string;
    blindCoding: boolean;
    status: "assigned" | "completed";
  }) {
    if (!studyId) return;
    setError("");
    await post({
      operation: "update_coder_assignment",
      studyId,
      ...input,
    });
    setNotice("Coder assignment saved.");
    await loadStudy();
  }

  async function deleteCoderAssignment(assignmentId: string) {
    if (!studyId) return;
    setError("");
    await post({
      operation: "delete_coder_assignment",
      studyId,
      assignmentId,
    });
    setNotice("Coder assignment removed.");
    await loadStudy();
  }

  async function resolveReconciliation(input: {
    sourceId: string;
    caseId: string;
    codeId: string;
    coderAIdentityId: string;
    coderBIdentityId: string;
    unitKey: string;
    startOffset: number;
    endOffset: number;
    excerpt: string;
    coderAPresent: boolean;
    coderBPresent: boolean;
    finalPresent: boolean;
    rationale?: string;
  }) {
    if (!studyId) return;
    setError("");
    await post({
      operation: "resolve_reconciliation",
      studyId,
      ...input,
    });
    setNotice("Coding disagreement reconciled.");
    await loadStudy();
  }

  async function updateCodeDefinition(input: {
    codeId: string;
    name: string;
    description: string;
    color: string;
    parentCodeId: string;
  }) {
    if (!studyId) return;
    setError("");
    await post({ operation: "update_code", studyId, ...input });
    setNotice("Codebook updated.");
    await loadStudy();
  }

  async function archiveCode(codeId: string) {
    if (!studyId) return;
    setError("");
    await post({ operation: "archive_code", studyId, codeId });
    setNotice("Code archived. Existing coding evidence was preserved.");
    await loadStudy();
  }

  async function mergeCodes(sourceCodeId: string, targetCodeId: string) {
    if (!studyId) return;
    setError("");
    const result = await post({
      operation: "merge_codes",
      studyId,
      sourceCodeId,
      targetCodeId,
    });
    setNotice(
      `Codes merged. ${result.movedCodingCount || 0} coded reference${
        result.movedCodingCount === 1 ? "" : "s"
      } moved.`,
    );
    await loadStudy();
  }

  async function splitCode(input: {
    sourceCodeId: string;
    name: string;
    description: string;
    color: string;
    codingIds: string[];
  }) {
    if (!studyId) return;
    setError("");
    const result = await post({
      operation: "split_code",
      studyId,
      ...input,
    });
    setNotice(
      `New code created from ${result.moved || 0} selected reference${
        result.moved === 1 ? "" : "s"
      }.`,
    );
    await loadStudy();
  }

  async function createTheme(input: {
    name: string;
    description: string;
    color: string;
    parentThemeId: string;
  }) {
    if (!studyId) return;
    setError("");
    await post({ operation: "create_theme", studyId, ...input });
    setNotice("Theme created.");
    await loadStudy();
  }

  async function updateTheme(input: {
    themeId: string;
    name: string;
    description: string;
    color: string;
    parentThemeId: string;
  }) {
    if (!studyId) return;
    setError("");
    await post({ operation: "update_theme", studyId, ...input });
    setNotice("Theme updated.");
    await loadStudy();
  }

  async function archiveTheme(themeId: string) {
    if (!studyId) return;
    setError("");
    await post({ operation: "archive_theme", studyId, themeId });
    setNotice("Theme archived.");
    await loadStudy();
  }

  async function setThemeCode(
    themeId: string,
    codeId: string,
    enabled: boolean,
  ) {
    if (!studyId) return;
    setError("");
    await post({
      operation: "set_theme_code",
      studyId,
      themeId,
      codeId,
      enabled,
    });
    await loadStudy();
  }

  async function saveFrameworkSummary(input: {
    caseId: string;
    themeId?: string;
    codeId?: string;
    summary: string;
    evidenceCodingIds: string[];
  }) {
    if (!studyId) return;
    setError("");
    await post({
      operation: "save_framework_summary",
      studyId,
      ...input,
    });
    setNotice(input.summary.trim() ? "Framework summary saved." : "Framework summary cleared.");
    await loadStudy();
  }

  async function createQualitativeSet(input: {
    name: string;
    description: string;
    color: string;
  }) {
    if (!studyId) return;
    setError("");
    await post({ operation: "create_set", studyId, ...input });
    setNotice("Set created.");
    await loadStudy();
  }

  async function updateQualitativeSet(input: {
    setId: string;
    name: string;
    description: string;
    color: string;
  }) {
    if (!studyId) return;
    setError("");
    await post({ operation: "update_set", studyId, ...input });
    setNotice("Set updated.");
    await loadStudy();
  }

  async function archiveQualitativeSet(setId: string) {
    if (!studyId) return;
    setError("");
    await post({ operation: "archive_set", studyId, setId });
    setNotice("Set archived.");
    await loadStudy();
  }

  async function toggleQualitativeSetItem(input: {
    setId: string;
    itemType: "case" | "source";
    itemId: string;
    enabled: boolean;
  }) {
    if (!studyId) return;
    setError("");
    await post({ operation: "toggle_set_item", studyId, ...input });
    await loadStudy();
  }

  async function createQualitativeRelationship(input: {
    fromType: QualitativeRelationship["from_type"];
    fromId: string;
    toType: QualitativeRelationship["to_type"];
    toId: string;
    relationshipType: QualitativeRelationship["relationship_type"];
    customLabel: string;
    note: string;
  }) {
    if (!studyId) return;
    setError("");
    await post({
      operation: "create_relationship",
      studyId,
      ...input,
    });
    setNotice("Relationship created.");
    await loadStudy();
  }

  async function deleteQualitativeRelationship(relationshipId: string) {
    if (!studyId) return;
    setError("");
    await post({
      operation: "delete_relationship",
      studyId,
      relationshipId,
    });
    setNotice("Relationship deleted.");
    await loadStudy();
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
            Enable Qualitative data in Study Builder. The same study will then
            become available here for cases, sources and coding.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[120] overflow-y-auto bg-slate-100 p-3 sm:p-4"
          : "space-y-4"
      }
    >
      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4 text-cyan-700" />
              <h2 className="text-[14px] font-semibold text-slate-950">
                Qualitative project
              </h2>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">
              Link qualitative cases to PsyLattice participants or keep them
              standalone. Participant linkage becomes the bridge for later
              mixed-methods analysis.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setWorkspaceMode("workspace")}
                className={`rounded-lg px-3 py-1.5 text-[8px] font-semibold ${
                  workspaceMode === "workspace"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                Workspace
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("analysis")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[8px] font-semibold ${
                  workspaceMode === "analysis"
                    ? "bg-white text-cyan-800 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                Analysis
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("explore")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[8px] font-semibold ${
                  workspaceMode === "explore"
                    ? "bg-white text-cyan-800 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                <Search className="h-3 w-3" />
                Explore
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("synthesis")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[8px] font-semibold ${
                  workspaceMode === "synthesis"
                    ? "bg-white text-violet-800 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                <Layers3 className="h-3 w-3" />
                Synthesis
              </button>
              {canReview && !data?.sharedAccess?.blindCodingActive && (
                <button
                  type="button"
                  onClick={() => setWorkspaceMode("reliability")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[8px] font-semibold ${
                    workspaceMode === "reliability"
                      ? "bg-white text-violet-800 shadow-sm"
                      : "text-slate-400"
                  }`}
                >
                  <Users className="h-3 w-3" />
                  Reliability
                </button>
              )}
            </div>

            {!lockedStudyId && (
              <label className="relative min-w-[270px]">
                <select
                  value={studyId}
                  onChange={(event) => {
                    const next = event.target.value;
                    setStudyId(next);
                    setSelectedCaseId("");
                    setSelectedSourceId("");
                    onStudyIdChange?.(next);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-[10px] font-semibold text-slate-700 outline-none focus:border-cyan-300"
                >
                  {studies.map((study) => (
                    <option key={study.id} value={study.id}>
                      {study.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </label>
            )}

            {!readOnly && allowImport && (
              <button
                type="button"
                onClick={() => openImportDialog()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-[8.5px] font-semibold text-cyan-800 hover:border-cyan-300"
              >
                <FolderUp className="h-3.5 w-3.5" />
                Import data
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen((value) => !value)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px] font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
              title={isFullscreen ? "Exit full screen" : "Full screen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </button>
          </div>
        </div>

        {data && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Cases", data.cases.length],
              ["Participant-linked", data.cases.filter((item) => item.participant_id).length],
              ["Sources", data.sources.length],
              ["Codes", data.codes.length],
              ["Coded references", data.codings.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50/55 px-3 py-2.5">
                <p className="text-[7.5px] font-bold uppercase tracking-[.08em] text-slate-400">{label}</p>
                <p className="mt-1 text-[17px] font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {(error || notice) && (
        <div>
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[9px] text-rose-700">{error}</div>}
          {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700">{notice}</div>}
        </div>
      )}

      {sharedMode && (
        <div className={`rounded-xl border px-3 py-2 text-[8.5px] ${
          readOnly
            ? "border-slate-200 bg-slate-50 text-slate-600"
            : "border-cyan-200 bg-cyan-50 text-cyan-800"
        }`}>
          {readOnly
            ? "Read-only qualitative access. You can inspect the study, coding, analyses and synthesis outputs, but changes are disabled."
            : "Shared qualitative access. Your coding is recorded under your collaborator identity, and blind-coding assignments are enforced by the server."}
        </div>
      )}

      {loadingStudy && !data ? (
        <div className="flex min-h-[400px] items-center justify-center gap-2 rounded-[26px] border border-slate-200 bg-white text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
          Loading qualitative study…
        </div>
      ) : data ? (
        workspaceMode === "analysis" ? (
          <QualitativeAnalysisPanel
            data={data}
            selectedCaseId={selectedCaseId}
            selectedSourceId={selectedSourceId}
            onOpenEvidence={openAnalysisEvidence}
            onSaveQuery={saveAnalysisQuery}
            onDeleteSavedQuery={deleteAnalysisQuery}
          />
        ) : workspaceMode === "explore" ? (
          <QualitativeExplorationPanel
            data={data}
            onOpenEvidence={openAnalysisEvidence}
            onCreateSet={createQualitativeSet}
            onUpdateSet={updateQualitativeSet}
            onArchiveSet={archiveQualitativeSet}
            onToggleSetItem={toggleQualitativeSetItem}
            onCreateRelationship={createQualitativeRelationship}
            onDeleteRelationship={deleteQualitativeRelationship}
          />
        ) : workspaceMode === "synthesis" ? (
          <QualitativeSynthesisPanel
            studyId={studyId}
            data={data}
            onUpdateCode={updateCodeDefinition}
            onArchiveCode={archiveCode}
            onMergeCodes={mergeCodes}
            onSplitCode={splitCode}
            onCreateTheme={createTheme}
            onUpdateTheme={updateTheme}
            onArchiveTheme={archiveTheme}
            onSetThemeCode={setThemeCode}
            onSaveFrameworkSummary={saveFrameworkSummary}
            onOpenEvidence={openAnalysisEvidence}
            exportApiBase={exportApiBase}
            canManageStructure={canManageStructure}
            allowExport={allowExport}
          />
        ) : workspaceMode === "reliability" ? (
          <QualitativeReliabilityPanel
            data={data}
            onCreateCoder={createCoderIdentity}
            onAssignCoder={updateCoderAssignment}
            onDeleteAssignment={deleteCoderAssignment}
            onResolve={resolveReconciliation}
            onOpenEvidence={openAnalysisEvidence}
          />
        ) : (
        <div className="grid min-h-[680px] gap-4 xl:grid-cols-[270px_minmax(0,1fr)_310px]">
          <aside className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-900">Cases</p>
                  <p className="mt-0.5 text-[7.5px] text-slate-400">Participant-linked or standalone</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCaseForm((value) => !value)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700"
                >
                  {showCaseForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                <input
                  value={caseQuery}
                  onChange={(event) => setCaseQuery(event.target.value)}
                  placeholder="Search cases"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-8 pr-2 text-[9px] outline-none focus:border-cyan-300"
                />
              </div>
            </div>

            {showCaseForm && (
              <form onSubmit={createCase} className="border-b border-cyan-100 bg-cyan-50/35 p-3.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {(["participant", "standalone"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCaseMode(mode)}
                      className={`rounded-lg border px-2 py-2 text-[7.5px] font-semibold ${
                        caseMode === mode ? "border-cyan-300 bg-white text-cyan-800" : "border-transparent text-slate-400"
                      }`}
                    >
                      {mode === "participant" ? "Link participant" : "Standalone"}
                    </button>
                  ))}
                </div>

                {caseMode === "participant" && (
                  <select
                    value={caseParticipantId}
                    onChange={(event) => setCaseParticipantId(event.target.value)}
                    required
                    className="mt-2.5 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[8.5px]"
                  >
                    <option value="">Choose participant</option>
                    {availableParticipants
                      .filter((participant) => !linkedParticipantIds.has(participant.id))
                      .map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {participant.public_id}{participant.is_test ? " · TEST" : ""}
                        </option>
                      ))}
                  </select>
                )}

                <input
                  value={caseName}
                  onChange={(event) => setCaseName(event.target.value)}
                  placeholder={caseMode === "participant" ? "Optional display name" : "Case name"}
                  required={caseMode === "standalone"}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[8.5px] outline-none focus:border-cyan-300"
                />
                <button
                  type="submit"
                  disabled={busy === "case"}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-50"
                >
                  {busy === "case" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  Create case
                </button>
              </form>
            )}

            <div className="border-b border-slate-100 p-3">
              <button
                type="button"
                disabled={busy === "sync"}
                onClick={() => void syncParticipants()}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[8px] font-semibold text-violet-700 disabled:opacity-50"
              >
                {busy === "sync" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />}
                Create cases from live participants
              </button>
            </div>

            <div className="max-h-[540px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visibleCases.length === 0 ? (
                <div className="p-5 text-center text-[8.5px] text-slate-400">No qualitative cases yet.</div>
              ) : (
                visibleCases.map((item) => {
                  const participant = item.participant_id
                    ? data.participants.find((p) => p.id === item.participant_id)
                    : null;
                  const sourceCount = data.sources.filter((source) => source.case_id === item.id).length;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => chooseCase(item.id)}
                      className={`w-full border-b border-slate-100 px-3.5 py-3 text-left ${
                        selectedCaseId === item.id ? "bg-cyan-50/70" : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          participant ? "bg-cyan-100 text-cyan-700" : "bg-violet-100 text-violet-700"
                        }`}>
                          {participant ? <UserRound className="h-3.5 w-3.5" /> : <BookOpenText className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[9px] font-semibold text-slate-900">{item.name}</span>
                          <span className="mt-0.5 block text-[7.5px] text-slate-400">
                            {participant ? participant.public_id : "Standalone case"} · {sourceCount} source{sourceCount === 1 ? "" : "s"}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            {!selectedCase ? (
              <div className="flex min-h-[620px] items-center justify-center p-8 text-center">
                <div className="w-full max-w-lg">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <FolderUp className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-[12px] font-semibold text-slate-800">
                    Import qualitative data
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-[9px] leading-4 text-slate-400">
                    Upload PDF, DOCX, TXT or Markdown files and decide whether they belong
                    to an existing case, a study participant, or a new standalone case.
                  </p>

                  {!readOnly && allowImport && (
                    <button
                      type="button"
                      onClick={() => openImportDialog()}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-[9px] font-semibold text-white shadow-sm"
                    >
                      <FolderUp className="h-3.5 w-3.5" />
                      Choose files to import
                    </button>
                  )}

                  <div className="my-5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-100" />
                    <span className="text-[7px] font-semibold uppercase tracking-[.12em] text-slate-300">
                      or
                    </span>
                    <span className="h-px flex-1 bg-slate-100" />
                  </div>

                  <p className="text-[8.5px] leading-4 text-slate-400">
                    Create or select a case from the left panel to type a transcript manually.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 p-3.5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-semibold text-slate-950">{selectedCase.name}</p>
                        <Badge tone={selectedCase.participant_id ? "cyan" : "violet"}>
                          {selectedCase.participant_id ? "Participant-linked" : "Standalone"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[7.5px] text-slate-400">{selectedCase.case_key}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!readOnly && allowImport && (
                        <button
                          type="button"
                          disabled={busy === "import-source"}
                          onClick={() => openImportDialog(selectedCase.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[8px] font-semibold text-cyan-800 disabled:opacity-50"
                        >
                          {busy === "import-source" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <FolderUp className="h-3 w-3" />
                          )}
                          Import files
                        </button>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setShowSourceForm((value) => !value)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white"
                        >
                          <Plus className="h-3 w-3" />
                          Add source
                        </button>
                      )}
                    </div>
                  </div>

                  {caseSources.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {caseSources.map((source) => (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() => {
                            if (editorDirty && !window.confirm("Discard unsaved source edits?")) return;
                            setSelectedSourceId(source.id);
                          }}
                          className={`shrink-0 rounded-xl border px-3 py-2 text-[8px] font-semibold ${
                            selectedSourceId === source.id
                              ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          {source.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {showSourceForm && (
                  <form onSubmit={createSource} className="border-b border-cyan-100 bg-cyan-50/35 p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_170px]">
                      <input
                        value={sourceTitle}
                        onChange={(event) => setSourceTitle(event.target.value)}
                        placeholder="Source title"
                        required
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] outline-none focus:border-cyan-300"
                      />
                      <select
                        value={sourceType}
                        onChange={(event) => setSourceType(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px]"
                      >
                        {SOURCE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </div>
                    <textarea
                      value={sourceContent}
                      onChange={(event) => setSourceContent(event.target.value)}
                      placeholder="Paste transcript, interview, field note or other qualitative text…"
                      rows={7}
                      className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-[10px] leading-5 outline-none focus:border-cyan-300"
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => setShowSourceForm(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px] font-semibold text-slate-500">Cancel</button>
                      <button type="submit" disabled={busy === "source"} className="rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-50">Create source</button>
                    </div>
                  </form>
                )}

                {!selectedSource ? (
                  <div className="flex min-h-[500px] items-center justify-center text-center">
                    <div>
                      <FileText className="mx-auto h-6 w-6 text-slate-300" />
                      <p className="mt-3 text-[10px] font-semibold text-slate-700">Add a qualitative source</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-slate-100 p-3.5">
                      <div className="grid gap-2 md:grid-cols-[1fr_150px_auto]">
                        <input
                          value={editorTitle}
                          onChange={(event) => {
                            setEditorTitle(event.target.value);
                            setEditorDirty(true);
                          }}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-semibold outline-none focus:border-cyan-300"
                        />
                        <select
                          value={editorType}
                          onChange={(event) => {
                            setEditorType(event.target.value);
                            setEditorDirty(true);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8.5px]"
                        >
                          {SOURCE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <button
                          type="button"
                          disabled={!editorDirty || busy === "save-source"}
                          onClick={() => void saveSource()}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-35"
                        >
                          {busy === "save-source" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          Save
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDocumentMode("edit")}
                          className={`rounded-lg border px-3 py-1.5 text-[7.5px] font-semibold ${
                            documentMode === "edit"
                              ? "border-slate-300 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          Edit / select text
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocumentMode("coding")}
                          className={`rounded-lg border px-3 py-1.5 text-[7.5px] font-semibold ${
                            documentMode === "coding"
                              ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          Highlighted coding
                        </button>
                        {(sourceCodings.length > 0 || sourceSuggestions.length > 0) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-100 bg-cyan-50/70 px-2 py-1 text-[7px] font-semibold text-cyan-700">
                            {sourceCodings.length} coded
                            {sourceSuggestions.length > 0
                              ? ` · ${sourceSuggestions.length} AI suggestion${sourceSuggestions.length === 1 ? "" : "s"}`
                              : ""}
                          </span>
                        )}
                        {selectedSource.original_filename && (
                          <span className="text-[7px] text-slate-400">
                            Imported from {selectedSource.original_filename}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[8px] font-semibold text-slate-700">Manual coding</p>
                          <p className="mt-0.5 truncate text-[7.5px] text-slate-400">
                            {selection.text.trim()
                              ? `Selected: “${selection.text.trim().slice(0, 90)}${selection.text.trim().length > 90 ? "…" : ""}”`
                              : "Select text, choose a code, then code the selection."}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {sharedMode ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-700">
                              <span className="text-[7px] font-semibold text-slate-400">
                                Coding as
                              </span>
                              {data?.coderIdentities.find(
                                (coder) => coder.id === activeCoderIdentityId,
                              )?.label || "Collaborator"}
                            </span>
                          ) : (
                            <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                              <span className="text-[7px] font-semibold text-slate-400">
                                Coding as
                              </span>
                              <select
                                value={activeCoderIdentityId}
                                onChange={(event) =>
                                  setActiveCoderIdentityId(event.target.value)
                                }
                                className="max-w-[150px] bg-transparent text-[8px] font-semibold text-slate-700 outline-none"
                              >
                                {(data?.coderIdentities || []).map((coder) => (
                                  <option key={coder.id} value={coder.id}>
                                    {coder.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}

                          {activeCoderAssignment?.blind_coding && (
                            <Badge tone="violet">Blind coding</Badge>
                          )}

                          <button
                            type="button"
                            disabled={readOnly || !selection.text.trim() || !selectedCodeId || !activeCoderIdentityId || editorDirty || busy === "coding"}
                            onClick={() => void codeSelection()}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[8px] font-semibold text-cyan-800 disabled:opacity-35"
                          >
                            <Tags className="h-3 w-3" />
                            Code selection
                          </button>
                        </div>
                      </div>

                      {selection.text.trim() && documentMode === "edit" && (
                        <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50/40 p-3">
                          <div className="flex items-center gap-2">
                            <NotebookPen className="h-3.5 w-3.5 text-violet-700" />
                            <p className="text-[8px] font-semibold text-violet-900">Annotate selected passage</p>
                          </div>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <input
                              value={annotationDraft}
                              onChange={(event) => setAnnotationDraft(event.target.value)}
                              placeholder="Add a note about this passage…"
                              className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2 text-[8.5px] outline-none focus:border-violet-300"
                            />
                            <button
                              type="button"
                              disabled={!annotationDraft.trim() || editorDirty || busy === "annotation"}
                              onClick={() => void createAnnotation()}
                              className="rounded-xl bg-violet-700 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-40"
                            >
                              Add annotation
                            </button>
                          </div>
                        </div>
                      )}

                      {documentMode === "edit" ? (
                      <textarea
                        ref={editorRef}
                        value={editorContent}
                        onChange={(event) => {
                          setEditorContent(event.target.value);
                          setEditorDirty(true);
                          setSelection({ start: 0, end: 0, text: "" });
                        }}
                        onSelect={captureSelection}
                        onMouseUp={captureSelection}
                        onKeyUp={captureSelection}
                        rows={22}
                        spellCheck
                        className="w-full resize-y rounded-2xl border border-slate-200 px-5 py-5 font-serif text-[15px] leading-7 text-slate-800 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
                      />
                      ) : (
                        <CodingTextView
                          text={editorContent}
                          codings={sourceCodings}
                          annotations={sourceAnnotations}
                          codes={allCodeDefinitions}
                          suggestions={sourceSuggestions}
                        />
                      )}
                    </div>

                    {sourceCodings.length > 0 && (
                      <div className="border-t border-slate-100 p-4">
                        <p className="mb-3 text-[9px] font-semibold text-slate-800">Coded references</p>
                        <div className="space-y-2">
                          {sourceCodings.map((coding) => {
                            const code = allCodeDefinitions.find((item) => item.id === coding.code_id);
                            return (
                              <div key={coding.id} className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: code?.color || "#06b6d4" }} />
                                      <span className="text-[8px] font-semibold text-slate-700">{code?.name || "Code"}</span>
                                    </div>
                                    <p className="mt-1.5 text-[9px] leading-4 text-slate-600">“{coding.excerpt}”</p>
                                  </div>
                                  {coding.coder_identity_id === activeCoderIdentityId && (
                                    <button
                                      type="button"
                                      disabled={busy === coding.id}
                                      onClick={() => void removeCoding(coding.id)}
                                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {sourceAnnotations.length > 0 && (
                      <div className="border-t border-slate-100 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <NotebookPen className="h-3.5 w-3.5 text-violet-700" />
                          <p className="text-[9px] font-semibold text-slate-800">Annotations</p>
                        </div>
                        <div className="space-y-2">
                          {sourceAnnotations.map((annotation) => (
                            <div key={annotation.id} className="rounded-xl border border-violet-200 bg-violet-50/35 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[8px] font-semibold text-violet-800">{annotation.content}</p>
                                  <p className="mt-1.5 text-[8.5px] leading-4 text-slate-600">“{annotation.excerpt}”</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={busy === annotation.id}
                                  onClick={() => void deleteAnnotation(annotation.id)}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-white text-slate-400 hover:text-rose-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>

          <aside className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/50 p-2">
              {([
                ["codes", "Codes"],
                ["case", "Case"],
                ["memos", "Memos"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRightPanel(key)}
                  className={`rounded-lg px-2 py-2 text-[8px] font-semibold ${
                    rightPanel === key
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {rightPanel === "case" && (
              <div className="max-h-[720px] space-y-4 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <section>
                  <div className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 text-cyan-700" />
                    <p className="text-[10px] font-semibold text-slate-900">Participant linkage</p>
                  </div>

                  {!selectedCase ? (
                    <p className="mt-3 text-[8.5px] text-slate-400">Select a case to manage its participant link.</p>
                  ) : selectedParticipant ? (
                    <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/55 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-semibold text-cyan-900">{selectedParticipant.public_id}</p>
                          <p className="mt-0.5 text-[7px] text-cyan-700/70">
                            {selectedParticipant.status}{selectedParticipant.is_test ? " · TEST" : ""}
                          </p>
                        </div>
                        <Check className="h-3.5 w-3.5 text-cyan-700" />
                      </div>
                      <button
                        type="button"
                        disabled={busy === "link"}
                        onClick={() => void linkCase("")}
                        className="mt-2 inline-flex items-center gap-1.5 text-[7.5px] font-semibold text-slate-500 hover:text-rose-600"
                      >
                        <Unlink className="h-3 w-3" />
                        Unlink participant
                      </button>
                    </div>
                  ) : (
                    <select
                      value=""
                      disabled={busy === "link"}
                      onChange={(event) => event.target.value && void linkCase(event.target.value)}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                    >
                      <option value="">Link existing participant…</option>
                      {availableParticipants
                        .filter((participant) => !linkedParticipantIds.has(participant.id))
                        .map((participant) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.public_id}{participant.is_test ? " · TEST" : ""}
                          </option>
                        ))}
                    </select>
                  )}
                </section>

                <div className="border-t border-slate-100" />

                <section>
                  <p className="text-[10px] font-semibold text-slate-900">Classification & attributes</p>
                  {!selectedCase ? (
                    <p className="mt-3 text-[8.5px] text-slate-400">Select a case to edit classifications and attributes.</p>
                  ) : (
                    <>
                      <select
                        value={caseClassificationId}
                        onChange={(event) => {
                          setCaseClassificationId(event.target.value);
                          setCaseAttributeValues({});
                        }}
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[8.5px]"
                      >
                        {data.classifications.map((classification) => (
                          <option key={classification.id} value={classification.id}>
                            {classification.name}
                          </option>
                        ))}
                      </select>

                      {selectedClassification?.description && (
                        <p className="mt-1.5 text-[7px] leading-3.5 text-slate-400">{selectedClassification.description}</p>
                      )}

                      <div className="mt-3 space-y-2">
                        {activeAttributeDefinitions.map((definition) => {
                          const value = caseAttributeValues[definition.field_key];
                          return (
                            <label key={definition.id} className="block">
                              <span className="text-[7.5px] font-semibold text-slate-600">
                                {definition.name}{definition.required ? " *" : ""}
                              </span>
                              {definition.data_type === "select" ? (
                                <select
                                  value={String(value ?? "")}
                                  onChange={(event) =>
                                    setCaseAttributeValues((previous) => ({
                                      ...previous,
                                      [definition.field_key]: event.target.value,
                                    }))
                                  }
                                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
                                >
                                  <option value="">Choose…</option>
                                  {(definition.options || []).map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              ) : definition.data_type === "boolean" ? (
                                <select
                                  value={value === true ? "true" : value === false ? "false" : ""}
                                  onChange={(event) =>
                                    setCaseAttributeValues((previous) => ({
                                      ...previous,
                                      [definition.field_key]:
                                        event.target.value === "" ? "" : event.target.value === "true",
                                    }))
                                  }
                                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
                                >
                                  <option value="">Choose…</option>
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              ) : (
                                <input
                                  type={
                                    definition.data_type === "number"
                                      ? "number"
                                      : definition.data_type === "date"
                                        ? "date"
                                        : "text"
                                  }
                                  value={String(value ?? "")}
                                  onChange={(event) =>
                                    setCaseAttributeValues((previous) => ({
                                      ...previous,
                                      [definition.field_key]: event.target.value,
                                    }))
                                  }
                                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[8px] outline-none focus:border-cyan-300"
                                />
                              )}
                            </label>
                          );
                        })}
                      </div>

                      <label className="mt-3 block">
                        <span className="text-[7.5px] font-semibold text-slate-600">Case notes</span>
                        <textarea
                          value={caseNotes}
                          onChange={(event) => setCaseNotes(event.target.value)}
                          rows={3}
                          className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-[8px] leading-4 outline-none focus:border-cyan-300"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={!caseClassificationId || busy === "case-profile"}
                        onClick={() => void saveCaseProfile()}
                        className="mt-3 w-full rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-40"
                      >
                        Save case profile
                      </button>
                    </>
                  )}
                </section>

                <div className="border-t border-slate-100" />

                <section>
                  <p className="text-[9px] font-semibold text-slate-800">Create classification</p>
                  <form onSubmit={createClassification} className="mt-2 flex gap-2">
                    <input
                      value={newClassificationName}
                      onChange={(event) => setNewClassificationName(event.target.value)}
                      placeholder="e.g. Participant"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[8px] outline-none focus:border-cyan-300"
                    />
                    <button
                      type="submit"
                      disabled={!newClassificationName.trim() || busy === "classification"}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px] font-semibold text-slate-600 disabled:opacity-40"
                    >
                      Add
                    </button>
                  </form>
                </section>

                {caseClassificationId && (
                  <section>
                    <p className="text-[9px] font-semibold text-slate-800">Add typed attribute</p>
                    <form onSubmit={createAttributeDefinition} className="mt-2 space-y-2">
                      <input
                        value={newAttributeName}
                        onChange={(event) => setNewAttributeName(event.target.value)}
                        placeholder="Attribute name"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[8px] outline-none focus:border-cyan-300"
                      />
                      <select
                        value={newAttributeType}
                        onChange={(event) => setNewAttributeType(event.target.value as AttributeDefinition["data_type"])}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Yes / No</option>
                        <option value="date">Date</option>
                        <option value="select">Category</option>
                      </select>
                      {newAttributeType === "select" && (
                        <input
                          value={newAttributeOptions}
                          onChange={(event) => setNewAttributeOptions(event.target.value)}
                          placeholder="Options, comma separated"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[8px] outline-none focus:border-cyan-300"
                        />
                      )}
                      <button
                        type="submit"
                        disabled={!newAttributeName.trim() || busy === "attribute"}
                        className="w-full rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[8px] font-semibold text-cyan-800 disabled:opacity-40"
                      >
                        Add attribute
                      </button>
                    </form>
                  </section>
                )}
              </div>
            )}

            {rightPanel === "codes" && (
              <div className="max-h-[720px] overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-2">
                  <Tags className="h-3.5 w-3.5 text-cyan-700" />
                  <p className="text-[10px] font-semibold text-slate-900">Hierarchical codebook</p>
                </div>

                <form onSubmit={createCode} className="mt-3 space-y-2">
                  <input
                    value={newCodeName}
                    onChange={(event) => setNewCodeName(event.target.value)}
                    placeholder="New code"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[8.5px] outline-none focus:border-cyan-300"
                  />
                  <textarea
                    value={newCodeDescription}
                    onChange={(event) => setNewCodeDescription(event.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-[8px] leading-4 outline-none focus:border-cyan-300"
                  />
                  <select
                    value={newCodeParentId}
                    onChange={(event) => setNewCodeParentId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px]"
                  >
                    <option value="">Top-level code</option>
                    {codeRows.map(({ code, depth }) => (
                      <option key={code.id} value={code.id}>
                        {`${"— ".repeat(Math.min(depth, 5))}${code.name}`}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newCodeColor}
                      onChange={(event) => setNewCodeColor(event.target.value)}
                      className="h-8 w-10 rounded-lg border border-slate-200 bg-white p-1"
                    />
                    <button
                      type="submit"
                      disabled={busy === "code" || !newCodeName.trim()}
                      className="flex-1 rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-40"
                    >
                      Add code
                    </button>
                  </div>
                </form>

                <div className="mt-4 space-y-1.5">
                  {codeRows.length === 0 ? (
                    <p className="py-4 text-center text-[8px] text-slate-400">Create your first code.</p>
                  ) : (
                    codeRows.map(({ code, depth }) => {
                      const count = data.codings.filter((coding) => coding.code_id === code.id).length;
                      return (
                        <button
                          key={code.id}
                          type="button"
                          onClick={() => setSelectedCodeId(code.id)}
                          className={`w-full rounded-xl border py-2.5 pr-2.5 text-left ${
                            selectedCodeId === code.id
                              ? "border-cyan-300 bg-cyan-50/70"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                          style={{ paddingLeft: `${10 + Math.min(depth, 6) * 16}px` }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: code.color }} />
                            <span className="min-w-0 flex-1 truncate text-[8.5px] font-semibold text-slate-800">{code.name}</span>
                            <span className="text-[7px] text-slate-400">{count}</span>
                          </div>
                          {code.description && (
                            <p className="mt-1 line-clamp-2 text-[7px] leading-3.5 text-slate-400">{code.description}</p>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {rightPanel === "memos" && (
              <div className="max-h-[720px] overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-2">
                  <NotebookPen className="h-3.5 w-3.5 text-violet-700" />
                  <p className="text-[10px] font-semibold text-slate-900">Memos</p>
                </div>
                <p className="mt-1 text-[7px] leading-3.5 text-slate-400">
                  New memos are linked to the current case{selectedSource ? " and source" : ""}.
                </p>

                <form onSubmit={createMemo} className="mt-3 space-y-2">
                  <input
                    value={memoTitle}
                    onChange={(event) => setMemoTitle(event.target.value)}
                    placeholder="Memo title"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[8.5px] outline-none focus:border-violet-300"
                  />
                  <select
                    value={memoType}
                    disabled={Boolean(editingMemoId)}
                    onChange={(event) => setMemoType(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px] disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="analytic">Analytic memo</option>
                    <option value="methodological">Methodological memo</option>
                    <option value="reflexive">Reflexive memo</option>
                    <option value="case">Case memo</option>
                    <option value="source">Source memo</option>
                    <option value="code">Code memo</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    value={memoContent}
                    onChange={(event) => setMemoContent(event.target.value)}
                    placeholder="Write memo…"
                    rows={5}
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-[8.5px] leading-4 outline-none focus:border-violet-300"
                  />
                  <button
                    type="submit"
                    disabled={!memoTitle.trim() || busy === "memo"}
                    className="w-full rounded-xl bg-violet-700 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-40"
                  >
                    {editingMemoId ? "Update memo" : "Save memo"}
                  </button>
                  {editingMemoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMemoId("");
                        setMemoTitle("");
                        setMemoContent("");
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px] font-semibold text-slate-500"
                    >
                      Cancel editing
                    </button>
                  )}
                </form>

                <div className="mt-4 space-y-2">
                  {visibleMemos.length === 0 ? (
                    <p className="py-5 text-center text-[8px] text-slate-400">No memos in this context yet.</p>
                  ) : (
                    visibleMemos.map((memo) => (
                      <div key={memo.id} className="rounded-xl border border-violet-200 bg-violet-50/35 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[8.5px] font-semibold text-violet-900">{memo.title}</p>
                            <p className="mt-0.5 text-[6.5px] uppercase tracking-[.08em] text-violet-500">{memo.memo_type}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMemoId(memo.id);
                                setMemoTitle(memo.title);
                                setMemoContent(memo.content);
                                setMemoType(memo.memo_type);
                              }}
                              className="rounded-lg border border-violet-200 bg-white px-2 py-1 text-[6.5px] font-semibold text-violet-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={busy === memo.id}
                              onClick={() => void deleteMemo(memo.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg border border-violet-200 bg-white text-slate-400 hover:text-rose-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {memo.content && <p className="mt-2 whitespace-pre-wrap text-[8px] leading-4 text-slate-600">{memo.content}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
        )
      ) : null}

      {!readOnly && allowImport && showImportDialog && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[26px] border border-white/20 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <FolderUp className="h-4 w-4 text-cyan-700" />
                  <h3 className="text-[13px] font-semibold text-slate-950">
                    Import qualitative data
                  </h3>
                </div>
                <p className="mt-1 text-[8.5px] leading-4 text-slate-500">
                  Choose where the material belongs, then add one or more PDF,
                  DOCX, TXT or Markdown files.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (busy === "import-source") return;
                  setShowImportDialog(false);
                  setImportFiles([]);
                  if (importInputRef.current) importInputRef.current.value = "";
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700"
                aria-label="Close import"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
                  Link imported material to
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    ["existing", "Existing case", "Add files to a case already in this project."],
                    ["participant", "Study participant", "Create or reuse a participant-linked case."],
                    ["standalone", "Standalone case", "Create a qualitative case with no participant link."],
                  ].map(([mode, label, description]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setImportTargetMode(mode as "existing" | "participant" | "standalone")}
                      className={`rounded-2xl border p-3 text-left transition ${
                        importTargetMode === mode
                          ? "border-cyan-300 bg-cyan-50/70"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-[9px] font-semibold text-slate-800">
                        {label}
                      </span>
                      <span className="mt-1 block text-[7.5px] leading-3.5 text-slate-400">
                        {description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {importTargetMode === "existing" && (
                <label className="block">
                  <span className="text-[8px] font-semibold text-slate-600">Existing case</span>
                  <select
                    value={importCaseId}
                    onChange={(event) => setImportCaseId(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] outline-none focus:border-cyan-300"
                  >
                    <option value="">Choose case…</option>
                    {data?.cases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.case_key}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {importTargetMode === "participant" && (
                <label className="block">
                  <span className="text-[8px] font-semibold text-slate-600">Study participant</span>
                  <select
                    value={importParticipantId}
                    onChange={(event) => setImportParticipantId(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] outline-none focus:border-cyan-300"
                  >
                    <option value="">Choose participant…</option>
                    {data?.participants
                      .filter((participant) => !participant.is_test)
                      .map((participant) => (
                        <option key={participant.id} value={participant.id}>
                          {participant.public_id} · {participant.status}
                        </option>
                      ))}
                  </select>
                  <span className="mt-1 block text-[7.5px] leading-3.5 text-slate-400">
                    If the participant already has a qualitative case, PsyLattice will reuse it.
                  </span>
                </label>
              )}

              {importTargetMode === "standalone" && (
                <label className="block">
                  <span className="text-[8px] font-semibold text-slate-600">New case name</span>
                  <input
                    value={importStandaloneName}
                    onChange={(event) => setImportStandaloneName(event.target.value)}
                    placeholder="e.g. Interview set A, Clinician 03, Policy document"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] outline-none focus:border-cyan-300"
                  />
                </label>
              )}

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsImportDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsImportDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget === event.target) setIsImportDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsImportDragging(false);
                  collectImportFiles(event.dataTransfer.files);
                }}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  isImportDragging
                    ? "border-cyan-400 bg-cyan-50"
                    : "border-slate-200 bg-slate-50/55"
                }`}
              >
                <input
                  ref={importInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) collectImportFiles(event.target.files);
                  }}
                />
                <FolderUp className="mx-auto h-6 w-6 text-cyan-700" />
                <p className="mt-2 text-[10px] font-semibold text-slate-700">
                  Drop files here
                </p>
                <p className="mt-1 text-[8px] text-slate-400">
                  PDF, DOCX, TXT or Markdown · up to 20 MiB each
                </p>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="mt-3 rounded-xl border border-cyan-200 bg-white px-4 py-2 text-[8px] font-semibold text-cyan-800"
                >
                  Browse files
                </button>
              </div>

              {importFiles.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <p className="text-[8px] font-semibold text-slate-700">
                      {importFiles.length} file{importFiles.length === 1 ? "" : "s"} ready
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setImportFiles([]);
                        if (importInputRef.current) importInputRef.current.value = "";
                      }}
                      className="text-[7.5px] font-semibold text-slate-400 hover:text-rose-600"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-40 divide-y divide-slate-100 overflow-y-auto">
                    {importFiles.map((file, index) => (
                      <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[8.5px] font-medium text-slate-700">
                            {file.name}
                          </p>
                          <p className="mt-0.5 text-[7px] text-slate-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MiB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setImportFiles((previous) =>
                              previous.filter((_, fileIndex) => fileIndex !== index),
                            )
                          }
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/65 px-5 py-4">
              <p className="text-[7.5px] leading-3.5 text-slate-400">
                Imported text becomes a qualitative source and can be coded immediately.
              </p>
              <button
                type="button"
                disabled={busy === "import-source" || importFiles.length === 0}
                onClick={() => void importSelectedFiles()}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[8.5px] font-semibold text-white disabled:opacity-40"
              >
                {busy === "import-source" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FolderUp className="h-3.5 w-3.5" />
                )}
                {busy === "import-source"
                  ? "Importing…"
                  : `Import ${importFiles.length || ""} file${importFiles.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
