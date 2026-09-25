import "server-only";

import { generatePsyLatticeAiResponse } from "@/lib/ai/provider";
import type { ResearchAiProvider } from "@/lib/billing/ai";
import type {
  SemanticAuditExecution,
  ResearchLogicAuditContext,
  ThesisCitationAuditContext,
  ThesisWritingAuditContext,
} from "@/lib/research/health/ai/types";
import { THESIS_CITATION_AUDIT_INSTRUCTIONS } from "@/lib/research/health/ai/thesisCitationAudit";
import { THESIS_WRITING_QUALITY_INSTRUCTIONS } from "@/lib/research/health/ai/writingQualityAudit";
import { RESEARCH_LOGIC_AUDIT_INSTRUCTIONS } from "@/lib/research/health/ai/researchLogicAudit";

export async function runThesisCitationSemanticAudit(args: {
  provider: ResearchAiProvider;
  providerModel: string;
  context: ThesisCitationAuditContext;
}): Promise<SemanticAuditExecution> {
  const payload = JSON.stringify({
    study: {
      id: args.context.studyId,
      title: args.context.studyTitle,
    },
    auditCoverage: {
      documentCount: args.context.documentCount,
      candidateParagraphs: args.context.paragraphs.length,
      auditedChars: args.context.auditedChars,
      truncated: args.context.truncated,
    },
    referenceLibrary: args.context.referenceLibrary,
    paragraphs: args.context.paragraphs,
  });

  const response = await generatePsyLatticeAiResponse({
    provider: args.provider,
    providerModel: args.providerModel,
    instructions: THESIS_CITATION_AUDIT_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content:
          "Audit the supplied Thesis candidate paragraphs for potential uncited external scholarly claims. When permitted Reference Manager context is supplied, use it only to identify possible references worth reviewing; never invent support.\n\n" +
          payload,
      },
    ],
    maxOutputTokens: 4_000,
  });

  return {
    provider: response.provider,
    providerModel: response.providerModel,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    rawText: response.text,
  };
}

export async function runThesisWritingQualityAudit(args: {
  provider: ResearchAiProvider;
  providerModel: string;
  context: ThesisWritingAuditContext;
}): Promise<SemanticAuditExecution> {
  const payload = JSON.stringify({
    study: {
      id: args.context.studyId,
      title: args.context.studyTitle,
      design: args.context.studyDesign,
    },
    auditCoverage: {
      documentCount: args.context.documentCount,
      paragraphs: args.context.paragraphs.length,
      auditedChars: args.context.auditedChars,
      truncated: args.context.truncated,
    },
    paragraphs: args.context.paragraphs,
  });

  const response = await generatePsyLatticeAiResponse({
    provider: args.provider,
    providerModel: args.providerModel,
    instructions: THESIS_WRITING_QUALITY_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content:
          "Review the supplied Thesis prose for high-value academic writing improvements. Return only validated passage-level issues worth the researcher's attention.\n\n" +
          payload,
      },
    ],
    maxOutputTokens: 4_600,
  });

  return {
    provider: response.provider,
    providerModel: response.providerModel,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    rawText: response.text,
  };
}


export async function runResearchLogicAudit(args: {
  provider: ResearchAiProvider;
  providerModel: string;
  context: ResearchLogicAuditContext;
}): Promise<SemanticAuditExecution> {
  const payload = JSON.stringify({
    study: args.context.study,
    participantSummary: args.context.participants,
    auditCoverage: {
      documentCount: args.context.documentCount,
      thesisParagraphs: args.context.paragraphs.length,
      auditedChars: args.context.auditedChars,
      truncated: args.context.truncated,
      persistedAnalysisRecords: args.context.analyses.length,
    },
    analyses: args.context.analyses,
    thesisParagraphs: args.context.paragraphs,
  });

  const response = await generatePsyLatticeAiResponse({
    provider: args.provider,
    providerModel: args.providerModel,
    instructions: RESEARCH_LOGIC_AUDIT_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content:
          "Review the supplied PsyLattice study configuration, aggregate participant state, persisted Analysis Lab records and linked Thesis passages for high-value cross-module research-logic inconsistencies. Use only the supplied evidence and return cautious review prompts.\n\n" +
          payload,
      },
    ],
    maxOutputTokens: 5_200,
  });

  return {
    provider: response.provider,
    providerModel: response.providerModel,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    rawText: response.text,
  };
}
