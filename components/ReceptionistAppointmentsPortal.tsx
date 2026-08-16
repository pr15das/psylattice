"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type PortalInfo = {
  clinician_id: string;
  clinician_name: string;
  portal_label: string;
  status: "active" | "paused";
};

type PortalClient = {
  connection_id: string;
  client_id: string;
  client_name: string;
  connected_at: string;
};

type Appointment = {
  id: string;
  client_id: string;
  connection_id: string;
  title: string;
  appointment_type: string;
  status: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  mode: string;
  location: string;
  meeting_url: string;
  client_visible: boolean;
  client_message: string;
  client_link: string;
  created_at: string;
  updated_at: string;
};

type AppointmentRequest = {
  id: string;
  client_id: string;
  client_name: string;
  appointment_type: string;
  requested_start_at: string;
  requested_end_at: string;
  timezone: string;
  mode: string;
  client_message: string;
  clinician_response: string;
  status: string;
  linked_appointment_id: string | null;
  requested_at: string;
  updated_at: string;
};

type AppointmentType =
  | "intake"
  | "therapy"
  | "assessment"
  | "review"
  | "consultation"
  | "other";

type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

type AppointmentMode =
  | "in_person"
  | "video"
  | "phone";

const types: Array<{
  value: AppointmentType;
  label: string;
}> = [
  { value: "intake", label: "Intake" },
  {
    value: "therapy",
    label: "Therapy / session",
  },
  {
    value: "assessment",
    label: "Assessment",
  },
  { value: "review", label: "Review" },
  {
    value: "consultation",
    label: "Consultation",
  },
  { value: "other", label: "Other" },
];

const modes: Array<{
  value: AppointmentMode;
  label: string;
}> = [
  {
    value: "in_person",
    label: "In person",
  },
  { value: "video", label: "Video" },
  { value: "phone", label: "Phone" },
];

const statuses: Array<{
  value: AppointmentStatus;
  label: string;
}> = [
  {
    value: "scheduled",
    label: "Scheduled",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "no_show",
    label: "No show",
  },
];

const durations = [
  30, 45, 50, 60, 75, 90, 120,
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${pad(
    value.getMonth() + 1
  )}-${pad(value.getDate())}`;
}

function localTimeValue(value: Date) {
  return `${pad(value.getHours())}:${pad(
    value.getMinutes()
  )}`;
}

function startOfMonth(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    1
  );
}

function addMonths(
  value: Date,
  amount: number
) {
  return new Date(
    value.getFullYear(),
    value.getMonth() + amount,
    1
  );
}

function addDays(
  value: Date,
  amount: number
) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month);
  const offset =
    (first.getDay() + 6) % 7;
  const firstVisible = addDays(
    first,
    -offset
  );

  return Array.from(
    { length: 42 },
    (_, index) =>
      addDays(firstVisible, index)
  );
}

function rangeLabel(
  start: string,
  end: string
) {
  const formatter = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  return `${formatter(
    new Date(start)
  )}–${formatter(new Date(end))}`;
}

function durationMinutes(
  start: string,
  end: string
) {
  return Math.max(
    1,
    Math.round(
      (new Date(end).getTime() -
        new Date(start).getTime()) /
        60000
    )
  );
}

function typeLabel(value: string) {
  return (
    types.find(
      (item) =>
        item.value === value
    )?.label || value
  );
}

function modeLabel(value: string) {
  return (
    modes.find(
      (item) =>
        item.value === value
    )?.label || value
  );
}

export default function ReceptionistAppointmentsPortal({
  token,
}: {
  token: string;
}) {
  const now = new Date();

  const [portal, setPortal] =
    useState<PortalInfo | null>(
      null
    );
  const [clients, setClients] =
    useState<PortalClient[]>([]);
  const [
    selectedClientId,
    setSelectedClientId,
  ] = useState("");
  const [appointments, setAppointments] =
    useState<Appointment[]>([]);
  const [requests, setRequests] =
    useState<AppointmentRequest[]>([]);

  const [loading, setLoading] =
    useState(true);
  const [working, setWorking] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [visibleMonth, setVisibleMonth] =
    useState(startOfMonth(now));
  const [selectedDate, setSelectedDate] =
    useState(localDateKey(now));

  const [formOpen, setFormOpen] =
    useState(false);
  const [
    editingAppointmentId,
    setEditingAppointmentId,
  ] = useState("");
  const [
    acceptingRequestId,
    setAcceptingRequestId,
  ] = useState("");

  const [formTitle, setFormTitle] =
    useState("");
  const [formType, setFormType] =
    useState<AppointmentType>(
      "therapy"
    );
  const [formStatus, setFormStatus] =
    useState<AppointmentStatus>(
      "scheduled"
    );
  const [formDate, setFormDate] =
    useState(localDateKey(now));
  const [formTime, setFormTime] =
    useState("10:00");
  const [formDuration, setFormDuration] =
    useState(50);
  const [formMode, setFormMode] =
    useState<AppointmentMode>(
      "in_person"
    );
  const [formLocation, setFormLocation] =
    useState("");
  const [formMeetingUrl, setFormMeetingUrl] =
    useState("");
  const [formClientVisible, setFormClientVisible] =
    useState(true);
  const [formClientMessage, setFormClientMessage] =
    useState("");
  const [formClientLink, setFormClientLink] =
    useState("");

  const timezone = useMemo(
    () =>
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || "UTC",
    []
  );

  const selectedClient = useMemo(
    () =>
      clients.find(
        (client) =>
          client.client_id ===
          selectedClientId
      ) || null,
    [
      clients,
      selectedClientId,
    ]
  );

  async function loadPortal() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_receptionist_portal",
        {
          p_token: token,
        }
      );

    if (error) {
      setErrorMessage(
        "This receptionist management link is invalid or unavailable."
      );
      setLoading(false);
      return;
    }

    const info =
      ((data || []) as PortalInfo[])[0] ||
      null;

    setPortal(info);

    if (!info) {
      setLoading(false);
      return;
    }

    if (
      info.status !== "active"
    ) {
      setLoading(false);
      return;
    }

    const {
      data: clientData,
      error: clientError,
    } = await supabase.rpc(
      "psylattice_receptionist_clients",
      {
        p_token: token,
      }
    );

    if (clientError) {
      setErrorMessage(
        clientError.message ||
          "Client list could not be loaded."
      );
      setLoading(false);
      return;
    }

    const clientRows =
      (clientData ||
        []) as PortalClient[];

    setClients(clientRows);

    setSelectedClientId(
      (current) =>
        current ||
        clientRows[0]?.client_id ||
        ""
    );

    setLoading(false);
  }

  async function loadClientWorkspace(
    clientId: string
  ) {
    if (
      !clientId ||
      portal?.status !== "active"
    ) {
      setAppointments([]);
      setRequests([]);
      return;
    }

    const supabase = createClient();

    const [
      appointmentResult,
      requestResult,
    ] = await Promise.all([
      supabase.rpc(
        "psylattice_receptionist_appointments",
        {
          p_token: token,
          p_client_id:
            clientId,
        }
      ),
      supabase.rpc(
        "psylattice_receptionist_requests",
        {
          p_token: token,
          p_client_id:
            clientId,
        }
      ),
    ]);

    if (
      appointmentResult.error ||
      requestResult.error
    ) {
      setErrorMessage(
        appointmentResult.error
          ?.message ||
          requestResult.error
            ?.message ||
          "Appointment data could not be loaded."
      );
      return;
    }

    setAppointments(
      (appointmentResult.data ||
        []) as Appointment[]
    );
    setRequests(
      (requestResult.data ||
        []) as AppointmentRequest[]
    );
  }

  useEffect(() => {
    void loadPortal();
  }, [token]);

  useEffect(() => {
    if (selectedClientId) {
      void loadClientWorkspace(
        selectedClientId
      );
    }
  }, [
    selectedClientId,
    portal?.status,
  ]);

  const calendarDays = useMemo(
    () =>
      buildCalendarDays(visibleMonth),
    [visibleMonth]
  );

  const selectedDayAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            (appointment) =>
              localDateKey(
                new Date(
                  appointment.starts_at
                )
              ) === selectedDate
          )
          .sort(
            (a, b) =>
              new Date(
                a.starts_at
              ).getTime() -
              new Date(
                b.starts_at
              ).getTime()
          ),
      [appointments, selectedDate]
    );

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status ===
              "scheduled" &&
            new Date(
              appointment.ends_at
            ).getTime() >= Date.now()
        )
        .sort(
          (a, b) =>
            new Date(
              a.starts_at
            ).getTime() -
            new Date(
              b.starts_at
            ).getTime()
        ),
    [appointments]
  );

  const pendingRequests =
    requests.filter(
      (request) =>
        request.status === "pending"
    );

  const proposedStart = useMemo(
    () =>
      new Date(
        `${formDate}T${formTime}:00`
      ),
    [formDate, formTime]
  );

  const proposedEnd = useMemo(
    () =>
      new Date(
        proposedStart.getTime() +
          formDuration * 60000
      ),
    [
      proposedStart,
      formDuration,
    ]
  );

  function clearForm() {
    setEditingAppointmentId("");
    setAcceptingRequestId("");
    setFormTitle("");
    setFormType("therapy");
    setFormStatus("scheduled");
    setFormDate(selectedDate);
    setFormTime("10:00");
    setFormDuration(50);
    setFormMode("in_person");
    setFormLocation("");
    setFormMeetingUrl("");
    setFormClientVisible(true);
    setFormClientMessage("");
    setFormClientLink("");
  }

  function openNew() {
    clearForm();
    setFormDate(selectedDate);
    setFormOpen(true);
  }

  function openEdit(
    appointment: Appointment
  ) {
    const startsAt = new Date(
      appointment.starts_at
    );

    clearForm();
    setEditingAppointmentId(
      appointment.id
    );
    setFormTitle(
      appointment.title
    );
    setFormType(
      appointment.appointment_type as AppointmentType
    );
    setFormStatus(
      appointment.status as AppointmentStatus
    );
    setFormDate(
      localDateKey(startsAt)
    );
    setFormTime(
      localTimeValue(startsAt)
    );
    setFormDuration(
      durationMinutes(
        appointment.starts_at,
        appointment.ends_at
      )
    );
    setFormMode(
      appointment.mode as AppointmentMode
    );
    setFormLocation(
      appointment.location
    );
    setFormMeetingUrl(
      appointment.meeting_url
    );
    setFormClientVisible(
      appointment.client_visible
    );
    setFormClientMessage(
      appointment.client_message
    );
    setFormClientLink(
      appointment.client_link
    );
    setFormOpen(true);
  }

  function openRequest(
    request: AppointmentRequest
  ) {
    const startsAt = new Date(
      request.requested_start_at
    );

    clearForm();
    setAcceptingRequestId(
      request.id
    );
    setFormTitle(
      typeLabel(
        request.appointment_type
      )
    );
    setFormType(
      request.appointment_type as AppointmentType
    );
    setFormStatus("scheduled");
    setFormDate(
      localDateKey(startsAt)
    );
    setFormTime(
      localTimeValue(startsAt)
    );
    setFormDuration(
      durationMinutes(
        request.requested_start_at,
        request.requested_end_at
      )
    );
    setFormMode(
      request.mode as AppointmentMode
    );
    setFormClientVisible(true);
    setFormOpen(true);
  }

  async function saveAppointment() {
    if (
      working ||
      !selectedClient ||
      Number.isNaN(
        proposedStart.getTime()
      )
    ) {
      return;
    }

    setWorking(true);
    setErrorMessage("");
    setSuccessMessage("");

    const supabase = createClient();

    const title =
      formTitle.trim() ||
      typeLabel(formType);

    if (acceptingRequestId) {
      const { error } =
        await supabase.rpc(
          "psylattice_receptionist_accept_request",
          {
            p_token: token,
            p_request_id:
              acceptingRequestId,
            p_title: title,
            p_appointment_type:
              formType,
            p_starts_at:
              proposedStart.toISOString(),
            p_ends_at:
              proposedEnd.toISOString(),
            p_timezone: timezone,
            p_mode: formMode,
            p_location:
              formMode ===
              "in_person"
                ? formLocation.trim()
                : "",
            p_meeting_url:
              formMode === "video"
                ? formMeetingUrl.trim()
                : "",
            p_client_visible:
              formClientVisible,
            p_client_message:
              formClientMessage.trim(),
            p_client_link:
              formClientLink.trim(),
          }
        );

      if (error) {
        setErrorMessage(
          error.message ||
            "The request could not be accepted."
        );
        setWorking(false);
        return;
      }

      setSuccessMessage(
        "Request accepted and appointment scheduled."
      );
    } else {
      const { error } =
        await supabase.rpc(
          "psylattice_receptionist_save_appointment",
          {
            p_token: token,
            p_appointment_id:
              editingAppointmentId ||
              null,
            p_client_id:
              selectedClient.client_id,
            p_connection_id:
              selectedClient.connection_id,
            p_title: title,
            p_appointment_type:
              formType,
            p_status: formStatus,
            p_starts_at:
              proposedStart.toISOString(),
            p_ends_at:
              proposedEnd.toISOString(),
            p_timezone: timezone,
            p_mode: formMode,
            p_location:
              formMode ===
              "in_person"
                ? formLocation.trim()
                : "",
            p_meeting_url:
              formMode === "video"
                ? formMeetingUrl.trim()
                : "",
            p_client_visible:
              formClientVisible,
            p_client_message:
              formClientMessage.trim(),
            p_client_link:
              formClientLink.trim(),
          }
        );

      if (error) {
        setErrorMessage(
          error.message ||
            "The appointment could not be saved."
        );
        setWorking(false);
        return;
      }

      setSuccessMessage(
        editingAppointmentId
          ? "Appointment updated."
          : "Appointment created."
      );
    }

    setFormOpen(false);
    clearForm();
    await loadClientWorkspace(
      selectedClient.client_id
    );
    setWorking(false);
  }

  async function rejectRequest(
    request: AppointmentRequest
  ) {
    const response =
      window.prompt(
        "Optional message to the client explaining why the request is being declined:",
        ""
      );

    if (response === null) {
      return;
    }

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_receptionist_reject_request",
        {
          p_token: token,
          p_request_id:
            request.id,
          p_response: response,
        }
      );

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The request could not be rejected."
      );
      return;
    }

    setSuccessMessage(
      "Appointment request rejected."
    );
    await loadClientWorkspace(
      selectedClientId
    );
  }

  async function deleteAppointment(
    appointment: Appointment
  ) {
    if (
      !window.confirm(
        `Delete "${appointment.title}"?`
      )
    ) {
      return;
    }

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_receptionist_delete_appointment",
        {
          p_token: token,
          p_appointment_id:
            appointment.id,
        }
      );

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The appointment could not be deleted."
      );
      return;
    }

    await loadClientWorkspace(
      selectedClientId
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faf9]">
        <div className="mx-auto max-w-5xl p-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            Loading appointment management...
          </div>
        </div>
      </main>
    );
  }

  if (!portal) {
    return (
      <main className="min-h-screen bg-[#f7faf9]">
        <div className="mx-auto max-w-3xl p-8">
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center">
            <h1 className="text-xl font-semibold text-slate-950">
              Receptionist link unavailable
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              The clinician may have removed or replaced this management link.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    portal.status === "paused"
  ) {
    return (
      <main className="min-h-screen bg-[#f7faf9]">
        <div className="mx-auto max-w-3xl p-8">
          <div className="rounded-3xl border border-amber-200 bg-white p-10 text-center">
            <div className="mx-auto w-fit">
  <PsyLatticeLogo />
</div>
            <h1 className="mt-5 text-xl font-semibold text-slate-950">
              Appointment management is paused
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {portal.clinician_name} has temporarily paused this receptionist link.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4">
          <div>
<PsyLatticeLogo />
            <p className="mt-1 text-xs text-slate-400">
              Receptionist appointment management
            </p>
          </div>

          <div className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800">
            Appointment-only access
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-5 px-5 py-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                {portal.portal_label}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {portal.clinician_name} · Appointments
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage client appointment scheduling and appointment requests. Private clinical notes and all other clinical information remain inaccessible.
              </p>
            </div>

            <label className="min-w-[280px]">
              <span className="text-xs font-semibold text-slate-600">
                Client
              </span>
              <select
                value={selectedClientId}
                onChange={(event) => {
                  setSelectedClientId(
                    event.target.value
                  );
                  setSelectedDate(
                    localDateKey(
                      new Date()
                    )
                  );
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                {clients.map(
                  (client) => (
                    <option
                      key={
                        client.client_id
                      }
                      value={
                        client.client_id
                      }
                    >
                      {client.client_name}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

        {selectedClient && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Client
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {selectedClient.client_name}
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
                  Upcoming
                </p>
                <p className="mt-2 text-2xl font-semibold text-cyan-950">
                  {upcoming.length}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                  Pending requests
                </p>
                <p className="mt-2 text-2xl font-semibold text-amber-950">
                  {pendingRequests.length}
                </p>
              </div>
            </div>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Appointment requests
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Accept a request to open the appointment editor, or decline it with an optional client-facing response.
                  </p>
                </div>
              </div>

              {pendingRequests.length ===
              0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  No pending appointment requests.
                </div>
              ) : (
                <div className="grid gap-3 p-4 lg:grid-cols-2">
                  {pendingRequests.map(
                    (request) => (
                      <article
                        key={request.id}
                        className="rounded-2xl border border-amber-200 bg-amber-50/35 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {typeLabel(
                            request.appointment_type
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(
                            request.requested_start_at
                          ).toLocaleDateString()}{" "}
                          ·{" "}
                          {rangeLabel(
                            request.requested_start_at,
                            request.requested_end_at
                          )}{" "}
                          ·{" "}
                          {modeLabel(
                            request.mode
                          )}
                        </p>

                        {request.client_message && (
                          <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                            {
                              request.client_message
                            }
                          </p>
                        )}

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openRequest(
                                request
                              )
                            }
                            className="rounded-xl bg-cyan-800 px-4 py-2.5 text-xs font-semibold text-white"
                          >
                            Accept & schedule
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void rejectRequest(
                                request
                              )
                            }
                            className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Calendar
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose a date to view or schedule appointments.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleMonth(
                          addMonths(
                            visibleMonth,
                            -1
                          )
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openNew()
                      }
                      className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white"
                    >
                      + Appointment
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleMonth(
                          addMonths(
                            visibleMonth,
                            1
                          )
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="pb-4 text-xl font-semibold">
                    {visibleMonth.toLocaleDateString(
                      [],
                      {
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </h3>

                  <div className="grid grid-cols-7 border-b border-l border-slate-100">
                    {[
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                      "Sun",
                    ].map(
                      (day) => (
                        <div
                          key={day}
                          className="border-r border-t border-slate-100 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                          {day}
                        </div>
                      )
                    )}

                    {calendarDays.map(
                      (day) => {
                        const key =
                          localDateKey(
                            day
                          );
                        const selected =
                          selectedDate ===
                          key;
                        const dayItems =
                          appointments.filter(
                            (
                              appointment
                            ) =>
                              localDateKey(
                                new Date(
                                  appointment.starts_at
                                )
                              ) ===
                                key &&
                              appointment.status !==
                                "cancelled"
                          );

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setSelectedDate(
                                key
                              )
                            }
                            className={`min-h-[96px] border-r border-t border-slate-100 p-2 text-left ${
                              selected
                                ? "bg-cyan-50/70"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-xs font-semibold ${
                                selected
                                  ? "bg-cyan-800 text-white"
                                  : "text-slate-600"
                              }`}
                            >
                              {day.getDate()}
                            </span>

                            <div className="mt-2 space-y-1">
                              {dayItems
                                .slice(
                                  0,
                                  2
                                )
                                .map(
                                  (
                                    appointment
                                  ) => (
                                    <div
                                      key={
                                        appointment.id
                                      }
                                      className="truncate rounded-md bg-cyan-100 px-1.5 py-1 text-[9px] font-medium text-cyan-900"
                                    >
                                      {new Date(
                                        appointment.starts_at
                                      ).toLocaleTimeString(
                                        [],
                                        {
                                          hour:
                                            "numeric",
                                          minute:
                                            "2-digit",
                                        }
                                      )}{" "}
                                      ·{" "}
                                      {
                                        appointment.title
                                      }
                                    </div>
                                  )
                                )}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </section>

              <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Selected day
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    {new Date(
                      `${selectedDate}T12:00:00`
                    ).toLocaleDateString(
                      [],
                      {
                        weekday:
                          "long",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </h3>
                </div>

                <div className="max-h-[650px] space-y-3 overflow-y-auto p-4">
                  {selectedDayAppointments.length ===
                  0 ? (
                    <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                      No appointments on this day.
                    </div>
                  ) : (
                    selectedDayAppointments.map(
                      (
                        appointment
                      ) => (
                        <article
                          key={
                            appointment.id
                          }
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {
                              appointment.title
                            }
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {rangeLabel(
                              appointment.starts_at,
                              appointment.ends_at
                            )}
                          </p>
                          <p className="mt-2 text-[10px] text-slate-400">
                            {typeLabel(
                              appointment.appointment_type
                            )}{" "}
                            ·{" "}
                            {modeLabel(
                              appointment.mode
                            )}{" "}
                            ·{" "}
                            {
                              appointment.status
                            }
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  appointment
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void deleteAppointment(
                                  appointment
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-semibold text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      )
                    )
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      {formOpen &&
        selectedClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingAppointmentId
                      ? "Edit appointment"
                      : acceptingRequestId
                        ? "Accept request & schedule"
                        : "New appointment"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedClient.client_name
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    clearForm();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 p-5">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Title
                  </span>
                  <input
                    value={formTitle}
                    onChange={(event) =>
                      setFormTitle(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="text-xs font-semibold text-slate-600">
                      Type
                    </span>
                    <select
                      value={formType}
                      onChange={(event) =>
                        setFormType(
                          event.target
                            .value as AppointmentType
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      {types.map(
                        (item) => (
                          <option
                            key={
                              item.value
                            }
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  {!acceptingRequestId && (
                    <label>
                      <span className="text-xs font-semibold text-slate-600">
                        Status
                      </span>
                      <select
                        value={
                          formStatus
                        }
                        onChange={(
                          event
                        ) =>
                          setFormStatus(
                            event
                              .target
                              .value as AppointmentStatus
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      >
                        {statuses.map(
                          (item) => (
                            <option
                              key={
                                item.value
                              }
                              value={
                                item.value
                              }
                            >
                              {item.label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_130px]">
                  <label>
                    <span className="text-xs font-semibold text-slate-600">
                      Date
                    </span>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(event) =>
                        setFormDate(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-semibold text-slate-600">
                      Start time
                    </span>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(event) =>
                        setFormTime(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-semibold text-slate-600">
                      Duration
                    </span>
                    <select
                      value={formDuration}
                      onChange={(event) =>
                        setFormDuration(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      {durations.map(
                        (minutes) => (
                          <option
                            key={
                              minutes
                            }
                            value={
                              minutes
                            }
                          >
                            {minutes} min
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="text-xs font-semibold text-slate-600">
                      Mode
                    </span>
                    <select
                      value={formMode}
                      onChange={(event) =>
                        setFormMode(
                          event.target
                            .value as AppointmentMode
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      {modes.map(
                        (item) => (
                          <option
                            key={
                              item.value
                            }
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  {formMode ===
                    "in_person" && (
                    <label>
                      <span className="text-xs font-semibold text-slate-600">
                        Location
                      </span>
                      <input
                        value={
                          formLocation
                        }
                        onChange={(
                          event
                        ) =>
                          setFormLocation(
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      />
                    </label>
                  )}

                  {formMode ===
                    "video" && (
                    <label>
                      <span className="text-xs font-semibold text-slate-600">
                        Meeting link
                      </span>
                      <input
                        value={
                          formMeetingUrl
                        }
                        onChange={(
                          event
                        ) =>
                          setFormMeetingUrl(
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      />
                    </label>
                  )}
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-cyan-900">
                    <input
                      type="checkbox"
                      checked={
                        formClientVisible
                      }
                      onChange={(
                        event
                      ) =>
                        setFormClientVisible(
                          event.target.checked
                        )
                      }
                    />
                    Show appointment to client
                  </label>

                  {formClientVisible && (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={
                          formClientMessage
                        }
                        onChange={(
                          event
                        ) =>
                          setFormClientMessage(
                            event.target.value
                          )
                        }
                        rows={3}
                        placeholder="Client-visible appointment message"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      />
                      <input
                        value={
                          formClientLink
                        }
                        onChange={(
                          event
                        ) =>
                          setFormClientLink(
                            event.target.value
                          )
                        }
                        placeholder="Optional client-visible link"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
                  Receptionist access deliberately excludes the clinician&apos;s private appointment note.
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormOpen(
                        false
                      );
                      clearForm();
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() =>
                      void saveAppointment()
                    }
                    className="rounded-xl bg-cyan-800 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {working
                      ? "Saving..."
                      : acceptingRequestId
                        ? "Accept & schedule"
                        : editingAppointmentId
                          ? "Save changes"
                          : "Create appointment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}
