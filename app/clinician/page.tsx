"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import AccountSwitcher from "@/components/AccountSwitcher";
import { createClient } from "@/lib/supabase/client";
import {
  AmbulatoryProtocolBuilder,
  defaultAmbulatoryProtocol,
  serializeAmbulatoryProtocol,
  validateAmbulatoryProtocol,
  type AmbulatoryScheduleDraft,
  type AmbulatoryQuestionnaireOption,
} from "@/components/AmbulatoryProtocolBuilder";

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
  onOpenClient,
}: {
  onOpenClient: (client: ConnectedClient) => void;
}) {
  const [clients, setClients] = useState<ConnectedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setDashboardError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_my_connected_clients"
    );

    if (error) {
      console.error(
        "Could not load Clinical dashboard:",
        error
      );

      setDashboardError(
        "Your connected caseload could not be loaded."
      );
      setClients([]);
      setLoading(false);
      return;
    }

    setClients((data ?? []) as ConnectedClient[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadDashboard();

    function refreshOnFocus() {
      void loadDashboard();
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadDashboard();
      }
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, []);

  return (
    <div className="space-y-5">
      {dashboardError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {dashboardError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Connected clients"
          value={loading ? "..." : String(clients.length)}
          detail="Active PsyLattice connections"
        />

        <StatCard
          label="Assessment data"
          value="Live"
          detail="When the client authorises sharing"
        />

        <StatCard
          label="Daily monitoring"
          value="Live"
          detail="V2 check-ins and responses"
        />

        <StatCard
          label="Privacy"
          value="Client controlled"
          detail="Every data category remains permission-gated"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel
          title="Connected caseload"
          description="These are the real clients currently connected to your Clinical workspace."
        >
          {loading ? (
            <p className="text-sm text-slate-500">
              Loading connected clients...
            </p>
          ) : clients.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium text-slate-800">
                No connected clients yet
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Add a client from the Clients tab. Once the Self user accepts,
                they will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {clients.slice(0, 8).map((client) => {
                const initials =
                  client.client_name
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part.charAt(0))
                    .join("")
                    .toUpperCase() || "PL";

                return (
                  <div
                    key={client.connection_id}
                    className="flex flex-col justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <PersonAvatar initials={initials} />

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {client.client_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Connected{" "}
                          {new Date(
                            client.connected_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenClient(client)}
                      className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-100"
                    >
                      Open live client view
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="Where to monitor client data"
          description="The Clinical workspace now separates quick overview from detailed review."
        >
          <div className="space-y-4">
            {[
              [
                "Client Overview",
                "Live snapshot of the selected client's authorised assessment and monitoring data.",
              ],
              [
                "Assessments",
                "Full completed assessment history, scores and clinician assignments.",
              ],
              [
                "Ambulatory Monitoring",
                "The actual accepted monitoring protocol plus recent check-ins and block-level responses.",
              ],
              [
                "Progress Timeline",
                "Combined chronological view of shared assessments and monitoring events.",
              ],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <p className="text-sm font-semibold text-slate-800">
                  {title}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Clinical data principle">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
          <p className="font-medium text-cyan-950">
            Only authorised client data is shown.
          </p>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Assessment and monitoring data is requested through the secure,
            permission-gated Supabase functions already used by the Clinical
            workspace. A connection alone does not provide data access.
          </p>
        </div>
      </Panel>
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
  client_name: string;
  connection_status: string;
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
  const [permissionsSyncedAt, setPermissionsSyncedAt] =
    useState<string | null>(null);

  async function loadPermissions(
    showLoading = true
  ) {
    if (!client) {
      setPermissions(null);
      setPermissionsError("");
      setLoadingPermissions(false);
      setPermissionsSyncedAt(null);
      return;
    }

    if (showLoading) {
      setLoadingPermissions(true);
    }

    setPermissionsError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_connected_client_permissions_v2",
      {
        p_connection_id: client.connection_id,
      }
    );

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
    setPermissionsSyncedAt(new Date().toISOString());
    setLoadingPermissions(false);
  }

  useEffect(() => {
    void loadPermissions(true);

    function refreshOnFocus() {
      void loadPermissions(false);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadPermissions(false);
      }
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [client?.connection_id]);

  return {
    permissions,
    loadingPermissions,
    permissionsError,
    permissionsSyncedAt,
    refreshPermissions: () => loadPermissions(true),
  };
}

function ClinicalClientSelector({
  client,
  onSelect,
}: {
  client: ConnectedClient | null;
  onSelect: (client: ConnectedClient | null) => void;
}) {
  const [clients, setClients] = useState<ConnectedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadClients(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }

    setErrorMessage("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_my_connected_clients"
    );

    if (error) {
      console.error(
        "Could not load client selector:",
        error
      );
      setErrorMessage(
        "Connected clients could not be loaded."
      );
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as ConnectedClient[];
    setClients(rows);

    if (
      client &&
      !rows.some(
        (row) =>
          row.connection_id ===
          client.connection_id
      )
    ) {
      onSelect(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadClients(true);

    function refreshOnFocus() {
      void loadClients(false);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadClients(false);
      }
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [client?.connection_id]);

  const selectedId =
    client?.connection_id || "";

  return (
    <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">
            Client context
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-950">
            {client
              ? `Viewing ${client.client_name}`
              : "Choose the client whose data you want to view"}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            This selector is available on every client-specific Clinical tab.
            Changing it keeps you on the current tab and loads that client's
            authorised information.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedId}
            disabled={loading}
            onChange={(event) => {
              const next =
                clients.find(
                  (row) =>
                    row.connection_id ===
                    event.target.value
                ) || null;

              onSelect(next);
            }}
            className="min-w-[260px] rounded-xl border border-cyan-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-700"
          >
            <option value="">
              {loading
                ? "Loading clients..."
                : "Select a client…"}
            </option>

            {clients.map((row) => (
              <option
                key={row.connection_id}
                value={row.connection_id}
              >
                {row.client_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={loading}
            onClick={() => void loadClients(true)}
            className="rounded-xl border border-cyan-200 bg-white px-3 py-3 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {client && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-cyan-100 pt-3 text-xs text-slate-500">
          <span>
            Connected{" "}
            {new Date(
              client.connected_at
            ).toLocaleDateString()}
          </span>

          <span>
            Connection{" "}
            {client.connection_id
              .slice(-6)
              .toUpperCase()}
          </span>
        </div>
      )}

      {errorMessage && (
        <p className="mt-3 text-xs font-medium text-red-700">
          {errorMessage}
        </p>
      )}
    </div>
  );
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

  async function loadConnectedClients(
    showLoading = true
  ) {
    if (showLoading) {
      setLoadingClients(true);
    }

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

  useEffect(() => {
    void loadConnectedClients(true);

    function refreshOnFocus() {
      void loadConnectedClients(false);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadConnectedClients(false);
      }
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
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
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            disabled={loadingClients}
            onClick={() => void loadConnectedClients(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh clients
          </button>
        </div>

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
  type OverviewAssessment = {
    session_id: string;
    questionnaire_id: string;
    questionnaire_name: string;
    questionnaire_acronym: string | null;
    scores: Record<string, number> | null;
    completed_at: string;
  };

  type OverviewMonitoringFeed = {
    plan_id: string;
    plan_name: string;
    duration_days: number;
    start_date: string;
    protocol: MonitoringProtocolScheduleDraft[];
    checkins: Array<{
      checkin_id: string;
      schedule_id: string;
      schedule_label: string;
      entry_date: string;
      completed_at: string;
      responses: Array<{
        item_id: string;
        item_key: string;
        type: MonitoringBlockType;
        prompt: string;
        response: any;
      }>;
    }>;
  };

  const [removingClient, setRemovingClient] = useState(false);
  const [overviewAssessments, setOverviewAssessments] = useState<
    OverviewAssessment[]
  >([]);
  const [overviewMonitoring, setOverviewMonitoring] =
    useState<OverviewMonitoringFeed | null>(null);
  const [loadingClientData, setLoadingClientData] = useState(false);
  const [clientDataError, setClientDataError] = useState("");

  const {
    permissions,
    loadingPermissions,
    permissionsError,
    permissionsSyncedAt,
    refreshPermissions,
  } = useClientSharingPermissions(client);

  async function loadClientData() {
    if (!client || !permissions) {
      setOverviewAssessments([]);
      setOverviewMonitoring(null);
      return;
    }

    setLoadingClientData(true);
    setClientDataError("");

    const supabase = createClient();

    const assessmentPromise =
      permissions.share_assessments
        ? supabase.rpc(
            "psylattice_connected_client_assessments_v2",
            {
              p_connection_id: client.connection_id,
            }
          )
        : Promise.resolve({
            data: [],
            error: null,
          });

    const monitoringPromise =
      permissions.share_monitoring
        ? supabase.rpc(
            "psylattice_connected_client_monitoring_v2",
            {
              p_connection_id: client.connection_id,
              p_days: 14,
            }
          )
        : Promise.resolve({
            data: [],
            error: null,
          });

    const [assessmentResult, monitoringResult] =
      await Promise.all([
        assessmentPromise,
        monitoringPromise,
      ]);

    if (assessmentResult.error) {
      console.error(
        "Could not load overview assessments:",
        assessmentResult.error
      );
      setClientDataError(
        "Some authorised client data could not be loaded."
      );
      setOverviewAssessments([]);
    } else {
      setOverviewAssessments(
        (assessmentResult.data ?? []) as OverviewAssessment[]
      );
    }

    if (monitoringResult.error) {
      console.error(
        "Could not load overview monitoring:",
        monitoringResult.error
      );
      setClientDataError(
        "Some authorised client data could not be loaded."
      );
      setOverviewMonitoring(null);
    } else {
      const row =
        Array.isArray(monitoringResult.data) &&
        monitoringResult.data.length > 0
          ? (monitoringResult.data[0] as OverviewMonitoringFeed)
          : null;

      setOverviewMonitoring(row);
    }

    setLoadingClientData(false);
  }

  useEffect(() => {
    if (!loadingPermissions) {
      void loadClientData();
    }

    function refreshOnFocus() {
      if (!loadingPermissions) {
        void loadClientData();
      }
    }

    function refreshWhenVisible() {
      if (
        document.visibilityState === "visible" &&
        !loadingPermissions
      ) {
        void loadClientData();
      }
    }

    window.addEventListener(
      "focus",
      refreshOnFocus
    );
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [
    client?.connection_id,
    loadingPermissions,
    permissions?.share_assessments,
    permissions?.share_monitoring,
  ]);

  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-slate-950">
          Select a client above
        </p>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Choose a connected client using the Client context selector. Their
          authorised assessment and monitoring data will load here.
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

  const latestAssessment =
    overviewAssessments.length > 0
      ? overviewAssessments[0]
      : null;

  const recentCheckins =
    overviewMonitoring?.checkins || [];

  const latestCheckin =
    recentCheckins.length > 0
      ? recentCheckins[0]
      : null;

  function scorePills(
    assessment: OverviewAssessment
  ) {
    return Object.entries(
      assessment.scores || {}
    )
      .filter(([, value]) => typeof value === "number")
      .slice(0, 4);
  }

  async function removeCurrentClient() {
    if (removingClient || !client) {
      return;
    }

    const currentClient = client;

    setRemovingClient(true);
    const removed = await onRemoveClient(currentClient);
    setRemovingClient(false);

    if (removed) {
      changeScreen("clients");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <PersonAvatar initials={initials} large />

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              Live client overview
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {client.client_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Connected{" "}
              {new Date(
                client.connected_at
              ).toLocaleDateString()}
              {" · "}
              Connection{" "}
              {client.connection_id
                .slice(-6)
                .toUpperCase()}
            </p>

            {permissionsSyncedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Permissions synced{" "}
                {new Date(
                  permissionsSyncedAt
                ).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Status type="success">Connected</Status>

          <button
            type="button"
            disabled={loadingPermissions || loadingClientData}
            onClick={() => {
              void refreshPermissions();
              void loadClientData();
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingPermissions || loadingClientData
              ? "Refreshing..."
              : "Refresh client data"}
          </button>

          <button
            type="button"
            disabled={removingClient}
            onClick={() => void removeCurrentClient()}
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            {removingClient
              ? "Removing..."
              : "Remove client"}
          </button>
        </div>
      </div>

      {(permissionsError || clientDataError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {permissionsError || clientDataError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Shared assessments"
          value={
            loadingClientData
              ? "..."
              : permissions?.share_assessments
                ? String(overviewAssessments.length)
                : "Private"
          }
          detail={
            permissions?.share_assessments
              ? "Completed authorised records"
              : "Client has not shared assessment results"
          }
        />

        <StatCard
          label="Monitoring check-ins"
          value={
            loadingClientData
              ? "..."
              : permissions?.share_monitoring
                ? String(recentCheckins.length)
                : "Private"
          }
          detail="Past 14 days"
        />

        <StatCard
          label="Latest monitoring"
          value={
            loadingClientData
              ? "..."
              : latestCheckin
                ? new Date(
                    latestCheckin.completed_at
                  ).toLocaleDateString([], {
                    day: "2-digit",
                    month: "short",
                  })
                : permissions?.share_monitoring
                  ? "None"
                  : "Private"
          }
          detail={
            latestCheckin
              ? latestCheckin.schedule_label
              : "Most recent completed check-in"
          }
        />

        <StatCard
          label="Authorised categories"
          value={
            loadingPermissions
              ? "..."
              : `${sharedPermissionCount} / 5`
          }
          detail="Controlled by the client"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Latest assessment data"
          description="Real completed assessments returned only when the client shares assessment results."
        >
          {!permissions?.share_assessments ? (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium text-slate-800">
                Assessment data is private
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This client has not enabled Self-assessment result sharing.
              </p>
            </div>
          ) : loadingClientData ? (
            <p className="text-sm text-slate-500">
              Loading assessments...
            </p>
          ) : overviewAssessments.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium text-slate-800">
                No completed assessments yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {overviewAssessments
                .slice(0, 3)
                .map((assessment) => (
                  <div
                    key={assessment.session_id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {assessment.questionnaire_acronym ||
                            assessment.questionnaire_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {assessment.questionnaire_name}
                          {" · "}
                          {new Date(
                            assessment.completed_at
                          ).toLocaleString()}
                        </p>
                      </div>

                      <Status type="success">
                        Shared
                      </Status>
                    </div>

                    {scorePills(assessment).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {scorePills(assessment).map(
                          ([label, value]) => (
                            <span
                              key={label}
                              className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-900"
                            >
                              {label}: {value}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => changeScreen("assessments")}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-900"
          >
            Open full assessment view
            <ArrowIcon />
          </button>
        </Panel>

        <Panel
          title="Latest monitoring data"
          description="Real V2 check-ins and block responses from the selected client."
        >
          {!permissions?.share_monitoring ? (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium text-slate-800">
                Monitoring data is private
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This client has not enabled Daily monitoring sharing.
              </p>
            </div>
          ) : loadingClientData ? (
            <p className="text-sm text-slate-500">
              Loading monitoring data...
            </p>
          ) : !latestCheckin ? (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium text-slate-800">
                No shared check-ins yet
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {latestCheckin.schedule_label}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(
                      latestCheckin.completed_at
                    ).toLocaleString()}
                  </p>
                </div>

                <Status type="success">
                  Latest check-in
                </Status>
              </div>

              <div className="mt-4 grid gap-3">
                {latestCheckin.responses
                  .slice(0, 5)
                  .map((response) => (
                    <div
                      key={response.item_id}
                      className="rounded-xl bg-slate-50 p-4"
                    >
                      <p className="text-xs text-slate-400">
                        {response.prompt}
                      </p>

                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {monitoringResponseText(
                          response.response
                        )}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => changeScreen("ambulatory")}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-900"
          >
            Open full monitoring feed
            <ArrowIcon />
          </button>
        </Panel>
      </div>

      <Panel
        title="Client-authorised information"
        description="The client decides which categories this Clinical workspace may access."
      >
        {loadingPermissions ? (
          <p className="text-sm text-slate-500">
            Loading permissions...
          </p>
        ) : permissions ? (
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
                    <p className="text-sm font-medium text-slate-800">
                      {definition.title}
                    </p>

                    <p
                      className={`mt-2 text-xs font-semibold ${
                        shared
                          ? "text-emerald-700"
                          : "text-slate-400"
                      }`}
                    >
                      {shared
                        ? "Shared"
                        : "Not shared"}
                    </p>
                  </div>
                );
              }
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-800">
                Luna AI conversations
              </p>

              <p className="mt-2 text-xs font-semibold text-slate-500">
                Private
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No permission record is available.
          </p>
        )}

        <button
          type="button"
          onClick={() => changeScreen("permissions")}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-900"
        >
          Open consent & data access
          <ArrowIcon />
        </button>
      </Panel>
    </div>
  );
}

/* =========================================================
   ASSESSMENTS
   ========================================================= */

type ClinicianAssessmentResponseOption = {
  label: string;
  value: number;
};

type ClinicianAssessmentResponse = {
  item_id: string;
  position: number;
  prompt: string;
  subscale: string | null;
  response_type: string;
  response_value: number;
  response_label: string | null;
  response_options: ClinicianAssessmentResponseOption[];
  reverse_scored: boolean;
  required: boolean;
};

type ClinicianAssessmentRecord = {
  session_id: string;
  questionnaire_id: string;
  questionnaire_name: string;
  questionnaire_acronym: string | null;
  version_label: string | null;
  scores: Record<string, number> | null;
  completed_at: string;
  assignment_id: string | null;
  assigned_by_clinician: boolean;
  responses: ClinicianAssessmentResponse[];
};

type AssignmentQuestionnaire = {
  questionnaire_id: string;
  questionnaire_name: string;
  questionnaire_acronym: string | null;
  questionnaire_category: string;
  item_count: number;
  estimated_minutes: number | null;
};

type ClinicianAssessmentAssignment = {
  assignment_id: string;
  questionnaire_id: string;
  questionnaire_name: string;
  questionnaire_acronym: string | null;
  due_date: string | null;
  note: string | null;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
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
  const [expandedAssessmentIds, setExpandedAssessmentIds] =
    useState<Set<string>>(new Set());

  const [assignmentCatalogue, setAssignmentCatalogue] =
    useState<AssignmentQuestionnaire[]>([]);
  const [assignments, setAssignments] = useState<
    ClinicianAssessmentAssignment[]
  >([]);
  const [loadingAssignmentTools, setLoadingAssignmentTools] =
    useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] =
    useState("");
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] =
    useState("");
  const [assignmentDueDate, setAssignmentDueDate] =
    useState("");
  const [assignmentNote, setAssignmentNote] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [cancellingAssignmentId, setCancellingAssignmentId] =
    useState<string | null>(null);

  async function loadAssignmentTools() {
    if (!client) {
      setAssignmentCatalogue([]);
      setAssignments([]);
      setLoadingAssignmentTools(false);
      return;
    }

    setLoadingAssignmentTools(true);
    setAssignmentError("");

    const supabase = createClient();

    const [catalogueResult, assignmentsResult] =
      await Promise.all([
        supabase.rpc(
          "psylattice_clinician_assignment_catalogue"
        ),
        supabase.rpc(
          "psylattice_clinician_assessment_assignments",
          {
            p_connection_id: client.connection_id,
          }
        ),
      ]);

    if (catalogueResult.error) {
      console.error(
        "Could not load assignment catalogue:",
        catalogueResult.error
      );

      setAssignmentError(
        "The assessment assignment catalogue could not be loaded."
      );
      setAssignmentCatalogue([]);
    } else {
      const catalogue =
        (catalogueResult.data ??
          []) as AssignmentQuestionnaire[];

      setAssignmentCatalogue(catalogue);

      setSelectedQuestionnaireId((current) =>
        current ||
        catalogue[0]?.questionnaire_id ||
        ""
      );
    }

    if (assignmentsResult.error) {
      console.error(
        "Could not load assessment assignments:",
        assignmentsResult.error
      );

      setAssignmentError(
        "Assessment assignments could not be loaded."
      );
      setAssignments([]);
    } else {
      setAssignments(
        (assignmentsResult.data ??
          []) as ClinicianAssessmentAssignment[]
      );
    }

    setLoadingAssignmentTools(false);
  }

  useEffect(() => {
    void loadAssignmentTools();
  }, [client?.connection_id]);

  async function loadSharedAssessments(
    showLoading = true
  ) {
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

    if (showLoading) {
      setLoadingAssessments(true);
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_connected_client_assessments_v2",
      {
        p_connection_id: client.connection_id,
      }
    );

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

  useEffect(() => {
    if (!loadingPermissions) {
      void loadSharedAssessments(true);
    }

    function refreshOnFocus() {
      if (!loadingPermissions) {
        void loadSharedAssessments(false);
      }
    }

    function refreshWhenVisible() {
      if (
        document.visibilityState === "visible" &&
        !loadingPermissions
      ) {
        void loadSharedAssessments(false);
      }
    }

    window.addEventListener(
      "focus",
      refreshOnFocus
    );
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [
    client?.connection_id,
    loadingPermissions,
    permissions?.share_assessments,
  ]);

  function toggleAssessmentResponses(
    sessionId: string
  ) {
    setExpandedAssessmentIds((current) => {
      const next = new Set(current);

      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }

      return next;
    });
  }


  async function assignAssessment() {
    if (
      !client ||
      !selectedQuestionnaireId ||
      assigning
    ) {
      return;
    }

    setAssigning(true);
    setAssignmentError("");
    setAssignmentSuccess("");

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_assign_assessment",
      {
        p_connection_id: client.connection_id,
        p_questionnaire_id: selectedQuestionnaireId,
        p_due_date: assignmentDueDate || null,
        p_note: assignmentNote.trim() || null,
      }
    );

    if (error) {
      console.error(
        "Could not assign assessment:",
        error
      );

      setAssignmentError(
        "The assessment could not be assigned. Please try again."
      );
      setAssigning(false);
      return;
    }

    const questionnaire =
      assignmentCatalogue.find(
        (item) =>
          item.questionnaire_id ===
          selectedQuestionnaireId
      );

    setAssignmentSuccess(
      `${questionnaire?.questionnaire_acronym ||
        questionnaire?.questionnaire_name ||
        "Assessment"} assigned to ${client.client_name}.`
    );

    setAssignmentNote("");
    setAssignmentDueDate("");
    setAssigning(false);
    await loadAssignmentTools();
  }

  async function cancelAssignment(
    assignment: ClinicianAssessmentAssignment
  ) {
    if (
      cancellingAssignmentId ||
      assignment.status !== "assigned"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Cancel the ${assignment.questionnaire_acronym ||
        assignment.questionnaire_name} assignment for ${client?.client_name || "this client"}?`
    );

    if (!confirmed) {
      return;
    }

    setCancellingAssignmentId(
      assignment.assignment_id
    );
    setAssignmentError("");
    setAssignmentSuccess("");

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_cancel_assessment_assignment",
      {
        p_assignment_id: assignment.assignment_id,
      }
    );

    if (error) {
      console.error(
        "Could not cancel assessment assignment:",
        error
      );

      setAssignmentError(
        "The assignment could not be cancelled."
      );
      setCancellingAssignmentId(null);
      return;
    }

    setAssignmentSuccess(
      "Assessment assignment cancelled."
    );
    setCancellingAssignmentId(null);
    await loadAssignmentTools();
  }

  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-slate-950">
          Select a client first
        </p>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Open a connected client from the Clients page before
          reviewing or assigning assessments.
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

  function assignmentStatusType(
    status: ClinicianAssessmentAssignment["status"]
  ): "neutral" | "success" | "warning" | "accent" {
    if (status === "completed") return "success";
    if (status === "in_progress") return "accent";
    if (status === "assigned") return "warning";
    return "neutral";
  }

  function assignmentStatusLabel(
    status: ClinicianAssessmentAssignment["status"]
  ) {
    if (status === "in_progress") return "In progress";
    if (status === "completed") return "Completed";
    if (status === "cancelled") return "Cancelled";
    return "Assigned";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <PersonAvatar initials={initials} large />

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              Assessments
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {client.client_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assign assessments and review results only when
              the client has authorised result sharing.
            </p>
          </div>
        </div>

        {loadingPermissions ? (
          <Status>Checking access</Status>
        ) : permissions?.share_assessments ? (
          <Status type="success">Results shared</Status>
        ) : (
          <Status>Results private</Status>
        )}
      </div>

      <Panel
        title="Assign an assessment"
        description="Send a curated Self questionnaire to this client. Assignment does not automatically grant access to the result."
      >
        {assignmentSuccess && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {assignmentSuccess}
          </div>
        )}

        {assignmentError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {assignmentError}
          </div>
        )}

        {loadingAssignmentTools ? (
          <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Loading assignment tools...
            </p>
          </div>
        ) : assignmentCatalogue.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium text-slate-800">
              No Self questionnaires available
            </p>

            <p className="mt-2 text-sm text-slate-500">
              PsyLattice did not return an active
              Self-available questionnaire for assignment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
              <label className="block">
                <span className="text-sm font-medium text-slate-800">
                  Assessment
                </span>

                <select
                  value={selectedQuestionnaireId}
                  onChange={(event) =>
                    setSelectedQuestionnaireId(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
                >
                  {assignmentCatalogue.map(
                    (questionnaire) => (
                      <option
                        key={
                          questionnaire.questionnaire_id
                        }
                        value={
                          questionnaire.questionnaire_id
                        }
                      >
                        {questionnaire.questionnaire_acronym
                          ? `${questionnaire.questionnaire_acronym} — ${questionnaire.questionnaire_name}`
                          : questionnaire.questionnaire_name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-800">
                  Due date
                </span>

                <input
                  type="date"
                  value={assignmentDueDate}
                  onChange={(event) =>
                    setAssignmentDueDate(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-800">
                Optional message
              </span>

              <textarea
                value={assignmentNote}
                onChange={(event) =>
                  setAssignmentNote(event.target.value)
                }
                placeholder="For example: Please complete this before our next session."
                className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-cyan-700"
              />
            </label>

            <div className="flex flex-col justify-between gap-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 sm:flex-row sm:items-center">
              <p className="max-w-3xl text-xs leading-5 text-slate-600">
                The client will see this assignment in
                Self → Self-Assessments. Completion status can
                be shown here, but scores remain unavailable
                unless the client has enabled
                Self-assessment results in Privacy & Sharing.
              </p>

              <button
                type="button"
                disabled={
                  assigning ||
                  !selectedQuestionnaireId
                }
                onClick={() =>
                  void assignAssessment()
                }
                className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assigning
                  ? "Assigning..."
                  : "Assign assessment"}
              </button>
            </div>
          </div>
        )}
      </Panel>

      <Panel
        title="Assignment activity"
        description="Operational status for assessments you assigned through this clinician-client connection."
      >
        {loadingAssignmentTools ? (
          <p className="text-sm text-slate-500">
            Loading assignments...
          </p>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium text-slate-800">
              No assignments yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              New assessment assignments will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment) => (
              <div
                key={assignment.assignment_id}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {assignment.questionnaire_acronym ||
                          assignment.questionnaire_name}
                      </p>

                      <Status
                        type={assignmentStatusType(
                          assignment.status
                        )}
                      >
                        {assignmentStatusLabel(
                          assignment.status
                        )}
                      </Status>
                    </div>

                    {assignment.questionnaire_acronym && (
                      <p className="mt-1 text-xs text-slate-400">
                        {assignment.questionnaire_name}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-400">
                      Assigned{" "}
                      {new Date(
                        assignment.created_at
                      ).toLocaleString()}
                      {assignment.due_date
                        ? ` · Due ${new Date(
                            `${assignment.due_date}T00:00:00`
                          ).toLocaleDateString()}`
                        : ""}
                    </p>

                    {assignment.note && (
                      <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                        “{assignment.note}”
                      </p>
                    )}

                    {assignment.status ===
                      "completed" && (
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {permissions?.share_assessments
                          ? "The client currently shares assessment results."
                          : "Completed — result remains private because assessment sharing is off."}
                      </p>
                    )}
                  </div>

                  {assignment.status ===
                    "assigned" && (
                    <button
                      type="button"
                      disabled={
                        cancellingAssignmentId ===
                        assignment.assignment_id
                      }
                      onClick={() =>
                        void cancelAssignment(
                          assignment
                        )
                      }
                      className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      {cancellingAssignmentId ===
                      assignment.assignment_id
                        ? "Cancelling..."
                        : "Cancel assignment"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={
            loadingAssignmentTools ||
            loadingAssessments
          }
          onClick={() => {
            void loadAssignmentTools();
            void loadSharedAssessments(true);
          }}
          className="mt-5 text-xs font-semibold text-cyan-900 disabled:opacity-50"
        >
          Refresh assignment status & results
        </button>
      </Panel>

      {loadingPermissions ? (
        <Panel title="Shared assessment results">
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
          title="Shared assessment results"
          description="The client controls result sharing from their Self workspace."
        >
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
              🔒
            </div>

            <p className="mt-4 font-semibold text-slate-800">
              Assessment results are not shared
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              You may assign an assessment, but PsyLattice
              will not return the client's scores while
              Self-assessment result sharing is off.
            </p>

            <button
              type="button"
              onClick={() =>
                changeScreen("permissions")
              }
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

          <div className="flex justify-end">
            <button
              type="button"
              disabled={loadingAssessments}
              onClick={() =>
                void loadSharedAssessments(true)
              }
              className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-50 disabled:opacity-50"
            >
              {loadingAssessments
                ? "Refreshing results..."
                : "Refresh assessment results"}
            </button>
          </div>

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
            title="Shared assessment history"
            description="Completed questionnaires, saved scale scores and every item response the client has authorised you to see."
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
                  No completed assessment result loaded
                </p>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Assessment sharing is enabled. If the client has just
                  completed an assigned questionnaire, use
                  “Refresh assessment results” above. The page also refreshes
                  automatically when this browser tab regains focus.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment) => {
                  const scoreEntries =
                    assessment.scores
                      ? Object.entries(
                          assessment.scores
                        ).filter(
                          ([, value]) =>
                            typeof value === "number"
                        )
                      : [];

                  const responses =
                    assessment.responses || [];

                  const expanded =
                    expandedAssessmentIds.has(
                      assessment.session_id
                    );

                  return (
                    <div
                      key={assessment.session_id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-slate-950">
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

                            {assessment.assigned_by_clinician && (
                              <Status type="success">
                                Clinician assigned
                              </Status>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-slate-400">
                            Completed{" "}
                            {new Date(
                              assessment.completed_at
                            ).toLocaleString()}
                            {assessment.version_label
                              ? ` · Version ${assessment.version_label}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Status type="success">
                            Client shared
                          </Status>

                          <button
                            type="button"
                            onClick={() =>
                              toggleAssessmentResponses(
                                assessment.session_id
                              )
                            }
                            className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-100"
                          >
                            {expanded
                              ? "Hide responses"
                              : `View all ${responses.length} responses`}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                          Scale scores
                        </p>

                        {scoreEntries.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {scoreEntries.map(
                              ([label, value]) => (
                                <span
                                  key={label}
                                  className="rounded-full border border-cyan-100 bg-cyan-50/60 px-3 py-1.5 text-xs font-semibold text-cyan-900"
                                >
                                  {label}: {value}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            No scored summary is stored for this session.
                          </p>
                        )}
                      </div>

                      {expanded && (
                        <div className="mt-6 border-t border-slate-100 pt-5">
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-slate-900">
                              Client item responses
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              The selected response is highlighted within the
                              response scale saved for each questionnaire item.
                            </p>
                          </div>

                          {responses.length === 0 ? (
                            <div className="rounded-xl bg-slate-50 p-4">
                              <p className="text-sm text-slate-500">
                                This completed session has no saved item-level
                                responses available.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {responses.map(
                                (response) => {
                                  const options =
                                    Array.isArray(
                                      response.response_options
                                    )
                                      ? response.response_options
                                      : [];

                                  return (
                                    <div
                                      key={response.item_id}
                                      className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4"
                                    >
                                      <div className="flex items-start gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm">
                                          {response.position}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium leading-6 text-slate-900">
                                            {response.prompt}
                                          </p>

                                          {response.subscale && (
                                            <p className="mt-1 text-xs text-slate-400">
                                              Scale: {response.subscale}
                                            </p>
                                          )}

                                          {options.length > 0 ? (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                              {options.map(
                                                (option) => {
                                                  const selected =
                                                    Number(option.value) ===
                                                    Number(
                                                      response.response_value
                                                    );

                                                  return (
                                                    <div
                                                      key={`${response.item_id}-${option.value}`}
                                                      className={`rounded-xl border px-3 py-2 text-xs ${
                                                        selected
                                                          ? "border-cyan-400 bg-cyan-100 font-semibold text-cyan-950 ring-1 ring-cyan-200"
                                                          : "border-slate-200 bg-white text-slate-500"
                                                      }`}
                                                    >
                                                      <span>
                                                        {option.label}
                                                      </span>

                                                      <span className="ml-2 text-[10px] opacity-70">
                                                        {option.value}
                                                      </span>

                                                      {selected && (
                                                        <span className="ml-2">
                                                          ✓ Client response
                                                        </span>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </div>
                                          ) : (
                                            <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2">
                                              <p className="text-sm font-semibold text-cyan-950">
                                                {response.response_label ||
                                                  response.response_value}
                                              </p>
                                            </div>
                                          )}

                                          <p className="mt-3 text-xs text-slate-400">
                                            Recorded response:{" "}
                                            <span className="font-medium text-slate-600">
                                              {response.response_label
                                                ? `${response.response_label} (${response.response_value})`
                                                : response.response_value}
                                            </span>
                                            {response.reverse_scored
                                              ? " · Reverse-scored item"
                                              : ""}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="mt-5 text-xs leading-5 text-slate-400">
                        Responses and scale scores are displayed as stored by
                        PsyLattice. Interpretation should consider the
                        questionnaire manual, scoring rules and clinical
                        context.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}


/* =========================================================
   AMBULATORY MONITORING
   ========================================================= */


type MonitoringBlockType =
  | "slider"
  | "single_choice"
  | "multiple_choice"
  | "yes_no"
  | "number"
  | "short_text"
  | "long_text"
  | "instruction"
  | "activity"
  | "questionnaire"
  | "time_duration"
  | "mood";

type MonitoringCondition = {
  sourceKey: string;
  operator: string;
  value: string;
};

type MonitoringVisibility = {
  mode: "always" | "conditional";
  logic: "AND" | "OR";
  conditions: MonitoringCondition[];
};

type MonitoringConditionalTrigger = {
  operator:
    | "gt"
    | "lt"
    | "equals"
    | "between"
    | "contains_any"
    | "contains_all";
  value?: string;
  value2?: string;
  values?: string[];
};

type MonitoringConditionalChild = {
  trigger: MonitoringConditionalTrigger;
  item: MonitoringProtocolItemDraft;
};

type MonitoringProtocolItemDraft = {
  item_id?: string;
  key: string;
  type: MonitoringBlockType;
  prompt: string;
  required: boolean;
  config: Record<string, any>;
  visibility: MonitoringVisibility;
  conditionalChildren?: MonitoringConditionalChild[];
};

type MonitoringProtocolScheduleDraft = {
  schedule_id?: string;
  key: string;
  label: string;
  start_time: string;
  end_time: string;
  items: MonitoringProtocolItemDraft[];
};

type MonitoringQuestionnaireOption = {
  questionnaire_id: string;
  questionnaire_name: string;
  questionnaire_acronym: string | null;
  questionnaire_slug: string;
  questionnaire_category: string;
  item_count: number;
  estimated_minutes: number | null;
};

function monitoringDraftKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function monitoringCanHaveConditionalChildren(
  type: MonitoringBlockType
) {
  return (
    type === "slider" ||
    type === "single_choice" ||
    type === "multiple_choice" ||
    type === "yes_no" ||
    type === "number"
  );
}

function newMonitoringItem(
  type: MonitoringBlockType,
  index: number
): MonitoringProtocolItemDraft {
  const defaults: Record<
    MonitoringBlockType,
    {
      prompt: string;
      config: Record<string, any>;
    }
  > = {
    slider: {
      prompt: "How would you rate this right now?",
      config: {
        min: 0,
        max: 10,
        step: 1,
        minLabel: "Not at all",
        maxLabel: "Extremely",
      },
    },
    single_choice: {
      prompt: "Choose the option that fits best.",
      config: {
        options: ["Option 1", "Option 2", "Option 3"],
      },
    },
    multiple_choice: {
      prompt: "Select all that apply.",
      config: {
        options: ["Option 1", "Option 2", "Option 3"],
      },
    },
    yes_no: {
      prompt: "Is this true right now?",
      config: {},
    },
    number: {
      prompt: "Enter a number.",
      config: {
        min: 0,
        max: 100,
        step: 1,
      },
    },
    short_text: {
      prompt: "Write a short response.",
      config: {},
    },
    long_text: {
      prompt: "Tell us more.",
      config: {},
    },
    instruction: {
      prompt: "Read this before continuing.",
      config: {},
    },
    activity: {
      prompt: "Complete this activity.",
      config: {
        instructions:
          "Follow the activity instructions, then mark it complete.",
        durationMinutes: 2,
      },
    },
    questionnaire: {
      prompt: "Complete this questionnaire.",
      config: {
        questionnaire_id: "",
        questionnaire_name: "",
        questionnaire_acronym: "",
      },
    },
    time_duration: {
      prompt: "How long?",
      config: {
        unit: "minutes",
        min: 0,
        max: 1440,
      },
    },
    mood: {
      prompt: "Which mood best describes how you feel?",
      config: {
        options: [
          "Calm",
          "Happy",
          "Sad",
          "Anxious",
          "Irritated",
          "Tired",
        ],
      },
    },
  };

  return {
    key: monitoringDraftKey(`item-${index + 1}`),
    type,
    prompt: defaults[type].prompt,
    required: type !== "instruction",
    config: defaults[type].config,
    visibility: {
      mode: "always",
      logic: "AND",
      conditions: [],
    },
    conditionalChildren: [],
  };
}

function defaultMonitoringTrigger(
  parent: MonitoringProtocolItemDraft
): MonitoringConditionalTrigger {
  if (
    parent.type === "slider" ||
    parent.type === "number"
  ) {
    const min = Number(parent.config.min ?? 0);
    const max = Number(parent.config.max ?? 10);
    const midpoint =
      Number.isFinite(min) && Number.isFinite(max)
        ? Math.round(((min + max) / 2) * 100) / 100
        : 5;

    return {
      operator: "gt",
      value: String(midpoint),
    };
  }

  if (parent.type === "single_choice") {
    return {
      operator: "equals",
      value:
        (parent.config.options || [])[0] || "",
    };
  }

  if (parent.type === "multiple_choice") {
    const first =
      (parent.config.options || [])[0] || "";

    return {
      operator: "contains_any",
      values: first ? [first] : [],
    };
  }

  return {
    operator: "equals",
    value: "Yes",
  };
}

function normaliseMonitoringTriggerForParent(
  parent: MonitoringProtocolItemDraft,
  trigger: MonitoringConditionalTrigger
): MonitoringConditionalTrigger {
  if (
    parent.type === "slider" ||
    parent.type === "number"
  ) {
    const operator = [
      "gt",
      "lt",
      "equals",
      "between",
    ].includes(trigger.operator)
      ? trigger.operator
      : "gt";

    return {
      operator: operator as
        | "gt"
        | "lt"
        | "equals"
        | "between",
      value:
        trigger.value ??
        String(parent.config.min ?? 0),
      value2:
        operator === "between"
          ? trigger.value2 ??
            String(parent.config.max ?? 10)
          : undefined,
    };
  }

  if (parent.type === "single_choice") {
    const options = (
      parent.config.options || []
    ) as string[];

    return {
      operator: "equals",
      value: options.includes(
        trigger.value || ""
      )
        ? trigger.value
        : options[0] || "",
    };
  }

  if (parent.type === "multiple_choice") {
    const options = (
      parent.config.options || []
    ) as string[];

    const selected = (
      trigger.values || []
    ).filter((value) =>
      options.includes(value)
    );

    return {
      operator:
        trigger.operator === "contains_all"
          ? "contains_all"
          : "contains_any",
      values:
        selected.length > 0
          ? selected
          : options[0]
            ? [options[0]]
            : [],
    };
  }

  return {
    operator: "equals",
    value:
      trigger.value === "No"
        ? "No"
        : "Yes",
  };
}

function defaultMonitoringProtocol(): MonitoringProtocolScheduleDraft[] {
  const afternoonYesNo =
    newMonitoringItem("yes_no", 1);

  afternoonYesNo.prompt =
    "Has anything stressful happened since your last check-in?";

  afternoonYesNo.conditionalChildren = [
    {
      trigger: {
        operator: "equals",
        value: "Yes",
      },
      item: {
        ...newMonitoringItem("short_text", 2),
        prompt: "What happened?",
        required: false,
      },
    },
  ];

  return [
    {
      key: monitoringDraftKey("morning"),
      label: "Morning",
      start_time: "08:00",
      end_time: "10:00",
      items: [
        {
          ...newMonitoringItem("slider", 0),
          prompt:
            "How stressed do you feel right now?",
          config: {
            min: 0,
            max: 10,
            step: 1,
            minLabel: "Not at all",
            maxLabel: "Extremely",
          },
        },
        {
          ...newMonitoringItem(
            "single_choice",
            1
          ),
          prompt:
            "What are you doing right now?",
          config: {
            options: [
              "Studying",
              "Working",
              "Resting",
              "Eating",
              "Exercising",
              "Socialising",
              "Travelling",
              "Other",
            ],
          },
        },
      ],
    },
    {
      key: monitoringDraftKey("afternoon"),
      label: "Afternoon",
      start_time: "15:00",
      end_time: "17:00",
      items: [
        {
          ...newMonitoringItem("slider", 0),
          prompt:
            "How stressed do you feel right now?",
          config: {
            min: 0,
            max: 10,
            step: 1,
            minLabel: "Not at all",
            maxLabel: "Extremely",
          },
        },
        afternoonYesNo,
      ],
    },
    {
      key: monitoringDraftKey("evening"),
      label: "Evening",
      start_time: "20:00",
      end_time: "22:00",
      items: [
        {
          ...newMonitoringItem("mood", 0),
          prompt:
            "Which mood best describes your evening?",
        },
        {
          ...newMonitoringItem("long_text", 1),
          prompt:
            "What stood out most about today?",
          required: false,
        },
      ],
    },
  ];
}

function monitoringTriggerToVisibility(
  parent: MonitoringProtocolItemDraft,
  trigger: MonitoringConditionalTrigger
): MonitoringVisibility {
  const safe =
    normaliseMonitoringTriggerForParent(
      parent,
      trigger
    );

  if (
    parent.type === "slider" ||
    parent.type === "number"
  ) {
    if (safe.operator === "between") {
      return {
        mode: "conditional",
        logic: "AND",
        conditions: [
          {
            sourceKey: parent.key,
            operator: "gte",
            value: String(safe.value ?? ""),
          },
          {
            sourceKey: parent.key,
            operator: "lte",
            value: String(
              safe.value2 ?? safe.value ?? ""
            ),
          },
        ],
      };
    }

    return {
      mode: "conditional",
      logic: "AND",
      conditions: [
        {
          sourceKey: parent.key,
          operator: safe.operator,
          value: String(safe.value ?? ""),
        },
      ],
    };
  }

  if (parent.type === "multiple_choice") {
    const values = safe.values || [];

    return {
      mode: "conditional",
      logic:
        safe.operator === "contains_all"
          ? "AND"
          : "OR",
      conditions: values.map((value) => ({
        sourceKey: parent.key,
        operator: "contains",
        value,
      })),
    };
  }

  return {
    mode: "conditional",
    logic: "AND",
    conditions: [
      {
        sourceKey: parent.key,
        operator: "equals",
        value: String(safe.value ?? ""),
      },
    ],
  };
}

function monitoringVisibilityToTrigger(
  parent: MonitoringProtocolItemDraft,
  visibility: MonitoringVisibility
): MonitoringConditionalTrigger {
  if (
    parent.type === "slider" ||
    parent.type === "number"
  ) {
    const lower = visibility.conditions.find(
      (condition) =>
        condition.operator === "gte"
    );
    const upper = visibility.conditions.find(
      (condition) =>
        condition.operator === "lte"
    );

    if (lower && upper) {
      return {
        operator: "between",
        value: lower.value,
        value2: upper.value,
      };
    }

    const first = visibility.conditions[0];

    return normaliseMonitoringTriggerForParent(
      parent,
      {
        operator: (
          first?.operator === "gt" ||
          first?.operator === "lt" ||
          first?.operator === "equals"
            ? first.operator
            : "equals"
        ) as "gt" | "lt" | "equals",
        value: first?.value || "",
      }
    );
  }

  if (parent.type === "multiple_choice") {
    return normaliseMonitoringTriggerForParent(
      parent,
      {
        operator:
          visibility.logic === "AND"
            ? "contains_all"
            : "contains_any",
        values: visibility.conditions
          .filter(
            (condition) =>
              condition.operator === "contains"
          )
          .map((condition) => condition.value),
      }
    );
  }

  return normaliseMonitoringTriggerForParent(
    parent,
    {
      operator: "equals",
      value:
        visibility.conditions[0]?.value ||
        (parent.type === "yes_no"
          ? "Yes"
          : ""),
    }
  );
}

function flattenMonitoringItems(
  items: MonitoringProtocolItemDraft[]
) {
  const flat: MonitoringProtocolItemDraft[] =
    [];

  function visit(
    item: MonitoringProtocolItemDraft,
    visibility: MonitoringVisibility
  ) {
    const {
      conditionalChildren: _children,
      ...itemWithoutChildren
    } = item;

    flat.push({
      ...itemWithoutChildren,
      visibility,
    });

    for (const child of
      item.conditionalChildren || []) {
      visit(
        child.item,
        monitoringTriggerToVisibility(
          item,
          child.trigger
        )
      );
    }
  }

  for (const item of items) {
    visit(item, {
      mode: "always",
      logic: "AND",
      conditions: [],
    });
  }

  return flat;
}

function serializeMonitoringProtocol(
  protocol: MonitoringProtocolScheduleDraft[]
): MonitoringProtocolScheduleDraft[] {
  return protocol.map((schedule) => ({
    ...schedule,
    items: flattenMonitoringItems(schedule.items),
  }));
}

function nestMonitoringItems(
  flatItems: MonitoringProtocolItemDraft[]
) {
  const roots: MonitoringProtocolItemDraft[] =
    [];
  const byKey = new Map<
    string,
    MonitoringProtocolItemDraft
  >();

  for (const raw of flatItems || []) {
    const item: MonitoringProtocolItemDraft = {
      ...raw,
      visibility:
        raw.visibility || {
          mode: "always",
          logic: "AND",
          conditions: [],
        },
      conditionalChildren: [],
    };

    byKey.set(item.key, item);

    const conditions =
      item.visibility?.conditions || [];
    const sourceKeys = Array.from(
      new Set(
        conditions
          .map(
            (condition) =>
              condition.sourceKey
          )
          .filter(Boolean)
      )
    );

    const parent =
      item.visibility?.mode ===
        "conditional" &&
      sourceKeys.length === 1
        ? byKey.get(sourceKeys[0])
        : null;

    if (
      parent &&
      monitoringCanHaveConditionalChildren(
        parent.type
      )
    ) {
      parent.conditionalChildren = [
        ...(parent.conditionalChildren || []),
        {
          trigger:
            monitoringVisibilityToTrigger(
              parent,
              item.visibility
            ),
          item,
        },
      ];
    } else {
      roots.push(item);
    }
  }

  return roots;
}

function nestMonitoringProtocol(
  protocol: MonitoringProtocolScheduleDraft[]
): MonitoringProtocolScheduleDraft[] {
  return (protocol || []).map((schedule) => ({
    ...schedule,
    items: nestMonitoringItems(
      schedule.items || []
    ),
  }));
}

function countMonitoringTreeItems(
  items: MonitoringProtocolItemDraft[]
): number {
  return items.reduce(
    (total, item) =>
      total +
      1 +
      countMonitoringTreeItems(
        (item.conditionalChildren || []).map(
          (child) => child.item
        )
      ),
    0
  );
}

function mapMonitoringTreeItem(
  items: MonitoringProtocolItemDraft[],
  targetKey: string,
  updater: (
    item: MonitoringProtocolItemDraft
  ) => MonitoringProtocolItemDraft
): MonitoringProtocolItemDraft[] {
  return items.map((item) => {
    if (item.key === targetKey) {
      return updater(item);
    }

    return {
      ...item,
      conditionalChildren: (
        item.conditionalChildren || []
      ).map((child) => ({
        ...child,
        item: mapMonitoringTreeItem(
          [child.item],
          targetKey,
          updater
        )[0],
      })),
    };
  });
}

function findMonitoringTreeItem(
  items: MonitoringProtocolItemDraft[],
  targetKey: string
): MonitoringProtocolItemDraft | null {
  for (const item of items) {
    if (item.key === targetKey) {
      return item;
    }

    const nested = findMonitoringTreeItem(
      (item.conditionalChildren || []).map(
        (child) => child.item
      ),
      targetKey
    );

    if (nested) {
      return nested;
    }
  }

  return null;
}

function monitoringConditionMatches(
  condition: MonitoringCondition,
  sourceType: MonitoringBlockType,
  response: any
) {
  const answered =
    monitoringResponseAnswered(response);

  if (condition.operator === "answered") {
    return answered;
  }

  if (
    condition.operator === "not_answered"
  ) {
    return !answered;
  }

  if (!answered) {
    return false;
  }

  const target = condition.value;

  if (
    sourceType === "slider" ||
    sourceType === "number" ||
    sourceType === "time_duration"
  ) {
    const left = Number(response);
    const right = Number(target);

    if (
      Number.isNaN(left) ||
      Number.isNaN(right)
    ) {
      return false;
    }

    if (condition.operator === "gt") {
      return left > right;
    }

    if (condition.operator === "gte") {
      return left >= right;
    }

    if (condition.operator === "lt") {
      return left < right;
    }

    if (condition.operator === "lte") {
      return left <= right;
    }

    if (
      condition.operator === "not_equals"
    ) {
      return left !== right;
    }

    return left === right;
  }

  if (sourceType === "multiple_choice") {
    const values = Array.isArray(response)
      ? response.map(String)
      : [];

    if (
      condition.operator ===
      "not_contains"
    ) {
      return !values.includes(target);
    }

    return values.includes(target);
  }

  if (
    condition.operator ===
    "contains_text"
  ) {
    return String(response)
      .toLowerCase()
      .includes(target.toLowerCase());
  }

  if (
    condition.operator === "not_equals"
  ) {
    return String(response) !== target;
  }

  return String(response) === target;
}

function monitoringResponseAnswered(value: any) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (
    typeof value === "object" &&
    "completed" in value
  ) {
    return Boolean(value.completed);
  }

  return true;
}

function monitoringVisibleItems(
  items: MonitoringProtocolItemDraft[],
  responses: Record<string, any>
) {
  const byKey = new Map(
    items.map((item) => [item.key, item])
  );

  return items.filter((item) => {
    if (
      item.visibility?.mode !==
      "conditional"
    ) {
      return true;
    }

    const conditions =
      item.visibility.conditions || [];

    if (conditions.length === 0) {
      return true;
    }

    const results = conditions.map(
      (condition) => {
        const source = byKey.get(
          condition.sourceKey
        );

        if (!source) {
          return false;
        }

        return monitoringConditionMatches(
          condition,
          source.type,
          responses[condition.sourceKey]
        );
      }
    );

    return item.visibility.logic === "OR"
      ? results.some(Boolean)
      : results.every(Boolean);
  });
}

function cleanHiddenMonitoringResponses(
  items: MonitoringProtocolItemDraft[],
  incoming: Record<string, any>
) {
  let next = {
    ...incoming,
  };

  for (
    let pass = 0;
    pass < items.length + 1;
    pass += 1
  ) {
    const visible = new Set(
      monitoringVisibleItems(
        items,
        next
      ).map((item) => item.key)
    );

    let changed = false;

    for (const key of Object.keys(next)) {
      if (!visible.has(key)) {
        delete next[key];
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  return next;
}

function monitoringResponseText(value: any) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.join(", ") || "—";
  }

  if (typeof value === "object") {
    if (
      value.completed &&
      value.questionnaire_name
    ) {
      return `Completed ${value.questionnaire_name}`;
    }

    if (value.completed) {
      return "Completed";
    }

    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value
      ? "Completed"
      : "Not completed";
  }

  return String(value);
}

function validateMonitoringEditorProtocol(
  protocol: MonitoringProtocolScheduleDraft[]
) {
  if (
    !protocol.length ||
    protocol.length > 12
  ) {
    return "Choose between 1 and 12 daily check-ins.";
  }

  function validateItems(
    items: MonitoringProtocolItemDraft[],
    scheduleLabel: string
  ): string {
    for (const item of items) {
      if (!item.prompt.trim()) {
        return "Every block needs a prompt or title.";
      }

      if (
        item.type === "questionnaire" &&
        !item.config.questionnaire_id
      ) {
        return "Choose a questionnaire for every questionnaire block.";
      }

      if (
        (item.conditionalChildren || [])
          .length > 0 &&
        !monitoringCanHaveConditionalChildren(
          item.type
        )
      ) {
        return `"${item.prompt}" cannot contain conditional blocks.`;
      }

      for (const child of
        item.conditionalChildren || []) {
        const trigger =
          normaliseMonitoringTriggerForParent(
            item,
            child.trigger
          );

        if (
          item.type === "slider" ||
          item.type === "number"
        ) {
          const first = Number(
            trigger.value
          );

          if (!Number.isFinite(first)) {
            return `Choose a valid conditional value under "${item.prompt}".`;
          }

          if (
            trigger.operator ===
            "between"
          ) {
            const second = Number(
              trigger.value2
            );

            if (
              !Number.isFinite(second) ||
              first > second
            ) {
              return `Choose a valid conditional range under "${item.prompt}".`;
            }
          }
        }

        if (
          item.type ===
          "single_choice"
        ) {
          const options =
            (item.config.options ||
              []) as string[];

          if (
            !trigger.value ||
            !options.includes(
              trigger.value
            )
          ) {
            return `Choose which response opens the conditional block under "${item.prompt}".`;
          }
        }

        if (
          item.type ===
          "multiple_choice"
        ) {
          const options =
            (item.config.options ||
              []) as string[];
          const values =
            trigger.values || [];

          if (
            values.length === 0 ||
            values.some(
              (value) =>
                !options.includes(value)
            )
          ) {
            return `Choose the linked multiple-choice response(s) under "${item.prompt}".`;
          }
        }

        const nestedError =
          validateItems(
            [child.item],
            scheduleLabel
          );

        if (nestedError) {
          return nestedError;
        }
      }
    }

    return "";
  }

  for (const schedule of protocol) {
    if (!schedule.label.trim()) {
      return "Every check-in needs a name.";
    }

    if (
      !schedule.start_time ||
      !schedule.end_time ||
      schedule.start_time >=
        schedule.end_time
    ) {
      return `Check the time window for ${
        schedule.label || "a check-in"
      }.`;
    }

    if (!schedule.items.length) {
      return `${schedule.label} needs at least one block.`;
    }

    if (
      countMonitoringTreeItems(
        schedule.items
      ) > 50
    ) {
      return `${schedule.label} can contain up to 50 total blocks, including nested conditional blocks.`;
    }

    const itemError = validateItems(
      schedule.items,
      schedule.label
    );

    if (itemError) {
      return itemError;
    }
  }

  return "";
}

function MonitoringProtocolBuilderV2({
  protocol,
  onChange,
  questionnaires,
}: {
  protocol: MonitoringProtocolScheduleDraft[];
  onChange: (
    protocol: MonitoringProtocolScheduleDraft[]
  ) => void;
  questionnaires: MonitoringQuestionnaireOption[];
}) {
  const blockTypes: Array<
    [MonitoringBlockType, string]
  > = [
    ["slider", "Slider / rating"],
    ["single_choice", "Single choice"],
    ["multiple_choice", "Multiple choice"],
    ["yes_no", "Yes / No"],
    ["number", "Number"],
    ["short_text", "Short text"],
    ["long_text", "Long text"],
    ["mood", "Mood / emotion"],
    ["time_duration", "Time / duration"],
    ["activity", "Activity"],
    [
      "questionnaire",
      "Questionnaire library",
    ],
    [
      "instruction",
      "Instruction / information",
    ],
  ];

  function updateSchedule(
    index: number,
    patch: Partial<MonitoringProtocolScheduleDraft>
  ) {
    onChange(
      protocol.map((schedule, i) =>
        i === index
          ? {
              ...schedule,
              ...patch,
            }
          : schedule
      )
    );
  }

  function addSchedule() {
    if (protocol.length >= 12) {
      return;
    }

    onChange([
      ...protocol,
      {
        key: monitoringDraftKey(
          `checkin-${protocol.length + 1}`
        ),
        label: `Check-in ${
          protocol.length + 1
        }`,
        start_time: "12:00",
        end_time: "13:00",
        items: [
          newMonitoringItem("slider", 0),
        ],
      },
    ]);
  }

  function removeSchedule(index: number) {
    if (protocol.length <= 1) {
      return;
    }

    onChange(
      protocol.filter(
        (_, i) => i !== index
      )
    );
  }

  function updateItemByKey(
    scheduleIndex: number,
    itemKey: string,
    patch:
      | Partial<MonitoringProtocolItemDraft>
      | ((
          item: MonitoringProtocolItemDraft
        ) => MonitoringProtocolItemDraft)
  ) {
    const schedule =
      protocol[scheduleIndex];

    const items = mapMonitoringTreeItem(
      schedule.items,
      itemKey,
      (item) =>
        typeof patch === "function"
          ? patch(item)
          : {
              ...item,
              ...patch,
            }
    );

    updateSchedule(scheduleIndex, {
      items,
    });
  }

  function updateItemConfig(
    scheduleIndex: number,
    itemKey: string,
    nextConfig: Record<string, any>
  ) {
    updateItemByKey(
      scheduleIndex,
      itemKey,
      (item) => {
        const updated = {
          ...item,
          config: nextConfig,
        };

        if (
          !monitoringCanHaveConditionalChildren(
            updated.type
          )
        ) {
          return updated;
        }

        return {
          ...updated,
          conditionalChildren: (
            updated.conditionalChildren || []
          ).map((child) => ({
            ...child,
            trigger:
              normaliseMonitoringTriggerForParent(
                updated,
                child.trigger
              ),
          })),
        };
      }
    );
  }

  function changeItemType(
    scheduleIndex: number,
    itemKey: string,
    type: MonitoringBlockType
  ) {
    const schedule =
      protocol[scheduleIndex];

    const current =
      findMonitoringTreeItem(
        schedule.items,
        itemKey
      );

    if (!current) {
      return;
    }

    if (
      (current.conditionalChildren || [])
        .length > 0 &&
      !monitoringCanHaveConditionalChildren(
        type
      )
    ) {
      const confirmed = window.confirm(
        "This block contains nested conditional blocks. Changing it to this response type will remove those conditional blocks. Continue?"
      );

      if (!confirmed) {
        return;
      }
    }

    const fresh = newMonitoringItem(
      type,
      countMonitoringTreeItems(
        schedule.items
      )
    );

    updateItemByKey(
      scheduleIndex,
      itemKey,
      (item) => {
        const keepChildren =
          monitoringCanHaveConditionalChildren(
            type
          );

        const updated: MonitoringProtocolItemDraft =
          {
            ...item,
            type,
            prompt: fresh.prompt,
            config: fresh.config,
            required: fresh.required,
            conditionalChildren:
              keepChildren
                ? item.conditionalChildren ||
                  []
                : [],
          };

        if (!keepChildren) {
          return updated;
        }

        return {
          ...updated,
          conditionalChildren: (
            updated.conditionalChildren || []
          ).map((child) => ({
            ...child,
            trigger:
              normaliseMonitoringTriggerForParent(
                updated,
                defaultMonitoringTrigger(
                  updated
                )
              ),
          })),
        };
      }
    );
  }

  function addRootItem(
    scheduleIndex: number,
    type: MonitoringBlockType
  ) {
    const schedule =
      protocol[scheduleIndex];

    if (
      countMonitoringTreeItems(
        schedule.items
      ) >= 50
    ) {
      return;
    }

    updateSchedule(scheduleIndex, {
      items: [
        ...schedule.items,
        newMonitoringItem(
          type,
          countMonitoringTreeItems(
            schedule.items
          )
        ),
      ],
    });
  }

  function addConditionalChild(
    scheduleIndex: number,
    parentKey: string
  ) {
    const schedule =
      protocol[scheduleIndex];

    if (
      countMonitoringTreeItems(
        schedule.items
      ) >= 50
    ) {
      return;
    }

    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => {
        if (
          !monitoringCanHaveConditionalChildren(
            parent.type
          )
        ) {
          return parent;
        }

        return {
          ...parent,
          conditionalChildren: [
            ...(parent.conditionalChildren ||
              []),
            {
              trigger:
                defaultMonitoringTrigger(
                  parent
                ),
              item: newMonitoringItem(
                "short_text",
                countMonitoringTreeItems(
                  schedule.items
                )
              ),
            },
          ],
        };
      }
    );
  }

  function removeRootItem(
    scheduleIndex: number,
    itemIndex: number
  ) {
    const schedule =
      protocol[scheduleIndex];

    if (schedule.items.length <= 1) {
      return;
    }

    updateSchedule(scheduleIndex, {
      items: schedule.items.filter(
        (_, index) =>
          index !== itemIndex
      ),
    });
  }

  function removeConditionalChild(
    scheduleIndex: number,
    parentKey: string,
    childKey: string
  ) {
    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => ({
        ...parent,
        conditionalChildren: (
          parent.conditionalChildren || []
        ).filter(
          (child) =>
            child.item.key !== childKey
        ),
      })
    );
  }

  function moveRootItem(
    scheduleIndex: number,
    itemIndex: number,
    direction: -1 | 1
  ) {
    const schedule =
      protocol[scheduleIndex];
    const target =
      itemIndex + direction;

    if (
      target < 0 ||
      target >= schedule.items.length
    ) {
      return;
    }

    const items = [
      ...schedule.items,
    ];

    [
      items[itemIndex],
      items[target],
    ] = [
      items[target],
      items[itemIndex],
    ];

    updateSchedule(scheduleIndex, {
      items,
    });
  }

  function moveConditionalChild(
    scheduleIndex: number,
    parentKey: string,
    childIndex: number,
    direction: -1 | 1
  ) {
    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => {
        const children = [
          ...(parent.conditionalChildren ||
            []),
        ];
        const target =
          childIndex + direction;

        if (
          target < 0 ||
          target >= children.length
        ) {
          return parent;
        }

        [
          children[childIndex],
          children[target],
        ] = [
          children[target],
          children[childIndex],
        ];

        return {
          ...parent,
          conditionalChildren: children,
        };
      }
    );
  }

  function updateChildTrigger(
    scheduleIndex: number,
    parentKey: string,
    childKey: string,
    trigger: MonitoringConditionalTrigger
  ) {
    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => ({
        ...parent,
        conditionalChildren: (
          parent.conditionalChildren || []
        ).map((child) =>
          child.item.key === childKey
            ? {
                ...child,
                trigger:
                  normaliseMonitoringTriggerForParent(
                    parent,
                    trigger
                  ),
              }
            : child
        ),
      })
    );
  }

  function renderConditionalTrigger(
    scheduleIndex: number,
    parent: MonitoringProtocolItemDraft,
    child: MonitoringConditionalChild
  ) {
    const trigger =
      normaliseMonitoringTriggerForParent(
        parent,
        child.trigger
      );

    if (
      parent.type === "slider" ||
      parent.type === "number"
    ) {
      return (
        <div className="grid gap-3 lg:grid-cols-[210px_1fr] lg:items-end">
          <label>
            <span className="text-xs font-medium text-cyan-950">
              Show this nested block when
            </span>

            <select
              value={trigger.operator}
              onChange={(event) =>
                updateChildTrigger(
                  scheduleIndex,
                  parent.key,
                  child.item.key,
                  {
                    ...trigger,
                    operator:
                      event.target.value as
                        | "gt"
                        | "lt"
                        | "equals"
                        | "between",
                  }
                )
              }
              className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="gt">
                Response is above
              </option>
              <option value="lt">
                Response is below
              </option>
              <option value="equals">
                Response equals
              </option>
              <option value="between">
                Response is within a range
              </option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-xs font-medium text-cyan-950">
                {trigger.operator ===
                "between"
                  ? "From"
                  : "Value"}
              </span>

              <input
                type="number"
                min={parent.config.min}
                max={parent.config.max}
                step={
                  parent.config.step ?? 1
                }
                value={trigger.value ?? ""}
                onChange={(event) =>
                  updateChildTrigger(
                    scheduleIndex,
                    parent.key,
                    child.item.key,
                    {
                      ...trigger,
                      value:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            {trigger.operator ===
              "between" && (
              <label>
                <span className="text-xs font-medium text-cyan-950">
                  To
                </span>

                <input
                  type="number"
                  min={parent.config.min}
                  max={parent.config.max}
                  step={
                    parent.config.step ?? 1
                  }
                  value={
                    trigger.value2 ?? ""
                  }
                  onChange={(event) =>
                    updateChildTrigger(
                      scheduleIndex,
                      parent.key,
                      child.item.key,
                      {
                        ...trigger,
                        value2:
                          event.target.value,
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>
            )}
          </div>
        </div>
      );
    }

    if (
      parent.type ===
      "single_choice"
    ) {
      const options =
        (parent.config.options ||
          []) as string[];

      return (
        <label className="block">
          <span className="text-xs font-medium text-cyan-950">
            Show this nested block when the participant chooses
          </span>

          <select
            value={trigger.value || ""}
            onChange={(event) =>
              updateChildTrigger(
                scheduleIndex,
                parent.key,
                child.item.key,
                {
                  operator: "equals",
                  value:
                    event.target.value,
                }
              )
            }
            className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">
              Choose linked response…
            </option>

            {options.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (parent.type === "yes_no") {
      return (
        <label className="block">
          <span className="text-xs font-medium text-cyan-950">
            Show this nested block when the participant chooses
          </span>

          <select
            value={trigger.value || "Yes"}
            onChange={(event) =>
              updateChildTrigger(
                scheduleIndex,
                parent.key,
                child.item.key,
                {
                  operator: "equals",
                  value:
                    event.target.value,
                }
              )
            }
            className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="Yes">
              Yes
            </option>
            <option value="No">
              No
            </option>
          </select>
        </label>
      );
    }

    if (
      parent.type ===
      "multiple_choice"
    ) {
      const options =
        (parent.config.options ||
          []) as string[];
      const selected =
        trigger.values || [];

      return (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-cyan-950">
                Show this nested block when the participant selects
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Choose one or more linked responses.
              </p>
            </div>

            <select
              value={trigger.operator}
              onChange={(event) =>
                updateChildTrigger(
                  scheduleIndex,
                  parent.key,
                  child.item.key,
                  {
                    ...trigger,
                    operator:
                      event.target.value as
                        | "contains_any"
                        | "contains_all",
                  }
                )
              }
              className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold"
            >
              <option value="contains_any">
                Any selected response
              </option>
              <option value="contains_all">
                All selected responses
              </option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((option) => {
              const checked =
                selected.includes(option);

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                    checked
                      ? "border-cyan-300 bg-cyan-100 text-cyan-950"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const values =
                        event.target
                          .checked
                          ? [
                              ...selected,
                              option,
                            ]
                          : selected.filter(
                              (value) =>
                                value !==
                                option
                            );

                      updateChildTrigger(
                        scheduleIndex,
                        parent.key,
                        child.item.key,
                        {
                          ...trigger,
                          values,
                        }
                      );
                    }}
                  />

                  {option}
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  }

  function renderItem(
    scheduleIndex: number,
    item: MonitoringProtocolItemDraft,
    displayPath: string,
    siblingIndex: number,
    siblingCount: number,
    parent: MonitoringProtocolItemDraft | null,
    childEdge: MonitoringConditionalChild | null
  ): ReactNode {
    const nested =
      parent !== null;

    return (
      <div
        key={item.key}
        className={`rounded-2xl border p-4 ${
          nested
            ? "border-cyan-200 bg-white"
            : "border-slate-200 bg-slate-50/40"
        }`}
      >
        {parent && childEdge && (
          <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-800">
                  Conditional block
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  This entire block appears only from the response to:
                  {" "}
                  <span className="font-semibold text-slate-800">
                    {parent.prompt}
                  </span>
                </p>
              </div>
            </div>

            {renderConditionalTrigger(
              scheduleIndex,
              parent,
              childEdge
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={item.type}
              onChange={(event) =>
                changeItemType(
                  scheduleIndex,
                  item.key,
                  event.target
                    .value as MonitoringBlockType
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
            >
              {blockTypes.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <span className="text-xs text-slate-400">
              {nested
                ? `Conditional ${displayPath}`
                : `Block ${displayPath}`}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={siblingIndex === 0}
              onClick={() => {
                if (parent) {
                  moveConditionalChild(
                    scheduleIndex,
                    parent.key,
                    siblingIndex,
                    -1
                  );
                } else {
                  moveRootItem(
                    scheduleIndex,
                    siblingIndex,
                    -1
                  );
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs disabled:opacity-30"
            >
              ↑
            </button>

            <button
              type="button"
              disabled={
                siblingIndex ===
                siblingCount - 1
              }
              onClick={() => {
                if (parent) {
                  moveConditionalChild(
                    scheduleIndex,
                    parent.key,
                    siblingIndex,
                    1
                  );
                } else {
                  moveRootItem(
                    scheduleIndex,
                    siblingIndex,
                    1
                  );
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs disabled:opacity-30"
            >
              ↓
            </button>

            <button
              type="button"
              disabled={
                !parent &&
                protocol[
                  scheduleIndex
                ].items.length <= 1
              }
              onClick={() => {
                if (parent) {
                  removeConditionalChild(
                    scheduleIndex,
                    parent.key,
                    item.key
                  );
                } else {
                  removeRootItem(
                    scheduleIndex,
                    siblingIndex
                  );
                }
              }}
              className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-slate-500">
            Prompt / title
          </span>

          <input
            value={item.prompt}
            onChange={(event) =>
              updateItemByKey(
                scheduleIndex,
                item.key,
                {
                  prompt:
                    event.target.value,
                }
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
          />
        </label>

        {(item.type ===
          "single_choice" ||
          item.type ===
            "multiple_choice" ||
          item.type === "mood") && (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">
              Options (one per line)
            </span>

            <textarea
              value={(
                item.config.options || []
              ).join("\n")}
              onChange={(event) =>
                updateItemConfig(
                  scheduleIndex,
                  item.key,
                  {
                    ...item.config,
                    options:
                      event.target.value
                        .split("\n")
                        .map((value) =>
                          value.trim()
                        )
                        .filter(Boolean),
                  }
                )
              }
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-700"
            />
          </label>
        )}

        {item.type === "slider" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["min", "Minimum"],
              ["max", "Maximum"],
              ["step", "Step"],
            ].map(([key, label]) => (
              <label key={key}>
                <span className="text-xs font-medium text-slate-500">
                  {label}
                </span>

                <input
                  type="number"
                  value={
                    item.config[key] ?? ""
                  }
                  onChange={(event) =>
                    updateItemConfig(
                      scheduleIndex,
                      item.key,
                      {
                        ...item.config,
                        [key]: Number(
                          event.target.value
                        ),
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>
            ))}

            <label>
              <span className="text-xs font-medium text-slate-500">
                Low label
              </span>

              <input
                value={
                  item.config.minLabel || ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      minLabel:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                High label
              </span>

              <input
                value={
                  item.config.maxLabel || ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      maxLabel:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        )}

        {(item.type === "number" ||
          item.type ===
            "time_duration") && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label>
              <span className="text-xs font-medium text-slate-500">
                Minimum
              </span>

              <input
                type="number"
                value={
                  item.config.min ?? ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      min: Number(
                        event.target.value
                      ),
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                Maximum
              </span>

              <input
                type="number"
                value={
                  item.config.max ?? ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      max: Number(
                        event.target.value
                      ),
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            {item.type ===
            "time_duration" ? (
              <label>
                <span className="text-xs font-medium text-slate-500">
                  Unit
                </span>

                <select
                  value={
                    item.config.unit ||
                    "minutes"
                  }
                  onChange={(event) =>
                    updateItemConfig(
                      scheduleIndex,
                      item.key,
                      {
                        ...item.config,
                        unit:
                          event.target
                            .value,
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="minutes">
                    Minutes
                  </option>
                  <option value="hours">
                    Hours
                  </option>
                  <option value="seconds">
                    Seconds
                  </option>
                </select>
              </label>
            ) : (
              <label>
                <span className="text-xs font-medium text-slate-500">
                  Step
                </span>

                <input
                  type="number"
                  value={
                    item.config.step ?? 1
                  }
                  onChange={(event) =>
                    updateItemConfig(
                      scheduleIndex,
                      item.key,
                      {
                        ...item.config,
                        step: Number(
                          event.target.value
                        ),
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>
            )}
          </div>
        )}

        {item.type === "activity" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
            <label>
              <span className="text-xs font-medium text-slate-500">
                Activity instructions
              </span>

              <textarea
                value={
                  item.config
                    .instructions || ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      instructions:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                Minutes
              </span>

              <input
                type="number"
                min="1"
                value={
                  item.config
                    .durationMinutes ?? 2
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      durationMinutes:
                        Number(
                          event.target.value
                        ),
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        )}

        {item.type ===
          "questionnaire" && (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">
              Questionnaire from library
            </span>

            <select
              value={
                item.config
                  .questionnaire_id || ""
              }
              onChange={(event) => {
                const selected =
                  questionnaires.find(
                    (questionnaire) =>
                      questionnaire.questionnaire_id ===
                      event.target.value
                  );

                updateItemConfig(
                  scheduleIndex,
                  item.key,
                  {
                    ...item.config,
                    questionnaire_id:
                      event.target.value,
                    questionnaire_name:
                      selected?.questionnaire_name ||
                      "",
                    questionnaire_acronym:
                      selected?.questionnaire_acronym ||
                      "",
                  }
                );
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">
                Choose questionnaire…
              </option>

              {questionnaires.map(
                (questionnaire) => (
                  <option
                    key={
                      questionnaire.questionnaire_id
                    }
                    value={
                      questionnaire.questionnaire_id
                    }
                  >
                    {questionnaire.questionnaire_acronym
                      ? `${questionnaire.questionnaire_acronym} — ${questionnaire.questionnaire_name}`
                      : questionnaire.questionnaire_name}
                  </option>
                )
              )}
            </select>
          </label>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-200 pt-4">
          {item.type !==
            "instruction" && (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={item.required}
                onChange={(event) =>
                  updateItemByKey(
                    scheduleIndex,
                    item.key,
                    {
                      required:
                        event.target
                          .checked,
                    }
                  )
                }
              />

              Required when shown
            </label>
          )}
        </div>

        {monitoringCanHaveConditionalChildren(
          item.type
        ) && (
          <div className="mt-5 rounded-xl border border-dashed border-cyan-200 bg-cyan-50/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-cyan-950">
                  Conditional follow-up blocks
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add a complete new block inside this response. It will appear only when the response rule you choose is met.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  countMonitoringTreeItems(
                    protocol[
                      scheduleIndex
                    ].items
                  ) >= 50
                }
                onClick={() =>
                  addConditionalChild(
                    scheduleIndex,
                    item.key
                  )
                }
                className="rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-50 disabled:opacity-40"
              >
                + Add conditional block
              </button>
            </div>
          </div>
        )}

        {(item.conditionalChildren || [])
          .length > 0 && (
          <div className="mt-5 border-l-2 border-cyan-200 pl-4">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-800">
                Nested under {item.prompt}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Each nested block has its own response trigger and can itself contain further conditional blocks.
              </p>
            </div>

            <div className="space-y-4">
              {(
                item.conditionalChildren ||
                []
              ).map(
                (child, childIndex) =>
                  renderItem(
                    scheduleIndex,
                    child.item,
                    `${displayPath}.${
                      childIndex + 1
                    }`,
                    childIndex,
                    (
                      item.conditionalChildren ||
                      []
                    ).length,
                    item,
                    child
                  )
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {protocol.map(
        (schedule, scheduleIndex) => (
          <section
            key={schedule.key}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div className="grid flex-1 gap-3 md:grid-cols-[1fr_160px_160px]">
                <label>
                  <span className="text-xs font-medium text-slate-500">
                    Check-in name
                  </span>

                  <input
                    value={schedule.label}
                    onChange={(event) =>
                      updateSchedule(
                        scheduleIndex,
                        {
                          label:
                            event.target
                              .value,
                        }
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                  />
                </label>

                <label>
                  <span className="text-xs font-medium text-slate-500">
                    From
                  </span>

                  <input
                    type="time"
                    value={
                      schedule.start_time
                    }
                    onChange={(event) =>
                      updateSchedule(
                        scheduleIndex,
                        {
                          start_time:
                            event.target
                              .value,
                        }
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                  />
                </label>

                <label>
                  <span className="text-xs font-medium text-slate-500">
                    Until
                  </span>

                  <input
                    type="time"
                    value={schedule.end_time}
                    onChange={(event) =>
                      updateSchedule(
                        scheduleIndex,
                        {
                          end_time:
                            event.target
                              .value,
                        }
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={
                  protocol.length <= 1
                }
                onClick={() =>
                  removeSchedule(
                    scheduleIndex
                  )
                }
                className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold text-red-700 disabled:opacity-30"
              >
                Remove check-in
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {schedule.items.map(
                (item, itemIndex) =>
                  renderItem(
                    scheduleIndex,
                    item,
                    String(itemIndex + 1),
                    itemIndex,
                    schedule.items.length,
                    null,
                    null
                  )
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-medium text-slate-500">
                Add block:
              </span>

              {blockTypes.map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={
                      countMonitoringTreeItems(
                        schedule.items
                      ) >= 50
                    }
                    onClick={() =>
                      addRootItem(
                        scheduleIndex,
                        value
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 disabled:opacity-40"
                  >
                    + {label}
                  </button>
                )
              )}
            </div>
          </section>
        )
      )}

      <button
        type="button"
        disabled={protocol.length >= 12}
        onClick={addSchedule}
        className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900 disabled:opacity-40"
      >
        + Add another daily check-in
      </button>
    </div>
  );
}

type MonitoringV2RequestClinical = {
  request_id: string;
  monitoring_plan_id: string | null;
  name: string;
  duration_days: number;
  note: string | null;
  protocol: AmbulatoryScheduleDraft[];
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  responded_at: string | null;
  stopped_at: string | null;
  stopped_by: string | null;
};

type MonitoringV2SharedFeed = {
  plan_id: string;
  plan_name: string;
  duration_days: number;
  start_date: string;
  protocol: AmbulatoryScheduleDraft[];
  checkins: Array<{
    checkin_id: string;
    schedule_id: string;
    schedule_label: string;
    trigger_type?: string;
    occurrence_index?: number;
    trigger_source?: string;
    entry_date: string;
    completed_at: string;
    responses: Array<{ item_id: string; item_key: string; type: MonitoringBlockType; prompt: string; response: any }>;
  }>;
};

function Ambulatory({
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

  const [questionnaires, setQuestionnaires] = useState<
    AmbulatoryQuestionnaireOption[]
  >([]);

  const [showProtocolBuilder, setShowProtocolBuilder] =
    useState(false);

  const [protocolName, setProtocolName] =
    useState("Clinical monitoring protocol");
  const [durationDays, setDurationDays] =
    useState(7);
  const [note, setNote] = useState("");
  const [protocol, setProtocol] = useState<
    AmbulatoryScheduleDraft[]
  >(defaultAmbulatoryProtocol());

  const [requests, setRequests] = useState<
    MonitoringV2RequestClinical[]
  >([]);
  const [loadingRequests, setLoadingRequests] =
    useState(false);
  const [requestMessage, setRequestMessage] =
    useState("");
  const [requestError, setRequestError] =
    useState("");
  const [sending, setSending] = useState(false);
  const [cancellingId, setCancellingId] =
    useState<string | null>(null);

  const [receivingMonitoring, setReceivingMonitoring] =
    useState(true);
  const [updatingReceiving, setUpdatingReceiving] =
    useState(false);

  const [sharedFeed, setSharedFeed] =
    useState<MonitoringV2SharedFeed | null>(null);
  const [loadingFeed, setLoadingFeed] =
    useState(false);
  const [feedError, setFeedError] =
    useState("");

  const [stoppingProtocol, setStoppingProtocol] =
    useState(false);

  const [progressRangeDays, setProgressRangeDays] =
    useState<7 | 14 | 30>(14);

  function toLocalDateString(date: Date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(
        2,
        "0"
      ),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function parseLocalDate(dateString: string) {
    return new Date(
      `${dateString}T00:00:00`
    );
  }

  function addDays(date: Date, amount: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function buildDateRange(days: number) {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return Array.from(
      {
        length: days,
      },
      (_, index) => {
        const daysAgo =
          days - 1 - index;

        return toLocalDateString(
          addDays(today, -daysAgo)
        );
      }
    );
  }

  function dateFallsWithinPlan(
    dateString: string,
    startDate: string,
    planDurationDays: number
  ) {
    const date = parseLocalDate(dateString);
    const start = parseLocalDate(startDate);
    const end = addDays(
      start,
      planDurationDays - 1
    );

    return date >= start && date <= end;
  }

  function formatProgressDate(
    dateString: string
  ) {
    return parseLocalDate(
      dateString
    ).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
    });
  }

  async function loadCatalogue() {
    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_monitoring_questionnaire_catalogue"
      );

    if (!error) {
      setQuestionnaires(
        (data ??
          []) as AmbulatoryQuestionnaireOption[]
      );
    }
  }

  async function loadRequests(
    showLoading = true
  ) {
    if (!client) {
      setRequests([]);
      return;
    }

    if (showLoading) {
      setLoadingRequests(true);
    }

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_clinician_monitoring_requests_v2",
        {
          p_connection_id:
            client.connection_id,
        }
      );

    if (error) {
      console.error(
        "Could not load monitoring request history:",
        error
      );

      setRequestError(
        "Monitoring request history could not be loaded."
      );
    } else {
      setRequests(
        (data ??
          []) as MonitoringV2RequestClinical[]
      );
    }

    setLoadingRequests(false);
  }

  async function loadReceivingState() {
    if (!client) {
      return;
    }

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_monitoring_receiving_state",
        {
          p_connection_id:
            client.connection_id,
        }
      );

    if (
      !error &&
      typeof data === "boolean"
    ) {
      setReceivingMonitoring(data);
    }
  }

  async function loadFeed(
    showLoading = true
  ) {
    if (
      !client ||
      !permissions?.share_monitoring ||
      !receivingMonitoring
    ) {
      setSharedFeed(null);
      setLoadingFeed(false);
      return;
    }

    if (showLoading) {
      setLoadingFeed(true);
    }

    setFeedError("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_connected_client_monitoring_v2",
        {
          p_connection_id:
            client.connection_id,
          p_days: progressRangeDays,
        }
      );

    if (error) {
      console.error(
        "Could not load shared monitoring feed:",
        error
      );

      setFeedError(
        "Shared monitoring data could not be loaded."
      );
      setSharedFeed(null);
    } else {
      setSharedFeed(
        Array.isArray(data) &&
          data.length > 0
          ? (data[0] as MonitoringV2SharedFeed)
          : null
      );
    }

    setLoadingFeed(false);
  }

  useEffect(() => {
    void loadCatalogue();
  }, []);

  useEffect(() => {
    if (client) {
      void Promise.all([
        loadRequests(true),
        loadReceivingState(),
      ]);
    }
  }, [client?.connection_id]);

  useEffect(() => {
    void loadFeed(true);
  }, [
    client?.connection_id,
    permissions?.share_monitoring,
    receivingMonitoring,
    progressRangeDays,
  ]);

  useEffect(() => {
    function refreshOnFocus() {
      if (!client) {
        return;
      }

      void loadRequests(false);
      void loadReceivingState();
      void loadFeed(false);
    }

    function refreshWhenVisible() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refreshOnFocus();
      }
    }

    window.addEventListener(
      "focus",
      refreshOnFocus
    );
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [
    client?.connection_id,
    permissions?.share_monitoring,
    receivingMonitoring,
    progressRangeDays,
  ]);

  function validateProtocolDraft() {
    if (!protocolName.trim()) {
      return "Enter a protocol name.";
    }

    if (
      durationDays < 1 ||
      durationDays > 365
    ) {
      return "Duration must be between 1 and 365 days.";
    }

    return validateAmbulatoryProtocol(
      protocol
    );
  }

  async function sendRequest() {
    if (!client || sending) {
      return;
    }

    const validation =
      validateProtocolDraft();

    if (validation) {
      setRequestError(validation);
      return;
    }

    setSending(true);
    setRequestError("");
    setRequestMessage("");

    const supabase = createClient();

    const { error } =
      await supabase.rpc(
        "psylattice_assign_monitoring_protocol_v2",
        {
          p_connection_id:
            client.connection_id,
          p_name: protocolName.trim(),
          p_duration_days: durationDays,
          p_note: note.trim() || null,
          p_protocol:
            serializeAmbulatoryProtocol(
              protocol
            ),
        }
      );

    if (error) {
      setRequestError(
        error.message.includes(
          "already pending"
        )
          ? "A protocol request is already pending for this client."
          : "The monitoring protocol could not be sent."
      );
    } else {
      setRequestMessage(
        `Monitoring protocol sent to ${client.client_name}.`
      );
      setNote("");
      setShowProtocolBuilder(false);
      await loadRequests(true);
    }

    setSending(false);
  }

  async function cancelRequest(
    request: MonitoringV2RequestClinical
  ) {
    if (
      cancellingId ||
      !window.confirm(
        `Cancel the pending “${request.name}” request?`
      )
    ) {
      return;
    }

    setCancellingId(request.request_id);

    const supabase = createClient();

    const { error } =
      await supabase.rpc(
        "psylattice_cancel_monitoring_request_v2",
        {
          p_request_id:
            request.request_id,
        }
      );

    if (error) {
      setRequestError(
        "The request could not be cancelled."
      );
    } else {
      setRequestMessage(
        "Monitoring request cancelled."
      );
    }

    setCancellingId(null);
    await loadRequests(true);
  }

  async function toggleReceiving() {
    if (
      !client ||
      updatingReceiving
    ) {
      return;
    }

    setUpdatingReceiving(true);

    const next = !receivingMonitoring;
    const supabase = createClient();

    const { error } =
      await supabase.rpc(
        "psylattice_set_monitoring_receiving",
        {
          p_connection_id:
            client.connection_id,
          p_receive: next,
        }
      );

    if (error) {
      setFeedError(
        "Receiving preference could not be updated."
      );
    } else {
      setReceivingMonitoring(next);
      setRequestMessage(
        next
          ? "Monitoring feed receiving resumed."
          : "You stopped receiving this client's monitoring feed. Client consent was not changed."
      );
    }

    setUpdatingReceiving(false);
  }

  async function stopClientProtocol() {
    if (
      !client ||
      !sharedFeed ||
      stoppingProtocol
    ) {
      return;
    }

    const assigned = requests.some(
      (request) =>
        request.monitoring_plan_id ===
          sharedFeed.plan_id &&
        request.status === "accepted"
    );

    if (!assigned) {
      setFeedError(
        "This active protocol was not assigned through this clinician connection, so it cannot be stopped from your Clinical workspace."
      );
      return;
    }

    if (
      !window.confirm(
        `Stop ${client.client_name}'s active clinician-assigned monitoring protocol? Historical check-ins will remain.`
      )
    ) {
      return;
    }

    setStoppingProtocol(true);

    const supabase = createClient();

    const { error } =
      await supabase.rpc(
        "psylattice_stop_client_monitoring_protocol",
        {
          p_connection_id:
            client.connection_id,
          p_plan_id:
            sharedFeed.plan_id,
        }
      );

    if (error) {
      setFeedError(
        "The monitoring protocol could not be stopped."
      );
    } else {
      setRequestMessage(
        "Client monitoring protocol stopped."
      );

      await Promise.all([
        loadRequests(true),
        loadFeed(true),
      ]);
    }

    setStoppingProtocol(false);
  }

  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold">
          Select a client first
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Choose a connected client above before
          building or reviewing monitoring.
        </p>

        <button
          type="button"
          onClick={() =>
            changeScreen("clients")
          }
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
      .map((part) =>
        part.charAt(0)
      )
      .join("")
      .toUpperCase() || "PL";

  const activeAssignedToThisClinician =
    sharedFeed
      ? requests.some(
          (request) =>
            request.monitoring_plan_id ===
              sharedFeed.plan_id &&
            request.status === "accepted"
        )
      : false;

  const selectedDates =
    buildDateRange(
      progressRangeDays
    );

  const schedulesPerDay =
    sharedFeed?.protocol.filter(
      (schedule) =>
        schedule.trigger_type !== "event_contingent" &&
        schedule.trigger_type !== "participant_initiated"
    ).length || 0;

  const eventScheduleCount =
    sharedFeed?.protocol.filter(
      (schedule) =>
        schedule.trigger_type === "event_contingent" ||
        schedule.trigger_type === "participant_initiated"
    ).length || 0;

  const relevantProgressDates =
    sharedFeed
      ? selectedDates.filter((date) =>
          dateFallsWithinPlan(
            date,
            sharedFeed.start_date,
            sharedFeed.duration_days
          )
        )
      : [];

  const expectedCheckins =
    relevantProgressDates.length *
    schedulesPerDay;

  const scheduledCompletedCheckins =
    sharedFeed?.checkins.filter(
      (checkin) =>
        checkin.trigger_type !== "event_contingent" &&
        checkin.trigger_type !== "participant_initiated"
    ) || [];

  const eventCompletedCheckins =
    sharedFeed?.checkins.filter(
      (checkin) =>
        checkin.trigger_type === "event_contingent" ||
        checkin.trigger_type === "participant_initiated"
    ) || [];

  const completedCheckins =
    scheduledCompletedCheckins.length;

  const monitoringConsistency =
    expectedCheckins > 0
      ? Math.min(
          100,
          Math.round(
            (completedCheckins /
              expectedCheckins) *
              100
          )
        )
      : 0;

  const protocolItemMap = new Map<
    string,
    {
      type: MonitoringBlockType;
      prompt: string;
      config: Record<string, any>;
    }
  >();

  for (const schedule of
    sharedFeed?.protocol || []) {
    for (const item of
      schedule.items || []) {
      protocolItemMap.set(
        item.key,
        {
          type: item.type,
          prompt: item.prompt,
          config: item.config || {},
        }
      );
    }
  }

  function normaliseRatingToTen(
    response: any,
    config: Record<string, any>
  ) {
    const value = Number(response);

    if (!Number.isFinite(value)) {
      return null;
    }

    const min = Number(config.min);
    const max = Number(config.max);

    if (
      Number.isFinite(min) &&
      Number.isFinite(max) &&
      max > min
    ) {
      return Math.max(
        0,
        Math.min(
          10,
          ((value - min) /
            (max - min)) *
            10
        )
      );
    }

    return value >= 0 &&
      value <= 10
      ? value
      : null;
  }

  function ratingSeries(
    checkins: MonitoringV2SharedFeed["checkins"]
  ) {
    const stressValues: number[] = [];
    const sliderValues: number[] = [];

    for (const checkin of checkins) {
      for (const response of
        checkin.responses || []) {
        const item =
          protocolItemMap.get(
            response.item_key
          );

        if (!item) {
          continue;
        }

        const value =
          normaliseRatingToTen(
            response.response,
            item.config
          );

        if (value === null) {
          continue;
        }

        if (
          (item.type === "slider" ||
            item.type === "number") &&
          item.prompt
            .toLowerCase()
            .includes("stress")
        ) {
          stressValues.push(value);
        }

        if (
          item.type === "slider"
        ) {
          sliderValues.push(value);
        }
      }
    }

    if (
      stressValues.length > 0
    ) {
      return {
        kind: "stress" as const,
        values: stressValues,
      };
    }

    if (
      sliderValues.length > 0
    ) {
      return {
        kind: "rating" as const,
        values: sliderValues,
      };
    }

    return {
      kind: "none" as const,
      values: [] as number[],
    };
  }

  const overallRatings =
    ratingSeries(
      sharedFeed?.checkins || []
    );

  const averageRating =
    overallRatings.values.length > 0
      ? (
          overallRatings.values.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          overallRatings.values.length
        ).toFixed(1)
      : null;

  const ratingLabel =
    overallRatings.kind === "stress"
      ? "Average stress"
      : "Average rating";

  const monitoringProgressHistory =
    [...selectedDates]
      .reverse()
      .map((date) => {
        const checkins =
          (
            sharedFeed?.checkins || []
          ).filter(
            (checkin) =>
              checkin.entry_date ===
              date
          );

        const scheduledCheckins =
          checkins.filter(
            (checkin) =>
              checkin.trigger_type !== "event_contingent" &&
              checkin.trigger_type !== "participant_initiated"
          );

        const eventCheckins =
          checkins.filter(
            (checkin) =>
              checkin.trigger_type === "event_contingent" ||
              checkin.trigger_type === "participant_initiated"
          );

        const expected =
          sharedFeed &&
          dateFallsWithinPlan(
            date,
            sharedFeed.start_date,
            sharedFeed.duration_days
          )
            ? schedulesPerDay
            : 0;

        const dailyRatings =
          ratingSeries(checkins);

        const average =
          dailyRatings.values.length >
          0
            ? (
                dailyRatings.values.reduce(
                  (sum, value) =>
                    sum + value,
                  0
                ) /
                dailyRatings.values.length
              ).toFixed(1)
            : null;

        return {
          date,
          completed:
            scheduledCheckins.length,
          eventCompleted:
            eventCheckins.length,
          expected,
          average,
          kind: dailyRatings.kind,
        };
      })
      .filter(
        (day) =>
          day.expected > 0 ||
          day.completed > 0
      );

  const progressDaysWithData =
    monitoringProgressHistory.filter(
      (day) =>
        day.average !== null
    );

  const highestProgressDay =
    progressDaysWithData.length > 0
      ? progressDaysWithData.reduce(
          (highest, day) =>
            Number(day.average) >
            Number(highest.average)
              ? day
              : highest
        )
      : null;

  const lowestProgressDay =
    progressDaysWithData.length > 0
      ? progressDaysWithData.reduce(
          (lowest, day) =>
            Number(day.average) <
            Number(lowest.average)
              ? day
              : lowest
        )
      : null;

  return (
    <div className="space-y-5">
      {requestMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {requestMessage}
        </div>
      )}

      {requestError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {requestError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <PersonAvatar
            initials={initials}
            large
          />

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              Ambulatory Monitoring
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {client.client_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review real check-ins,
              longitudinal monitoring progress
              and clinician-assigned protocols.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {permissions?.share_monitoring ? (
            <Status type="success">
              Client sharing ON
            </Status>
          ) : (
            <Status>
              Client sharing OFF
            </Status>
          )}

          <Status
            type={
              receivingMonitoring
                ? "accent"
                : "neutral"
            }
          >
            {receivingMonitoring
              ? "Receiving feed"
              : "Feed paused"}
          </Status>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() =>
            setShowProtocolBuilder(
              (current) => !current
            )
          }
          className="flex w-full items-center justify-between gap-5 p-5 text-left transition hover:bg-slate-50/60"
        >
          <div>
            <p className="font-semibold text-slate-950">
              Build a monitoring protocol
            </p>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              Create time-contingent or event-contingent EMA/ESM
              check-ins with sliders, nested branching, activities and
              questionnaire-library blocks. Your Researcher-created
              questionnaires also appear under My questionnaire. The builder
              stays collapsed until you choose to open it.
            </p>
          </div>

          <span className="shrink-0 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-semibold text-cyan-900">
            {showProtocolBuilder
              ? "Collapse builder ↑"
              : "Expand builder ↓"}
          </span>
        </button>

        {showProtocolBuilder && (
          <div className="border-t border-slate-100 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <label>
                <span className="text-xs font-medium text-slate-500">
                  Protocol name
                </span>

                <input
                  value={protocolName}
                  onChange={(event) =>
                    setProtocolName(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>

              <label>
                <span className="text-xs font-medium text-slate-500">
                  Duration (days)
                </span>

                <input
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={(event) =>
                    setDurationDays(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
            </div>

            <div className="mt-6">
              <AmbulatoryProtocolBuilder
                protocol={protocol}
                onChange={setProtocol}
                questionnaires={questionnaires}
                context="clinical"
              />
            </div>

            <label className="mt-6 block">
              <span className="text-xs font-medium text-slate-500">
                Optional message to client
              </span>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-4 text-sm"
                placeholder="Explain why you are suggesting this protocol or what you would like the client to observe."
              />
            </label>

            <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
              <p className="text-sm font-medium text-cyan-950">
                The client remains in control.
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                They can edit your
                schedule, questions, options,
                activities and branching
                before accepting.
                Questionnaire blocks continue
                to reference the standardized
                library questionnaire rather
                than editable copied items.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={() =>
                  void sendRequest()
                }
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sending
                  ? "Sending..."
                  : "Send protocol to client"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowProtocolBuilder(
                    false
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Collapse builder
              </button>
            </div>
          </div>
        )}
      </div>

      <Panel title="Protocol request activity">
        {loadingRequests ? (
          <p className="text-sm text-slate-500">
            Loading requests...
          </p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-500">
            No V2 monitoring requests yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((request) => (
              <div
                key={request.request_id}
                className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      {request.name}
                    </p>

                    <Status
                      type={
                        request.status ===
                        "accepted"
                          ? "success"
                          : request.status ===
                              "pending"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {request.stopped_at
                        ? `Stopped by ${request.stopped_by}`
                        : request.status}
                    </Status>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    {request.duration_days}{" "}
                    days ·{" "}
                    {
                      request.protocol
                        .length
                    }{" "}
                    check-ins/day ·{" "}
                    {new Date(
                      request.created_at
                    ).toLocaleString()}
                  </p>
                </div>

                {request.status ===
                  "pending" && (
                  <button
                    type="button"
                    disabled={
                      cancellingId ===
                      request.request_id
                    }
                    onClick={() =>
                      void cancelRequest(
                        request
                      )
                    }
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                  >
                    {cancellingId ===
                    request.request_id
                      ? "Cancelling..."
                      : "Cancel request"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Monitoring feed controls"
        description="Client consent and your receiving preference are independent."
      >
        <div className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium">
              {receivingMonitoring
                ? "Receiving monitoring data when authorised"
                : "You paused this monitoring feed"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Pausing receiving does not
              turn off the client's consent
              setting. You can resume later.
            </p>
          </div>

          <button
            type="button"
            disabled={
              updatingReceiving
            }
            onClick={() =>
              void toggleReceiving()
            }
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
              receivingMonitoring
                ? "border border-red-200 bg-white text-red-700"
                : "bg-slate-950 text-white"
            }`}
          >
            {updatingReceiving
              ? "Updating..."
              : receivingMonitoring
                ? "Stop receiving monitoring"
                : "Resume receiving"}
          </button>
        </div>
      </Panel>

      {permissionsError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {permissionsError}
        </div>
      ) : loadingPermissions ? (
        <Panel title="Shared monitoring">
          <p className="text-sm text-slate-500">
            Checking client permission...
          </p>
        </Panel>
      ) : !permissions?.share_monitoring ? (
        <Panel title="Shared monitoring data">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-semibold">
              Monitoring data is not
              shared by the client
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              You can still build and
              send protocols, but the
              database will not return
              their monitoring responses
              until Daily monitoring
              sharing is enabled.
            </p>

            <button
              type="button"
              onClick={() =>
                changeScreen(
                  "permissions"
                )
              }
              className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"
            >
              View consent & data access
            </button>
          </div>
        </Panel>
      ) : !receivingMonitoring ? (
        <Panel title="Shared monitoring data">
          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="font-semibold">
              You chose to stop receiving
              this feed.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              The client may still be
              sharing, but PsyLattice is
              not returning monitoring data
              to your Clinical workspace
              while your receiving
              preference is paused.
            </p>
          </div>
        </Panel>
      ) : (
        <>
          {feedError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {feedError}
            </div>
          )}

          <Panel
            title="Client monitoring progress"
            description="Monitoring-related progress derived from the same Monitoring V2 records used in the client's Self → Progress tab."
          >
            {!permissions?.share_progress ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="font-semibold text-slate-800">
                  Progress & trends are
                  not shared
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The client is sharing
                  their Daily Monitoring
                  feed, but has not
                  authorised the separate
                  Progress & trends
                  permission. Raw authorised
                  check-ins remain available
                  below, while longitudinal
                  progress summaries stay
                  hidden.
                </p>
              </div>
            ) : loadingFeed ? (
              <p className="text-sm text-slate-500">
                Loading client progress...
              </p>
            ) : !sharedFeed ? (
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-medium text-slate-800">
                  No active shared
                  monitoring plan
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {sharedFeed.plan_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Progress for the last{" "}
                      {progressRangeDays} days
                    </p>
                  </div>

                  <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                    {(
                      [7, 14, 30] as const
                    ).map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() =>
                          setProgressRangeDays(
                            days
                          )
                        }
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                          progressRangeDays ===
                          days
                            ? "bg-slate-950 text-white"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Check-ins completed"
                    value={`${completedCheckins} / ${expectedCheckins}`}
                    detail={`Selected ${progressRangeDays}-day range`}
                  />

                  <StatCard
                    label="Monitoring consistency"
                    value={`${monitoringConsistency}%`}
                    detail={`${schedulesPerDay} scheduled check-ins / day`}
                  />

                  <StatCard
                    label={ratingLabel}
                    value={
                      averageRating
                        ? `${averageRating} / 10`
                        : "No data"
                    }
                    detail={
                      overallRatings.kind ===
                      "stress"
                        ? "Across saved stress responses"
                        : overallRatings.kind ===
                            "rating"
                          ? "Across saved slider responses"
                          : "No numeric slider response in this range"
                    }
                  />

                  <StatCard
                    label="Event reports"
                    value={String(
                      eventCompletedCheckins.length
                    )}
                    detail={`${eventScheduleCount} event-contingent check-in type${
                      eventScheduleCount === 1 ? "" : "s"
                    } configured`}
                  />
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Daily progress
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Completion and
                      available rating
                      summaries by day.
                    </p>

                    {monitoringProgressHistory.length ===
                    0 ? (
                      <p className="mt-5 text-sm text-slate-500">
                        No monitoring
                        records are available
                        in this range yet.
                      </p>
                    ) : (
                      <div className="mt-5 divide-y divide-slate-100">
                        {monitoringProgressHistory.map(
                          (day) => {
                            const percentage =
                              day.expected > 0
                                ? Math.min(
                                    100,
                                    Math.round(
                                      (day.completed /
                                        day.expected) *
                                        100
                                    )
                                  )
                                : 0;

                            return (
                              <div
                                key={
                                  day.date
                                }
                                className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[80px_1fr_auto] sm:items-center"
                              >
                                <p className="text-sm font-medium text-slate-800">
                                  {formatProgressDate(
                                    day.date
                                  )}
                                </p>

                                <div>
                                  <p className="text-xs text-slate-500">
                                    {day.completed} / {day.expected} scheduled
                                    {day.eventCompleted > 0
                                      ? ` · ${day.eventCompleted} event report${
                                          day.eventCompleted === 1 ? "" : "s"
                                        }`
                                      : ""}
                                  </p>

                                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-cyan-700"
                                      style={{
                                        width: `${percentage}%`,
                                      }}
                                    />
                                  </div>
                                </div>

                                <span className="text-xs font-medium text-slate-500">
                                  {day.average
                                    ? `${
                                        day.kind ===
                                        "stress"
                                          ? "Stress"
                                          : "Avg"
                                      } ${
                                        day.average
                                      } / 10`
                                    : day.completed >
                                        0
                                      ? "Completed"
                                      : "No rating"}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">
                    <p className="font-semibold text-cyan-950">
                      Descriptive pattern
                    </p>

                    {highestProgressDay &&
                    lowestProgressDay &&
                    progressDaysWithData.length >=
                      2 ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Within this{" "}
                        {progressRangeDays}
                        -day view, the
                        highest daily average{" "}
                        {overallRatings.kind ===
                        "stress"
                          ? "stress "
                          : "slider rating "}
                        was{" "}
                        {
                          highestProgressDay.average
                        }
                        /10 on{" "}
                        {formatProgressDate(
                          highestProgressDay.date
                        )}
                        , while the lowest
                        was{" "}
                        {
                          lowestProgressDay.average
                        }
                        /10 on{" "}
                        {formatProgressDate(
                          lowestProgressDay.date
                        )}
                        .
                      </p>
                    ) : completedCheckins >
                      0 ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Check-in progress is
                        being recorded. At
                        least two days with
                        numeric slider
                        responses are needed
                        for a daily rating
                        comparison.
                      </p>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        No completed
                        monitoring check-ins
                        are available in this
                        range yet.
                      </p>
                    )}

                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      These are descriptive
                      summaries from the
                      client's authorised
                      Monitoring V2 records;
                      they do not establish
                      diagnosis or causation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Panel>

          <Panel
            title="Actual client protocol"
            description="This reflects the client's accepted/customised version, not necessarily the exact protocol you originally suggested."
          >
            {loadingFeed ? (
              <p className="text-sm text-slate-500">
                Loading shared protocol...
              </p>
            ) : !sharedFeed ? (
              <p className="text-sm text-slate-500">
                No active shared V2
                monitoring protocol.
              </p>
            ) : (
              <div>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold">
                      {
                        sharedFeed.plan_name
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        sharedFeed.duration_days
                      }{" "}
                      days ·{" "}
                      {
                        sharedFeed.protocol
                          .length
                      }{" "}
                      daily check-ins
                    </p>
                  </div>

                  {activeAssignedToThisClinician && (
                    <button
                      type="button"
                      disabled={
                        stoppingProtocol
                      }
                      onClick={() =>
                        void stopClientProtocol()
                      }
                      className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-700"
                    >
                      {stoppingProtocol
                        ? "Stopping..."
                        : "Stop this protocol"}
                    </button>
                  )}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {sharedFeed.protocol.map(
                    (schedule) => (
                      <div
                        key={
                          schedule.schedule_id ||
                          schedule.key
                        }
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {schedule.label}
                          </p>

                          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-cyan-800">
                            {(schedule.trigger_type || "fixed_time")
                              .replaceAll("_", " ")}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {(schedule.trigger_type === "event_contingent" ||
                            schedule.trigger_type === "participant_initiated")
                            ? `Available any time · ${
                                schedule.event_title || schedule.label
                              }`
                            : schedule.trigger_type === "fixed_time"
                              ? `Fixed at ${
                                  schedule.fixed_time || schedule.start_time
                                }`
                              : `${schedule.start_time}–${schedule.end_time}`}
                        </p>

                        {(schedule.trigger_type === "event_contingent" ||
                          schedule.trigger_type === "participant_initiated") &&
                          schedule.event_description && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {schedule.event_description}
                            </p>
                          )}

                        <div className="mt-3 space-y-2">
                          {schedule.items.map(
                            (item) => (
                              <div
                                key={
                                  item.item_id ||
                                  item.key
                                }
                                className="rounded-lg bg-slate-50 p-3"
                              >
                                <div className="flex justify-between gap-2">
                                  <p className="text-xs font-medium text-slate-700">
                                    {
                                      item.prompt
                                    }
                                  </p>

                                  <span className="text-[10px] uppercase text-slate-400">
                                    {item.type.replaceAll(
                                      "_",
                                      " "
                                    )}
                                  </span>
                                </div>

                                {item.visibility
                                  .mode ===
                                  "conditional" && (
                                  <p className="mt-1 text-[10px] font-medium text-cyan-800">
                                    Conditional ·{" "}
                                    {
                                      item
                                        .visibility
                                        .conditions
                                        .length
                                    }{" "}
                                    rule(s)
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </Panel>

          <Panel
            title="Recent shared check-ins"
            description={`Responses are shown according to the actual blocks that were visible and submitted during each check-in. Showing the selected ${progressRangeDays}-day progress range.`}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                disabled={loadingFeed}
                onClick={() =>
                  void loadFeed(true)
                }
                className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-900 disabled:opacity-50"
              >
                {loadingFeed
                  ? "Refreshing..."
                  : "Refresh monitoring data"}
              </button>
            </div>

            {!sharedFeed ||
            sharedFeed.checkins.length ===
              0 ? (
              <p className="text-sm text-slate-500">
                No shared V2 check-ins in
                the selected{" "}
                {progressRangeDays}-day
                range.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {sharedFeed.checkins
                  .slice(0, 30)
                  .map((checkin) => (
                    <div
                      key={
                        checkin.checkin_id
                      }
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {checkin.schedule_label}
                          </p>

                          {checkin.trigger_type && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-500">
                              {checkin.trigger_type.replaceAll("_", " ")}
                              {checkin.occurrence_index &&
                              checkin.occurrence_index > 1
                                ? ` · #${checkin.occurrence_index}`
                                : ""}
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-slate-400">
                          {new Date(
                            checkin.completed_at
                          ).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {checkin.responses.map(
                          (response) => (
                            <div
                              key={
                                response.item_id
                              }
                              className="rounded-xl bg-slate-50 p-4"
                            >
                              <p className="text-xs text-slate-400">
                                {
                                  response.prompt
                                }
                              </p>

                              <p className="mt-2 text-sm font-medium text-slate-700">
                                {monitoringResponseText(
                                  response.response
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}


/* =========================================================
   WEARABLES
   ========================================================= */

function Wearables({
  client,
}: {
  client: ConnectedClient | null;
}) {
  const {
    permissions,
    loadingPermissions,
  } = useClientSharingPermissions(client);

  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold">
          Select a client above
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Wearable access is evaluated separately for each connected client.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Panel
        title={`${client.client_name} · Wearables & physiology`}
        description="Wearable information is shown only when it is both authorised and connected to a real data source."
      >
        {loadingPermissions ? (
          <p className="text-sm text-slate-500">
            Checking permission...
          </p>
        ) : !permissions?.share_wearables ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="font-semibold text-slate-800">
              Wearable summaries are not shared
            </p>
            <p className="mt-2 text-sm text-slate-500">
              The client has not authorised wearable-summary access.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <p className="font-semibold text-cyan-950">
              Permission granted — live wearable connector not configured yet
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No fabricated sleep, heart-rate, HRV or activity values are shown.
              Real readings will appear here only after PsyLattice is connected
              to an actual wearable data source.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   TIMELINE
   ========================================================= */

function Timeline({
  client,
}: {
  client: ConnectedClient | null;
}) {
  type TimelineEvent = {
    id: string;
    occurred_at: string;
    title: string;
    detail: string;
    type: "Assessment" | "Monitoring";
  };

  const {
    permissions,
    loadingPermissions,
  } = useClientSharingPermissions(client);

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");

  useEffect(() => {
    async function loadTimeline() {
      if (!client || !permissions) {
        setEvents([]);
        return;
      }

      setLoading(true);
      setTimelineError("");

      const supabase = createClient();

      const assessmentPromise =
        permissions.share_assessments
          ? supabase.rpc(
              "psylattice_connected_client_assessments_v2",
              {
                p_connection_id: client.connection_id,
              }
            )
          : Promise.resolve({
              data: [],
              error: null,
            });

      const monitoringPromise =
        permissions.share_monitoring
          ? supabase.rpc(
              "psylattice_connected_client_monitoring_v2",
              {
                p_connection_id: client.connection_id,
                p_days: 30,
              }
            )
          : Promise.resolve({
              data: [],
              error: null,
            });

      const [assessmentResult, monitoringResult] =
        await Promise.all([
          assessmentPromise,
          monitoringPromise,
        ]);

      if (
        assessmentResult.error ||
        monitoringResult.error
      ) {
        console.error(
          "Could not load client timeline:",
          assessmentResult.error ||
            monitoringResult.error
        );

        setTimelineError(
          "Some timeline data could not be loaded."
        );
      }

      const nextEvents: TimelineEvent[] = [];

      for (const assessment of
        (assessmentResult.data ?? []) as Array<{
          session_id: string;
          questionnaire_name: string;
          questionnaire_acronym: string | null;
          completed_at: string;
        }>) {
        nextEvents.push({
          id: `assessment-${assessment.session_id}`,
          occurred_at: assessment.completed_at,
          title:
            assessment.questionnaire_acronym ||
            assessment.questionnaire_name,
          detail: "Completed assessment",
          type: "Assessment",
        });
      }

      const feed =
        Array.isArray(monitoringResult.data) &&
        monitoringResult.data.length > 0
          ? monitoringResult.data[0]
          : null;

      for (const checkin of
        (feed?.checkins || []) as Array<{
          checkin_id: string;
          schedule_label: string;
          completed_at: string;
          responses: Array<any>;
        }>) {
        nextEvents.push({
          id: `monitoring-${checkin.checkin_id}`,
          occurred_at: checkin.completed_at,
          title: checkin.schedule_label,
          detail: `${checkin.responses.length} submitted response${
            checkin.responses.length === 1 ? "" : "s"
          }`,
          type: "Monitoring",
        });
      }

      nextEvents.sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() -
          new Date(a.occurred_at).getTime()
      );

      setEvents(nextEvents);
      setLoading(false);
    }

    if (!loadingPermissions) {
      void loadTimeline();
    }
  }, [
    client?.connection_id,
    loadingPermissions,
    permissions?.share_assessments,
    permissions?.share_monitoring,
  ]);

  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold">
          Select a client above
        </p>
        <p className="mt-2 text-sm text-slate-500">
          The combined progress timeline will load for the selected client.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {timelineError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {timelineError}
        </div>
      )}

      <Panel
        title={`${client.client_name} · Progress timeline`}
        description="Chronological authorised assessment and Monitoring V2 events."
      >
        {loading || loadingPermissions ? (
          <p className="text-sm text-slate-500">
            Loading timeline...
          </p>
        ) : events.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium text-slate-800">
              No shared timeline events yet
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Assessment and monitoring events appear here only when the
              corresponding sharing permissions are enabled.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.slice(0, 50).map((event) => (
              <div
                key={event.id}
                className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {event.title}
                    </p>
                    <Status
                      type={
                        event.type === "Assessment"
                          ? "accent"
                          : "success"
                      }
                    >
                      {event.type}
                    </Status>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {event.detail}
                  </p>
                </div>

                <p className="text-xs text-slate-400">
                  {new Date(
                    event.occurred_at
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   NOTES
   ========================================================= */

function Notes({
  client,
}: {
  client: ConnectedClient | null;
}) {
  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold">
          Select a client above
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Choose a client to work in Professional Notes.
        </p>
      </div>
    );
  }

  return (
    <Panel
      title={`${client.client_name} · Professional Notes`}
      description="This tab is client-scoped. The selected client can be changed above without returning to the Clients page."
    >
      <div className="rounded-2xl bg-slate-50 p-6">
        <p className="font-semibold text-slate-800">
          Client-specific professional notes are not connected to a persistent clinical-record backend yet.
        </p>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          PsyLattice is not displaying demo client records here. This tab will
          be connected only when its real backend workflow is implemented.
        </p>
      </div>
    </Panel>
  );
}

/* =========================================================
   CARE PATHWAY
   ========================================================= */

function CarePathway({
  client,
}: {
  client: ConnectedClient | null;
}) {
  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold">
          Select a client above
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Choose a client to work in Care Pathway.
        </p>
      </div>
    );
  }

  return (
    <Panel
      title={`${client.client_name} · Care Pathway`}
      description="This tab is client-scoped. The selected client can be changed above without returning to the Clients page."
    >
      <div className="rounded-2xl bg-slate-50 p-6">
        <p className="font-semibold text-slate-800">
          The care-pathway backend has not been connected yet. No fictional pathway data is shown.
        </p>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          PsyLattice is not displaying demo client records here. This tab will
          be connected only when its real backend workflow is implemented.
        </p>
      </div>
    </Panel>
  );
}

/* =========================================================
   APPOINTMENTS
   ========================================================= */

function Appointments({
  client,
}: {
  client: ConnectedClient | null;
}) {
  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold">
          Select a client above
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Choose a client to work in Appointments.
        </p>
      </div>
    );
  }

  return (
    <Panel
      title={`${client.client_name} · Appointments`}
      description="This tab is client-scoped. The selected client can be changed above without returning to the Clients page."
    >
      <div className="rounded-2xl bg-slate-50 p-6">
        <p className="font-semibold text-slate-800">
          Client-specific appointment scheduling is not connected yet.
        </p>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          PsyLattice is not displaying demo client records here. This tab will
          be connected only when its real backend workflow is implemented.
        </p>
      </div>
    </Panel>
  );
}

/* =========================================================
   MESSAGES
   ========================================================= */

function Messages({
  client,
}: {
  client: ConnectedClient | null;
}) {
  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold">
          Select a client above
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Choose a client to work in Messages.
        </p>
      </div>
    );
  }

  return (
    <Panel
      title={`${client.client_name} · Messages`}
      description="This tab is client-scoped. The selected client can be changed above without returning to the Clients page."
    >
      <div className="rounded-2xl bg-slate-50 p-6">
        <p className="font-semibold text-slate-800">
          Secure client messaging is not connected yet.
        </p>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          PsyLattice is not displaying demo client records here. This tab will
          be connected only when its real backend workflow is implemented.
        </p>
      </div>
    </Panel>
  );
}

/* =========================================================
   REPORTS
   ========================================================= */

function Reports({
  client,
}: {
  client: ConnectedClient | null;
}) {
  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold">
          Select a client above
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Choose a client to work in Reports.
        </p>
      </div>
    );
  }

  return (
    <Panel
      title={`${client.client_name} · Reports`}
      description="This tab is client-scoped. The selected client can be changed above without returning to the Clients page."
    >
      <div className="rounded-2xl bg-slate-50 p-6">
        <p className="font-semibold text-slate-800">
          Structured client reports are not connected yet. Authorised assessment and monitoring data remains available in the live data tabs.
        </p>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          PsyLattice is not displaying demo client records here. This tab will
          be connected only when its real backend workflow is implemented.
        </p>
      </div>
    </Panel>
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
    permissionsSyncedAt,
    refreshPermissions,
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

        <div className="flex flex-wrap items-center gap-2">
          <Status type="success">Connected</Status>

          <button
            type="button"
            disabled={loadingPermissions}
            onClick={() => void refreshPermissions()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingPermissions
              ? "Refreshing..."
              : "Refresh permissions"}
          </button>
        </div>
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

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
              {permissions.permissions_updated_at && (
                <p>
                  Client permissions last updated{" "}
                  {new Date(
                    permissions.permissions_updated_at
                  ).toLocaleString()}
                </p>
              )}

              {permissionsSyncedAt && (
                <p>
                  Clinical view synced{" "}
                  {new Date(
                    permissionsSyncedAt
                  ).toLocaleTimeString()}
                </p>
              )}
            </div>
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
  const [clinicianName, setClinicianName] = useState("");
  const [currentLocalTime, setCurrentLocalTime] = useState(
    () => new Date()
  );
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(
      "psylattice-clinical-sidebar-collapsed"
    );

    if (saved === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "psylattice-clinical-sidebar-collapsed",
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    async function loadClinicianProfile() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error(
          "Could not load clinician account:",
          userError
        );
        setClinicianName("Clinician");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Could not load clinician profile:",
          profileError
        );
      }

      setClinicianName(
        profile?.full_name?.trim() ||
          user.user_metadata?.full_name?.trim?.() ||
          user.email?.split("@")[0] ||
          "Clinician"
      );
    }

    void loadClinicianProfile();
  }, []);

  useEffect(() => {
    const updateClock = () => {
      setCurrentLocalTime(new Date());
    };

    updateClock();

    const timer = window.setInterval(
      updateClock,
      60_000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

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

  const clinicianFirstName =
    clinicianName.trim().split(/\s+/)[0] ||
    "Clinician";

  const clinicianInitials =
    clinicianName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "CL";

  const localHour =
    currentLocalTime.getHours();

  const greeting =
    localHour < 12
      ? "Good morning"
      : localHour < 17
        ? "Good afternoon"
        : "Good evening";

  const activeNavigation = navigation.find((item) => item.id === screen)!;

  const descriptions: Record<Screen, string> = {
    dashboard:
      "A concise view of your connected caseload and authorised clinical data.",

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
        return <Dashboard onOpenClient={openClient} />;

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
            key={selectedClient?.connection_id ?? "no-client"}
            changeScreen={setScreen}
            client={selectedClient}
            onRemoveClient={removeClientConnection}
          />
        );

      case "assessments":
        return (
          <Assessments
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
            changeScreen={setScreen}
          />
        );

      case "ambulatory":
        return (
          <Ambulatory
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
            changeScreen={setScreen}
          />
        );

      case "wearables":
        return (
          <Wearables
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
          />
        );

      case "timeline":
        return (
          <Timeline
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
          />
        );

      case "notes":
        return (
          <Notes
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
          />
        );

      case "care":
        return (
          <CarePathway
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
          />
        );

      case "appointments":
        return (
          <Appointments
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
          />
        );

      case "messages":
        return (
          <Messages
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
          />
        );

      case "reports":
        return (
          <Reports
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
          />
        );

      case "permissions":
        return (
          <Permissions
            key={selectedClient?.connection_id ?? "no-client"}
            client={selectedClient}
          />
        );

      case "settings":
        return <Settings />;

      default:
        return <Dashboard onOpenClient={openClient} />;
    }
  }

  const groups: ("Clinical" | "Monitoring" | "Care" | "Governance")[] = [
    "Clinical",
    "Monitoring",
    "Care",
    "Governance",
  ];

  const clientContextScreens = new Set<Screen>([
    "overview",
    "assessments",
    "ambulatory",
    "wearables",
    "timeline",
    "notes",
    "care",
    "appointments",
    "messages",
    "reports",
    "permissions",
  ]);

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

            <AccountSwitcher
              initials={clinicianInitials}
              currentWorkspace="clinician"
              title={clinicianName || "Switch workspace"}
            />

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

      <div className="min-h-[calc(100vh-80px)]">
        {/* SIDEBAR */}

        <aside
          className={`fixed bottom-0 left-0 top-20 z-40 hidden overflow-y-auto border-r border-slate-200 bg-white p-3 transition-[width] duration-200 lg:block ${
            sidebarCollapsed ? "w-[76px]" : "w-[250px]"
          }`}
        >
          <div
            className={`mb-4 flex ${
              sidebarCollapsed ? "justify-center" : "justify-end"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setSidebarCollapsed((current) => !current)
              }
              aria-label={
                sidebarCollapsed
                  ? "Expand clinical sidebar"
                  : "Collapse clinical sidebar"
              }
              title={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            >
              {sidebarCollapsed ? "›" : "‹"}
            </button>
          </div>

          {groups.map((group, groupIndex) => (
            <div
              key={group}
              className={`mb-6 ${
                sidebarCollapsed && groupIndex > 0
                  ? "border-t border-slate-100 pt-4"
                  : ""
              }`}
            >
              {!sidebarCollapsed && (
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                  {group}
                </p>
              )}

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
                        title={
                          sidebarCollapsed
                            ? item.label
                            : undefined
                        }
                        aria-label={item.label}
                        className={`flex w-full items-center rounded-xl py-2.5 text-sm transition ${
                          sidebarCollapsed
                            ? "justify-center px-2"
                            : "gap-3 px-3 text-left"
                        } ${
                          active
                            ? "bg-cyan-50 font-semibold text-cyan-900"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <span
                          className={`rounded-full transition-all ${
                            sidebarCollapsed
                              ? "h-2.5 w-2.5"
                              : "h-1.5 w-1.5"
                          } ${
                            active
                              ? "bg-cyan-700"
                              : "bg-slate-300"
                          }`}
                        />

                        {!sidebarCollapsed && item.label}
                      </button>
                    );
                  })}
              </nav>
            </div>
          ))}

          {sidebarCollapsed ? (
            <div
              title="Client-controlled access"
              className="mx-auto mt-8 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-semibold text-cyan-200"
            >
              C
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs font-medium text-cyan-200">
                Client-controlled access
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Assessment and monitoring views use real connected-client data
                and remain permission-gated. Unimplemented clinical-record tabs
                no longer display fictional client records.
              </p>
            </div>
          )}
        </aside>

        {/* CONTENT */}

        <section
          className={`min-w-0 p-5 transition-[margin] duration-200 sm:p-6 lg:p-8 ${
            sidebarCollapsed
              ? "lg:ml-[76px]"
              : "lg:ml-[250px]"
          }`}
        >
          <div className="mx-auto max-w-[1450px]">
            <div className="mb-7">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Status type="accent">Clinician workspace</Status>

                <span className="text-xs text-slate-400">
                  Connected clinical workspace
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                {screen === "dashboard"
                  ? `${greeting}, ${clinicianFirstName}.`
                  : activeNavigation.label}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {descriptions[screen]}
              </p>
            </div>

            {clientContextScreens.has(screen) && (
              <ClinicalClientSelector
                client={selectedClient}
                onSelect={setSelectedClient}
              />
            )}

            {renderScreen()}
          </div>
        </section>
      </div>
    </main>
  );
}