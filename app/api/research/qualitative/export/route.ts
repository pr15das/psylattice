import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { researchAdmin } from "@/lib/research/serverAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function safeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "qualitative-project"
  );
}

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.alignment = { vertical: "middle", wrapText: true };
}

function autosize(sheet: ExcelJS.Worksheet, maxWidth = 48) {
  sheet.columns.forEach((column) => {
    let width = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value =
        typeof cell.value === "string"
          ? cell.value
          : cell.value === null || cell.value === undefined
            ? ""
            : String(cell.value);
      width = Math.max(width, Math.min(maxWidth, value.length + 2));
    });
    column.width = width;
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ ok: false, error: "Please sign in again." }, 401);
    }

    const studyId = request.nextUrl.searchParams.get("study_id")?.trim() || "";
    const format =
      request.nextUrl.searchParams.get("format")?.trim().toLowerCase() || "xlsx";

    if (!validUuid(studyId)) {
      return jsonResponse({ ok: false, error: "A valid study_id is required." }, 400);
    }
    if (format !== "xlsx" && format !== "json") {
      return jsonResponse({ ok: false, error: "Unsupported export format." }, 400);
    }

    const admin = researchAdmin();

    const { data: study, error: studyError } = await admin
      .from("research_studies")
      .select("id,title,status,components,design,participant_description,created_at,updated_at")
      .eq("id", studyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (studyError) throw studyError;
    if (!study) {
      return jsonResponse({ ok: false, error: "This study is not available." }, 404);
    }

    const [
      casesResult,
      sourcesResult,
      codesResult,
      codingsResult,
      themesResult,
      themeCodesResult,
      frameworksResult,
      classificationsResult,
      attributesResult,
      memosResult,
      annotationsResult,
      reconciliationsResult,
      codersResult,
      mergeHistoryResult,
      setsResult,
      setItemsResult,
      relationshipsResult,
      auditResult,
    ] = await Promise.all([
      admin
        .from("qualitative_cases")
        .select("id,participant_id,case_key,name,classification,attributes,notes,status,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_sources")
        .select("id,case_id,source_type,title,original_filename,language,content_text,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_codes")
        .select("id,parent_code_id,name,description,color,position,status,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_codings")
        .select("id,case_id,source_id,code_id,coder_identity_id,method,start_offset,end_offset,excerpt,note,created_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_themes")
        .select("id,parent_theme_id,name,description,color,position,status,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_theme_codes")
        .select("id,theme_id,code_id,created_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_framework_summaries")
        .select("id,case_id,theme_id,code_id,summary,evidence_coding_ids,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_case_classifications")
        .select("id,name,description,position,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_attribute_definitions")
        .select("id,classification_id,field_key,name,data_type,options,required,position,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_memos")
        .select("id,case_id,source_id,code_id,memo_type,title,content,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_annotations")
        .select("id,case_id,source_id,start_offset,end_offset,excerpt,content,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_reconciliations")
        .select("id,source_id,case_id,code_id,coder_a_identity_id,coder_b_identity_id,unit_key,start_offset,end_offset,excerpt,coder_a_present,coder_b_present,final_present,rationale,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_coder_identities")
        .select("id,label,email,identity_type,status,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_code_merge_history")
        .select("id,source_code_id,target_code_id,source_name,target_name,moved_coding_count,created_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_sets")
        .select("id,name,description,color,status,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_set_items")
        .select("id,set_id,item_type,item_id,created_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_relationships")
        .select("id,from_type,from_id,to_type,to_id,relationship_type,custom_label,note,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id),
      admin
        .from("qualitative_audit_log")
        .select("id,actor_user_id,action_type,entity_type,entity_id,summary,details,created_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    const results = [
      casesResult,
      sourcesResult,
      codesResult,
      codingsResult,
      themesResult,
      themeCodesResult,
      frameworksResult,
      classificationsResult,
      attributesResult,
      memosResult,
      annotationsResult,
      reconciliationsResult,
      codersResult,
      mergeHistoryResult,
      setsResult,
      setItemsResult,
      relationshipsResult,
      auditResult,
    ];
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;

    const payload = {
      exportedAt: new Date().toISOString(),
      study,
      cases: casesResult.data || [],
      sources: sourcesResult.data || [],
      codes: codesResult.data || [],
      codings: codingsResult.data || [],
      themes: themesResult.data || [],
      themeCodes: themeCodesResult.data || [],
      frameworkSummaries: frameworksResult.data || [],
      classifications: classificationsResult.data || [],
      attributeDefinitions: attributesResult.data || [],
      memos: memosResult.data || [],
      annotations: annotationsResult.data || [],
      reconciliations: reconciliationsResult.data || [],
      coders: codersResult.data || [],
      codeMergeHistory: mergeHistoryResult.data || [],
      sets: setsResult.data || [],
      setItems: setItemsResult.data || [],
      relationships: relationshipsResult.data || [],
      auditLog: auditResult.data || [],
    };

    const base = safeFilename(study.title || "qualitative-project");

    if (format === "json") {
      return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${base}-qualitative.json"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "PsyLattice";
    workbook.created = new Date();

    const codeById = new Map((payload.codes as Array<any>).map((item) => [item.id, item]));
    const caseById = new Map((payload.cases as Array<any>).map((item) => [item.id, item]));
    const sourceById = new Map((payload.sources as Array<any>).map((item) => [item.id, item]));
    const coderById = new Map((payload.coders as Array<any>).map((item) => [item.id, item]));
    const themeById = new Map((payload.themes as Array<any>).map((item) => [item.id, item]));

    const overview = workbook.addWorksheet("Overview");
    overview.addRows([
      ["Study", study.title],
      ["Status", study.status],
      ["Exported at", payload.exportedAt],
      ["Cases", payload.cases.length],
      ["Sources", payload.sources.length],
      ["Codes", payload.codes.length],
      ["Coded references", payload.codings.length],
      ["Themes", payload.themes.length],
      ["Framework summaries", payload.frameworkSummaries.length],
      ["Reconciliations", payload.reconciliations.length],
      ["Sets", payload.sets.length],
      ["Relationships", payload.relationships.length],
      ["Audit entries", payload.auditLog.length],
    ]);
    overview.getColumn(1).font = { bold: true };
    autosize(overview);

    const codebook = workbook.addWorksheet("Codebook");
    styleHeader(
      codebook.addRow([
        "Code",
        "Parent code",
        "Description",
        "Color",
        "Status",
        "References",
        "Cases coded",
        "Sources coded",
      ]),
    );
    for (const code of payload.codes as Array<any>) {
      const refs = (payload.codings as Array<any>).filter((item) => item.code_id === code.id);
      codebook.addRow([
        code.name,
        code.parent_code_id ? codeById.get(code.parent_code_id)?.name || "" : "",
        code.description || "",
        code.color,
        code.status,
        refs.length,
        new Set(refs.map((item) => item.case_id)).size,
        new Set(refs.map((item) => item.source_id)).size,
      ]);
    }
    autosize(codebook);

    const themes = workbook.addWorksheet("Themes");
    styleHeader(
      themes.addRow([
        "Theme",
        "Parent theme",
        "Description",
        "Mapped codes",
        "Cases represented",
        "Coded references",
      ]),
    );
    for (const theme of payload.themes as Array<any>) {
      const mappedCodeIds = (payload.themeCodes as Array<any>)
        .filter((item) => item.theme_id === theme.id)
        .map((item) => item.code_id);
      const refs = (payload.codings as Array<any>).filter((item) =>
        mappedCodeIds.includes(item.code_id),
      );
      themes.addRow([
        theme.name,
        theme.parent_theme_id ? themeById.get(theme.parent_theme_id)?.name || "" : "",
        theme.description || "",
        mappedCodeIds.map((id) => codeById.get(id)?.name || id).join(", "),
        new Set(refs.map((item) => item.case_id)).size,
        refs.length,
      ]);
    }
    autosize(themes);

    const cases = workbook.addWorksheet("Cases");
    const attributeDefs = payload.attributeDefinitions as Array<any>;
    styleHeader(
      cases.addRow([
        "Case",
        "Case key",
        "Participant ID",
        "Classification",
        ...attributeDefs.map((definition) => definition.name),
        "Sources",
        "Coded references",
        "Notes",
      ]),
    );
    for (const item of payload.cases as Array<any>) {
      cases.addRow([
        item.name,
        item.case_key,
        item.participant_id || "",
        item.classification,
        ...attributeDefs.map((definition) => {
          const value = item.attributes?.[definition.field_key];
          return value === undefined || value === null ? "" : String(value);
        }),
        (payload.sources as Array<any>).filter((source) => source.case_id === item.id).length,
        (payload.codings as Array<any>).filter((coding) => coding.case_id === item.id).length,
        item.notes || "",
      ]);
    }
    autosize(cases);

    const coded = workbook.addWorksheet("Coded excerpts");
    styleHeader(
      coded.addRow([
        "Case",
        "Source",
        "Code",
        "Coder",
        "Method",
        "Start",
        "End",
        "Excerpt",
        "Note",
        "Created at",
      ]),
    );
    for (const item of payload.codings as Array<any>) {
      coded.addRow([
        caseById.get(item.case_id)?.name || item.case_id,
        sourceById.get(item.source_id)?.title || item.source_id,
        codeById.get(item.code_id)?.name || item.code_id,
        item.coder_identity_id
          ? coderById.get(item.coder_identity_id)?.label || item.coder_identity_id
          : "",
        item.method,
        item.start_offset,
        item.end_offset,
        item.excerpt,
        item.note || "",
        item.created_at,
      ]);
    }
    autosize(coded, 70);

    const framework = workbook.addWorksheet("Framework matrix");
    const activeThemes = (payload.themes as Array<any>).filter(
      (theme) => theme.status === "active",
    );
    const frameworkColumns =
      activeThemes.length > 0
        ? activeThemes.map((theme) => ({ type: "theme", id: theme.id, name: theme.name }))
        : (payload.codes as Array<any>)
            .filter((code) => code.status === "active" && !code.parent_code_id)
            .map((code) => ({ type: "code", id: code.id, name: code.name }));

    styleHeader(framework.addRow(["Case", ...frameworkColumns.map((column) => column.name)]));
    for (const item of payload.cases as Array<any>) {
      framework.addRow([
        item.name,
        ...frameworkColumns.map((column) => {
          const match = (payload.frameworkSummaries as Array<any>).find(
            (summary) =>
              summary.case_id === item.id &&
              (column.type === "theme"
                ? summary.theme_id === column.id
                : summary.code_id === column.id),
          );
          return match?.summary || "";
        }),
      ]);
    }
    autosize(framework, 70);

    const reconciliation = workbook.addWorksheet("Reconciliation");
    styleHeader(
      reconciliation.addRow([
        "Case",
        "Source",
        "Code",
        "Coder A",
        "Coder B",
        "Coder A decision",
        "Coder B decision",
        "Final decision",
        "Excerpt",
        "Rationale",
        "Updated at",
      ]),
    );
    for (const item of payload.reconciliations as Array<any>) {
      reconciliation.addRow([
        caseById.get(item.case_id)?.name || item.case_id,
        sourceById.get(item.source_id)?.title || item.source_id,
        codeById.get(item.code_id)?.name || item.code_id,
        coderById.get(item.coder_a_identity_id)?.label || item.coder_a_identity_id,
        coderById.get(item.coder_b_identity_id)?.label || item.coder_b_identity_id,
        item.coder_a_present ? "Coded" : "Not coded",
        item.coder_b_present ? "Coded" : "Not coded",
        item.final_present ? "Coded" : "Not coded",
        item.excerpt,
        item.rationale || "",
        item.updated_at,
      ]);
    }
    autosize(reconciliation, 70);

    const mergeHistory = workbook.addWorksheet("Code merge history");
    styleHeader(
      mergeHistory.addRow([
        "Source code",
        "Target code",
        "Moved references",
        "Merged at",
      ]),
    );
    for (const item of payload.codeMergeHistory as Array<any>) {
      mergeHistory.addRow([
        item.source_name,
        item.target_name,
        item.moved_coding_count,
        item.created_at,
      ]);
    }
    autosize(mergeHistory);


    const setsSheet = workbook.addWorksheet("Sets");
    styleHeader(
      setsSheet.addRow([
        "Set",
        "Description",
        "Status",
        "Cases",
        "Sources",
        "Created at",
        "Updated at",
      ]),
    );
    for (const item of payload.sets as Array<any>) {
      const items = (payload.setItems as Array<any>).filter(
        (setItem) => setItem.set_id === item.id,
      );
      setsSheet.addRow([
        item.name,
        item.description || "",
        item.status,
        items.filter((setItem) => setItem.item_type === "case").length,
        items.filter((setItem) => setItem.item_type === "source").length,
        item.created_at,
        item.updated_at,
      ]);
    }
    autosize(setsSheet);

    const relationshipsSheet = workbook.addWorksheet("Relationships");
    styleHeader(
      relationshipsSheet.addRow([
        "From type",
        "From item",
        "Relationship",
        "To type",
        "To item",
        "Note",
        "Created at",
      ]),
    );
    const entityLabel = (type: string, id: string) => {
      if (type === "case") return caseById.get(id)?.name || id;
      if (type === "source") return sourceById.get(id)?.title || id;
      if (type === "code") return codeById.get(id)?.name || id;
      if (type === "theme") return themeById.get(id)?.name || id;
      const memo = (payload.memos as Array<any>).find((item) => item.id === id);
      if (type === "memo") return memo?.title || id;
      const coding = (payload.codings as Array<any>).find((item) => item.id === id);
      if (type === "coding") return coding?.excerpt || id;
      const annotation = (payload.annotations as Array<any>).find(
        (item) => item.id === id,
      );
      if (type === "annotation") return annotation?.content || id;
      return id;
    };
    for (const item of payload.relationships as Array<any>) {
      relationshipsSheet.addRow([
        item.from_type,
        entityLabel(item.from_type, item.from_id),
        item.relationship_type === "custom"
          ? item.custom_label || "custom"
          : item.relationship_type.replaceAll("_", " "),
        item.to_type,
        entityLabel(item.to_type, item.to_id),
        item.note || "",
        item.created_at,
      ]);
    }
    autosize(relationshipsSheet, 70);

    const auditSheet = workbook.addWorksheet("Project history");
    styleHeader(
      auditSheet.addRow([
        "Time",
        "Entity type",
        "Action",
        "Summary",
        "Actor user ID",
      ]),
    );
    for (const item of payload.auditLog as Array<any>) {
      auditSheet.addRow([
        item.created_at,
        item.entity_type,
        item.action_type,
        item.summary,
        item.actor_user_id || "",
      ]);
    }
    autosize(auditSheet, 72);

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}-qualitative.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Qualitative export failed:", error);
    return jsonResponse(
      { ok: false, error: "PsyLattice could not export this qualitative project right now." },
      500,
    );
  }
}
