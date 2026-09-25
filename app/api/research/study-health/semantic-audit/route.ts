import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  AiAccessError,
  completeResearchAiRequest,
  prepareResearchAiRequest,
  refundResearchAiRequest,
} from "@/lib/billing/ai";
import { buildThesisCitationAuditContext } from "@/lib/research/health/ai/citationScanner";
import { buildThesisWritingAuditContext } from "@/lib/research/health/ai/writingScanner";
import { buildResearchLogicAuditContext } from "@/lib/research/health/ai/researchLogicContext";
import { loadReferenceAuditContext } from "@/lib/research/health/ai/referenceContext";
import {
  runResearchLogicAudit,
  runThesisCitationSemanticAudit,
  runThesisWritingQualityAudit,
} from "@/lib/research/health/ai/auditRunner";
import { validateResearchLogicFindings } from "@/lib/research/health/ai/researchLogicAudit";
import { validateThesisCitationFindings } from "@/lib/research/health/ai/thesisCitationAudit";
import { validateWritingQualityFindings } from "@/lib/research/health/ai/writingQualityAudit";
import type {
  ResearchLogicAuditContext,
  SemanticAuditType,
  ThesisCitationAuditContext,
  ThesisWritingAuditContext,
  ValidatedSemanticFinding,
} from "@/lib/research/health/ai/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reply(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function validAuditType(value: unknown): SemanticAuditType {
  if (value === "thesis_writing_quality") return "thesis_writing_quality";
  if (value === "research_logic") return "research_logic";
  return "thesis_citation_coverage";
}

function defaultReferenceContext() {
  return {
    permitted: false,
    totalLibraryItems: 0,
    suppliedItems: [] as Awaited<
      ReturnType<typeof loadReferenceAuditContext>
    >["suppliedItems"],
    linkedItems: 0,
    extractedTextItems: 0,
  };
}

function responseMessage(
  auditType: SemanticAuditType,
  findings: number,
) {
  if (auditType === "thesis_citation_coverage") {
    return findings > 0
      ? `AI citation review produced ${findings} review prompt${
          findings === 1 ? "" : "s"
        }.`
      : "AI citation review found no high-confidence citation-review prompts in the audited candidate paragraphs.";
  }

  if (auditType === "thesis_writing_quality") {
    return findings > 0
      ? `AI writing-quality review produced ${findings} focused revision prompt${
          findings === 1 ? "" : "s"
        }.`
      : "AI writing-quality review found no high-confidence passage-level issues in the audited prose.";
  }

  return findings > 0
    ? `AI research-logic review produced ${findings} cross-module review prompt${
        findings === 1 ? "" : "s"
      }.`
    : "AI research-logic review found no high-confidence cross-module inconsistency in the supplied saved evidence.";
}

export async function POST(request: NextRequest) {
  let runId = "";
  let userId = "";
  let reservation: Awaited<ReturnType<typeof prepareResearchAiRequest>> | null =
    null;

  try {
    const body = await request.json().catch(() => null);
    const studyId = String(body?.studyId || "").trim();
    const auditType = validAuditType(body?.auditType);
    const includeReferenceLibrary =
      auditType === "thesis_citation_coverage" &&
      body?.includeReferenceLibrary === true;

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    userId = user.id;

    const { data: study, error: studyError } = await supabase
      .from("research_studies")
      .select(
        "id,title,design,status,target_sample_size,participant_description,components,study_config",
      )
      .eq("id", studyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (studyError) throw studyError;
    if (!study) {
      return reply(
        { ok: false, error: "This study is not available to your account." },
        404,
      );
    }

    const { data: documents, error: documentError } = await supabase
      .from("research_writing_documents")
      .select("id,title,content_text,updated_at")
      .eq("owner_user_id", user.id)
      .eq("study_id", studyId)
      .order("updated_at", { ascending: false })
      .limit(40);

    if (documentError) throw documentError;

    const documentRows = (documents || []) as Array<{
      id: string;
      title: string;
      content_text: string | null;
    }>;

    let context:
      | ThesisCitationAuditContext
      | ThesisWritingAuditContext
      | ResearchLogicAuditContext;

    const referenceLibrary = defaultReferenceContext();

    if (auditType === "thesis_citation_coverage") {
      const thesis = buildThesisCitationAuditContext({
        studyId,
        studyTitle: study.title || "Untitled study",
        documents: documentRows,
      });

      const references = await loadReferenceAuditContext({
        supabase,
        userId: user.id,
        studyId,
        paragraphs: thesis.paragraphs,
        permitted: includeReferenceLibrary,
      });

      referenceLibrary.permitted = references.permitted;
      referenceLibrary.totalLibraryItems = references.totalLibraryItems;
      referenceLibrary.suppliedItems = references.suppliedItems;
      referenceLibrary.linkedItems = references.linkedItems;
      referenceLibrary.extractedTextItems = references.extractedTextItems;

      context = {
        ...thesis,
        referenceLibrary,
      };
    } else if (auditType === "thesis_writing_quality") {
      context = buildThesisWritingAuditContext({
        studyId,
        studyTitle: study.title || "Untitled study",
        studyDesign: study.design || null,
        documents: documentRows,
      });
    } else {
      context = await buildResearchLogicAuditContext({
        supabase,
        userId: user.id,
        study: {
          id: study.id,
          title: study.title || "Untitled study",
          design: study.design || null,
          status: study.status || "draft",
          target_sample_size: study.target_sample_size,
          participant_description: study.participant_description,
          components:
            (study.components || {}) as Record<string, unknown>,
          study_config:
            (study.study_config || {}) as Record<string, unknown>,
        },
        documents: documentRows,
      });
    }

    const analysisRecordCount =
      auditType === "research_logic"
        ? (context as ResearchLogicAuditContext).analyses.length
        : 0;

    const evidenceUnits =
      context.paragraphs.length + analysisRecordCount;

    const { data: run, error: runError } = await supabase
      .from("research_health_audit_runs")
      .insert({
        owner_user_id: user.id,
        study_id: studyId,
        audit_type: auditType,
        status: evidenceUnits > 0 ? "running" : "completed",
        document_count: context.documentCount,
        candidate_paragraph_count: context.paragraphs.length,
        audited_chars: context.auditedChars,
        truncated: context.truncated,
        finding_count: 0,
        coverage_json: {
          semanticAuditRequested: evidenceUnits > 0,
          auditType,
          documentCount: context.documentCount,
          paragraphCount: context.paragraphs.length,
          analysisRecordCount,
          referenceLibraryPermitted: referenceLibrary.permitted,
          referenceItemsSupplied: referenceLibrary.suppliedItems.length,
          linkedReferenceItems: referenceLibrary.linkedItems,
          referenceItemsWithExtractedText:
            referenceLibrary.extractedTextItems,
        },
        completed_at:
          evidenceUnits > 0 ? null : new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runError) throw runError;
    runId = String(run.id);

    if (evidenceUnits === 0) {
      return reply({
        ok: true,
        auditType,
        runId,
        findingCount: 0,
        message:
          auditType === "research_logic"
            ? "No linked Thesis prose or persisted Analysis Lab record is available for cross-module logic review yet, so no AI allowance was charged."
            : "No eligible linked Thesis text is available for this review, so no AI allowance was charged.",
      });
    }

    const routeDefaultModel =
      process.env.PSYLATTICE_RESEARCH_AI_MODEL ||
      process.env.PSYLATTICE_AI_GUIDE_MODEL ||
      "gpt-5.6";

    const referenceChars = referenceLibrary.suppliedItems.reduce(
      (sum, item) =>
        sum +
        item.title.length +
        (item.abstract?.length || 0) +
        (item.extractedText?.length || 0),
      0,
    );

    const researchLogicChars =
      auditType === "research_logic"
        ? (context as ResearchLogicAuditContext).analysisContextChars
        : 0;

    reservation = await prepareResearchAiRequest({
      userId: user.id,
      surface: "writing-assistant",
      studyId,
      routeDefaultModel,
      contextChars:
        context.auditedChars + referenceChars + researchLogicChars,
      messages: [
        {
          content:
            auditType === "thesis_citation_coverage"
              ? "Study Health semantic audit: Thesis citation coverage review."
              : auditType === "thesis_writing_quality"
                ? "Study Health semantic audit: Thesis academic writing-quality review."
                : "Study Health semantic audit: cross-module research-logic review.",
        },
      ],
      metadata: {
        studyHealthAudit: true,
        auditType,
        documentCount: context.documentCount,
        candidateParagraphs: context.paragraphs.length,
        analysisRecordCount,
        truncated: context.truncated,
        referenceLibraryPermitted: referenceLibrary.permitted,
        referenceItemsSupplied: referenceLibrary.suppliedItems.length,
      },
    });

    let execution;
    try {
      if (auditType === "thesis_citation_coverage") {
        execution = await runThesisCitationSemanticAudit({
          provider: reservation.provider,
          providerModel: reservation.providerModel,
          context: context as ThesisCitationAuditContext,
        });
      } else if (auditType === "thesis_writing_quality") {
        execution = await runThesisWritingQualityAudit({
          provider: reservation.provider,
          providerModel: reservation.providerModel,
          context: context as ThesisWritingAuditContext,
        });
      } else {
        execution = await runResearchLogicAudit({
          provider: reservation.provider,
          providerModel: reservation.providerModel,
          context: context as ResearchLogicAuditContext,
        });
      }
    } catch (providerError) {
      await refundResearchAiRequest(
        user.id,
        reservation.usageId,
        "study_health_semantic_audit_provider_failure",
      );
      reservation = null;
      throw providerError;
    }

    const rawText = execution.rawText.trim();
    if (!rawText) {
      await refundResearchAiRequest(
        user.id,
        reservation.usageId,
        "study_health_semantic_audit_empty_response",
      );
      reservation = null;
      throw new Error("AI_AUDIT_EMPTY_RESPONSE");
    }

    let findings: ValidatedSemanticFinding[];
    try {
      if (auditType === "thesis_citation_coverage") {
        findings = validateThesisCitationFindings({
          rawText,
          context: context as ThesisCitationAuditContext,
        });
      } else if (auditType === "thesis_writing_quality") {
        findings = validateWritingQualityFindings({
          rawText,
          context: context as ThesisWritingAuditContext,
        });
      } else {
        findings = validateResearchLogicFindings({
          rawText,
          context: context as ResearchLogicAuditContext,
        });
      }
    } catch (parseError) {
      await refundResearchAiRequest(
        user.id,
        reservation.usageId,
        "study_health_semantic_audit_invalid_response",
      );
      reservation = null;
      throw parseError;
    }

    const now = new Date().toISOString();

    const { error: supersedeError } = await supabase
      .from("research_health_ai_findings")
      .update({ status: "superseded" })
      .eq("owner_user_id", user.id)
      .eq("study_id", studyId)
      .eq("audit_type", auditType)
      .eq("status", "active");

    if (supersedeError) throw supersedeError;

    if (findings.length > 0) {
      const rows = findings.map((finding) => ({
        run_id: runId,
        owner_user_id: user.id,
        study_id: studyId,
        audit_type: auditType,
        finding_key: finding.findingKey,
        category: finding.category,
        status: "active",
        severity: finding.severity,
        confidence: finding.confidence,
        title: finding.title,
        detail: finding.detail,
        reason: finding.reason,
        suggested_action: finding.suggestedAction,
        document_id: finding.documentId,
        paragraph_index: finding.paragraphIndex,
        quote_text: finding.quoteText,
        source_excerpt: finding.sourceExcerpt,
        target_screen: finding.targetScreen,
        metadata: finding.metadata,
      }));

      const { error: findingError } = await supabase
        .from("research_health_ai_findings")
        .insert(rows);

      if (findingError) throw findingError;
    }

    const { error: updateRunError } = await supabase
      .from("research_health_audit_runs")
      .update({
        status: "completed",
        provider: execution.provider,
        provider_model: execution.providerModel,
        model_key: reservation.modelKey,
        finding_count: findings.length,
        input_tokens: execution.inputTokens,
        output_tokens: execution.outputTokens,
        completed_at: now,
        coverage_json: {
          auditType,
          validFindings: findings.length,
          documentCount: context.documentCount,
          paragraphCount: context.paragraphs.length,
          analysisRecordCount,
          auditedChars: context.auditedChars,
          truncated: context.truncated,
          referenceLibraryPermitted: referenceLibrary.permitted,
          referenceItemsSupplied: referenceLibrary.suppliedItems.length,
          linkedReferenceItems: referenceLibrary.linkedItems,
          referenceItemsWithExtractedText:
            referenceLibrary.extractedTextItems,
        },
      })
      .eq("id", runId)
      .eq("owner_user_id", user.id);

    if (updateRunError) throw updateRunError;

    try {
      await completeResearchAiRequest(user.id, reservation.usageId, {
        inputTokens: execution.inputTokens,
        outputTokens: execution.outputTokens,
        metadata: {
          outcome: "success",
          studyHealthAudit: true,
          auditType,
          findings: findings.length,
          candidateParagraphs: context.paragraphs.length,
          analysisRecordCount,
          referenceLibraryPermitted: referenceLibrary.permitted,
          referenceItemsSupplied: referenceLibrary.suppliedItems.length,
        },
      });
    } catch (billingCompletionError) {
      console.error(
        "Study Health semantic audit billing completion failed:",
        billingCompletionError,
      );
    }

    return reply({
      ok: true,
      auditType,
      runId,
      findingCount: findings.length,
      provider: execution.provider,
      providerModel: execution.providerModel,
      remainingPercent: reservation.remainingPercent,
      coverage: {
        documentCount: context.documentCount,
        paragraphs: context.paragraphs.length,
        analysisRecordCount,
        auditedChars: context.auditedChars,
        truncated: context.truncated,
        referenceLibraryPermitted: referenceLibrary.permitted,
        referenceItemsSupplied: referenceLibrary.suppliedItems.length,
      },
      message: responseMessage(auditType, findings.length),
    });
  } catch (error) {
    console.error("Study Health semantic audit failed:", error);

    if (reservation && userId) {
      try {
        await refundResearchAiRequest(
          userId,
          reservation.usageId,
          "study_health_semantic_audit_processing_failure",
        );
      } catch (refundError) {
        console.error("Study Health semantic audit refund failed:", refundError);
      }
    }

    if (runId) {
      try {
        const supabase = await createServerSupabase();
        await supabase
          .from("research_health_audit_runs")
          .update({
            status: "failed",
            error_code:
              error instanceof AiAccessError
                ? error.code
                : messageFromError(error).slice(0, 120),
            error_message: messageFromError(error).slice(0, 700),
            completed_at: new Date().toISOString(),
          })
          .eq("id", runId);
      } catch (runUpdateError) {
        console.error(
          "Could not mark semantic audit run failed:",
          runUpdateError,
        );
      }
    }

    if (error instanceof AiAccessError) {
      return reply(
        { ok: false, error: error.message, code: error.code },
        error.status,
      );
    }

    const message = messageFromError(error);
    if (message === "AI_AUDIT_INVALID_JSON") {
      return reply(
        {
          ok: false,
          error:
            "The AI review response could not be validated safely. Your AI allowance was restored for this attempt.",
        },
        502,
      );
    }

    if (message === "AI_AUDIT_EMPTY_RESPONSE") {
      return reply(
        {
          ok: false,
          error:
            "The AI review returned an empty response. Your AI allowance was restored for this attempt.",
        },
        502,
      );
    }

    return reply(
      {
        ok: false,
        error:
          "PsyLattice could not complete this AI research review right now.",
      },
      500,
    );
  }
}
