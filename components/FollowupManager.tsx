"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type FollowupManagerProps = {
  preferredStudyId: string;
  onStudyIdChange: (studyId: string) => void;
  onBack: () => void;
  onBuildQuestionnaire: () => void;
};

type FollowupStudy = {
  id: string;
  title: string;
  status: string;
  components: Record<string, boolean>;
};

type CatalogueItem = {
  id: string;
  name: string;
  acronym: string | null;
  category: string;
  description: string;
  item_count: number;
  estimated_minutes: number | null;
  owner_user_id: string | null;
  source_type: string;
  current_version_id: string | null;
  current_version_label: string | null;
};

type MeasureDraft = {
  id: string;
  questionnaire_id: string;
  questionnaire_version_id: string;
  name: string;
  acronym: string | null;
  category: string;
  source_type: string;
  version_label: string;
  required: boolean;
};

type WaveDraft = {
  id: string;
  name: string;
  description: string;
  position: number;
  timing_mode:
    | "days_after_completion"
    | "fixed_date"
    | "manual";
  delay_days: number;
  fixed_send_at: string;
  completion_window_days: number;
  reminder_offsets_text: string;
  auto_send: boolean;
  status: "draft" | "active" | "paused";
  measures: MeasureDraft[];
};

type FollowupParticipant = {
  id: string;
  public_id: string;
  is_test: boolean;
  status: string;
  baseline_completed_at: string | null;
  initial_study_completed_at: string | null;
};

type FollowupContact = {
  participant_id: string;
  email: string | null;
  consented: boolean;
  consented_at: string | null;
  withdrawn_at: string | null;
};

type FollowupInvitation = {
  id: string;
  wave_id: string;
  participant_id: string;
  status:
    | "scheduled"
    | "sent"
    | "opened"
    | "completed"
    | "cancelled"
    | "expired";
  scheduled_for: string;
  expires_at: string | null;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  reminder_count: number;
  last_reminded_at: string | null;
};

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Status({
  children,
  type = "neutral",
}: {
  children: ReactNode;
  type?: "neutral" | "success" | "warning" | "accent";
}) {
  const classes = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    accent: "bg-cyan-50 text-cyan-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${classes[type]}`}
    >
      {children}
    </span>
  );
}

function makeLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function parseReminderOffsets(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((part) => Number(part.trim()))
        .filter(
          (number) =>
            Number.isInteger(number) &&
            number >= 0
        )
    )
  ).sort((a, b) => a - b);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

function toLocalDateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000
  );

  return local.toISOString().slice(0, 16);
}

export default function FollowupManager({
  preferredStudyId,
  onStudyIdChange,
  onBack,
  onBuildQuestionnaire,
}: FollowupManagerProps) {
  const [studies, setStudies] = useState<FollowupStudy[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);
  const [waves, setWaves] = useState<WaveDraft[]>([]);
  const [selectedWaveId, setSelectedWaveId] = useState("");
  const [participants, setParticipants] = useState<
    FollowupParticipant[]
  >([]);
  const [contacts, setContacts] = useState<FollowupContact[]>([]);
  const [invitations, setInvitations] = useState<
    FollowupInvitation[]
  >([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deliveryBusy, setDeliveryBusy] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedStudy = useMemo(
    () =>
      studies.find(
        (study) => study.id === selectedStudyId
      ) || null,
    [studies, selectedStudyId]
  );

  const selectedWave = useMemo(
    () =>
      waves.find(
        (wave) => wave.id === selectedWaveId
      ) || null,
    [waves, selectedWaveId]
  );

  const selectedWaveInvitations = useMemo(
    () =>
      selectedWave
        ? invitations.filter(
            (invitation) =>
              invitation.wave_id === selectedWave.id
          )
        : [],
    [invitations, selectedWave]
  );

  const selectedWaveLocked = selectedWaveInvitations.some(
    (invitation) =>
      ["sent", "opened", "completed"].includes(
        invitation.status
      )
  );

  const eligibleParticipants = participants.filter(
    (participant) =>
      participant.status !== "withdrawn" &&
      participant.initial_study_completed_at
  );

  const filteredCatalogue = catalogue.filter(
    (questionnaire) => {
      const q = search.trim().toLowerCase();

      if (!q) return true;

      return [
        questionnaire.name,
        questionnaire.acronym || "",
        questionnaire.category,
        questionnaire.description,
      ].some((value) =>
        value.toLowerCase().includes(q)
      );
    }
  );

  async function loadCatalogue() {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    const { data: questionnaireData, error } =
      await supabase
        .from("questionnaires")
        .select(
          "id, name, acronym, category, description, item_count, estimated_minutes, owner_user_id, source_type"
        )
        .eq("status", "active")
        .or(
          `researcher_available.eq.true,owner_user_id.eq.${user.id}`
        )
        .order("name", { ascending: true });

    if (error) {
      console.error(
        "Could not load follow-up questionnaire catalogue:",
        error
      );
      return;
    }

    const rows = questionnaireData || [];
    const ids = rows.map((row) => row.id);

    let versions: Array<{
      id: string;
      questionnaire_id: string;
      version_label: string;
    }> = [];

    if (ids.length > 0) {
      const { data: versionData, error: versionError } =
        await supabase
          .from("questionnaire_versions")
          .select(
            "id, questionnaire_id, version_label"
          )
          .in("questionnaire_id", ids)
          .eq("is_current", true);

      if (!versionError) {
        versions = versionData || [];
      }
    }

    const versionMap = new Map(
      versions.map((version) => [
        version.questionnaire_id,
        version,
      ])
    );

    setCatalogue(
      rows.map((questionnaire) => {
        const version = versionMap.get(questionnaire.id);

        return {
          ...questionnaire,
          current_version_id: version?.id || null,
          current_version_label:
            version?.version_label || null,
        } as CatalogueItem;
      })
    );
  }

  async function loadStudies() {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "Your research studies could not be loaded."
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("research_studies")
      .select("id, title, status, components")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      setErrorMessage(
        "Your research studies could not be loaded."
      );
      setLoading(false);
      return;
    }

    const rows = ((data || []) as FollowupStudy[]).filter(
      (study) =>
        Boolean(
          study.components?.followup
        )
    );

    setStudies(rows);

    setSelectedStudyId((current) => {
      if (
        rows.some((study) => study.id === current)
      ) {
        return current;
      }

      if (
        preferredStudyId &&
        rows.some(
          (study) => study.id === preferredStudyId
        )
      ) {
        return preferredStudyId;
      }

      return rows[0]?.id || "";
    });
  }

  async function loadStudyFollowups(studyId: string) {
    if (!studyId) return;

    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const [
      waveResult,
      measureResult,
      participantResult,
      contactResult,
      invitationResult,
    ] = await Promise.all([
      supabase
        .from("study_followup_waves")
        .select(
          "id, name, description, position, timing_mode, delay_days, fixed_send_at, completion_window_days, reminder_offsets_days, auto_send, status"
        )
        .eq("study_id", studyId)
        .order("position", { ascending: true }),

      supabase
        .from("study_measures")
        .select(
          "id, followup_wave_id, questionnaire_id, questionnaire_version_id, position, required, config"
        )
        .eq("study_id", studyId)
        .not("followup_wave_id", "is", null)
        .order("position", { ascending: true }),

      supabase
        .from("study_participants")
        .select(
          "id, public_id, is_test, status, baseline_completed_at, initial_study_completed_at"
        )
        .eq("study_id", studyId)
        .order("enrolled_at", { ascending: true }),

      supabase
        .from("study_followup_contacts")
        .select(
          "participant_id, email, consented, consented_at, withdrawn_at"
        )
        .eq("study_id", studyId),

      supabase
        .from("study_followup_invitations")
        .select(
          "id, wave_id, participant_id, status, scheduled_for, expires_at, sent_at, opened_at, completed_at, reminder_count, last_reminded_at"
        )
        .eq("study_id", studyId)
        .order("scheduled_for", { ascending: false }),
    ]);

    const firstError = [
      waveResult,
      measureResult,
      participantResult,
      contactResult,
      invitationResult,
    ].find((result) => result.error)?.error;

    if (firstError) {
      console.error(
        "Could not load Follow-up Manager:",
        firstError
      );
      setErrorMessage(
        "The Follow-up Manager could not be loaded. Run the Research Follow-up Waves migration first."
      );
      setLoading(false);
      return;
    }

    const measureRows = measureResult.data || [];

    const loadedWaves = (waveResult.data || []).map(
      (wave: any) => ({
        id: wave.id,
        name: wave.name,
        description: wave.description || "",
        position: Number(wave.position || 1),
        timing_mode: wave.timing_mode,
        delay_days: Number(wave.delay_days || 0),
        fixed_send_at: toLocalDateTimeInput(
          wave.fixed_send_at
        ),
        completion_window_days: Number(
          wave.completion_window_days || 7
        ),
        reminder_offsets_text: Array.isArray(
          wave.reminder_offsets_days
        )
          ? wave.reminder_offsets_days.join(", ")
          : "2, 5",
        auto_send: Boolean(wave.auto_send),
        status: wave.status,
        measures: measureRows
          .filter(
            (measure: any) =>
              measure.followup_wave_id === wave.id
          )
          .map((measure: any) => ({
            id: measure.id,
            questionnaire_id:
              measure.questionnaire_id,
            questionnaire_version_id:
              measure.questionnaire_version_id,
            name:
              measure.config
                ?.questionnaire_name_snapshot ||
              "Questionnaire",
            acronym:
              measure.config
                ?.questionnaire_acronym_snapshot ||
              null,
            category:
              measure.config?.category ||
              "Questionnaire",
            source_type:
              measure.config?.source_type ||
              "catalogue",
            version_label:
              measure.config
                ?.version_label_snapshot ||
              "Saved version",
            required: measure.required !== false,
          })),
      })
    ) as WaveDraft[];

    setWaves(loadedWaves);
    setParticipants(
      (participantResult.data ||
        []) as FollowupParticipant[]
    );
    setContacts(
      (contactResult.data || []) as FollowupContact[]
    );
    setInvitations(
      (invitationResult.data ||
        []) as FollowupInvitation[]
    );

    setSelectedWaveId((current) =>
      loadedWaves.some(
        (wave) => wave.id === current
      )
        ? current
        : loadedWaves[0]?.id || ""
    );

    setLoading(false);
  }

  useEffect(() => {
    void Promise.all([
      loadStudies(),
      loadCatalogue(),
    ]);
  }, []);

  useEffect(() => {
    if (!selectedStudyId) return;

    onStudyIdChange(selectedStudyId);
    void loadStudyFollowups(selectedStudyId);
  }, [selectedStudyId]);

  function updateSelectedWave(
    patch: Partial<WaveDraft>
  ) {
    if (!selectedWave) return;

    setWaves((previous) =>
      previous.map((wave) =>
        wave.id === selectedWave.id
          ? { ...wave, ...patch }
          : wave
      )
    );
  }

  function addWave() {
    const nextPosition =
      waves.length > 0
        ? Math.max(
            ...waves.map((wave) => wave.position)
          ) + 1
        : 1;

    const id = makeLocalId("wave-local");

    setWaves((previous) => [
      ...previous,
      {
        id,
        name: `Follow-up ${nextPosition}`,
        description: "",
        position: nextPosition,
        timing_mode: "days_after_completion",
        delay_days: 14,
        fixed_send_at: "",
        completion_window_days: 7,
        reminder_offsets_text: "2, 5",
        auto_send: true,
        status: "draft",
        measures: [],
      },
    ]);

    setSelectedWaveId(id);
    setMessage("");
    setErrorMessage("");
  }

  function addMeasure(
    questionnaire: CatalogueItem
  ) {
    if (!selectedWave) return;

    if (selectedWaveLocked) {
      setErrorMessage(
        "Questionnaire selection is locked because an invitation for this wave has already been sent. Create a new wave if you need a different measure set."
      );
      return;
    }

    if (!questionnaire.current_version_id) {
      setErrorMessage(
        `${questionnaire.name} does not have a current version.`
      );
      return;
    }

    if (
      selectedWave.measures.some(
        (measure) =>
          measure.questionnaire_version_id ===
          questionnaire.current_version_id
      )
    ) {
      return;
    }

    updateSelectedWave({
      measures: [
        ...selectedWave.measures,
        {
          id: makeLocalId("measure-local"),
          questionnaire_id: questionnaire.id,
          questionnaire_version_id:
            questionnaire.current_version_id,
          name: questionnaire.name,
          acronym: questionnaire.acronym,
          category: questionnaire.category,
          source_type: questionnaire.source_type,
          version_label:
            questionnaire.current_version_label ||
            "Current version",
          required: true,
        },
      ],
    });
  }

  function removeMeasure(measureId: string) {
    if (!selectedWave || selectedWaveLocked) {
      return;
    }

    updateSelectedWave({
      measures: selectedWave.measures.filter(
        (measure) => measure.id !== measureId
      ),
    });
  }

  function toggleMeasureRequired(
    measureId: string
  ) {
    if (!selectedWave || selectedWaveLocked) {
      return;
    }

    updateSelectedWave({
      measures: selectedWave.measures.map(
        (measure) =>
          measure.id === measureId
            ? {
                ...measure,
                required: !measure.required,
              }
            : measure
      ),
    });
  }

  async function saveSelectedWave() {
    if (
      !selectedStudyId ||
      !selectedWave ||
      saving
    ) {
      return;
    }

    if (!selectedWave.name.trim()) {
      setErrorMessage(
        "Give this follow-up wave a name."
      );
      return;
    }

    if (selectedWave.measures.length === 0) {
      setErrorMessage(
        "Add at least one questionnaire to this follow-up wave."
      );
      return;
    }

    if (
      selectedWave.timing_mode === "fixed_date" &&
      !selectedWave.fixed_send_at
    ) {
      setErrorMessage(
        "Choose the date and time for this follow-up invitation."
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "Your follow-up wave could not be saved."
      );
      setSaving(false);
      return;
    }

    const payload = {
      study_id: selectedStudyId,
      owner_user_id: user.id,
      name: selectedWave.name.trim(),
      description:
        selectedWave.description.trim(),
      position: selectedWave.position,
      timing_mode: selectedWave.timing_mode,
      delay_days: Math.max(
        0,
        Number(selectedWave.delay_days || 0)
      ),
      fixed_send_at:
        selectedWave.timing_mode ===
          "fixed_date" &&
        selectedWave.fixed_send_at
          ? new Date(
              selectedWave.fixed_send_at
            ).toISOString()
          : null,
      completion_window_days: Math.max(
        1,
        Number(
          selectedWave.completion_window_days ||
            7
        )
      ),
      reminder_offsets_days:
        parseReminderOffsets(
          selectedWave.reminder_offsets_text
        ),
      auto_send:
        selectedWave.timing_mode === "manual"
          ? false
          : selectedWave.auto_send,
      status: selectedWave.status,
      updated_at: new Date().toISOString(),
    };

    let savedWaveId = selectedWave.id;

    if (
      selectedWave.id.startsWith(
        "wave-local-"
      )
    ) {
      const { data, error } = await supabase
        .from("study_followup_waves")
        .insert(payload)
        .select("id")
        .single();

      if (error || !data) {
        setErrorMessage(
          error?.message ||
            "The follow-up wave could not be created."
        );
        setSaving(false);
        return;
      }

      savedWaveId = data.id;
    } else {
      const { error } = await supabase
        .from("study_followup_waves")
        .update(payload)
        .eq("id", savedWaveId)
        .eq("owner_user_id", user.id);

      if (error) {
        setErrorMessage(error.message);
        setSaving(false);
        return;
      }
    }

    if (!selectedWaveLocked) {
      const { error: deleteError } =
        await supabase
          .from("study_measures")
          .delete()
          .eq(
            "followup_wave_id",
            savedWaveId
          )
          .eq("owner_user_id", user.id);

      if (deleteError) {
        setErrorMessage(
          deleteError.message.includes(
            "study_measure_sessions"
          )
            ? "Questionnaire selection is locked because participants have already started this follow-up wave."
            : deleteError.message
        );
        setSaving(false);
        return;
      }

      const { error: measureError } =
        await supabase
          .from("study_measures")
          .insert(
            selectedWave.measures.map(
              (measure, index) => ({
                study_id: selectedStudyId,
                owner_user_id: user.id,
                questionnaire_id:
                  measure.questionnaire_id,
                questionnaire_version_id:
                  measure.questionnaire_version_id,
                measurement_point: "followup",
                followup_wave_id: savedWaveId,
                position: index + 1,
                required: measure.required,
                config: {
                  source_type:
                    measure.source_type,
                  category: measure.category,
                  questionnaire_name_snapshot:
                    measure.name,
                  questionnaire_acronym_snapshot:
                    measure.acronym,
                  version_label_snapshot:
                    measure.version_label,
                },
              })
            )
          );

      if (measureError) {
        setErrorMessage(
          measureError.message
        );
        setSaving(false);
        return;
      }
    }

    setSelectedWaveId(savedWaveId);
    setMessage("Follow-up wave saved.");
    await loadStudyFollowups(
      selectedStudyId
    );
    setSelectedWaveId(savedWaveId);
    setSaving(false);
  }

  async function removeSelectedWave() {
    if (!selectedWave || saving) return;

    if (
      selectedWave.id.startsWith(
        "wave-local-"
      )
    ) {
      const remaining = waves.filter(
        (wave) =>
          wave.id !== selectedWave.id
      );

      setWaves(remaining);
      setSelectedWaveId(
        remaining[0]?.id || ""
      );
      return;
    }

    if (
      selectedWaveInvitations.length > 0
    ) {
      setErrorMessage(
        "This wave already has participant invitations, so it cannot be deleted. Pause it instead to preserve the longitudinal record."
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("study_followup_waves")
      .delete()
      .eq("id", selectedWave.id);

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    await loadStudyFollowups(
      selectedStudyId
    );
    setMessage("Follow-up wave removed.");
    setSaving(false);
  }

  async function queueWaveNow() {
    if (
      !selectedWave ||
      selectedWave.id.startsWith(
        "wave-local-"
      )
    ) {
      setErrorMessage(
        "Save the follow-up wave before sending invitations."
      );
      return;
    }

    setDeliveryBusy("wave");
    setErrorMessage("");
    setMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_queue_followup_wave",
        {
          p_wave_id: selectedWave.id,
        }
      );

    if (error || !data?.ok) {
      setErrorMessage(
        error?.message ||
          data?.error ||
          "Follow-up invitations could not be queued."
      );
      setDeliveryBusy("");
      return;
    }

    setMessage(
      `Invitation delivery queued for ${Number(
        data.eligible_participants || 0
      )} eligible participant(s).`
    );

    await loadStudyFollowups(
      selectedStudyId
    );
    setDeliveryBusy("");
  }

  async function sendReminder(
    invitationId: string
  ) {
    setDeliveryBusy(invitationId);
    setErrorMessage("");
    setMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_queue_followup_reminder",
        {
          p_invitation_id:
            invitationId,
        }
      );

    if (error || !data?.ok) {
      setErrorMessage(
        error?.message ||
          "The reminder could not be queued."
      );
      setDeliveryBusy("");
      return;
    }

    setMessage(
      "A follow-up reminder email has been queued."
    );

    await loadStudyFollowups(
      selectedStudyId
    );
    setDeliveryBusy("");
  }

  async function cancelInvitation(
    invitationId: string
  ) {
    setDeliveryBusy(invitationId);
    setErrorMessage("");
    setMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_cancel_followup_invitation",
        {
          p_invitation_id:
            invitationId,
        }
      );

    if (error || !data?.ok) {
      setErrorMessage(
        error?.message ||
          "The invitation could not be cancelled."
      );
      setDeliveryBusy("");
      return;
    }

    setMessage(
      "Follow-up invitation cancelled."
    );

    await loadStudyFollowups(
      selectedStudyId
    );
    setDeliveryBusy("");
  }

  if (
    loading &&
    studies.length === 0
  ) {
    return (
      <Panel title="Follow-up Manager">
        <p className="text-sm text-slate-500">
          Loading follow-up studies...
        </p>
      </Panel>
    );
  }

  if (!loading && studies.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            ← Back to Study Builder
          </button>
        </div>

        <Panel
          title="No follow-up studies"
          description="Only studies with Follow-up selected in Study Components appear here."
        >
          <p className="text-sm leading-6 text-slate-500">
            Open a study in Study Builder and enable the Follow-up component
            before configuring follow-up waves.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          ← Back to Study Builder
        </button>

        {selectedStudy && (
          <p className="text-sm text-slate-500">
            Follow-ups for{" "}
            <span className="font-semibold text-slate-700">
              {selectedStudy.title}
            </span>
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <Panel
        title="Study"
        description="Follow-up waves remain linked to the same pseudonymous study participants."
      >
        <select
          value={selectedStudyId}
          onChange={(event) =>
            setSelectedStudyId(
              event.target.value
            )
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          {studies.map((study) => (
            <option
              key={study.id}
              value={study.id}
            >
              {study.title}
            </option>
          ))}
        </select>
      </Panel>

      {!selectedStudy ? (
        <Panel title="No study selected">
          <p className="text-sm text-slate-500">
            Create and save a study before
            configuring follow-up waves.
          </p>
        </Panel>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
            <Panel
              title="Follow-up waves"
              description="Every wave can use a different questionnaire set."
            >
              <div className="space-y-3">
                {waves.map((wave) => (
                  <button
                    key={wave.id}
                    type="button"
                    onClick={() =>
                      setSelectedWaveId(wave.id)
                    }
                    className={`w-full rounded-xl border p-4 text-left ${
                      wave.id ===
                      selectedWaveId
                        ? "border-cyan-300 bg-cyan-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {wave.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {wave.measures.length}{" "}
                          measure
                          {wave.measures.length ===
                          1
                            ? ""
                            : "s"}
                        </p>
                      </div>

                      <Status
                        type={
                          wave.status ===
                          "active"
                            ? "success"
                            : wave.status ===
                                "paused"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {wave.status}
                      </Status>
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={addWave}
                  className="w-full rounded-xl border border-dashed border-cyan-300 bg-cyan-50/50 px-4 py-3 text-sm font-semibold text-cyan-900"
                >
                  + Add follow-up wave
                </button>
              </div>
            </Panel>

            {selectedWave ? (
              <div className="space-y-5">
                <Panel
                  title={selectedWave.name}
                  description="Configure timing, reminders and the questionnaire set for this wave."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="text-xs font-medium text-slate-500">
                        Wave name
                      </span>
                      <input
                        value={selectedWave.name}
                        onChange={(event) =>
                          updateSelectedWave({
                            name:
                              event.target
                                .value,
                          })
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-medium text-slate-500">
                        Status
                      </span>
                      <select
                        value={
                          selectedWave.status
                        }
                        onChange={(event) =>
                          updateSelectedWave({
                            status:
                              event.target
                                .value as WaveDraft["status"],
                          })
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      >
                        <option value="draft">
                          Draft
                        </option>
                        <option value="active">
                          Active
                        </option>
                        <option value="paused">
                          Paused
                        </option>
                      </select>
                    </label>

                    <label className="md:col-span-2">
                      <span className="text-xs font-medium text-slate-500">
                        Participant-facing
                        description
                      </span>
                      <textarea
                        value={
                          selectedWave.description
                        }
                        onChange={(event) =>
                          updateSelectedWave({
                            description:
                              event.target
                                .value,
                          })
                        }
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        placeholder="Briefly explain this follow-up phase."
                      />
                    </label>

                    <label>
                      <span className="text-xs font-medium text-slate-500">
                        Invitation timing
                      </span>
                      <select
                        value={
                          selectedWave.timing_mode
                        }
                        onChange={(event) =>
                          updateSelectedWave({
                            timing_mode:
                              event.target
                                .value as WaveDraft["timing_mode"],
                          })
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      >
                        <option value="days_after_completion">
                          Days after initial study
                          completion
                        </option>
                        <option value="fixed_date">
                          Specific date & time
                        </option>
                        <option value="manual">
                          Researcher sends manually
                        </option>
                      </select>
                    </label>

                    {selectedWave.timing_mode ===
                    "days_after_completion" ? (
                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Days after completion
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={
                            selectedWave.delay_days
                          }
                          onChange={(event) =>
                            updateSelectedWave({
                              delay_days:
                                Number(
                                  event.target
                                    .value || 0
                                ),
                            })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        />
                      </label>
                    ) : selectedWave.timing_mode ===
                      "fixed_date" ? (
                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Send on
                        </span>
                        <input
                          type="datetime-local"
                          value={
                            selectedWave.fixed_send_at
                          }
                          onChange={(event) =>
                            updateSelectedWave({
                              fixed_send_at:
                                event.target
                                  .value,
                            })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        />
                      </label>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        No invitation is sent until
                        you press{" "}
                        <span className="font-semibold text-slate-700">
                          Send invitations now
                        </span>
                        .
                      </div>
                    )}

                    <label>
                      <span className="text-xs font-medium text-slate-500">
                        Completion window (days)
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={
                          selectedWave.completion_window_days
                        }
                        onChange={(event) =>
                          updateSelectedWave({
                            completion_window_days:
                              Number(
                                event.target
                                  .value || 1
                              ),
                          })
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-medium text-slate-500">
                        Automatic reminder days
                      </span>
                      <input
                        value={
                          selectedWave.reminder_offsets_text
                        }
                        onChange={(event) =>
                          updateSelectedWave({
                            reminder_offsets_text:
                              event.target
                                .value,
                          })
                        }
                        placeholder="2, 5"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      />
                      <span className="mt-1 block text-[11px] leading-5 text-slate-400">
                        Example: 2, 5 sends
                        reminders 2 and 5 days
                        after the first invitation
                        if it is still incomplete.
                      </span>
                    </label>

                    {selectedWave.timing_mode !==
                      "manual" && (
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={
                            selectedWave.auto_send
                          }
                          onChange={(event) =>
                            updateSelectedWave({
                              auto_send:
                                event.target
                                  .checked,
                            })
                          }
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            Automatically send
                            this wave when due
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Only participants who
                            explicitly consented
                            to follow-up email
                            contact are eligible.
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </Panel>

                <Panel
                  title="Questionnaires in this wave"
                  description={
                    selectedWaveLocked
                      ? "The measure set is locked because participant invitations have already been sent."
                      : "These questionnaires belong only to this follow-up wave."
                  }
                >
                  {selectedWave.measures
                    .length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No questionnaires selected
                      yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedWave.measures.map(
                        (measure) => (
                          <div
                            key={measure.id}
                            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {measure.name}
                                {measure.acronym
                                  ? ` (${measure.acronym})`
                                  : ""}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  measure.version_label
                                }
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <label className="flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={
                                    measure.required
                                  }
                                  disabled={
                                    selectedWaveLocked
                                  }
                                  onChange={() =>
                                    toggleMeasureRequired(
                                      measure.id
                                    )
                                  }
                                />
                                Required
                              </label>

                              {!selectedWaveLocked && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeMeasure(
                                      measure.id
                                    )
                                  }
                                  className="text-xs font-semibold text-red-600"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {!selectedWaveLocked && (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-sm font-semibold text-cyan-950">
                            Need a questionnaire that is not in your library?
                          </p>
                          <p className="mt-1 text-xs leading-5 text-cyan-900/70">
                            Build your own research questionnaire, then return
                            here and add it to this follow-up wave.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={onBuildQuestionnaire}
                          className="shrink-0 rounded-xl bg-cyan-900 px-4 py-2.5 text-xs font-semibold text-white"
                        >
                          + Build your own questionnaire
                        </button>
                      </div>

                      <input
                        value={search}
                        onChange={(event) =>
                          setSearch(
                            event.target
                              .value
                          )
                        }
                        placeholder="Search questionnaire library..."
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      />

                      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                        {filteredCatalogue.map(
                          (questionnaire) => {
                            const added =
                              selectedWave.measures.some(
                                (measure) =>
                                  measure.questionnaire_version_id ===
                                  questionnaire.current_version_id
                              );

                            return (
                              <div
                                key={
                                  questionnaire.id
                                }
                                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">
                                    {
                                      questionnaire.name
                                    }
                                    {questionnaire.acronym
                                      ? ` (${questionnaire.acronym})`
                                      : ""}
                                  </p>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                    {questionnaire.source_type ===
                                      "researcher_created" && (
                                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-800">
                                        Your questionnaire
                                      </span>
                                    )}

                                    <span>
                                      {questionnaire.category}
                                      {" · "}
                                      {questionnaire.item_count} items
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={
                                    added ||
                                    !questionnaire.current_version_id
                                  }
                                  onClick={() =>
                                    addMeasure(
                                      questionnaire
                                    )
                                  }
                                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold ${
                                    added
                                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "bg-slate-950 text-white"
                                  } disabled:opacity-60`}
                                >
                                  {added
                                    ? "✓ Added"
                                    : "+ Add"}
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        void removeSelectedWave()
                      }
                      disabled={saving}
                      className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Remove wave
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void saveSelectedWave()
                      }
                      disabled={saving}
                      className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : "Save follow-up wave"}
                    </button>
                  </div>
                </Panel>

                {!selectedWave.id.startsWith(
                  "wave-local-"
                ) && (
                  <Panel
                    title="Participant delivery"
                    description="Send invitations and manual reminders without changing the questionnaire wave."
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-slate-500">
                        {
                          eligibleParticipants.length
                        }{" "}
                        participant
                        {eligibleParticipants.length ===
                        1
                          ? ""
                          : "s"}{" "}
                        completed the initial study
                        phase.
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void loadStudyFollowups(
                              selectedStudyId
                            )
                          }
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                        >
                          Refresh
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void queueWaveNow()
                          }
                          disabled={
                            deliveryBusy ===
                              "wave" ||
                            selectedWave.status !==
                              "active"
                          }
                          className="rounded-xl bg-cyan-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {deliveryBusy ===
                          "wave"
                            ? "Queuing..."
                            : selectedWave.status !==
                                "active"
                              ? "Activate wave to send"
                              : "Send invitations now"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="border-b border-slate-200 text-slate-400">
                          <tr>
                            <th className="px-3 py-3 font-medium">
                              Participant
                            </th>
                            <th className="px-3 py-3 font-medium">
                              Follow-up contact
                            </th>
                            <th className="px-3 py-3 font-medium">
                              Invitation
                            </th>
                            <th className="px-3 py-3 font-medium">
                              Last activity
                            </th>
                            <th className="px-3 py-3 font-medium">
                              Controls
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {eligibleParticipants.map(
                            (participant) => {
                              const contact =
                                contacts.find(
                                  (
                                    candidate
                                  ) =>
                                    candidate.participant_id ===
                                    participant.id
                                ) || null;

                              const invitation =
                                selectedWaveInvitations.find(
                                  (
                                    candidate
                                  ) =>
                                    candidate.participant_id ===
                                    participant.id
                                ) || null;

                              const canRemind =
                                Boolean(
                                  invitation &&
                                    [
                                      "sent",
                                      "opened",
                                    ].includes(
                                      invitation.status
                                    ) &&
                                    contact?.consented &&
                                    !contact?.withdrawn_at
                                );

                              return (
                                <tr
                                  key={
                                    participant.id
                                  }
                                  className="border-b border-slate-100 align-top"
                                >
                                  <td className="px-3 py-4">
                                    <p className="font-semibold text-slate-700">
                                      {
                                        participant.public_id
                                      }
                                    </p>
                                    {participant.is_test && (
                                      <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                        TEST
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-3 py-4">
                                    {contact?.consented &&
                                    !contact.withdrawn_at ? (
                                      <>
                                        <p className="text-slate-700">
                                          {
                                            contact.email
                                          }
                                        </p>
                                        <p className="mt-1 text-[10px] text-emerald-700">
                                          Contact
                                          consent
                                          recorded
                                        </p>
                                      </>
                                    ) : (
                                      <span className="text-slate-400">
                                        No follow-up
                                        contact consent
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-3 py-4">
                                    {invitation ? (
                                      <>
                                        <Status
                                          type={
                                            invitation.status ===
                                            "completed"
                                              ? "success"
                                              : [
                                                    "expired",
                                                    "cancelled",
                                                  ].includes(
                                                    invitation.status
                                                  )
                                                ? "warning"
                                                : "accent"
                                          }
                                        >
                                          {
                                            invitation.status
                                          }
                                        </Status>
                                        <p className="mt-2 text-[10px] text-slate-400">
                                          Reminders:{" "}
                                          {
                                            invitation.reminder_count
                                          }
                                        </p>
                                      </>
                                    ) : (
                                      <span className="text-slate-400">
                                        Not invited
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-3 py-4 text-slate-500">
                                    {invitation?.completed_at
                                      ? `Completed ${formatDateTime(
                                          invitation.completed_at
                                        )}`
                                      : invitation?.opened_at
                                        ? `Opened ${formatDateTime(
                                            invitation.opened_at
                                          )}`
                                        : invitation?.sent_at
                                          ? `Sent ${formatDateTime(
                                              invitation.sent_at
                                            )}`
                                          : invitation
                                            ? `Scheduled ${formatDateTime(
                                                invitation.scheduled_for
                                              )}`
                                            : "—"}
                                  </td>

                                  <td className="px-3 py-4">
                                    <div className="flex flex-wrap gap-2">
                                      {canRemind &&
                                        invitation && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void sendReminder(
                                                invitation.id
                                              )
                                            }
                                            disabled={
                                              deliveryBusy ===
                                              invitation.id
                                            }
                                            className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 font-semibold text-cyan-800 disabled:opacity-50"
                                          >
                                            Send
                                            reminder
                                          </button>
                                        )}

                                      {invitation &&
                                        ![
                                          "completed",
                                          "cancelled",
                                          "expired",
                                        ].includes(
                                          invitation.status
                                        ) && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void cancelInvitation(
                                                invitation.id
                                              )
                                            }
                                            disabled={
                                              deliveryBusy ===
                                              invitation.id
                                            }
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-50"
                                          >
                                            Cancel
                                          </button>
                                        )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}

                          {eligibleParticipants.length ===
                            0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-8 text-center text-sm text-slate-400"
                              >
                                No participants
                                have completed the
                                initial study phase
                                yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                )}
              </div>
            ) : (
              <Panel
                title="Create the first follow-up wave"
                description="A follow-up wave is a new measurement phase attached to the same participant."
              >
                <button
                  type="button"
                  onClick={addWave}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  + Add follow-up wave
                </button>
              </Panel>
            )}
          </div>

          <Panel
            title="Longitudinal linking"
            description="Follow-up contact information is stored separately from ordinary response exports."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                [
                  "1. Initial study",
                  "The participant completes the original study and keeps the same PsyLattice pseudonymous participant ID.",
                ],
                [
                  "2. New secure link",
                  "With explicit follow-up contact consent, PsyLattice emails a participant-specific link for the selected wave.",
                ],
                [
                  "3. Same participant, new wave",
                  "Responses are saved under the same participant ID with the follow-up wave attached for longitudinal analysis.",
                ],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-sm font-semibold">
                    {title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
