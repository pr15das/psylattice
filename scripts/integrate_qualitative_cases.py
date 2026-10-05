from pathlib import Path

path = Path("components/QualitativeResearchLabLegacy.tsx")
text = path.read_text()

if "function toggleCaseExpanded(caseId: string)" in text:
    print("Qualitative Cases panel is already integrated; nothing to do.")
    raise SystemExit(0)


def replace_once(old: str, new: str, label: str):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    '  const [caseQuery, setCaseQuery] = useState("");\n  const [selectedCaseId, setSelectedCaseId] = useState("");',
    '  const [caseQuery, setCaseQuery] = useState("");\n  const [expandedCaseIds, setExpandedCaseIds] = useState<string[]>([]);\n  const [selectedCaseId, setSelectedCaseId] = useState("");',
    "expanded case state",
)

old_visible = '''  const visibleCases = useMemo(() => {
    const needle = caseQuery.trim().toLowerCase();
    return (data?.cases || []).filter((item) =>
      !needle
        ? true
        : `${item.name} ${item.case_key} ${item.classification}`
            .toLowerCase()
            .includes(needle),
    );
  }, [data, caseQuery]);'''
new_visible = '''  const visibleCases = useMemo(() => {
    const needle = caseQuery.trim().toLowerCase();
    return (data?.cases || []).filter((item) => {
      if (!needle) return true;
      const participant = item.participant_id
        ? data?.participants.find((entry) => entry.id === item.participant_id)
        : null;
      const caseMatch = `${item.name} ${item.case_key} ${item.classification} ${participant?.public_id || ""}`
        .toLowerCase()
        .includes(needle);
      const materialMatch = (data?.sources || []).some(
        (source) =>
          source.case_id === item.id &&
          `${source.title} ${source.source_type}`.toLowerCase().includes(needle),
      );
      return caseMatch || materialMatch;
    });
  }, [data, caseQuery]);'''
replace_once(old_visible, new_visible, "case/material search")

old_choose = '''  function chooseCase(caseId: string) {
    if (editorDirty && !window.confirm("Discard unsaved source edits?")) return;
    setSelectedCaseId(caseId);
    setSelectedSourceId(
      (data?.sources || []).find((source) => source.case_id === caseId)?.id || "",
    );
  }
'''
new_choose = '''  function chooseCase(caseId: string) {
    if (editorDirty && !window.confirm("Discard unsaved source edits?")) return;
    setSelectedCaseId(caseId);
    setExpandedCaseIds((previous) =>
      previous.includes(caseId) ? previous : [...previous, caseId],
    );
    setSelectedSourceId(
      (data?.sources || []).find((source) => source.case_id === caseId)?.id || "",
    );
  }

  function toggleCaseExpanded(caseId: string) {
    setExpandedCaseIds((previous) =>
      previous.includes(caseId)
        ? previous.filter((id) => id !== caseId)
        : [...previous, caseId],
    );
  }

  function chooseSource(caseId: string, sourceId: string) {
    if (editorDirty && !window.confirm("Discard unsaved source edits?")) return;
    setSelectedCaseId(caseId);
    setSelectedSourceId(sourceId);
    setShowSourceForm(false);
    setExpandedCaseIds((previous) =>
      previous.includes(caseId) ? previous : [...previous, caseId],
    );
  }

  function beginSourceForCase(caseId: string) {
    if (editorDirty && !window.confirm("Discard unsaved source edits?")) return;
    setSelectedCaseId(caseId);
    setShowSourceForm(true);
    setSourceTitle("");
    setSourceType("transcript");
    setSourceContent("");
    setExpandedCaseIds((previous) =>
      previous.includes(caseId) ? previous : [...previous, caseId],
    );
  }
'''
replace_once(old_choose, new_choose, "case/source helpers")

replace_once(
    '      setSelectedCaseId(result.case.id);\n      setNotice(result.existing ? "That participant already has a qualitative case." : "Qualitative case created.");',
    '      setSelectedCaseId(result.case.id);\n      setExpandedCaseIds((previous) =>\n        previous.includes(result.case.id) ? previous : [...previous, result.case.id],\n      );\n      setNotice(result.existing ? "That participant already has a qualitative case." : "Qualitative case created.");',
    "expand new case",
)

replace_once(
    '<p className="mt-0.5 text-[7.5px] text-slate-400">Participant-linked or standalone</p>',
    '<p className="mt-0.5 text-[7.5px] text-slate-400">Participant-linked or standalone · materials nested below</p>',
    "cases subtitle",
)
replace_once('placeholder="Search cases"', 'placeholder="Search cases & materials"', "cases search")

start_marker = '                visibleCases.map((item) => {'
end_marker = '              )}\n            </div>\n          </aside>'
start = text.find(start_marker)
end = text.find(end_marker, start)
if start == -1 or end == -1:
    raise SystemExit("Could not locate existing flat Cases list")

nested_cases = '''                visibleCases.map((item) => {
                  const participant = item.participant_id
                    ? data.participants.find((p) => p.id === item.participant_id)
                    : null;
                  const sources = data.sources.filter((source) => source.case_id === item.id);
                  const expanded = expandedCaseIds.includes(item.id) || Boolean(caseQuery.trim());
                  const activeCase = selectedCaseId === item.id;
                  return (
                    <div key={item.id} className="border-b border-slate-100">
                      <div className={`flex items-center gap-1.5 px-2 py-2 ${
                        activeCase ? "bg-cyan-50/70" : "bg-white hover:bg-slate-50"
                      }`}>
                        <button
                          type="button"
                          onClick={() => toggleCaseExpanded(item.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
                          title={expanded ? "Collapse materials" : "Show materials"}
                          aria-label={expanded ? "Collapse materials" : "Show materials"}
                        >
                          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => chooseCase(item.id)}
                          className="min-w-0 flex-1 rounded-lg px-1 py-1.5 text-left"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              participant ? "bg-cyan-100 text-cyan-700" : "bg-violet-100 text-violet-700"
                            }`}>
                              {participant ? <UserRound className="h-3.5 w-3.5" /> : <BookOpenText className="h-3.5 w-3.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[9px] font-semibold text-slate-900">{item.name}</span>
                              <span className="mt-0.5 block truncate text-[7px] text-slate-400">
                                {participant ? participant.public_id : "Standalone case"} · {sources.length} material{sources.length === 1 ? "" : "s"}
                              </span>
                            </span>
                          </div>
                        </button>

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => beginSourceForCase(item.id)}
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
                          {sources.length === 0 ? (
                            <button
                              type="button"
                              disabled={readOnly}
                              onClick={() => !readOnly && beginSourceForCase(item.id)}
                              className="w-full rounded-lg border border-dashed border-slate-200 px-3 py-2 text-left text-[7px] text-slate-400 disabled:cursor-default"
                            >
                              No text materials yet{readOnly ? "." : " · Add one"}
                            </button>
                          ) : (
                            <div className="space-y-1">
                              {sources.map((source) => {
                                const active = selectedSourceId === source.id;
                                const words = wordTokens(source.content_text || "").length;
                                return (
                                  <button
                                    key={source.id}
                                    type="button"
                                    onClick={() => chooseSource(item.id, source.id)}
                                    className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left ${
                                      active
                                        ? "border-cyan-200 bg-white text-cyan-900 shadow-sm"
                                        : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white"
                                    }`}
                                  >
                                    <FileText className={`h-3.5 w-3.5 shrink-0 ${active ? "text-cyan-700" : "text-slate-400"}`} />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[7.8px] font-semibold">{source.title}</span>
                                      <span className="mt-0.5 block text-[6.5px] text-slate-400">
                                        {words.toLocaleString()} words
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {!readOnly && sources.length > 0 && (
                            <button
                              type="button"
                              onClick={() => beginSourceForCase(item.id)}
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
'''
text = text[:start] + nested_cases + text[end:]

tabs_start_marker = '                  {caseSources.length > 0 && ('
tabs_end_marker = '                </div>\n\n                {showSourceForm && ('
tabs_start = text.find(tabs_start_marker)
tabs_end = text.find(tabs_end_marker, tabs_start)
if tabs_start == -1 or tabs_end == -1:
    raise SystemExit("Could not locate redundant source tabs")
text = text[:tabs_start] + text[tabs_end:]

for old, new in [
    ('                          Add source', '                          Add material'),
    ('placeholder="Source title"', 'placeholder="Material title"'),
    ('>Create source</button>', '>Add material</button>'),
    ('<p className="mt-3 text-[10px] font-semibold text-slate-700">Add a qualitative source</p>', '<p className="mt-3 text-[10px] font-semibold text-slate-700">Add a text material</p>'),
    ('setNotice("Qualitative source created.");', 'setNotice("Text material added to this case.");'),
]:
    replace_once(old, new, f"UI label {old}")

empty_start = text.find('            {!selectedCase ? (\n              <div className="flex min-h-[620px] items-center justify-center p-8 text-center">')
empty_end_marker = '            ) : (\n              <>\n                <div className="border-b border-slate-100 p-3.5">'
empty_end = text.find(empty_end_marker, empty_start)
if empty_start == -1 or empty_end == -1:
    raise SystemExit("Could not locate selectedCase empty state")
empty_state = '''            {!selectedCase ? (
              <div className="flex min-h-[620px] items-center justify-center p-8 text-center">
                <div className="w-full max-w-lg">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-[12px] font-semibold text-slate-800">
                    Select a case or participant
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-[9px] leading-4 text-slate-400">
                    Choose a case from the left. Its transcripts and other text materials are nested directly underneath it and open here for editing, coding and analysis.
                  </p>
                </div>
              </div>
'''
text = text[:empty_start] + empty_state + text[empty_end:]

source_textarea = '''                    <textarea
                      value={sourceContent}
                      onChange={(event) => setSourceContent(event.target.value)}
                      placeholder="Paste transcript, interview, field note or other qualitative text…"
                      rows={7}
                      className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-[10px] leading-5 outline-none focus:border-cyan-300"
                    />'''
replace_once(
    source_textarea,
    source_textarea
    + '''
                    <div className="mt-1.5 flex justify-end text-[7px] font-medium text-slate-400">
                      {wordTokens(sourceContent).length.toLocaleString()} words
                    </div>''',
    "new material word count",
)

selected_file_marker = '''                        {selectedSource.original_filename && (
                          <span className="text-[7px] text-slate-400">
                            Imported from {selectedSource.original_filename}
                          </span>
                        )}'''
replace_once(
    selected_file_marker,
    selected_file_marker
    + '''
                        <span className="text-[7px] font-semibold text-slate-400">
                          {wordTokens(editorContent).length.toLocaleString()} words
                        </span>''',
    "editor word count",
)

path.write_text(text)

wrapper = Path("components/QualitativeResearchLab.tsx")
wrapper.write_text('''"use client";\n\nimport type { ComponentProps } from "react";\nimport LegacyQualitativeResearchLab from "./QualitativeResearchLabLegacy";\n\ntype Props = ComponentProps<typeof LegacyQualitativeResearchLab>;\n\nexport default function QualitativeResearchLab(props: Props) {\n  const apiBase =\n    props.apiBase && props.apiBase !== "/api/research/qualitative"\n      ? props.apiBase\n      : "/api/research/qualitative/limited";\n\n  return (\n    <LegacyQualitativeResearchLab\n      {...props}\n      apiBase={apiBase}\n      allowImport={false}\n    />\n  );\n}\n''')

print("Integrated materials into the existing Cases panel.")
