"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type Screen =
  | "dashboard"
  | "clients"
  | "overview"
  | "assessments"
  | "ambulatory"
  | "wearables"
  | "timeline"
  | "notes"
  | "care"
  | "appointments"
  | "messages"
  | "reports"
  | "permissions"
  | "settings";

const navigation: {
  id: Screen;
  label: string;
  group: "Clinical" | "Monitoring" | "Care" | "Governance";
}[] = [
  { id: "dashboard", label: "Dashboard", group: "Clinical" },
  { id: "clients", label: "Clients", group: "Clinical" },
  { id: "overview", label: "Client Overview", group: "Clinical" },

  { id: "assessments", label: "Assessments", group: "Monitoring" },
  { id: "ambulatory", label: "Ambulatory Monitoring", group: "Monitoring" },
  { id: "wearables", label: "Wearables & Physiology", group: "Monitoring" },
  { id: "timeline", label: "Progress Timeline", group: "Monitoring" },

  { id: "notes", label: "Professional Notes", group: "Care" },
  { id: "care", label: "Care Pathway", group: "Care" },
  { id: "appointments", label: "Appointments", group: "Care" },
  { id: "messages", label: "Messages", group: "Care" },

  { id: "reports", label: "Reports", group: "Governance" },
  { id: "permissions", label: "Consent & Data Access", group: "Governance" },
  { id: "settings", label: "Clinical Settings", group: "Governance" },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4.5 10.5 8 14l7.5-8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4 10h11M11 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

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
  const styles = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    accent: "bg-cyan-50 text-cyan-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[type]}`}
    >
      {children}
    </span>
  );
}

function ProgressBar({
  label,
  value,
  text,
}: {
  label: string;
  value: number;
  text: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">{text}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-cyan-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function PersonAvatar({
  initials,
  large = false,
}: {
  initials: string;
  large?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-cyan-50 font-semibold text-cyan-800 ${
        large ? "h-12 w-12" : "h-10 w-10"
      }`}
    >
      {initials}
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned clients" value="24" detail="3 need review" />
        <StatCard label="Today's sessions" value="5" detail="Next at 14:30" />
        <StatCard label="New results" value="7" detail="Since yesterday" />
        <StatCard label="Follow-ups" value="4" detail="Due this week" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel
          title="Needs your review"
          description="Recent information requiring professional attention."
        >
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-5 py-4 first:pt-0">
              <div className="flex items-center gap-3">
                <PersonAvatar initials="MS" />

                <div>
                  <p className="text-sm font-medium">Maya S.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    New stress assessment + 3 days of ambulatory data
                  </p>
                </div>
              </div>

              <Status type="warning">Review</Status>
            </div>

            <div className="flex items-center justify-between gap-5 py-4">
              <div className="flex items-center gap-3">
                <PersonAvatar initials="AK" />

                <div>
                  <p className="text-sm font-medium">Arjun K.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Follow-up task due today
                  </p>
                </div>
              </div>

              <Status>Due</Status>
            </div>

            <div className="flex items-center justify-between gap-5 py-4 pb-0">
              <div className="flex items-center gap-3">
                <PersonAvatar initials="LP" />

                <div>
                  <p className="text-sm font-medium">Lina P.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Wearable-data permission changed
                  </p>
                </div>
              </div>

              <Status type="accent">Update</Status>
            </div>
          </div>

          <button
            type="button"
            onClick={() => changeScreen("clients")}
            className="mt-5 flex items-center gap-2 text-sm font-semibold"
          >
            View connected clients
            <ArrowIcon />
          </button>
        </Panel>

        <Panel title="Today">
          <div className="divide-y divide-slate-100">
            {[
              ["10:00", "Arjun K.", "Follow-up", "Complete"],
              ["14:30", "Maya S.", "Initial consultation", "Upcoming"],
              ["16:00", "Lina P.", "Online session", "Upcoming"],
            ].map(([time, name, type, status]) => (
              <div
                key={`${time}-${name}`}
                className="grid grid-cols-[60px_1fr_auto] gap-3 py-4 first:pt-0 last:pb-0"
              >
                <p className="text-sm font-semibold">{time}</p>

                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs text-slate-400">{type}</p>
                </div>

                <Status type={status === "Complete" ? "success" : "neutral"}>
                  {status}
                </Status>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Recent incoming information">
          <div className="space-y-5">
            {[
              [
                "13:14",
                "Maya S.",
                "Momentary stress 8 / 10 while studying",
                "EMA",
              ],
              [
                "12:42",
                "Lina P.",
                "Wearable sharing preference changed",
                "Consent",
              ],
              [
                "11:50",
                "Arjun K.",
                "Follow-up questionnaire completed",
                "Assessment",
              ],
            ].map(([time, person, text, type]) => (
              <div key={`${time}-${person}`} className="flex gap-4">
                <div className="w-12 shrink-0 text-xs text-slate-400">
                  {time}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{person}</p>
                    <Status>{type}</Status>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Clinical workspace principle">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <p className="font-medium">Data supports professional judgment.</p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              PsyLattice organises assessments, ambulatory information and
              authorised physiological context. It does not independently
              diagnose a disorder or select treatment.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   CLIENTS
   ========================================================= */
type ConnectedClient = {
  connection_id: string;
  client_id: string;
  client_name: string;
  connected_at: string;
  connection_status: string;
};

type ClientSharingPermissions = {
  connection_id: string;
  client_id: string;
  share_assessments: boolean;
  share_monitoring: boolean;
  share_progress: boolean;
  share_wearables: boolean;
  share_regulation: boolean;
  permissions_updated_at: string | null;
};

const clientPermissionDefinitions: Array<{
  key:
    | "share_assessments"
    | "share_monitoring"
    | "share_progress"
    | "share_wearables"
    | "share_regulation";
  title: string;
  description: string;
}> = [
  {
    key: "share_assessments",
    title: "Self-assessment results",
    description:
      "Assessment results the client has authorised for clinician access.",
  },
  {
    key: "share_monitoring",
    title: "Daily monitoring",
    description:
      "Daily check-ins and ambulatory monitoring information.",
  },
  {
    key: "share_progress",
    title: "Progress & trends",
    description:
      "Longitudinal summaries and progress views derived from shared information.",
  },
  {
    key: "share_wearables",
    title: "Wearable summaries",
    description:
      "Authorised wearable summaries when wearable data is connected.",
  },
  {
    key: "share_regulation",
    title: "Self-regulation progress",
    description:
      "Progress from self-regulation plans and completed activities.",
  },
];

function useClientSharingPermissions(
  client: ConnectedClient | null
) {
  const [permissions, setPermissions] =
    useState<ClientSharingPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] =
    useState(false);
  const [permissionsError, setPermissionsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPermissions() {
      if (!client) {
        setPermissions(null);
        setPermissionsError("");
        setLoadingPermissions(false);
        return;
      }

      setLoadingPermissions(true);
      setPermissionsError("");

      const supabase = createClient();

      const { data, error } = await supabase.rpc(
        "psylattice_connected_client_permissions",
        {
          p_connection_id: client.connection_id,
        }
      );

      if (!active) {
        return;
      }

      if (error) {
        console.error(
          "Could not load client sharing permissions:",
          error
        );

        setPermissions(null);
        setPermissionsError(
          "This client's sharing permissions could not be loaded."
        );
        setLoadingPermissions(false);
        return;
      }

      const row =
        Array.isArray(data) && data.length > 0
          ? (data[0] as ClientSharingPermissions)
          : null;

      setPermissions(row);
      setLoadingPermissions(false);
    }

    void loadPermissions();

    return () => {
      active = false;
    };
  }, [client?.connection_id]);

  return {
    permissions,
    loadingPermissions,
    permissionsError,
  };
}

function ConnectedClients({
  onOpenClient,
  onRemoveClient,
}: {
  onOpenClient: (client: ConnectedClient) => void;
  onRemoveClient: (client: ConnectedClient) => Promise<boolean>;
}) {
  const [clients, setClients] = useState<ConnectedClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState("");
  const [search, setSearch] = useState("");
  const [removingClientId, setRemovingClientId] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function loadConnectedClients() {
      setLoadingClients(true);
      setClientsError("");

      const supabase = createClient();

      const { data, error } = await supabase.rpc(
        "psylattice_my_connected_clients"
      );

      if (error) {
        console.error(
          "Could not load connected clients:",
          error
        );

        setClientsError(
          "Your connected clients could not be loaded."
        );

        setLoadingClients(false);
        return;
      }

      setClients((data ?? []) as ConnectedClient[]);
      setLoadingClients(false);
    }

    void loadConnectedClients();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const visibleClients = clients.filter((client) =>
    client.client_name
      .toLowerCase()
      .includes(normalizedSearch)
  );

  async function handleRemoveClient(
    client: ConnectedClient
  ) {
    if (removingClientId) {
      return;
    }

    setClientsError("");
    setRemovingClientId(client.connection_id);

    const removed = await onRemoveClient(client);

    if (removed) {
      setClients((current) =>
        current.filter(
          (item) =>
            item.connection_id !== client.connection_id
        )
      );
    }

    setRemovingClientId(null);
  }

  function initialsFromName(name: string) {
    const initials = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();

    return initials || "PL";
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Connected clients"
        description="People who have accepted your clinician connection request."
      >
        <div className="mb-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search connected clients..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700"
          />
        </div>

        {clientsError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {clientsError}
          </div>
        )}

        {loadingClients ? (
          <div className="rounded-xl bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Loading connected clients...
            </p>
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-5 py-10 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 text-lg text-cyan-800">
              +
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-800">
              No connected clients yet
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              When someone accepts your clinician invitation
              from their PsyLattice Self account, they will
              appear here.
            </p>
          </div>
        ) : visibleClients.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              No matching clients
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try another search.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleClients.map((client) => {
              const removing =
                removingClientId === client.connection_id;

              return (
                <div
                  key={client.connection_id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-200 hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <PersonAvatar
                      initials={initialsFromName(
                        client.client_name
                      )}
                      large
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {client.client_name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            Connected{" "}
                            {new Date(
                              client.connected_at
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        <Status type="success">
                          Active
                        </Status>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        This person has accepted your PsyLattice
                        clinician connection.
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={removing}
                          onClick={() =>
                            onOpenClient(client)
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          Open client
                          <ArrowIcon />
                        </button>

                        <button
                          type="button"
                          disabled={removing}
                          onClick={() =>
                            void handleRemoveClient(client)
                          }
                          className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {removing
                            ? "Removing..."
                            : "Remove client"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
function Clients({
  onOpenClient,
  onRemoveClient,
}: {
  onOpenClient: (client: ConnectedClient) => void;
  onRemoveClient: (client: ConnectedClient) => Promise<boolean>;
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [pageError, setPageError] = useState("");

  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [sendingInvitation, setSendingInvitation] = useState(false);

  const [pendingInvitations, setPendingInvitations] = useState<
    Array<{
      id: string;
      email: string;
      message: string;
      createdAt: string;
    }>
  >([]);

  

  useEffect(() => {
    async function loadInvitations() {
      setLoadingInvitations(true);
      setPageError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPageError(
          "We could not confirm your account. Please sign in again."
        );
        setLoadingInvitations(false);
        return;
      }

      const { data, error } = await supabase
        .from("clinician_client_invitations")
        .select("id, client_email, message, created_at")
        .eq("clinician_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load client invitations:", error);

        setPageError(
          "Pending invitations could not be loaded. Please try again."
        );

        setLoadingInvitations(false);
        return;
      }

      setPendingInvitations(
        (data ?? []).map((row) => ({
          id: row.id,
          email: row.client_email,
          message: row.message ?? "",
          createdAt: row.created_at,
        }))
      );

      setLoadingInvitations(false);
    }

    void loadInvitations();
  }, []);


  function openInviteModal() {
    setInviteEmail("");
    setInviteMessage("");
    setInviteError("");
    setShowInviteModal(true);
  }

  function closeInviteModal() {
    if (sendingInvitation) return;

    setShowInviteModal(false);
    setInviteError("");
  }

  async function sendInvitation() {
    if (sendingInvitation) return;

    const normalizedEmail = inviteEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setInviteError("Enter the client's email address.");
      return;
    }

    if (
      !normalizedEmail.includes("@") ||
      !normalizedEmail.includes(".")
    ) {
      setInviteError("Enter a valid email address.");
      return;
    }

    const alreadyPending = pendingInvitations.some(
      (invite) => invite.email.toLowerCase() === normalizedEmail
    );

    if (alreadyPending) {
      setInviteError(
        "An invitation to this email is already pending."
      );
      return;
    }

    setSendingInvitation(true);
    setInviteError("");
    setPageError("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setInviteError(
        "We could not confirm your account. Please sign in again."
      );
      setSendingInvitation(false);
      return;
    }

    const { data, error } = await supabase
      .from("clinician_client_invitations")
      .insert({
        clinician_id: user.id,
        client_email: normalizedEmail,
        message: inviteMessage.trim() || null,
        status: "pending",
      })
      .select("id, client_email, message, created_at")
      .single();

    if (error) {
      console.error("Could not create client invitation:", error);

      if (error.code === "23505") {
        setInviteError(
          "An invitation to this email is already pending."
        );
      } else {
        setInviteError(
          "The invitation could not be created. Please try again."
        );
      }

      setSendingInvitation(false);
      return;
    }

    setPendingInvitations((current) => [
      {
        id: data.id,
        email: data.client_email,
        message: data.message ?? "",
        createdAt: data.created_at,
      },
      ...current,
    ]);

    setInviteEmail("");
    setInviteMessage("");
    setInviteError("");
    setSendingInvitation(false);
    setShowInviteModal(false);
  }

  async function cancelInvitation(id: string) {
    setPageError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("clinician_client_invitations")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Could not cancel invitation:", error);

      setPageError(
        "The invitation could not be cancelled. Please try again."
      );

      return;
    }

    setPendingInvitations((current) =>
      current.filter((invite) => invite.id !== id)
    );
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Your clients
            </p>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              View connected clients or invite someone to connect their
              PsyLattice Self account with your professional workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={openInviteModal}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <span className="text-lg font-light">+</span>
            Add client
          </button>
        </div>

        {pageError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}
        <ConnectedClients
          onOpenClient={onOpenClient}
          onRemoveClient={onRemoveClient}
        />

        {/* Pending invitations */}
        <Panel
          title="Pending invitations"
          description="Invitations remain pending until the client accepts the connection from their PsyLattice Self account."
        >
          {loadingInvitations ? (
            <div className="rounded-xl bg-slate-50 px-5 py-7 text-center">
              <p className="text-sm font-medium text-slate-600">
                Loading invitations...
              </p>
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-5 py-7 text-center">
              <p className="text-sm font-medium text-slate-700">
                No pending invitations
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                New client invitations will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingInvitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {invite.email}
                      </p>

                      <Status type="warning">Pending</Status>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Invitation created ·{" "}
                      {new Date(invite.createdAt).toLocaleString()}
                    </p>

                    {invite.message && (
                      <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                        “{invite.message}”
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void cancelInvitation(invite.id)
                    }
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    Cancel invitation
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Invite client modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm"
          onMouseDown={closeInviteModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-client-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_100px_-25px_rgba(15,23,42,0.45)]"
          >
            <div className="flex items-start justify-between gap-5 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800">
                  Client connection
                </p>

                <h2
                  id="invite-client-title"
                  className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
                >
                  Invite a client
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The client will need to accept the connection before
                  you can access any information from their PsyLattice
                  Self account.
                </p>
              </div>

              <button
                type="button"
                onClick={closeInviteModal}
                disabled={sendingInvitation}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <label className="block">
                <span className="text-sm font-medium text-slate-800">
                  Client email
                </span>

                <p className="mt-1 text-xs text-slate-400">
                  Use the email they use, or will use, for PsyLattice.
                </p>

                <input
                  type="email"
                  value={inviteEmail}
                  disabled={sendingInvitation}
                  onChange={(event) => {
                    setInviteEmail(event.target.value);
                    setInviteError("");
                  }}
                  placeholder="client@example.com"
                  className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 disabled:bg-slate-50"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-800">
                  Optional message
                </span>

                <textarea
                  value={inviteMessage}
                  disabled={sendingInvitation}
                  onChange={(event) =>
                    setInviteMessage(event.target.value)
                  }
                  placeholder="For example: I'm inviting you to use PsyLattice for the assessments and monitoring we discussed."
                  className="mt-2 min-h-28 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none transition focus:border-cyan-700 disabled:bg-slate-50"
                />
              </label>

              <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
                <p className="text-sm font-medium text-cyan-950">
                  The client stays in control.
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Sending an invitation does not give you access to
                  their PsyLattice data. Sharing permissions are chosen
                  after the client accepts the connection.
                </p>
              </div>

              {inviteError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {inviteError}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={sendingInvitation}
                onClick={closeInviteModal}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={sendingInvitation}
                onClick={() => void sendInvitation()}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingInvitation
                  ? "Sending..."
                  : "Send invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
/* =========================================================
   CLIENT OVERVIEW
   ========================================================= */

function ClientOverview({
  changeScreen,
  client,
  onRemoveClient,
}: {
  changeScreen: (screen: Screen) => void;
  client: ConnectedClient | null;
  onRemoveClient: (client: ConnectedClient) => Promise<boolean>;
}) {
  const [removingClient, setRemovingClient] = useState(false);

  const {
    permissions,
    loadingPermissions,
    permissionsError,
  } = useClientSharingPermissions(client);

  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-slate-950">
          Select a client first
        </p>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Open a connected client from the Clients page to view their
          professional workspace.
        </p>

        <button
          type="button"
          onClick={() => changeScreen("clients")}
          className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          View clients
        </button>
      </div>
    );
  }

  const initials =
    client.client_name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "PL";

  const sharedPermissionCount = permissions
    ? clientPermissionDefinitions.filter(
        (definition) => permissions[definition.key]
      ).length
    : 0;

  async function removeCurrentClient() {
    if (!client || removingClient) {
      return;
    }

    setRemovingClient(true);

    const removed = await onRemoveClient(client);

    if (removed) {
      changeScreen("clients");
    }

    setRemovingClient(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <PersonAvatar initials={initials} large />

          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              {client.client_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Connected{" "}
              {new Date(client.connected_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Status type="success">Connected</Status>

          <button
            type="button"
            disabled={removingClient}
            onClick={() => void removeCurrentClient()}
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removingClient
              ? "Removing..."
              : "Remove client"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-semibold text-cyan-800">
            <CheckIcon />
          </div>

          <div>
            <p className="font-semibold text-cyan-950">
              Clinician connection active
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This client has accepted your connection request. Acceptance
              does not automatically provide access to their assessments,
              monitoring, wearable information or other personal data.
            </p>
          </div>
        </div>
      </div>

      <Panel
        title="Client-authorised information"
        description="A summary of the categories this client currently allows you to access."
      >
        {loadingPermissions ? (
          <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Loading sharing permissions...
            </p>
          </div>
        ) : permissionsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700">
              {permissionsError}
            </p>
          </div>
        ) : permissions ? (
          <div className="space-y-5">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {sharedPermissionCount} of 5 categories shared
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The client controls these permissions from
                  Self → Privacy & Sharing.
                </p>
              </div>

              <Status
                type={
                  sharedPermissionCount > 0
                    ? "success"
                    : "neutral"
                }
              >
                {sharedPermissionCount > 0
                  ? "Authorised access"
                  : "Nothing shared"}
              </Status>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clientPermissionDefinitions.map(
                (definition) => {
                  const shared =
                    permissions[definition.key];

                  return (
                    <div
                      key={definition.key}
                      className={`rounded-xl border p-4 ${
                        shared
                          ? "border-emerald-100 bg-emerald-50/60"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-800">
                          {definition.title}
                        </p>

                        <span
                          className={`text-sm font-semibold ${
                            shared
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {shared ? "✓" : "—"}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Luna AI conversations
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Private conversation history is not included
                    in clinician sharing permissions.
                  </p>
                </div>

                <Status type="accent">Private</Status>
              </div>
            </div>

            <button
              type="button"
              onClick={() => changeScreen("permissions")}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-50"
            >
              View consent & data access
              <ArrowIcon />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
            <p className="font-semibold text-slate-800">
              No permission record available
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              No client-authorised sharing record was returned
              for this active connection.
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Professional actions">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            disabled={
              loadingPermissions ||
              !permissions?.share_assessments
            }
            onClick={() => changeScreen("assessments")}
            className={`rounded-xl border p-4 text-left transition ${
              permissions?.share_assessments
                ? "border-cyan-200 bg-cyan-50/50 hover:bg-cyan-50"
                : "border-slate-200 bg-slate-50 opacity-60"
            }`}
          >
            <p className="text-sm font-semibold text-slate-700">
              Review shared assessments
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              {loadingPermissions
                ? "Checking client permission..."
                : permissions?.share_assessments
                  ? "Open this client's authorised completed assessment results."
                  : "Assessment results are not currently shared by this client."}
            </p>
          </button>

          <button
            type="button"
            disabled
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left opacity-60"
          >
            <p className="text-sm font-semibold text-slate-700">
              Assign monitoring
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Available after sharing permissions are configured.
            </p>
          </button>

          <button
            type="button"
            disabled
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left opacity-60"
          >
            <p className="text-sm font-semibold text-slate-700">
              Add professional note
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Client-specific professional records will be connected next.
            </p>
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   ASSESSMENTS
   ========================================================= */

type ClinicianAssessmentRecord = {
  session_id: string;
  questionnaire_id: string;
  questionnaire_name: string;
  questionnaire_acronym: string | null;
  scores: Record<string, number> | null;
  completed_at: string;
};

function Assessments({
  client,
  changeScreen,
}: {
  client: ConnectedClient | null;
  changeScreen: (screen: Screen) => void;
}) {
  const {
    permissions,
    loadingPermissions,
    permissionsError,
  } = useClientSharingPermissions(client);

  const [assessments, setAssessments] = useState<
    ClinicianAssessmentRecord[]
  >([]);
  const [loadingAssessments, setLoadingAssessments] =
    useState(false);
  const [assessmentError, setAssessmentError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSharedAssessments() {
      setAssessmentError("");

      if (
        !client ||
        loadingPermissions ||
        !permissions ||
        !permissions.share_assessments
      ) {
        setAssessments([]);
        setLoadingAssessments(false);
        return;
      }

      setLoadingAssessments(true);

      const supabase = createClient();

      const { data, error } = await supabase.rpc(
        "psylattice_connected_client_assessments",
        {
          p_connection_id: client.connection_id,
        }
      );

      if (!active) {
        return;
      }

      if (error) {
        console.error(
          "Could not load shared client assessments:",
          error
        );

        setAssessmentError(
          "This client's shared assessments could not be loaded."
        );
        setAssessments([]);
        setLoadingAssessments(false);
        return;
      }

      setAssessments(
        (data ?? []) as ClinicianAssessmentRecord[]
      );
      setLoadingAssessments(false);
    }

    void loadSharedAssessments();

    return () => {
      active = false;
    };
  }, [
    client?.connection_id,
    loadingPermissions,
    permissions?.share_assessments,
  ]);

  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-slate-950">
          Select a client first
        </p>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Open a connected client from the Clients page before
          reviewing assessment information.
        </p>

        <button
          type="button"
          onClick={() => changeScreen("clients")}
          className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          View clients
        </button>
      </div>
    );
  }

  const initials =
    client.client_name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "PL";

  const latestAssessment =
    assessments.length > 0 ? assessments[0] : null;

  const distinctQuestionnaires = new Set(
    assessments.map(
      (assessment) => assessment.questionnaire_id
    )
  ).size;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <PersonAvatar initials={initials} large />

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              Shared assessments
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {client.client_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assessment access follows this client's
              current sharing permission.
            </p>
          </div>
        </div>

        {loadingPermissions ? (
          <Status>Checking access</Status>
        ) : permissions?.share_assessments ? (
          <Status type="success">Shared</Status>
        ) : (
          <Status>Not shared</Status>
        )}
      </div>

      {loadingPermissions ? (
        <Panel title="Assessment access">
          <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Checking assessment permission...
            </p>
          </div>
        </Panel>
      ) : permissionsError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">
            {permissionsError}
          </p>
        </div>
      ) : !permissions?.share_assessments ? (
        <Panel
          title="Assessment access"
          description="The client controls this permission from their Self workspace."
        >
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
              🔒
            </div>

            <p className="mt-4 font-semibold text-slate-800">
              Assessment results are not shared
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {client.client_name} has not authorised access
              to Self-assessment results. PsyLattice will not
              return their assessment records to this
              Clinical workspace while this permission is off.
            </p>

            <button
              type="button"
              onClick={() => changeScreen("permissions")}
              className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View consent & data access
            </button>
          </div>
        </Panel>
      ) : (
        <>
          {assessmentError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm text-red-700">
                {assessmentError}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Completed assessments"
              value={
                loadingAssessments
                  ? "..."
                  : String(assessments.length)
              }
              detail="Authorised completed records"
            />

            <StatCard
              label="Measures represented"
              value={
                loadingAssessments
                  ? "..."
                  : String(distinctQuestionnaires)
              }
              detail="Distinct questionnaires"
            />

            <StatCard
              label="Latest completion"
              value={
                loadingAssessments
                  ? "..."
                  : latestAssessment
                    ? new Date(
                        latestAssessment.completed_at
                      ).toLocaleDateString([], {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "None"
              }
              detail="Most recent shared result"
            />
          </div>

          <Panel
            title="Assessment history"
            description="Completed Self assessments returned through the client's active assessment-sharing permission."
          >
            {loadingAssessments ? (
              <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm font-medium text-slate-600">
                  Loading shared assessments...
                </p>
              </div>
            ) : assessments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
                <p className="font-semibold text-slate-800">
                  No completed assessments yet
                </p>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Assessment sharing is enabled, but this
                  client does not currently have a completed
                  assessment record available through the
                  shared-assessment endpoint.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assessments.map((assessment) => {
                  const scoreEntries = assessment.scores
                    ? Object.entries(
                        assessment.scores
                      ).filter(
                        ([, value]) =>
                          typeof value === "number"
                      )
                    : [];

                  return (
                    <div
                      key={assessment.session_id}
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">
                              {
                                assessment.questionnaire_name
                              }
                            </p>

                            {assessment.questionnaire_acronym && (
                              <Status type="accent">
                                {
                                  assessment.questionnaire_acronym
                                }
                              </Status>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-slate-400">
                            Completed{" "}
                            {new Date(
                              assessment.completed_at
                            ).toLocaleString()}
                          </p>
                        </div>

                        <Status type="success">
                          Client shared
                        </Status>
                      </div>

                      {scoreEntries.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {scoreEntries.map(
                            ([label, value]) => (
                              <span
                                key={label}
                                className="rounded-full border border-cyan-100 bg-cyan-50/60 px-3 py-1.5 text-xs font-medium text-cyan-900"
                              >
                                {label}: {value}
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          No scored summary is stored for this
                          completed session.
                        </p>
                      )}

                      <p className="mt-4 max-w-4xl text-xs leading-5 text-slate-400">
                        Questionnaire scores are displayed as
                        recorded results. Clinical meaning
                        requires professional interpretation
                        and appropriate context.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Assessment access boundary">
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
              <p className="font-medium text-cyan-950">
                Access is checked in Supabase, not only hidden
                in the interface.
              </p>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                The Clinical workspace requests assessment
                history through a restricted database
                function. The function returns completed
                assessment summaries only when this clinician
                has an active connection to the client and the
                client currently allows assessment sharing.
              </p>
            </div>
          </Panel>

          <Panel title="Assign an assessment">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium text-slate-800">
                Assessment assignment is the next workflow.
              </p>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Reading authorised existing results is now
                separate from assigning a new assessment. We
                will connect assignment to the Self workspace
                in the next assessment step.
              </p>

              <button
                type="button"
                disabled
                className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
              >
                Assign assessment · Coming next
              </button>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}


/* =========================================================
   AMBULATORY MONITORING
   ========================================================= */

function Ambulatory() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Prompts sent" value="56" detail="Past 14 days" />
        <StatCard label="Completed" value="46" detail="82% completion" />
        <StatCard label="Mean stress" value="5.4 / 10" detail="Momentary reports" />
        <StatCard label="High ratings" value="9" detail="Ratings ≥ 8" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Recent moments">
          <div className="divide-y divide-slate-100">
            {[
              [
                "Today · 12:42",
                "8 / 10",
                "Studying",
                "Deadline approaching",
                "High",
              ],
              ["Today · 09:11", "4 / 10", "Commuting", "Alone", "Moderate"],
              [
                "Yesterday · 20:31",
                "3 / 10",
                "Home",
                "Socialising",
                "Lower",
              ],
              [
                "Yesterday · 16:08",
                "7 / 10",
                "Library",
                "Studying",
                "Elevated",
              ],
            ].map(([time, stress, location, context, level]) => (
              <div
                key={time}
                className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[130px_80px_1fr_auto]"
              >
                <p className="text-xs text-slate-400">{time}</p>
                <p className="text-sm font-semibold">{stress}</p>
                <div>
                  <p className="text-sm">{location}</p>
                  <p className="mt-1 text-xs text-slate-400">{context}</p>
                </div>
                <Status
                  type={
                    level === "High"
                      ? "warning"
                      : level === "Lower"
                        ? "success"
                        : "neutral"
                  }
                >
                  {level}
                </Status>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Context summary">
          <div className="space-y-6">
            <ProgressBar
              label="Academic / studying"
              value={72}
              text="Most frequent context"
            />

            <ProgressBar label="Alone" value={58} text="58% of reports" />

            <ProgressBar
              label="Elevated stress during study"
              value={61}
              text="Descriptive subset"
            />
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            These are descriptive associations only and should not be
            presented as causal conclusions.
          </p>
        </Panel>
      </div>

      <Panel title="Current ambulatory protocol">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Morning", "08:00–10:00", "Random"],
            ["Midday", "12:00–14:30", "Random"],
            ["Afternoon", "16:00–18:30", "Random"],
            ["Evening", "20:30", "Fixed"],
          ].map(([name, time, type]) => (
            <div
              key={name}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p className="text-sm font-medium">{name}</p>
              <p className="mt-2 text-xs text-slate-400">{time}</p>
              <div className="mt-3">
                <Status type="accent">{type}</Status>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   WEARABLES
   ========================================================= */

function Wearables() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
        <p className="font-medium">Physiological information is contextual.</p>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          PsyLattice displays only signals explicitly authorised by the
          client. Wearable information supplements self-report data and does
          not independently establish a psychological diagnosis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sleep" value="6h 18m" detail="7-day average" />
        <StatCard label="Activity" value="7,420" detail="Average steps" />
        <StatCard label="Resting HR" value="64 bpm" detail="Daily summary" />
        <StatCard label="HRV" value="Not shared" detail="Permission off" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Data coverage">
          <div className="space-y-6">
            <ProgressBar label="Sleep" value={92} text="92% coverage" />
            <ProgressBar label="Activity" value={96} text="96% coverage" />
            <ProgressBar
              label="Resting heart rate"
              value={74}
              text="74% coverage"
            />
          </div>
        </Panel>

        <Panel title="Current permissions">
          <div className="divide-y divide-slate-100">
            {[
              ["Sleep", "Duration and timing summaries", "Authorised"],
              ["Activity", "Daily movement summaries", "Authorised"],
              ["Resting HR", "Daily summary only", "Authorised"],
              ["HRV", "Not shared by client", "Unavailable"],
            ].map(([name, description, status]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {description}
                  </p>
                </div>

                <Status
                  type={status === "Authorised" ? "success" : "neutral"}
                >
                  {status}
                </Status>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   TIMELINE
   ========================================================= */

function Timeline() {
  const events = [
    {
      date: "09 Aug",
      title: "New stress assessment",
      detail: "Score 21 · professional review pending",
      type: "Assessment",
    },
    {
      date: "08 Aug",
      title: "Elevated EMA reports",
      detail: "Three high stress reports during academic activity",
      type: "Ambulatory",
    },
    {
      date: "02 Aug",
      title: "Follow-up note",
      detail: "Monitoring continued for another two weeks",
      type: "Clinical",
    },
    {
      date: "26 Jul",
      title: "Previous stress assessment",
      detail: "Score 25 · reviewed",
      type: "Assessment",
    },
    {
      date: "24 Jul",
      title: "Ambulatory protocol started",
      detail: "Four prompts per day",
      type: "Monitoring",
    },
  ];

  return (
    <div className="space-y-5">
      <Panel title="Longitudinal record">
        <div className="space-y-0">
          {events.map((event, index) => (
            <div key={`${event.date}-${event.title}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="mt-1 h-3 w-3 rounded-full bg-cyan-700" />

                {index < events.length - 1 && (
                  <div className="h-20 w-px bg-slate-200" />
                )}
              </div>

              <div className="pb-7">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-slate-400">{event.date}</p>
                  <Status>{event.type}</Status>
                </div>

                <p className="mt-2 font-medium">{event.title}</p>
                <p className="mt-1 text-sm text-slate-500">{event.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Timeline filters">
        <div className="flex flex-wrap gap-2">
          {[
            "All",
            "Assessments",
            "Ambulatory",
            "Wearables",
            "Sessions",
            "Notes",
          ].map((item, index) => (
            <button
              key={item}
              className={`rounded-full border px-3 py-2 text-xs font-medium ${
                index === 0
                  ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   NOTES
   ========================================================= */

function Notes() {
  const [note, setNote] = useState(
    "Reviewed latest self-assessment and ambulatory entries. Discuss contextual pattern during scheduled consultation.",
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title="New professional note">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Note type</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>Assessment review</option>
              <option>Session note</option>
              <option>Follow-up</option>
              <option>Referral</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Professional note</span>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-40 w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-cyan-700"
            />
          </label>

          <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            Professional notes will later be timestamped, attributed to the
            authenticated professional and included in the audit trail.
          </div>

          <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Save professional note
          </button>
        </div>
      </Panel>

      <Panel title="Recent notes">
        <div className="divide-y divide-slate-100">
          {[
            ["09 Aug · 11:32", "Assessment review", "Dr. Sharma"],
            ["02 Aug · 16:05", "Follow-up note", "Dr. Sharma"],
            ["26 Jul · 10:18", "Initial triage", "Counselling service"],
          ].map(([date, type, author]) => (
            <div
              key={date}
              className="py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{type}</p>
                <Status>{author}</Status>
              </div>

              <p className="mt-1 text-xs text-slate-400">{date}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   CARE PATHWAY
   ========================================================= */

function CarePathway() {
  return (
    <div className="space-y-5">
      <Panel title="Current support pathway">
        <div className="flex flex-wrap items-center gap-2">
          <Status type="success">1 · Request ✓</Status>
          <span className="text-slate-300">→</span>
          <Status type="success">2 · Review ✓</Status>
          <span className="text-slate-300">→</span>
          <Status type="accent">3 · Consultation</Status>
          <span className="text-slate-300">→</span>
          <Status>4 · Follow-up</Status>
        </div>

        <div className="mt-7 divide-y divide-slate-100">
          {[
            [
              "Support request",
              "Submitted 26 Jul",
              "Complete",
            ],
            [
              "Initial professional review",
              "Reviewed by counselling service",
              "Complete",
            ],
            [
              "Consultation",
              "14 Aug · 14:30",
              "Scheduled",
            ],
            [
              "Follow-up plan",
              "To be determined by professional",
              "Pending",
            ],
          ].map(([name, detail, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>

              <Status
                type={
                  status === "Complete"
                    ? "success"
                    : status === "Scheduled"
                      ? "accent"
                      : "neutral"
                }
              >
                {status}
              </Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Record professional decision">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Next action</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>Continue current support</option>
              <option>Schedule follow-up</option>
              <option>Refer to another service</option>
              <option>Close current pathway</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Follow-up interval</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>1 week</option>
              <option>2 weeks</option>
              <option>4 weeks</option>
            </select>
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium">
            Professional rationale
          </span>

          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-4 text-sm"
            placeholder="Record the professional basis for the decision..."
          />
        </label>

        <button className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Record decision
        </button>
      </Panel>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-medium text-amber-900">
          Human decision required
        </p>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-800">
          Referral, escalation, diagnosis and treatment decisions remain
          professional actions. PsyLattice may organise information or surface
          workflow tasks, but does not make these decisions autonomously.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   APPOINTMENTS
   ========================================================= */

function Appointments() {
  return (
    <div className="space-y-5">
      <Panel title="Upcoming appointments">
        <div className="divide-y divide-slate-100">
          {[
            [
              "14 Aug · 14:30",
              "Maya S.",
              "Initial consultation · In person",
              "Confirmed",
            ],
            [
              "14 Aug · 16:00",
              "Lina P.",
              "Follow-up · Online",
              "Confirmed",
            ],
            [
              "15 Aug · 10:30",
              "Arjun K.",
              "Follow-up · In person",
              "Pending",
            ],
          ].map(([time, person, type, status]) => (
            <div
              key={`${time}-${person}`}
              className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[150px_1fr_200px_auto] md:items-center"
            >
              <p className="text-sm font-semibold">{time}</p>
              <p className="text-sm font-medium">{person}</p>
              <p className="text-sm text-slate-500">{type}</p>
              <Status
                type={status === "Confirmed" ? "success" : "warning"}
              >
                {status}
              </Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Follow-up tasks">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Maya S.",
              "Review ambulatory entries before consultation",
              "14 Aug",
            ],
            ["Arjun K.", "Send agreed follow-up questionnaire", "Today"],
            [
              "Lina P.",
              "Acknowledge changed data permission",
              "Today",
            ],
          ].map(([person, task, due]) => (
            <div
              key={`${person}-${task}`}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{person}</p>
                <p className="mt-1 text-sm text-slate-500">{task}</p>
              </div>

              <Status>{due}</Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Schedule appointment">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="text-sm font-medium">Client</span>
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>Maya S.</option>
              <option>Arjun K.</option>
              <option>Lina P.</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Type</span>
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>Follow-up</option>
              <option>Initial consultation</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Mode</span>
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>In person</option>
              <option>Online</option>
            </select>
          </label>

          <div className="flex items-end">
            <button className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Schedule
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   MESSAGES
   ========================================================= */

function Messages() {
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <Panel title="Conversations">
        <div className="divide-y divide-slate-100">
          {[
            ["Maya S.", "Question about tomorrow's check-in", "12m"],
            ["Arjun K.", "Follow-up questionnaire", "1h"],
            ["Lina P.", "Data-sharing preference updated", "Today"],
          ].map(([person, preview, time]) => (
            <button
              key={person}
              className="w-full py-4 text-left first:pt-0 last:pb-0"
            >
              <div className="flex justify-between gap-3">
                <p className="text-sm font-medium">{person}</p>
                <span className="text-xs text-slate-400">{time}</span>
              </div>

              <p className="mt-1 text-xs text-slate-500">{preview}</p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Maya S.">
        <div className="min-h-[380px] space-y-4">
          <div className="max-w-md rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-6">
              Do I need to complete the evening check-in if I'm travelling?
            </p>
            <p className="mt-2 text-xs text-slate-400">12:22</p>
          </div>

          <div className="ml-auto max-w-md rounded-2xl rounded-tr-sm bg-slate-950 p-4 text-white">
            <p className="text-sm leading-6">
              Complete it if practical. Missing an occasional prompt is okay,
              and we can review the overall pattern later.
            </p>
            <p className="mt-2 text-xs text-slate-400">12:28</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 border-t border-slate-100 pt-5">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a secure message..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />

          <button
            type="button"
            onClick={() => setMessage("")}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Send
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   REPORTS
   ========================================================= */

function Reports() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel
          title="Create professional report"
          description="Prepare a structured summary from authorised information."
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium">Report type</span>

              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Longitudinal assessment summary</option>
                <option>Monitoring summary</option>
                <option>Referral summary</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Period</span>

              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Custom range</option>
              </select>
            </label>

            <div className="space-y-3">
              {[
                "Assessment history",
                "Ambulatory summary",
                "Authorised wearable summaries",
                "Professional notes",
              ].map((item, index) => (
                <label key={item} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked={index !== 2}
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>

            <button className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Generate draft report
            </button>
          </div>
        </Panel>

        <Panel title="Professional review required">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <p className="font-medium">Reports remain professional documents.</p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              PsyLattice may organise authorised information into a draft,
              but a qualified professional must review and finalise the
              report. The system does not autonomously generate definitive
              diagnosis or treatment recommendations.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Previous reports">
        <div className="divide-y divide-slate-100">
          {[
            ["02 Aug 2026", "Monitoring summary", "PDF", "Finalised"],
            [
              "26 Jul 2026",
              "Initial assessment summary",
              "PDF",
              "Finalised",
            ],
          ].map(([date, name, format, status]) => (
            <div
              key={date}
              className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[140px_1fr_100px_auto] sm:items-center"
            >
              <span className="text-xs text-slate-400">{date}</span>
              <span className="text-sm font-medium">{name}</span>
              <span className="text-xs text-slate-500">{format}</span>
              <Status type="success">{status}</Status>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   PERMISSIONS
   ========================================================= */

function Permissions({
  client,
}: {
  client: ConnectedClient | null;
}) {
  const {
    permissions,
    loadingPermissions,
    permissionsError,
  } = useClientSharingPermissions(client);

  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-slate-950">
          Select a client first
        </p>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Open a connected client from the Clients page before
          reviewing Consent & Data Access.
        </p>
      </div>
    );
  }

  const initials =
    client.client_name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "PL";

  const sharedPermissionCount = permissions
    ? clientPermissionDefinitions.filter(
        (definition) => permissions[definition.key]
      ).length
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <PersonAvatar initials={initials} large />

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              Consent & Data Access
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {client.client_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Connected{" "}
              {new Date(client.connected_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Status type="success">Connected</Status>
      </div>

      <Panel
        title="Client-authorised access"
        description="This is a read-only view of the sharing choices made by the client in their Self workspace."
      >
        {loadingPermissions ? (
          <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Loading permissions...
            </p>
          </div>
        ) : permissionsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700">
              {permissionsError}
            </p>
          </div>
        ) : permissions ? (
          <div className="space-y-5">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-cyan-950">
                  {sharedPermissionCount} of 5 categories currently shared
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Only the client can change these permissions.
                  Changes made in Self → Privacy & Sharing are
                  reflected here.
                </p>
              </div>

              <Status
                type={
                  sharedPermissionCount > 0
                    ? "success"
                    : "neutral"
                }
              >
                {sharedPermissionCount > 0
                  ? "Access granted"
                  : "No data access"}
              </Status>
            </div>

            <div className="divide-y divide-slate-100">
              {clientPermissionDefinitions.map(
                (definition) => {
                  const shared =
                    permissions[definition.key];

                  return (
                    <div
                      key={definition.key}
                      className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {definition.title}
                        </p>

                        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
                          {definition.description}
                        </p>
                      </div>

                      <Status
                        type={
                          shared
                            ? "success"
                            : "neutral"
                        }
                      >
                        {shared
                          ? "Shared"
                          : "Not shared"}
                      </Status>
                    </div>
                  );
                }
              )}

              <div className="flex items-center justify-between gap-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Luna AI conversations
                  </p>

                  <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
                    Private AI conversation history is not
                    exposed through clinician sharing permissions.
                  </p>
                </div>

                <Status type="accent">Private</Status>
              </div>
            </div>

            {permissions.permissions_updated_at && (
              <p className="text-xs text-slate-400">
                Client permissions last updated{" "}
                {new Date(
                  permissions.permissions_updated_at
                ).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-9 text-center">
            <p className="font-semibold text-slate-800">
              No permission record available
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              PsyLattice did not receive a sharing-permission
              record for this active connection.
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Access rule">
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="font-medium">
            Client connection does not equal data access.
          </p>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
            A connected client can keep every category private.
            Clinical data pages should only expose information
            covered by an active client-authorised permission.
            The next implementation step will enforce these
            permissions on the underlying assessment,
            monitoring, progress and wearable queries.
          </p>
        </div>
      </Panel>
    </div>
  );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function Settings() {
  return (
    <div className="space-y-5">
      <Panel title="Professional account">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Professional verification",
              "Counselling psychologist",
              "Verified",
            ],
            [
              "Organisation",
              "University Wellbeing Service",
              "Connected",
            ],
            ["Assigned service", "Student counselling", "Active"],
          ].map(([name, value, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{value}</p>
              </div>

              <Status type="success">{status}</Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Clinical workflow">
        <div className="divide-y divide-slate-100">
          {[
            [
              "New client assignment",
              "Coordinator approval required",
              "Controlled",
            ],
            [
              "Automated diagnosis",
              "Not available in PsyLattice",
              "Disabled",
            ],
            [
              "Automated treatment selection",
              "Not available in PsyLattice",
              "Disabled",
            ],
            [
              "After-hours messaging",
              "Show service availability notice",
              "Enabled",
            ],
          ].map(([name, detail, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>

              <Status>{status}</Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Security">
        <div className="divide-y divide-slate-100">
          {[
            ["Two-factor authentication", "Enabled", "Secure"],
            [
              "Sensitive-action logging",
              "All relevant clinical actions",
              "Enabled",
            ],
            ["Session timeout", "15 minutes inactive", "Policy"],
            ["Last account access", "Today · 08:42", "Expected"],
          ].map(([name, detail, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>

              <Status type={status === "Secure" ? "success" : "neutral"}>
                {status}
              </Status>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   MAIN CLINICIAN WORKSPACE
   ========================================================= */

export default function ClinicianWorkspace() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedClient, setSelectedClient] =
    useState<ConnectedClient | null>(null);

  function openClient(client: ConnectedClient) {
    setSelectedClient(client);
    setScreen("overview");
  }

  async function removeClientConnection(
    client: ConnectedClient
  ): Promise<boolean> {
    const confirmed = window.confirm(
      `Remove ${client.client_name} from your Clinical workspace?\n\nThis ends the clinician-client connection and immediately removes your access through PsyLattice sharing permissions. It does not delete the client's Self account or personal data.`
    );

    if (!confirmed) {
      return false;
    }

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_end_connection_as_clinician",
      {
        p_connection_id: client.connection_id,
      }
    );

    if (error) {
      console.error(
        "Could not remove client connection:",
        error
      );

      window.alert(
        "The client connection could not be removed. Please try again."
      );
      return false;
    }

    setSelectedClient((current) =>
      current?.connection_id === client.connection_id
        ? null
        : current
    );

    return true;
  }

  const activeNavigation = navigation.find((item) => item.id === screen)!;

  const descriptions: Record<Screen, string> = {
    dashboard:
      "A concise view of your caseload, professional reviews, appointments and follow-up tasks.",

    clients:
      "View only clients assigned to you or explicitly shared through an authorised professional workflow.",

    overview:
      "One longitudinal view across assessments, real-world monitoring and authorised contextual information.",

    assessments:
      "Review repeated questionnaire results alongside professional interpretation.",

    ambulatory:
      "Review momentary reports with their time and real-world context.",

    wearables:
      "View only physiological and behavioural summaries explicitly authorised by the client.",

    timeline:
      "Bring assessments, ambulatory observations and professional actions together across time.",

    notes:
      "Create professional records with authorship and future audit visibility.",

    care:
      "Document human professional decisions, referrals and follow-up pathways.",

    appointments:
      "Manage upcoming sessions and outstanding professional tasks.",

    messages:
      "Communicate with clients within an authorised professional workflow.",

    reports:
      "Prepare structured professional summaries from authorised information.",

    permissions:
      "Review exactly which client data sources you are authorised to access.",

    settings:
      "Manage professional workflow, verification and security settings.",
  };

  function renderScreen() {
    switch (screen) {
      case "dashboard":
        return <Dashboard changeScreen={setScreen} />;

      case "clients":
        return (
          <Clients
            onOpenClient={openClient}
            onRemoveClient={removeClientConnection}
          />
        );

      case "overview":
        return (
          <ClientOverview
            changeScreen={setScreen}
            client={selectedClient}
            onRemoveClient={removeClientConnection}
          />
        );

      case "assessments":
        return (
          <Assessments
            client={selectedClient}
            changeScreen={setScreen}
          />
        );

      case "ambulatory":
        return <Ambulatory />;

      case "wearables":
        return <Wearables />;

      case "timeline":
        return <Timeline />;

      case "notes":
        return <Notes />;

      case "care":
        return <CarePathway />;

      case "appointments":
        return <Appointments />;

      case "messages":
        return <Messages />;

      case "reports":
        return <Reports />;

      case "permissions":
        return <Permissions client={selectedClient} />;

      case "settings":
        return <Settings />;

      default:
        return <Dashboard changeScreen={setScreen} />;
    }
  }

  const groups: ("Clinical" | "Monitoring" | "Care" | "Governance")[] = [
    "Clinical",
    "Monitoring",
    "Care",
    "Governance",
  ];

  return (
    <main className="min-h-screen bg-[#f6f8f8] text-slate-950">
      {/* TOPBAR */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-20 items-center justify-between gap-4 px-5 lg:px-7">
          <div>
  <PsyLatticeLogo size={38} />

  <p className="mt-1 pl-[50px] text-xs text-slate-400">
    Clinical workspace
  </p>
</div>

          <div className="hidden items-center gap-3 sm:flex">
            <Status type="accent">Verified clinician</Status>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold">
              AS
            </div>

            <Link
              href="/signin"
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Sign out
            </Link>
          </div>

          <select
            value={screen}
            onChange={(event) =>
              setScreen(event.target.value as Screen)
            }
            className="max-w-[210px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm lg:hidden"
          >
            {navigation.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* SIDEBAR */}

        <aside className="hidden border-r border-slate-200 bg-white p-4 lg:block">
          {groups.map((group) => (
            <div key={group} className="mb-6">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                {group}
              </p>

              <nav className="space-y-1">
                {navigation
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const active = item.id === screen;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setScreen(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? "bg-cyan-50 font-semibold text-cyan-900"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            active ? "bg-cyan-700" : "bg-slate-300"
                          }`}
                        />

                        {item.label}
                      </button>
                    );
                  })}
              </nav>
            </div>
          ))}

          <div className="mt-8 rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-medium text-cyan-200">
              Clinical prototype
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Every client name, assessment result and professional record
              shown here is fictional demo data.
            </p>
          </div>
        </aside>

        {/* CONTENT */}

        <section className="min-w-0 p-5 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1450px]">
            <div className="mb-7">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Status type="accent">Clinician workspace</Status>

                <span className="text-xs text-slate-400">
                  Frontend prototype
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                {screen === "dashboard"
                  ? "Good afternoon, Dr. Sharma."
                  : activeNavigation.label}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {descriptions[screen]}
              </p>
            </div>

            {renderScreen()}
          </div>
        </section>
      </div>
    </main>
  );
}