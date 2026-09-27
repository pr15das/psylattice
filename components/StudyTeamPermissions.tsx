"use client";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Database,
  FileText,
  FlaskConical,
  Loader2,
  Mail,
  MessageSquare,
  PauseCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StudyRole = "supervisor" | "researcher" | "analyst" | "viewer";
type MemberStatus = "active" | "suspended" | "revoked";

type OwnedStudy = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
};

type SharedStudy = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  role: StudyRole;
  permissions: Record<string, boolean>;
  membership_status: string;
  accepted_at: string | null;
};

type IncomingInvite = {
  id: string;
  study_id: string;
  study_title: string;
  email: string;
  role: StudyRole;
  permissions: Record<string, boolean>;
  status: string;
  expires_at: string;
  created_at: string;
};

type TeamMember = {
  id: string;
  study_id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: StudyRole;
  permissions: Record<string, boolean>;
  status: MemberStatus;
  accepted_at: string;
  updated_at: string;
};

type TeamInvite = IncomingInvite & {
  accepted_at?: string | null;
  updated_at?: string;
};

type ActivityItem = {
  id: string;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const ROLE_LABELS: Record<StudyRole, string> = {
  supervisor: "Supervisor",
  researcher: "Researcher",
  analyst: "Analyst",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<StudyRole, string> = {
  supervisor: "Review-first access across the study without destructive editing by default.",
  researcher: "Operational access for study building, recruitment, data and research work.",
  analyst: "Focused access to research data, Study Health and Analysis Lab.",
  viewer: "Read-only access to selected research material.",
};

const ROLE_DEFAULTS: Record<StudyRole, Record<string, boolean>> = {
  supervisor: {
    study_builder: true,
    recruitment: true,
    participants: true,
    data_explorer: true,
    analysis: true,
    thesis: true,
    study_health: true,
    exports: false,
    can_edit: false,
    can_comment: true,
    can_review: true,
    can_manage_structure: false,
    can_close_recruitment: false,
    can_withdraw_participants: false,
  },
  researcher: {
    study_builder: true,
    recruitment: true,
    participants: true,
    data_explorer: true,
    analysis: true,
    thesis: true,
    study_health: true,
    exports: false,
    can_edit: true,
    can_comment: true,
    can_review: true,
    can_manage_structure: false,
    can_close_recruitment: false,
    can_withdraw_participants: false,
  },
  analyst: {
    study_builder: false,
    recruitment: false,
    participants: false,
    data_explorer: true,
    analysis: true,
    thesis: false,
    study_health: true,
    exports: true,
    can_edit: true,
    can_comment: true,
    can_review: true,
    can_manage_structure: false,
    can_close_recruitment: false,
    can_withdraw_participants: false,
  },
  viewer: {
    study_builder: true,
    recruitment: false,
    participants: false,
    data_explorer: false,
    analysis: false,
    thesis: true,
    study_health: true,
    exports: false,
    can_edit: false,
    can_comment: false,
    can_review: false,
    can_manage_structure: false,
    can_close_recruitment: false,
    can_withdraw_participants: false,
  },
};

const MODULES = [
  { key: "study_builder", label: "Study Builder", icon: FlaskConical },
  { key: "recruitment", label: "Recruitment", icon: UserPlus },
  { key: "participants", label: "Participants", icon: Users },
  { key: "data_explorer", label: "Data Explorer", icon: Database },
  { key: "analysis", label: "Analysis Lab", icon: BarChart3 },
  { key: "thesis", label: "Thesis Builder", icon: FileText },
  { key: "study_health", label: "Study Health", icon: ShieldCheck },
  { key: "exports", label: "Exports", icon: Copy },
] as const;

function shortDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionLabel(action: string) {
  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PermissionGrid({
  value,
  onChange,
  disabled = false,
}: {
  value: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="max-h-[286px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {MODULES.map(({ key, label, icon: Icon }) => {
        const enabled = Boolean(value[key]);
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...value, [key]: !enabled })}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
              enabled
                ? "border-cyan-200 bg-cyan-50/70"
                : "border-slate-200 bg-white hover:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-55`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  enabled ? "bg-white text-cyan-700" : "bg-slate-100 text-slate-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 whitespace-normal text-[10px] font-semibold leading-4 text-slate-800">
                {label}
              </span>
            </span>
            <span
              className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                enabled ? "bg-cyan-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
                  enabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}


const ADVANCED_PERMISSIONS = [
  {
    key: "can_manage_structure",
    label: "Structural changes",
    description: "Remove study measures before participant enrolment.",
    module: "study_builder",
  },
  {
    key: "can_close_recruitment",
    label: "Close recruitment",
    description: "Permanently close participant links.",
    module: "recruitment",
  },
  {
    key: "can_withdraw_participants",
    label: "Withdraw participants",
    description: "Withdraw participants while retaining collected data.",
    module: "participants",
  },
] as const;

function permissionDependencies(value: Record<string, boolean>) {
  const next = { ...value };
  if (!next.can_edit) {
    next.can_manage_structure = false;
    next.can_close_recruitment = false;
    next.can_withdraw_participants = false;
  }
  if (!next.study_builder) next.can_manage_structure = false;
  if (!next.recruitment) next.can_close_recruitment = false;
  if (!next.participants) next.can_withdraw_participants = false;
  return next;
}

function AdvancedPermissionGrid({
  value,
  onChange,
  disabled = false,
}: {
  value: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {ADVANCED_PERMISSIONS.map((permission) => {
        const enabled = Boolean(value[permission.key]);
        const locked =
          disabled || !Boolean(value.can_edit) || !Boolean(value[permission.module]);

        return (
          <button
            key={permission.key}
            type="button"
            disabled={locked}
            onClick={() =>
              onChange(
                permissionDependencies({
                  ...value,
                  [permission.key]: !enabled,
                }),
              )
            }
            className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition ${
              enabled
                ? "border-violet-200 bg-violet-50/70"
                : "border-slate-200 bg-white hover:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-45`}
          >
            <span className="flex min-w-0 gap-2.5">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  enabled ? "bg-white text-violet-700" : "bg-slate-100 text-slate-400"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-semibold text-slate-800">
                  {permission.label}
                </span>
                <span className="mt-0.5 block text-[7.5px] leading-3.5 text-slate-400">
                  {permission.description}
                </span>
              </span>
            </span>
            <span
              className={`mt-1 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                enabled ? "bg-violet-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
                  enabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function StudyTeamPermissions() {
  const [ownedStudies, setOwnedStudies] = useState<OwnedStudy[]>([]);
  const [sharedStudies, setSharedStudies] = useState<SharedStudy[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StudyRole>("supervisor");
  const [invitePermissions, setInvitePermissions] = useState<Record<string, boolean>>(
    ROLE_DEFAULTS.supervisor,
  );
  const [lastInviteUrl, setLastInviteUrl] = useState("");

  const selectedStudy = useMemo(
    () => ownedStudies.find((study) => study.id === selectedStudyId) || null,
    [ownedStudies, selectedStudyId],
  );

  async function bootstrap() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/research/team", {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Team & Permissions could not be loaded.");
      }

      const studies = Array.isArray(data.ownedStudies) ? data.ownedStudies : [];
      setOwnedStudies(studies);
      setSharedStudies(
        Array.isArray(data.sharedStudies) ? data.sharedStudies : [],
      );
      setIncomingInvites(
        Array.isArray(data.incomingInvites) ? data.incomingInvites : [],
      );
      setSelectedStudyId((current) => current || studies[0]?.id || "");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Team & Permissions could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadStudy(studyId: string) {
    if (!studyId) {
      setMembers([]);
      setInvites([]);
      setActivity([]);
      return;
    }

    setDetailLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/research/team?study_id=${encodeURIComponent(studyId)}`,
        { method: "GET", cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "This study team could not be loaded.");
      }
      setMembers(Array.isArray(data.members) ? data.members : []);
      setInvites(Array.isArray(data.invites) ? data.invites : []);
      setActivity(Array.isArray(data.activity) ? data.activity : []);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "This study team could not be loaded.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function post(payload: Record<string, unknown>) {
    const response = await fetch("/api/research/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "The team update could not be completed.");
    }
    return data;
  }

  useEffect(() => {
    void bootstrap();

    const params = new URLSearchParams(window.location.search);
    const token = params.get("collaboration_invite");
    if (!token) return;

    void (async () => {
      setBusy("accept-link");
      setError("");
      try {
        const data = await post({ operation: "accept_invite", token });
        setNotice(
          `Invitation accepted${data?.result?.study_title ? ` · ${data.result.study_title}` : ""}.`,
        );
        params.delete("collaboration_invite");
        const next = params.toString();
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`,
        );
        await bootstrap();
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : "The invitation could not be accepted.",
        );
      } finally {
        setBusy("");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadStudy(selectedStudyId);
  }, [selectedStudyId]);

  function chooseRole(role: StudyRole) {
    setInviteRole(role);
    setInvitePermissions(permissionDependencies({ ...ROLE_DEFAULTS[role] }));
  }

  async function createInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedStudyId || busy) return;
    setBusy("invite");
    setError("");
    setNotice("");
    setLastInviteUrl("");

    try {
      const data = await post({
        operation: "invite",
        studyId: selectedStudyId,
        email: inviteEmail,
        role: inviteRole,
        permissions: invitePermissions,
      });
      setLastInviteUrl(String(data.inviteUrl || ""));
      setNotice(`Invitation created for ${inviteEmail.trim().toLowerCase()}.`);
      setInviteEmail("");
      await loadStudy(selectedStudyId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The invitation could not be created.",
      );
    } finally {
      setBusy("");
    }
  }

  async function acceptIncoming(inviteId: string) {
    if (busy) return;
    setBusy(`accept-${inviteId}`);
    setError("");
    setNotice("");
    try {
      const data = await post({
        operation: "accept_invite",
        inviteId,
      });
      setNotice(
        `Invitation accepted${data?.result?.study_title ? ` · ${data.result.study_title}` : ""}.`,
      );
      await bootstrap();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The invitation could not be accepted.",
      );
    } finally {
      setBusy("");
    }
  }

  async function revokeInvite(inviteId: string) {
    if (!selectedStudyId || busy) return;
    setBusy(`invite-${inviteId}`);
    setError("");
    try {
      await post({
        operation: "revoke_invite",
        studyId: selectedStudyId,
        inviteId,
      });
      await loadStudy(selectedStudyId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The invitation could not be revoked.",
      );
    } finally {
      setBusy("");
    }
  }

  async function changeMemberStatus(
    memberId: string,
    operation: "suspend_member" | "restore_member" | "remove_member",
  ) {
    if (!selectedStudyId || busy) return;
    setBusy(`member-${memberId}`);
    setError("");
    try {
      await post({
        operation,
        studyId: selectedStudyId,
        memberId,
      });
      await loadStudy(selectedStudyId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The collaborator could not be updated.",
      );
    } finally {
      setBusy("");
    }
  }

  async function saveMember(
    member: TeamMember,
    role: StudyRole,
    permissions: Record<string, boolean>,
  ) {
    if (!selectedStudyId || busy) return;
    setBusy(`member-${member.id}`);
    setError("");
    try {
      await post({
        operation: "update_member",
        studyId: selectedStudyId,
        memberId: member.id,
        role,
        permissions,
      });
      await loadStudy(selectedStudyId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The collaborator permissions could not be saved.",
      );
    } finally {
      setBusy("");
    }
  }

  async function copyInviteUrl() {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      setNotice("Invitation link copied.");
    } catch {
      setError("The invitation link could not be copied automatically.");
    }
  }

  return (
    <div className="space-y-5">
      {incomingInvites.length > 0 && (
        <section className="overflow-hidden rounded-[26px] border border-violet-200 bg-white shadow-sm">
          <div className="border-b border-violet-100 bg-violet-50/60 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-violet-700" />
              <div>
                <h2 className="text-[14px] font-semibold text-slate-950">
                  Collaboration invitations
                </h2>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  These invitations are bound to the email address on your signed-in PsyLattice account.
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {incomingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <p className="text-[11px] font-semibold text-slate-900">
                    {invite.study_title}
                  </p>
                  <p className="mt-1 text-[9px] text-slate-500">
                    {ROLE_LABELS[invite.role]} · expires {shortDate(invite.expires_at)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void acceptIncoming(invite.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-semibold text-white disabled:opacity-50"
                >
                  {busy === `accept-${invite.id}` ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Accept invitation
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {sharedStudies.length > 0 && (
        <section className="overflow-hidden rounded-[26px] border border-cyan-200 bg-white shadow-sm">
          <div className="border-b border-cyan-100 bg-cyan-50/45 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-4 w-4 text-cyan-700" />
              <div>
                <h2 className="text-[14px] font-semibold text-slate-950">
                  Studies shared with you
                </h2>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  Open a study where another researcher has granted you collaboration access.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {sharedStudies.map((study) => {
              const enabledModules = MODULES.filter(
                (module) => Boolean(study.permissions?.[module.key]),
              );

              return (
                <a
                  key={study.id}
                  href={`/researcher/shared/${study.id}`}
                  className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.28)] transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-[0_16px_38px_rgba(8,145,178,0.18)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-white">
                        {study.title}
                      </p>
                      <p className="mt-1 text-[8.5px] text-slate-300">
                        {study.status || "Active"} · {ROLE_LABELS[study.role] || study.role}
                      </p>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[7px] font-semibold text-cyan-200">
                      Shared
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </span>
                  </div>

                  {enabledModules.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {enabledModules.map((module) => (
                        <span
                          key={module.key}
                          className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-1 text-[7px] font-medium text-slate-200"
                        >
                          {module.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {study.permissions?.can_edit && (
                      <span className="rounded-full bg-violet-500/15 px-2 py-1 text-[7px] font-semibold text-violet-200">
                        Edit
                      </span>
                    )}
                    {study.permissions?.can_comment && (
                      <span className="rounded-full bg-violet-500/15 px-2 py-1 text-[7px] font-semibold text-violet-200">
                        Comment
                      </span>
                    )}
                    {study.permissions?.can_review && (
                      <span className="rounded-full bg-violet-500/15 px-2 py-1 text-[7px] font-semibold text-violet-200">
                        Review
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[26px] border border-slate-300/75 bg-white shadow-[0_2px_5px_rgba(15,23,42,.045),0_12px_30px_rgba(15,23,42,.075)]">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-700" />
                <h2 className="text-[15px] font-semibold tracking-[-.01em] text-slate-950">
                  Team & Permissions
                </h2>
              </div>
              <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-500">
                Collaboration is scoped to one study. The study owner remains authoritative and can suspend or revoke access immediately.
              </p>
            </div>

            <div className="relative min-w-[260px]">
              <select
                value={selectedStudyId}
                onChange={(event) => setSelectedStudyId(event.target.value)}
                disabled={loading || ownedStudies.length === 0}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-[10px] font-semibold text-slate-800 outline-none focus:border-cyan-300"
              >
                {ownedStudies.length === 0 ? (
                  <option value="">No owned study available</option>
                ) : (
                  ownedStudies.map((study) => (
                    <option key={study.id} value={study.id}>
                      {study.title || "Untitled study"}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {(error || notice) && (
          <div className="border-b border-slate-100 px-5 py-3 sm:px-6">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[9px] leading-4 text-rose-700">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-[9px] leading-4 text-cyan-800">
                {notice}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center gap-2 text-[10px] text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading collaboration workspace…
          </div>
        ) : ownedStudies.length === 0 ? (
          <div className="p-6 text-[11px] leading-5 text-slate-500">
            Create a study before inviting collaborators. Collaboration remains study-scoped rather than account-wide.
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_350px]">
            <div className="min-w-0 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">
                    Active members
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {members.filter((member) => member.status === "active").length + 1}
                  </p>
                  <p className="mt-1 text-[8px] text-slate-400">including owner</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">
                    Pending invites
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {invites.filter((invite) => invite.status === "pending").length}
                  </p>
                  <p className="mt-1 text-[8px] text-slate-400">email-bound</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">
                    Study
                  </p>
                  <p className="mt-2 truncate text-[12px] font-semibold text-slate-950">
                    {selectedStudy?.title || "Untitled study"}
                  </p>
                  <p className="mt-1 text-[8px] capitalize text-slate-400">
                    {selectedStudy?.status || "draft"}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-900">Research team</p>
                    <p className="mt-0.5 text-[9px] text-slate-400">
                      Owner access is permanent. Collaborator roles can be changed or revoked.
                    </p>
                  </div>
                  {detailLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold text-slate-900">
                        Study owner
                      </p>
                      <p className="mt-0.5 text-[8px] text-slate-400">
                        Full access · ownership cannot be changed by collaborators
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-700">
                      Owner
                    </span>
                  </div>

                  {members.length === 0 ? (
                    <div className="px-4 py-5 text-[9px] text-slate-400">
                      No collaborators have joined this study yet.
                    </div>
                  ) : (
                    members.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        busy={busy === `member-${member.id}`}
                        onSave={saveMember}
                        onSuspend={() =>
                          void changeMemberStatus(member.id, "suspend_member")
                        }
                        onRestore={() =>
                          void changeMemberStatus(member.id, "restore_member")
                        }
                        onRemove={() =>
                          void changeMemberStatus(member.id, "remove_member")
                        }
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-semibold text-slate-900">Pending invitations</p>
                <div className="mt-2 space-y-2">
                  {invites.filter((invite) => invite.status === "pending").length === 0 ? (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[9px] text-slate-400">
                      No pending invitations for this study.
                    </p>
                  ) : (
                    invites
                      .filter((invite) => invite.status === "pending")
                      .map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                        >
                          <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[9px] font-semibold text-slate-800">
                              {invite.email}
                            </p>
                            <p className="mt-0.5 text-[8px] text-slate-400">
                              {ROLE_LABELS[invite.role]} · expires {shortDate(invite.expires_at)}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() => void revokeInvite(invite.id)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-500 hover:text-rose-700 disabled:opacity-40"
                          >
                            Revoke
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-slate-500" />
                  <p className="text-[11px] font-semibold text-slate-900">Activity</p>
                </div>
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
                  {activity.length === 0 ? (
                    <p className="p-4 text-[9px] text-slate-400">
                      Collaboration activity will appear here.
                    </p>
                  ) : (
                    activity.slice(0, 20).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                      >
                        <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold text-slate-700">
                            {actionLabel(item.action)}
                          </p>
                          <p className="mt-0.5 truncate text-[8px] text-slate-400">
                            {item.target_email || "Study team"} · {shortDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-100 bg-slate-50/45 p-5 sm:p-6 lg:border-l lg:border-t-0">
              <form onSubmit={createInvite}>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-cyan-700" />
                  <p className="text-[11px] font-semibold text-slate-900">
                    Invite collaborator
                  </p>
                </div>
                <p className="mt-1 text-[9px] leading-4 text-slate-500">
                  The invitation is bound to this email. PsyLattice creates a secure invitation link you can send to them.
                </p>

                <label className="mt-4 block">
                  <span className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="researcher@university.edu"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] text-slate-800 outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="mt-3 block">
                  <span className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
                    Role
                  </span>
                  <div className="relative mt-1.5">
                    <select
                      value={inviteRole}
                      onChange={(event) => chooseRole(event.target.value as StudyRole)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-[10px] font-semibold text-slate-800 outline-none focus:border-cyan-300"
                    >
                      {(Object.keys(ROLE_LABELS) as StudyRole[]).map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="mt-1.5 text-[8px] leading-4 text-slate-400">
                    {ROLE_DESCRIPTIONS[inviteRole]}
                  </p>
                </label>

                <div className="mt-4">
                  <p className="mb-2 text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
                    Module access
                  </p>
                  <PermissionGrid
                    value={invitePermissions}
                    onChange={(next) => setInvitePermissions(permissionDependencies(next))}
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["can_edit", "Edit"],
                    ["can_comment", "Comment"],
                    ["can_review", "Review"],
                  ].map(([key, label]) => {
                    const enabled = Boolean(invitePermissions[key]);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setInvitePermissions((current) =>
                            permissionDependencies({
                              ...current,
                              [key]: !enabled,
                            }),
                          )
                        }
                        className={`rounded-xl border px-2 py-2 text-[8px] font-semibold ${
                          enabled
                            ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                            : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/35 p-3">
                  <p className="text-[8px] font-bold uppercase tracking-[.1em] text-violet-700">
                    Advanced controls
                  </p>
                  <p className="mt-1 mb-2 text-[7.5px] leading-3.5 text-violet-700/70">
                    High-risk actions are OFF for every role until you explicitly enable them.
                  </p>
                  <AdvancedPermissionGrid
                    value={invitePermissions}
                    onChange={setInvitePermissions}
                  />
                </div>

                <button
                  type="submit"
                  disabled={Boolean(busy) || !selectedStudyId}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[9px] font-semibold text-white disabled:opacity-50"
                >
                  {busy === "invite" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  Create invitation
                </button>

                {lastInviteUrl && (
                  <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3">
                    <p className="text-[8px] font-semibold text-cyan-900">
                      Secure invitation created
                    </p>
                    <p className="mt-1 break-all text-[7.5px] leading-4 text-cyan-800/70">
                      {lastInviteUrl}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyInviteUrl()}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[8px] font-semibold text-cyan-800 shadow-sm"
                    >
                      <Copy className="h-3 w-3" />
                      Copy invitation link
                    </button>
                  </div>
                )}
              </form>
            </aside>
          </div>
        )}
      </section>

    </div>
  );
}

function MemberRow({
  member,
  busy,
  onSave,
  onSuspend,
  onRestore,
  onRemove,
}: {
  member: TeamMember;
  busy: boolean;
  onSave: (
    member: TeamMember,
    role: StudyRole,
    permissions: Record<string, boolean>,
  ) => Promise<void>;
  onSuspend: () => void;
  onRestore: () => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [role, setRole] = useState<StudyRole>(member.role);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    ...member.permissions,
  });

  useEffect(() => {
    setRole(member.role);
    setPermissions({ ...member.permissions });
  }, [member]);

  function changeRole(nextRole: StudyRole) {
    setRole(nextRole);
    setPermissions(permissionDependencies({ ...ROLE_DEFAULTS[nextRole] }));
  }

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            member.status === "active"
              ? "bg-cyan-50 text-cyan-700"
              : member.status === "suspended"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          <Users className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-slate-900">
            {member.display_name || member.email}
          </p>
          <p className="mt-0.5 truncate text-[8px] text-slate-400">
            {member.email} · {ROLE_LABELS[member.role]} · {member.status}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-500"
        >
          Manage
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/45 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
                Role
              </p>
              <select
                value={role}
                disabled={busy || member.status === "revoked"}
                onChange={(event) => changeRole(event.target.value as StudyRole)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-semibold text-slate-700"
              >
                {(Object.keys(ROLE_LABELS) as StudyRole[]).map((item) => (
                  <option key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1.5 text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
                Module access
              </p>
              <PermissionGrid
                value={permissions}
                onChange={(next) => setPermissions(permissionDependencies(next))}
                disabled={busy || member.status === "revoked"}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { key: "can_edit", label: "Edit", icon: MessageSquare },
              { key: "can_comment", label: "Comment", icon: MessageSquare },
              { key: "can_review", label: "Review", icon: ShieldCheck },
            ].map(({ key, label, icon: IconComponent }) => {
              const enabled = Boolean(permissions[key]);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={busy || member.status === "revoked"}
                  onClick={() =>
                    setPermissions((current) =>
                      permissionDependencies({
                        ...current,
                        [key]: !enabled,
                      }),
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[8px] font-semibold ${
                    enabled
                      ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 bg-white text-slate-400"
                  } disabled:opacity-45`}
                >
                  <IconComponent className="h-3 w-3" />
                  {label}
                </button>
              );
            })}

          </div>

          <div className="mt-3 rounded-2xl border border-violet-200 bg-white p-3">
            <p className="text-[8px] font-bold uppercase tracking-[.1em] text-violet-700">
              Advanced controls
            </p>
            <p className="mt-1 mb-2 text-[7.5px] leading-3.5 text-slate-400">
              Each action is separately permissioned and audit logged.
            </p>
            <AdvancedPermissionGrid
              value={permissions}
              onChange={setPermissions}
              disabled={busy || member.status === "revoked"}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || member.status === "revoked"}
              onClick={() => void onSave(member, role, permissions)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-45"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save
            </button>

            {member.status === "active" && (
              <button
                type="button"
                disabled={busy}
                onClick={onSuspend}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[8px] font-semibold text-amber-800 disabled:opacity-45"
              >
                <PauseCircle className="h-3 w-3" />
                Suspend
              </button>
            )}

            {member.status === "suspended" && (
              <button
                type="button"
                disabled={busy}
                onClick={onRestore}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[8px] font-semibold text-cyan-800 disabled:opacity-45"
              >
                <RotateCcw className="h-3 w-3" />
                Restore
              </button>
            )}

            {member.status !== "revoked" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Revoke ${member.email}'s access to this study?`)) {
                    onRemove();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[8px] font-semibold text-rose-700 disabled:opacity-45"
              >
                <X className="h-3 w-3" />
                Revoke
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
