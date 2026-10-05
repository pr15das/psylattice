from pathlib import Path

component_path = Path("components/QualitativeResearchLab.tsx")
route_path = Path("app/api/research/qualitative/route.ts")

component = component_path.read_text()
route = route_path.read_text()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    return text.replace(old, new, 1)


# ---------- Component ----------
component = replace_once(
    component,
    '  Tags,\n  Unlink,',
    '  Tags,\n  Trash2,\n  Unlink,',
    'Trash2 import',
)

functions_marker = '''  async function createSource(event: FormEvent) {
'''
delete_functions = '''  async function deleteCase(item: QualitativeCase) {
    if (!studyId || busy) return;
    if (editorDirty) {
      setError("Save or discard the current material edits before deleting a case.");
      return;
    }

    const materials = (data?.sources || []).filter(
      (source) => source.case_id === item.id,
    );
    const codedReferences = (data?.codings || []).filter(
      (coding) => coding.case_id === item.id,
    ).length;
    const participantMessage = item.participant_id
      ? "\\n\\nThe linked study participant will NOT be deleted."
      : "";
    const confirmed = window.confirm(
      `Delete case “${item.name}”?\\n\\nThis permanently removes ${materials.length} material${materials.length === 1 ? "" : "s"}, ${codedReferences} coded reference${codedReferences === 1 ? "" : "s"}, and related annotations, memos, AI suggestions, coder assignments and qualitative links.${participantMessage}\\n\\nThis cannot be undone.`,
    );
    if (!confirmed) return;

    const busyKey = `delete-case:${item.id}`;
    setBusy(busyKey);
    setError("");
    setNotice("");
    try {
      await post({
        operation: "delete_case",
        studyId,
        caseId: item.id,
      });
      setExpandedCaseIds((previous) =>
        previous.filter((caseId) => caseId !== item.id),
      );
      if (selectedCaseId === item.id) {
        setSelectedCaseId("");
        setSelectedSourceId("");
        setEditorDirty(false);
      }
      setNotice(
        item.participant_id
          ? "Qualitative case deleted. The linked study participant was kept."
          : "Qualitative case deleted.",
      );
      await loadStudy();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The case could not be deleted.",
      );
    } finally {
      setBusy("");
    }
  }

  async function deleteSource(source: QualitativeSource) {
    if (!studyId || busy) return;
    if (editorDirty && selectedSourceId !== source.id) {
      setError("Save or discard the current material edits before deleting another material.");
      return;
    }

    const codedReferences = (data?.codings || []).filter(
      (coding) => coding.source_id === source.id,
    ).length;
    const annotations = (data?.annotations || []).filter(
      (annotation) => annotation.source_id === source.id,
    ).length;
    const unsavedWarning =
      editorDirty && selectedSourceId === source.id
        ? "\\n\\nAny unsaved edits to this material will also be lost."
        : "";
    const confirmed = window.confirm(
      `Delete material “${source.title}”?\\n\\nThis permanently removes its text, ${codedReferences} coded reference${codedReferences === 1 ? "" : "s"}, ${annotations} annotation${annotations === 1 ? "" : "s"}, and related memos, AI suggestions, coder assignments and qualitative links.${unsavedWarning}\\n\\nThis cannot be undone.`,
    );
    if (!confirmed) return;

    const busyKey = `delete-source:${source.id}`;
    setBusy(busyKey);
    setError("");
    setNotice("");
    try {
      await post({
        operation: "delete_source",
        studyId,
        sourceId: source.id,
      });
      if (selectedSourceId === source.id) {
        setSelectedSourceId("");
        setEditorDirty(false);
        setSelection({ start: 0, end: 0, text: "" });
      }
      setNotice("Text material deleted.");
      await loadStudy();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The material could not be deleted.",
      );
    } finally {
      setBusy("");
    }
  }

'''
component = replace_once(
    component,
    functions_marker,
    delete_functions + functions_marker,
    'delete functions',
)

old_case_controls = '''                        {!readOnly && (
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
'''
new_case_controls = '''                        {!readOnly && (
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
                        {!readOnly && canManageStructure && (
                          <button
                            type="button"
                            disabled={busy === `delete-case:${item.id}`}
                            onClick={() => void deleteCase(item)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-300 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            title="Delete case"
                            aria-label={`Delete case ${item.name}`}
                          >
                            {busy === `delete-case:${item.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
'''
component = replace_once(
    component,
    old_case_controls,
    new_case_controls,
    'case delete control',
)

old_material_row = '''                                return (
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
'''
new_material_row = '''                                return (
                                  <div
                                    key={source.id}
                                    className={`flex w-full items-center rounded-lg border ${
                                      active
                                        ? "border-cyan-200 bg-white text-cyan-900 shadow-sm"
                                        : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => chooseSource(item.id, source.id)}
                                      className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left"
                                    >
                                      <FileText className={`h-3.5 w-3.5 shrink-0 ${active ? "text-cyan-700" : "text-slate-400"}`} />
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[7.8px] font-semibold">{source.title}</span>
                                        <span className="mt-0.5 block text-[6.5px] text-slate-400">
                                          {words.toLocaleString()} words
                                        </span>
                                      </span>
                                    </button>
                                    {!readOnly && canManageStructure && (
                                      <button
                                        type="button"
                                        disabled={busy === `delete-source:${source.id}`}
                                        onClick={() => void deleteSource(source)}
                                        className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                                        title="Delete material"
                                        aria-label={`Delete material ${source.title}`}
                                      >
                                        {busy === `delete-source:${source.id}` ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                );
'''
component = replace_once(
    component,
    old_material_row,
    new_material_row,
    'material delete control',
)

# ---------- API route ----------
helper_marker = '''async function qualitativeEntityExists(
'''
helper_code = '''async function deleteQualitativeRelationshipReferences(
  admin: ReturnType<typeof researchAdmin>,
  ownerUserId: string,
  studyId: string,
  entityType: string,
  entityIds: string[],
) {
  const ids = entityIds.filter(validUuid);
  if (ids.length === 0) return;

  const { error: fromError } = await admin
    .from("qualitative_relationships")
    .delete()
    .eq("owner_user_id", ownerUserId)
    .eq("study_id", studyId)
    .eq("from_type", entityType)
    .in("from_id", ids);
  if (fromError) throw fromError;

  const { error: toError } = await admin
    .from("qualitative_relationships")
    .delete()
    .eq("owner_user_id", ownerUserId)
    .eq("study_id", studyId)
    .eq("to_type", entityType)
    .in("to_id", ids);
  if (toError) throw toError;
}

async function deleteQualitativeSetItems(
  admin: ReturnType<typeof researchAdmin>,
  ownerUserId: string,
  studyId: string,
  itemType: "case" | "source",
  itemIds: string[],
) {
  const ids = itemIds.filter(validUuid);
  if (ids.length === 0) return;

  const { error } = await admin
    .from("qualitative_set_items")
    .delete()
    .eq("owner_user_id", ownerUserId)
    .eq("study_id", studyId)
    .eq("item_type", itemType)
    .in("item_id", ids);
  if (error) throw error;
}

'''
route = replace_once(
    route,
    helper_marker,
    helper_code + helper_marker,
    'delete cleanup helpers',
)

operation_marker = '''    if (operation === "create_source") {
'''
delete_operations = '''    if (operation === "delete_source") {
      const sourceId = text(body?.sourceId, 80);
      if (!validUuid(sourceId)) {
        return reply({ ok: false, error: "A valid sourceId is required." }, 400);
      }

      const { data: source, error: sourceError } = await admin
        .from("qualitative_sources")
        .select("id,case_id,title")
        .eq("id", sourceId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (sourceError) throw sourceError;
      if (!source) {
        return reply({ ok: false, error: "That qualitative material could not be found." }, 404);
      }

      const [codingResult, annotationResult, memoResult] = await Promise.all([
        admin
          .from("qualitative_codings")
          .select("id")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("source_id", sourceId),
        admin
          .from("qualitative_annotations")
          .select("id")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("source_id", sourceId),
        admin
          .from("qualitative_memos")
          .select("id")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("source_id", sourceId),
      ]);
      if (codingResult.error) throw codingResult.error;
      if (annotationResult.error) throw annotationResult.error;
      if (memoResult.error) throw memoResult.error;

      await deleteQualitativeSetItems(admin, user.id, studyId, "source", [sourceId]);
      await deleteQualitativeRelationshipReferences(admin, user.id, studyId, "source", [sourceId]);
      await deleteQualitativeRelationshipReferences(
        admin,
        user.id,
        studyId,
        "coding",
        (codingResult.data || []).map((row) => row.id),
      );
      await deleteQualitativeRelationshipReferences(
        admin,
        user.id,
        studyId,
        "annotation",
        (annotationResult.data || []).map((row) => row.id),
      );
      await deleteQualitativeRelationshipReferences(
        admin,
        user.id,
        studyId,
        "memo",
        (memoResult.data || []).map((row) => row.id),
      );

      const { error: deleteError } = await admin
        .from("qualitative_sources")
        .delete()
        .eq("id", sourceId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);
      if (deleteError) throw deleteError;

      return reply({
        ok: true,
        deletedSourceId: sourceId,
        caseId: source.case_id,
      });
    }

    if (operation === "delete_case") {
      const caseId = text(body?.caseId, 80);
      if (!validUuid(caseId)) {
        return reply({ ok: false, error: "A valid caseId is required." }, 400);
      }

      const qualitativeCase = await caseForStudy(
        admin,
        user.id,
        studyId,
        caseId,
      );
      if (!qualitativeCase) {
        return reply({ ok: false, error: "That qualitative case could not be found." }, 404);
      }

      const [sourceResult, codingResult, annotationResult, memoResult] = await Promise.all([
        admin
          .from("qualitative_sources")
          .select("id")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("case_id", caseId),
        admin
          .from("qualitative_codings")
          .select("id")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("case_id", caseId),
        admin
          .from("qualitative_annotations")
          .select("id")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("case_id", caseId),
        admin
          .from("qualitative_memos")
          .select("id")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("case_id", caseId),
      ]);
      if (sourceResult.error) throw sourceResult.error;
      if (codingResult.error) throw codingResult.error;
      if (annotationResult.error) throw annotationResult.error;
      if (memoResult.error) throw memoResult.error;

      const sourceIds = (sourceResult.data || []).map((row) => row.id);
      await deleteQualitativeSetItems(admin, user.id, studyId, "case", [caseId]);
      await deleteQualitativeSetItems(admin, user.id, studyId, "source", sourceIds);
      await deleteQualitativeRelationshipReferences(admin, user.id, studyId, "case", [caseId]);
      await deleteQualitativeRelationshipReferences(admin, user.id, studyId, "source", sourceIds);
      await deleteQualitativeRelationshipReferences(
        admin,
        user.id,
        studyId,
        "coding",
        (codingResult.data || []).map((row) => row.id),
      );
      await deleteQualitativeRelationshipReferences(
        admin,
        user.id,
        studyId,
        "annotation",
        (annotationResult.data || []).map((row) => row.id),
      );
      await deleteQualitativeRelationshipReferences(
        admin,
        user.id,
        studyId,
        "memo",
        (memoResult.data || []).map((row) => row.id),
      );

      const { error: deleteError } = await admin
        .from("qualitative_cases")
        .delete()
        .eq("id", caseId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);
      if (deleteError) throw deleteError;

      return reply({
        ok: true,
        deletedCaseId: caseId,
        participantId: qualitativeCase.participant_id || null,
      });
    }

'''
route = replace_once(
    route,
    operation_marker,
    delete_operations + operation_marker,
    'delete API operations',
)

component_path.write_text(component)
route_path.write_text(route)
print("Qualitative case/material delete controls and API operations patched.")
