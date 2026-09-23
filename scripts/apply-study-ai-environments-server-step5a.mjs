import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "app/api/psylattice-copilot/route.ts");

if (!fs.existsSync(target)) {
  console.error("Could not find app/api/psylattice-copilot/route.ts");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const VERSION_MARKER = "psylattice.study-ai-environments.server.step5a.v2";
if (source.includes(VERSION_MARKER)) {
  console.log("Step 5A v2 is already installed in the Research Assistant server.");
  process.exit(0);
}

const backup = `${target}.before-study-ai-environments-step5a-v2.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

function fail(label) {
  console.error(`Patch stopped: could not safely patch ${label}.`);
  console.error("No partial file was written.");
  process.exit(1);
}

function replaceOnce(label, before, after) {
  const index = source.indexOf(before);
  if (index < 0) fail(label);
  if (source.indexOf(before, index + before.length) >= 0) {
    fail(`${label} (matched more than once)`);
  }
  source = source.slice(0, index) + after + source.slice(index + before.length);
  console.log(`Patched: ${label}`);
}

function replaceRegexOnce(label, regex, replacement) {
  const matches = [...source.matchAll(regex)];
  if (matches.length !== 1) {
    fail(`${label} (expected 1 match, found ${matches.length})`);
  }
  source = source.replace(regex, replacement);
  console.log(`Patched: ${label}`);
}

source = source.replace(
  'import { NextRequest, NextResponse } from "next/server";',
  `import { NextRequest, NextResponse } from "next/server";

// ${VERSION_MARKER}`,
);

// 1. Research Assistant instructions for Reference Library provenance.
replaceOnce(
  "Reference Library AI instructions",
  `PERMISSIONS
- Respect the permission state exactly. Missing or blocked context means unavailable, not permission to guess.
- Direct identifiers and participant-level rows are sensitive and should never be assumed available.
- EMA/ESM integration is intentionally not connected in this phase while that implementation is being completed elsewhere. You may provide general workflow guidance from study context, but do not claim to see the live Ambulatory builder unless context is explicitly supplied.

STATISTICAL BOUNDARY`,
  `PERMISSIONS
- Respect the permission state exactly. Missing or blocked context means unavailable, not permission to guess.
- Direct identifiers and participant-level rows are sensitive and should never be assumed available.
- EMA/ESM integration is intentionally not connected in this phase while that implementation is being completed elsewhere. You may provide general workflow guidance from study context, but do not claim to see the live Ambulatory builder unless context is explicitly supplied.

REFERENCE LIBRARY
- When SERVER-VERIFIED CONTEXT includes reference_library, those records come from the signed-in researcher's own global PsyLattice Reference Manager.
- Reference Library access is global across collections/subcollections, but every recommendation must still be interpreted for the active study environment.
- Distinguish references already linked to the active study from references found elsewhere in the user's library.
- You may recommend a saved reference because its metadata, abstract, or supplied extracted PDF text appears relevant. Do not invent authors, DOI values, findings, quotations, methods, samples, or conclusions.
- Presence in the library does not prove that a source supports a claim. Explain relevance only from the supplied metadata, abstract, or extracted text.
- Never say that a source was added to the study unless the context explicitly marks it linked_to_active_study=true.

STATISTICAL BOUNDARY`,
);

// 2. Server-side Reference Library loader.
replaceOnce(
  "Reference Library loader",
  `function conversationTitleFromQuestion(question: string) {`,
  `async function loadServerReferenceContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  studyId: string,
) {
  const linkedResult = studyId
    ? await supabase
        .from("reference_study_links")
        .select("reference_id")
        .eq("owner_user_id", userId)
        .eq("study_id", studyId)
    : { data: [], error: null };

  if (linkedResult.error) {
    throw new Error("Study-linked references could not be loaded.");
  }

  const linkedIds = new Set(
    (linkedResult.data || []).map((row) => String(row.reference_id)),
  );

  const { data: items, error: itemError } = await supabase
    .from("reference_items")
    .select(
      "id,item_type,title,authors,published_year,container_title,publisher,volume,issue,page,doi,url,abstract,keywords,citation_key,source_kind,metadata_verified_at,ai_index_status,updated_at",
    )
    .eq("owner_user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(160);

  if (itemError) {
    throw new Error("Reference Library metadata could not be loaded.");
  }

  const references = (items || []).map((item) => ({
    id: item.id,
    item_type: item.item_type,
    title: item.title,
    authors: item.authors,
    published_year: item.published_year,
    container_title: item.container_title,
    publisher: item.publisher,
    volume: item.volume,
    issue: item.issue,
    page: item.page,
    doi: item.doi,
    url: item.url,
    abstract:
      typeof item.abstract === "string"
        ? item.abstract.slice(0, 2_500)
        : null,
    keywords: Array.isArray(item.keywords)
      ? item.keywords.slice(0, 32)
      : [],
    citation_key: item.citation_key,
    source_kind: item.source_kind,
    metadata_verified_at: item.metadata_verified_at,
    ai_index_status: item.ai_index_status,
    linked_to_active_study: linkedIds.has(String(item.id)),
    updated_at: item.updated_at,
  }));

  // Keep request context bounded. Full-text is currently included only for a
  // small number of references already linked to this study. The next retrieval
  // step can broaden this through semantic indexing instead of dumping every PDF.
  const linkedForText = references
    .filter((reference) => reference.linked_to_active_study)
    .slice(0, 8)
    .map((reference) => String(reference.id));

  let fullText: Array<Record<string, unknown>> = [];

  if (linkedForText.length) {
    const { data: textRows, error: textError } = await supabase
      .from("reference_file_text")
      .select(
        "reference_id,reference_file_id,plain_text,page_count,char_count,extraction_method,updated_at",
      )
      .eq("owner_user_id", userId)
      .in("reference_id", linkedForText)
      .order("updated_at", { ascending: false })
      .limit(12);

    if (!textError) {
      fullText = (textRows || []).map((row) => ({
        reference_id: row.reference_id,
        reference_file_id: row.reference_file_id,
        page_count: row.page_count,
        char_count: row.char_count,
        extraction_method: row.extraction_method,
        text_excerpt:
          typeof row.plain_text === "string"
            ? row.plain_text.slice(0, 14_000)
            : "",
      }));
    }
  }

  return {
    total_library_items_loaded: references.length,
    study_linked_count: references.filter(
      (reference) => reference.linked_to_active_study,
    ).length,
    references,
    linked_reference_full_text_excerpts: fullText,
    note:
      "Global Reference Library metadata is supplied regardless of collection/subcollection. Full-text excerpts are bounded to a small set of study-linked PDFs in this phase.",
  };
}

function conversationTitleFromQuestion(question: string) {`,
);

// 3. Conversation records know which AI environment owns them.
replaceOnce(
  "verifyConversation environment field",
  '.select("id,study_id,title")',
  '.select("id,study_id,environment_id,title")',
);

replaceOnce(
  "ensureConversation environment argument",
  `  conversationId: string,
  studyId: string,
  firstQuestion: string,`,
  `  conversationId: string,
  studyId: string,
  environmentId: string,
  firstQuestion: string,`,
);

replaceOnce(
  "ensureConversation environment insert",
  `      study_id: studyId || null,
      document_id: null,`,
  `      study_id: studyId || null,
      environment_id: environmentId || null,
      document_id: null,`,
);

replaceOnce(
  "conversation bundle environment type",
  `  conversation: { id: string; study_id?: string | null; title?: string; created_at?: string; updated_at?: string },`,
  `  conversation: { id: string; study_id?: string | null; environment_id?: string | null; title?: string; created_at?: string; updated_at?: string },`,
);

// 4. GET: parse/validate selected environment before all history modes.
replaceOnce(
  "GET environment parsing",
  `    const mode = request.nextUrl.searchParams.get("mode") || "latest";

    if (mode === "list") {`,
  `    const mode = request.nextUrl.searchParams.get("mode") || "latest";
    const environmentId =
      request.nextUrl.searchParams.get("environment_id")?.trim() || "";

    let environmentStudyId = "";
    if (environmentId) {
      const { data: environment, error: environmentError } = await supabase
        .from("research_ai_environments")
        .select("id,study_id")
        .eq("id", environmentId)
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (environmentError || !environment) {
        return jsonError("This AI environment is not available to your account.", 404);
      }

      environmentStudyId = String(environment.study_id || "");
    }

    if (mode === "list") {`,
);

// list mode: turn query into mutable environment-filtered query.
replaceRegexOnce(
  "environment-scoped history list query",
  /      const \{ data: conversations, error: conversationError \} = await supabase\n        \.from\("research_ai_conversations"\)\n        \.select\("id,study_id,title,created_at,updated_at"\)\n        \.eq\("owner_user_id", user\.id\)\n        \.eq\("surface", "research"\)\n        \.is\("archived_at", null\)\n        \.order\("updated_at", \{ ascending: false \}\)\n        \.limit\(HISTORY_LIST_LIMIT\);/g,
  `      let conversationQuery = supabase
        .from("research_ai_conversations")
        .select("id,study_id,environment_id,title,created_at,updated_at")
        .eq("owner_user_id", user.id)
        .eq("surface", "research")
        .is("archived_at", null);

      conversationQuery = environmentId
        ? conversationQuery.eq("environment_id", environmentId)
        : conversationQuery.is("environment_id", null);

      const { data: conversations, error: conversationError } =
        await conversationQuery
          .order("updated_at", { ascending: false })
          .limit(HISTORY_LIST_LIMIT);`,
);

// conversation mode: prevent opening a chat from a different environment.
replaceOnce(
  "environment check when opening a saved conversation",
  `      const conversation = await verifyConversation(supabase, user.id, id);
      if (!conversation) return jsonError("This saved Research Assistant chat is no longer available.", 404);
      const bundle = await loadConversationBundle(supabase, user.id, conversation);`,
  `      const conversation = await verifyConversation(supabase, user.id, id);
      if (!conversation) return jsonError("This saved Research Assistant chat is no longer available.", 404);

      const conversationEnvironmentId = String(conversation.environment_id || "");
      if (
        (environmentId && conversationEnvironmentId !== environmentId) ||
        (!environmentId && conversationEnvironmentId)
      ) {
        return jsonError("This saved chat belongs to a different AI environment.", 404);
      }

      const bundle = await loadConversationBundle(supabase, user.id, conversation);`,
);

// latest mode: environment filtered.
replaceRegexOnce(
  "environment-scoped latest conversation query",
  /    const \{ data: conversation, error: conversationError \} = await supabase\n      \.from\("research_ai_conversations"\)\n      \.select\("id,study_id,title,created_at,updated_at"\)\n      \.eq\("owner_user_id", user\.id\)\n      \.eq\("surface", "research"\)\n      \.is\("archived_at", null\)\n      \.order\("updated_at", \{ ascending: false \}\)\n      \.limit\(1\)\n      \.maybeSingle\(\);/g,
  `    let latestConversationQuery = supabase
      .from("research_ai_conversations")
      .select("id,study_id,environment_id,title,created_at,updated_at")
      .eq("owner_user_id", user.id)
      .eq("surface", "research")
      .is("archived_at", null);

    latestConversationQuery = environmentId
      ? latestConversationQuery.eq("environment_id", environmentId)
      : latestConversationQuery.is("environment_id", null);

    const { data: conversation, error: conversationError } =
      await latestConversationQuery
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();`,
);

// 5. POST: validate environment and derive its study.
replaceOnce(
  "POST environment validation",
  `    const requestedConversationId = clipString(body.conversation_id, 80);

    if (operation === "pin_message" || operation === "unpin_message") {`,
  `    const requestedConversationId = clipString(body.conversation_id, 80);
    const environmentId = clipString(body.environment_id, 80);

    let environmentStudyId = "";
    if (environmentId) {
      const { data: environment, error: environmentError } = await supabase
        .from("research_ai_environments")
        .select("id,study_id")
        .eq("id", environmentId)
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (environmentError || !environment) {
        return jsonError("This AI environment is not available to your account.", 404);
      }

      environmentStudyId = String(environment.study_id || "");
    }

    if (operation === "pin_message" || operation === "unpin_message") {`,
);

// delete_unpinned_history only affects current environment.
replaceRegexOnce(
  "environment-scoped delete history query",
  /      const \{ data: conversations, error: conversationError \} = await supabase\n        \.from\("research_ai_conversations"\)\n        \.select\("id"\)\n        \.eq\("owner_user_id", user\.id\)\n        \.eq\("surface", "research"\)\n        \.is\("archived_at", null\);/g,
  `      let deleteHistoryQuery = supabase
        .from("research_ai_conversations")
        .select("id")
        .eq("owner_user_id", user.id)
        .eq("surface", "research")
        .is("archived_at", null);

      deleteHistoryQuery = environmentId
        ? deleteHistoryQuery.eq("environment_id", environmentId)
        : deleteHistoryQuery.is("environment_id", null);

      const { data: conversations, error: conversationError } =
        await deleteHistoryQuery;`,
);

// plan state must belong to active environment when supplied.
replaceOnce(
  "environment validation for plan state",
  `      const conversation = await verifyConversation(supabase, user.id, requestedConversationId);
      if (!conversation) return jsonError("This saved Research Assistant conversation is no longer available.", 404);
      const plan = operation === "save_plan_state" ? validatePlan(body.plan, true) : null;`,
  `      const conversation = await verifyConversation(supabase, user.id, requestedConversationId);
      if (!conversation) return jsonError("This saved Research Assistant conversation is no longer available.", 404);

      const conversationEnvironmentId = String(conversation.environment_id || "");
      if (
        (environmentId && conversationEnvironmentId !== environmentId) ||
        (!environmentId && conversationEnvironmentId)
      ) {
        return jsonError("This saved conversation belongs to a different AI environment.", 404);
      }

      const plan = operation === "save_plan_state" ? validatePlan(body.plan, true) : null;`,
);

// Environment study wins over whichever study happens to be open in the workspace.
replaceOnce(
  "environment-derived study ID",
  `    const studyId = typeof body.study_id === "string" ? body.study_id.trim() : "";`,
  `    const requestedStudyId =
      typeof body.study_id === "string" ? body.study_id.trim() : "";
    const studyId = environmentStudyId || requestedStudyId;`,
);

// 6. Inject Reference Library server context.
replaceOnce(
  "Reference Library server context",
  `    if (boolPermission(permissions, "studyStructure")) {
      serverContext.questionnaire_library = await loadServerQuestionnaireContext(supabase, user.id);
    }`,
  `    if (boolPermission(permissions, "referenceLibrary")) {
      serverContext.reference_library = await loadServerReferenceContext(
        supabase,
        user.id,
        studyId,
      );
    }

    if (boolPermission(permissions, "studyStructure")) {
      serverContext.questionnaire_library = await loadServerQuestionnaireContext(supabase, user.id);
    }`,
);

replaceOnce(
  "Reference Library permission summary",
  `      thesis: boolPermission(permissions, "thesis"),
      cognitive: boolPermission(permissions, "cognitive"),`,
  `      thesis: boolPermission(permissions, "thesis"),
      reference_library: boolPermission(permissions, "referenceLibrary"),
      cognitive: boolPermission(permissions, "cognitive"),`,
);

replaceOnce(
  "environment + Reference Library billing metadata",
  `        unifiedResearchAssistant: true,
        currentScreen,
        thesisContext: boolPermission(permissions, "thesis"),
        questionnaireContext: boolPermission(permissions, "studyStructure"),`,
  `        unifiedResearchAssistant: true,
        environmentId: environmentId || null,
        currentScreen,
        thesisContext: boolPermission(permissions, "thesis"),
        referenceLibraryContext: boolPermission(permissions, "referenceLibrary"),
        questionnaireContext: boolPermission(permissions, "studyStructure"),`,
);

// 7. Persist the environment ID on newly created conversations.
replaceOnce(
  "environment argument in ensureConversation call",
  `          requestedConversationId,
          studyId,
          latestUser?.content || "Research workflow",`,
  `          requestedConversationId,
          studyId,
          environmentId,
          latestUser?.content || "Research workflow",`,
);

replaceOnce(
  "environment ID in response",
  `        conversationId: conversationId || null,
        savedUserMessage,`,
  `        conversationId: conversationId || null,
        environmentId: environmentId || null,
        savedUserMessage,`,
);

// Safety checks.
for (const required of [
  VERSION_MARKER,
  "loadServerReferenceContext",
  "reference_library",
  "research_ai_environments",
  "environment_id: environmentId || null",
  "latestConversationQuery",
  "deleteHistoryQuery",
]) {
  if (!source.includes(required)) fail(`final safety check: ${required}`);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Step 5A v2 server patch installed successfully.");
console.log("Modified: app/api/psylattice-copilot/route.ts");
