"use client";

export type PsyLatticeCopilotSurface =
  | "research"
  | "analysis"
  | "thesis"
  | "study_builder"
  | "data_explorer"
  | "cognitive"
  | "cognitive_builder"
  | "questionnaire"
  | "ambulatory"
  | "export"
  | "workspace";

export type PsyLatticeCopilotContextEnvelope = {
  surface: PsyLatticeCopilotSurface;
  label: string;
  studyId?: string;
  studyTitle?: string;
  publicContext?: Record<string, unknown>;
  participantContext?: Record<string, unknown>;
  directIdentifierContext?: Record<string, unknown>;
  active: boolean;
  updatedAt: string;
};

type Store = Record<string, PsyLatticeCopilotContextEnvelope>;

const STORE_KEY = "__psylatticeCopilotContextStoreV2";
const EVENT_NAME = "psylattice-copilot-context-change";

function globalStore(): Store {
  if (typeof window === "undefined") return {};
  const target = window as typeof window & { [STORE_KEY]?: Store };
  if (!target[STORE_KEY]) target[STORE_KEY] = {};
  return target[STORE_KEY] as Store;
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function publishCopilotContext(
  envelope: Omit<PsyLatticeCopilotContextEnvelope, "active" | "updatedAt">,
) {
  if (typeof window === "undefined") return;
  globalStore()[envelope.surface] = {
    ...envelope,
    active: true,
    updatedAt: new Date().toISOString(),
  };
  emit();
}

/**
 * Keep the last-known context for continuity when the researcher navigates away.
 * It is marked inactive so Copilot knows it is a snapshot rather than live state.
 * The store is memory-only and disappears when the browser page is reloaded.
 */
export function deactivateCopilotContext(surface: PsyLatticeCopilotSurface) {
  if (typeof window === "undefined") return;
  const current = globalStore()[surface];
  if (!current) return;
  globalStore()[surface] = { ...current, active: false };
  emit();
}

export function removeCopilotContext(surface: PsyLatticeCopilotSurface) {
  if (typeof window === "undefined") return;
  delete globalStore()[surface];
  emit();
}

export function clearCopilotContexts() {
  if (typeof window === "undefined") return;
  const store = globalStore();
  Object.keys(store).forEach((key) => delete store[key]);
  emit();
}

export function getCopilotContextSnapshot(): Store {
  if (typeof window === "undefined") return {};
  return { ...globalStore() };
}

export function subscribeCopilotContext(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
