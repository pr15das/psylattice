import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "app/api/psylattice-copilot/route.ts");
const marker = "psylattice.study-scoped-copilot.v1";

if (!fs.existsSync(target)) {
  console.error("Could not find app/api/psylattice-copilot/route.ts");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (source.includes(marker)) {
  console.log("Study-scoped Research Assistant context v1 is already installed.");
  process.exit(0);
}

const backup = `${target}.before-study-scoped-copilot-v1.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

function replaceFunction(startName, nextName, replacement) {
  const start = source.indexOf(`async function ${startName}(`);
  const end = source.indexOf(`async function ${nextName}(`, start + 1);
  if (start < 0 || end < 0) {
    console.error(
      `Patch stopped: could not find ${startName} -> ${nextName} function boundary. No partial file was written.`,
    );
    process.exit(1);
  }
  source = source.slice(0, start) + replacement.trimEnd() + "\n\n" + source.slice(end);
}

const scopedCognitive = String.raw`async function loadServerCognitiveContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  studyId: string,
) {
  // ${marker}
  if (!studyId) {
    return {
      study_id: null,
      study_links: [],
      templates: [],
      owned_tasks: [],
      task_versions: [],
      task_structure: {},
      pilot_sessions: [],
      pilot_links: [],
      capabilities: { study_scoped: true },
      note:
        "No active study scope was supplied, so Cognitive Lab records were not loaded. This prevents cross-study context mixing.",
    };
  }

  const { data: studyLinks, error: linkError } = await supabase
    .from("study_cognitive_tasks")
    .select("id,task_id,task_version_id,position,required,config")
    .eq("study_id", studyId)
    .order("position", { ascending: true });

  if (linkError) {
    return {
      study_id: studyId,
      study_links: [],
      templates: [],
      owned_tasks: [],
      task_versions: [],
      task_structure: {},
      pilot_sessions: [],
      pilot_links: [],
      capabilities: { study_scoped: true },
      note: "Study-linked Cognitive Lab records could not be loaded for this request.",
    };
  }

  const links = studyLinks || [];
  const taskIds = Array.from(
    new Set(
      links
        .map((row: any) => String(row.task_id || ""))
        .filter(Boolean),
    ),
  );

  if (!taskIds.length) {
    return {
      study_id: studyId,
      study_links: [],
      templates: [],
      owned_tasks: [],
      task_versions: [],
      task_structure: {},
      pilot_sessions: [],
      pilot_links: [],
      capabilities: {
        study_scoped: true,
        study_builder_attachment: true,
        task_builder: true,
      },
      note:
        "This study currently has no Cognitive Lab tasks attached. Global Cognitive Lab library content is intentionally excluded from this study AI environment.",
    };
  }

  const taskSelect =
    "id,owner_user_id,source_type,source_template_id,template_key,title,short_title,description,domain,tags,status,template_stage,default_device_support,library_metadata,created_at,updated_at";

  const [taskResult, versionResult, sessionResult, pilotLinkResult] =
    await Promise.all([
      supabase.from("cognitive_tasks").select(taskSelect).in("id", taskIds),
      supabase
        .from("cognitive_task_versions")
        .select(
          "id,task_id,version_number,version_label,status,runtime_engine,participant_instructions,task_config,randomization_config,scoring_config,timing_config,output_config,device_config,updated_at",
        )
        .in("task_id", taskIds)
        .order("version_number", { ascending: false }),
      supabase
        .from("cognitive_task_sessions")
        .select(
          "id,task_id,version_id,session_mode,status,started_at,completed_at,created_at",
        )
        .eq("owner_user_id", userId)
        .in("task_id", taskIds)
        .eq("session_mode", "pilot")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("cognitive_pilot_links")
        .select(
          "id,task_id,version_id,label,status,max_completions,completion_count,expires_at,last_used_at,created_at",
        )
        .eq("owner_user_id", userId)
        .in("task_id", taskIds)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (taskResult.error) {
    throw new Error("Study-linked Cognitive Lab tasks could not be loaded.");
  }

  const allVersions = versionResult.data || [];
  const explicitVersionByTask = new Map(
    links
      .filter((row: any) => row.task_version_id)
      .map((row: any) => [
        String(row.task_id),
        String(row.task_version_id),
      ]),
  );

  const selectedVersions: any[] = [];
  for (const taskId of taskIds) {
    const explicitId = explicitVersionByTask.get(taskId);
    const versionsForTask = allVersions.filter(
      (row: any) => String(row.task_id) === taskId,
    );
    const selected = explicitId
      ? versionsForTask.find((row: any) => String(row.id) === explicitId)
      : versionsForTask[0];
    if (selected) selectedVersions.push(selected);
  }

  const selectedVersionIds = selectedVersions.map((row: any) => String(row.id));
  let structureByTask: Record<string, unknown> = {};

  if (selectedVersionIds.length) {
    const { data: blockRows } = await supabase
      .from("cognitive_task_blocks")
      .select(
        "id,version_id,block_key,name,block_type,position,repeat_count,continue_rule,config",
      )
      .in("version_id", selectedVersionIds)
      .order("position", { ascending: true });

    const blockIds = (blockRows || []).map((row: any) => String(row.id));
    const [componentResult, trialResult] = blockIds.length
      ? await Promise.all([
          supabase
            .from("cognitive_task_components")
            .select(
              "id,block_id,component_key,component_type,position,config",
            )
            .in("block_id", blockIds)
            .order("position", { ascending: true }),
          supabase
            .from("cognitive_task_trial_rows")
            .select(
              "id,block_id,position,condition_label,variables,weight,enabled",
            )
            .in("block_id", blockIds)
            .order("position", { ascending: true })
            .limit(4000),
        ])
      : [{ data: [] } as any, { data: [] } as any];

    const taskByVersion = new Map(
      selectedVersions.map((row: any) => [String(row.id), String(row.task_id)]),
    );

    const next: Record<string, unknown> = {};
    for (const block of blockRows || []) {
      const taskId = taskByVersion.get(String((block as any).version_id));
      if (!taskId) continue;
      const current = (next[taskId] as any[]) || [];
      const trials = (trialResult.data || []).filter(
        (row: any) => String(row.block_id) === String((block as any).id),
      );
      current.push({
        id: (block as any).id,
        block_key: (block as any).block_key,
        name: (block as any).name,
        block_type: (block as any).block_type,
        position: (block as any).position,
        repeat_count: (block as any).repeat_count,
        continue_rule: (block as any).continue_rule,
        config: (block as any).config,
        components: (componentResult.data || []).filter(
          (row: any) => String(row.block_id) === String((block as any).id),
        ),
        trial_count: trials.length,
        trial_variable_names: Array.from(
          new Set(
            trials.flatMap((row: any) =>
              Object.keys(row.variables || {}),
            ),
          ),
        ),
        sample_trials: trials.slice(0, 16),
        trial_samples_truncated: trials.length > 16,
      });
      next[taskId] = current;
    }
    structureByTask = next;
  }

  const tasks = taskResult.data || [];
  const enrich = (row: any) => ({
    ...row,
    attached_to_study: true,
    study_attachment:
      links.find((link: any) => String(link.task_id) === String(row.id)) || null,
    selected_version:
      selectedVersions.find(
        (version: any) => String(version.task_id) === String(row.id),
      ) || null,
    selected_structure: structureByTask[String(row.id)] || [],
  });

  return {
    study_id: studyId,
    study_links: links,
    templates: tasks
      .filter((row: any) => row.source_type === "system_template")
      .map(enrich),
    owned_tasks: tasks
      .filter((row: any) => String(row.owner_user_id || "") === userId)
      .map(enrich),
    task_versions: selectedVersions,
    task_structure: structureByTask,
    pilot_sessions: sessionResult.data || [],
    pilot_links: pilotLinkResult.data || [],
    capabilities: {
      study_scoped: true,
      task_builder: true,
      study_builder_attachment: true,
      browser_preview: true,
      pilot_links: true,
      publish_and_version: true,
      batteries_in_study_context: false,
    },
    note:
      "Strict study-scoped Cognitive Lab context. Only tasks attached through study_cognitive_tasks for the active study are included. Global task-library and unrelated-study records are excluded.",
  };
}`;

const scopedThesis = String.raw`async function loadServerThesisContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  studyId: string,
) {
  if (!studyId) {
    return {
      study_id: null,
      documents: [],
      note:
        "No active study scope was supplied, so Thesis Builder documents were not loaded. This prevents cross-study context mixing.",
    };
  }

  const { data, error } = await supabase
    .from("research_writing_documents")
    .select(
      "id,folder_id,study_id,title,document_type,format_style,content_text,updated_at",
    )
    .eq("owner_user_id", userId)
    .eq("study_id", studyId)
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error) {
    return {
      study_id: studyId,
      documents: [],
      note:
        "Study-linked Thesis Builder records could not be loaded for this request.",
    };
  }

  let remaining = MAX_THESIS_CONTEXT_CHARS;
  const documents = [] as Array<Record<string, unknown>>;

  for (const row of data || []) {
    if (remaining <= 0) break;
    const raw = typeof row.content_text === "string" ? row.content_text : "";
    const text = raw.slice(0, remaining);
    remaining -= text.length;
    documents.push({
      id: row.id,
      folder_id: row.folder_id,
      study_id: row.study_id,
      title: row.title,
      document_type: row.document_type,
      format_style: row.format_style,
      content_text: text,
      content_truncated: text.length < raw.length,
      updated_at: row.updated_at,
    });
  }

  return {
    study_id: studyId,
    documents,
    note:
      "Strict study-scoped Thesis Builder context. Multiple files may belong to one study, and only files linked to the active AI environment's study are included.",
  };
}`;

replaceFunction(
  "loadServerCognitiveContext",
  "loadServerThesisContext",
  scopedCognitive,
);
replaceFunction(
  "loadServerThesisContext",
  "loadServerReferenceContext",
  scopedThesis,
);

const oldThesisCall = "loadServerThesisContext(supabase, user.id)";
const newThesisCall = "loadServerThesisContext(supabase, user.id, studyId)";
if (!source.includes(oldThesisCall)) {
  console.error("Patch stopped: Thesis context call site was not found. No partial file was written.");
  process.exit(1);
}
source = source.split(oldThesisCall).join(newThesisCall);

const oldCognitiveCall = "loadServerCognitiveContext(supabase, user.id)";
const newCognitiveCall = "loadServerCognitiveContext(supabase, user.id, studyId)";
if (!source.includes(oldCognitiveCall)) {
  console.error("Patch stopped: Cognitive context call site was not found. No partial file was written.");
  process.exit(1);
}
source = source.split(oldCognitiveCall).join(newCognitiveCall);

for (const required of [
  marker,
  ".eq(\"study_id\", studyId)",
  "Strict study-scoped Thesis Builder context",
  "Strict study-scoped Cognitive Lab context",
  "loadServerThesisContext(supabase, user.id, studyId)",
  "loadServerCognitiveContext(supabase, user.id, studyId)",
]) {
  if (!source.includes(required)) {
    console.error(`Safety check failed: ${required}`);
    process.exit(1);
  }
}

fs.writeFileSync(target, source, "utf8");
console.log("Patched: app/api/psylattice-copilot/route.ts");
console.log("Research Assistant Thesis + Cognitive contexts are now study-scoped.");
