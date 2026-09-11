/**
 * PsyLattice researcher plan definitions.
 *
 * This file contains customer-safe plan rules only. Do not put provider secrets,
 * internal AI unit counts, model costs or private billing data here.
 */

export type ResearchPlanTier =
  | "free"
  | "study-pass"
  | "pro-monthly"
  | "pro-annual";

export type AiAllowanceLabel = "Starter" | "Standard" | "High" | "Extended";
export type AiModelAccess = "auto-only" | "selected" | "full";

export type ResearchPlanDefinition = {
  id: ResearchPlanTier;
  name: string;
  billingLabel: string;
  maxSimultaneousStudies: number;
  participantsPerStudy: number;
  aiAllowanceLabel: AiAllowanceLabel;
  aiModelAccess: AiModelAccess;
  mediaUploadsAllowed: boolean;
  includedMediaBytes: number;
  includedParticipantEmails: number;
  canBuyAddons: boolean;
};

const GIB = 1024 ** 3;

export const RESEARCH_PLAN_DEFINITIONS: Record<ResearchPlanTier, ResearchPlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    billingLabel: "Free",
    maxSimultaneousStudies: 1,
    participantsPerStudy: 50,
    aiAllowanceLabel: "Starter",
    aiModelAccess: "auto-only",
    mediaUploadsAllowed: false,
    includedMediaBytes: 0,
    includedParticipantEmails: 100,
    canBuyAddons: false,
  },
  "study-pass": {
    id: "study-pass",
    name: "Study Pass",
    billingLabel: "Per study",
    maxSimultaneousStudies: 1,
    participantsPerStudy: 100,
    aiAllowanceLabel: "Standard",
    aiModelAccess: "selected",
    mediaUploadsAllowed: false,
    includedMediaBytes: 0,
    includedParticipantEmails: 500,
    canBuyAddons: true,
  },
  "pro-monthly": {
    id: "pro-monthly",
    name: "Pro Monthly",
    billingLabel: "Monthly",
    maxSimultaneousStudies: 3,
    participantsPerStudy: 300,
    aiAllowanceLabel: "High",
    aiModelAccess: "full",
    mediaUploadsAllowed: true,
    includedMediaBytes: 2 * GIB,
    includedParticipantEmails: 3_000,
    canBuyAddons: true,
  },
  "pro-annual": {
    id: "pro-annual",
    name: "Pro Annual",
    billingLabel: "Annual",
    maxSimultaneousStudies: 3,
    participantsPerStudy: 500,
    aiAllowanceLabel: "Extended",
    aiModelAccess: "full",
    mediaUploadsAllowed: true,
    includedMediaBytes: 5 * GIB,
    includedParticipantEmails: 6_000,
    canBuyAddons: true,
  },
};

export function researchPlanDefinition(tier: ResearchPlanTier) {
  return RESEARCH_PLAN_DEFINITIONS[tier];
}
