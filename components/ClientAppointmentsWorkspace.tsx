"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type ClientAppointment = {
  id: string;
  clinician_id: string;
  clinician_name: string;
  title: string;
  appointment_type: string;
  status:
    | "scheduled"
    | "completed"
    | "cancelled"
    | "no_show";
  starts_at: string;
  ends_at: string;
  timezone: string;
  mode:
    | "in_person"
    | "video"
    | "phone";
  location: string;
  meeting_url: string;
  client_message: string;
  client_link: string;
  created_at: string;
  updated_at: string;
};

type AppointmentRequest = {
  id: string;
  connection_id: string;
  clinician_id: string;
  clinician_name: string;
  appointment_type: string;
  requested_start_at: string;
  requested_end_at: string;
  timezone: string;
  mode: string;
  client_message: string;
  clinician_response: string;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "cancelled";
  linked_appointment_id: string | null;
  requested_at: string;
  decided_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
};

type CurrentClinician = {
  connection_id: string;
  clinician_id: string;
  clinician_name: string;
  clinician_email: string;
  connected_at: string;
};

type AppointmentType =
  | "intake"
  | "therapy"
  | "assessment"
  | "review"
  | "consultation"
  | "other";

type AppointmentMode =
  | "in_person"
  | "video"
  | "phone";

const appointmentTypeOptions: Array<{
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

const modeOptions: Array<{
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

const durationOptions = [
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

function timeRangeLabel(
  start: string,
  end: string
) {
  const startsAt = new Date(start);
  const endsAt = new Date(end);

  const format = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  return `${format(startsAt)}–${format(
    endsAt
  )}`;
}

function modeLabel(value: string) {
  if (value === "in_person") {
    return "In person";
  }

  if (value === "video") {
    return "Video";
  }

  return "Phone";
}

function typeLabel(value: string) {
  return (
    appointmentTypeOptions.find(
      (option) =>
        option.value === value
    )?.label ||
    value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      )
  );
}

function statusLabel(value: string) {
  if (value === "no_show") {
    return "No show";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function statusClasses(value: string) {
  if (
    value === "completed" ||
    value === "accepted"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    value === "cancelled"
  ) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  if (
    value === "no_show" ||
    value === "rejected"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-cyan-200 bg-cyan-50 text-cyan-700";
}

function safeExternalUrl(value: string) {
  const clean = value.trim();

  if (!clean) {
    return "";
  }

  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }

  return `https://${clean}`;
}

export default function ClientAppointmentsWorkspace() {
  const now = new Date();

  const [appointments, setAppointments] =
    useState<ClientAppointment[]>([]);
  const [requests, setRequests] =
    useState<AppointmentRequest[]>([]);
  const [currentClinician, setCurrentClinician] =
    useState<CurrentClinician | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [visibleMonth, setVisibleMonth] =
    useState(startOfMonth(now));
  const [selectedDate, setSelectedDate] =
    useState(localDateKey(now));

  const [requestOpen, setRequestOpen] =
    useState(false);
  const [requestType, setRequestType] =
    useState<AppointmentType>(
      "therapy"
    );
  const [requestDate, setRequestDate] =
    useState(
      localDateKey(
        addDays(now, 1)
      )
    );
  const [requestTime, setRequestTime] =
    useState("10:00");
  const [requestDuration, setRequestDuration] =
    useState(50);
  const [requestMode, setRequestMode] =
    useState<AppointmentMode>(
      "in_person"
    );
  const [requestMessage, setRequestMessage] =
    useState("");

  const timezone = useMemo(
    () =>
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || "UTC",
    []
  );

  async function markNotificationsRead() {
    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_mark_appointment_notifications_read",
      {
        p_scope: "client",
      }
    );

    if (error) {
      console.error(
        "Could not mark appointment notifications read:",
        error
      );
    }
  }

  async function loadWorkspace() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const [
      appointmentsResult,
      requestsResult,
      cliniciansResult,
    ] = await Promise.all([
      supabase.rpc(
        "psylattice_my_appointments"
      ),
      supabase.rpc(
        "psylattice_my_appointment_requests"
      ),
      supabase.rpc(
        "psylattice_my_clinicians_and_permissions_v2"
      ),
    ]);

    if (appointmentsResult.error) {
      setErrorMessage(
        appointmentsResult.error.message ||
          "Your appointments could not be loaded."
      );
      setLoading(false);
      return;
    }

    if (requestsResult.error) {
      setErrorMessage(
        requestsResult.error.message ||
          "Your appointment requests could not be loaded."
      );
      setLoading(false);
      return;
    }

    if (cliniciansResult.error) {
      setErrorMessage(
        cliniciansResult.error.message ||
          "Your clinician connection could not be loaded."
      );
      setLoading(false);
      return;
    }

    setAppointments(
      (appointmentsResult.data ||
        []) as ClientAppointment[]
    );
    setRequests(
      (requestsResult.data ||
        []) as AppointmentRequest[]
    );

    const clinicians =
      (cliniciansResult.data ||
        []) as CurrentClinician[];

    setCurrentClinician(
      clinicians[0] || null
    );

    setLoading(false);
    void markNotificationsRead();
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

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

  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status ===
          "pending"
      ),
    [requests]
  );

  const nextAppointment =
    upcoming[0] || null;

  const proposedStart = useMemo(() => {
    const value = new Date(
      `${requestDate}T${requestTime}:00`
    );

    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;
  }, [
    requestDate,
    requestTime,
  ]);

  const proposedEnd = useMemo(() => {
    if (!proposedStart) {
      return null;
    }

    return new Date(
      proposedStart.getTime() +
        requestDuration * 60_000
    );
  }, [
    proposedStart,
    requestDuration,
  ]);

  function resetRequestForm() {
    const tomorrow = addDays(
      new Date(),
      1
    );

    setRequestType("therapy");
    setRequestDate(
      localDateKey(tomorrow)
    );
    setRequestTime("10:00");
    setRequestDuration(50);
    setRequestMode("in_person");
    setRequestMessage("");
  }

  async function submitRequest() {
    if (
      submitting ||
      !proposedStart ||
      !proposedEnd ||
      !currentClinician
    ) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_request_appointment",
      {
        p_appointment_type:
          requestType,
        p_requested_start_at:
          proposedStart.toISOString(),
        p_requested_end_at:
          proposedEnd.toISOString(),
        p_timezone: timezone,
        p_mode: requestMode,
        p_client_message:
          requestMessage.trim(),
      }
    );

    if (error) {
      setErrorMessage(
        error.message ||
          "Your appointment request could not be sent."
      );
      setSubmitting(false);
      return;
    }

    setSuccessMessage(
      `Request sent to ${currentClinician.clinician_name}.`
    );
    setRequestOpen(false);
    resetRequestForm();
    await loadWorkspace();
    setSubmitting(false);

    window.setTimeout(
      () => setSuccessMessage(""),
      2400
    );
  }

  async function cancelRequest(
    request: AppointmentRequest
  ) {
    const confirmed = window.confirm(
      "Cancel this appointment request?"
    );

    if (!confirmed) {
      return;
    }

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_cancel_my_appointment_request",
        {
          p_request_id:
            request.id,
        }
      );

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The appointment request could not be cancelled."
      );
      return;
    }

    setSuccessMessage(
      "Appointment request cancelled."
    );
    await loadWorkspace();
  }

  return (
    <div className="space-y-5">
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

      <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50/80 via-white to-white">
        <div className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Appointment requests
            </p>

            <h3 className="mt-2 text-lg font-semibold text-slate-950">
              Need another appointment?
            </h3>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Send your preferred date, time and session format to{" "}
              <strong className="font-semibold text-slate-700">
                {currentClinician?.clinician_name ||
                  "your clinician"}
              </strong>
              . The final appointment is confirmed only after the clinician accepts and schedules it.
            </p>
          </div>

          <button
            type="button"
            disabled={!currentClinician}
            onClick={() =>
              setRequestOpen(true)
            }
            className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Request appointment
          </button>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Next appointment
          </p>

          {nextAppointment ? (
            <>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {new Date(
                  nextAppointment.starts_at
                ).toLocaleDateString(
                  [],
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {timeRangeLabel(
                  nextAppointment.starts_at,
                  nextAppointment.ends_at
                )}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-500">
              None scheduled
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
            Upcoming
          </p>
          <p className="mt-2 text-2xl font-semibold text-cyan-950">
            {upcoming.length}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
            Pending requests
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-950">
            {pendingRequests.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Current clinician
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-800">
            {currentClinician?.clinician_name ||
              "Not connected"}
          </p>
          <p className="mt-1 truncate text-xs text-slate-400">
            {currentClinician?.clinician_email ||
              "Appointment requests require an active clinician connection."}
          </p>
        </div>
      </div>

      {requests.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-slate-900">
                Your appointment requests
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Track pending, accepted and declined requests.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadWorkspace()
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              Refresh
            </button>
          </div>

          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {requests
              .slice(0, 6)
              .map((request) => (
                <article
                  key={request.id}
                  className={`rounded-2xl border p-4 ${
                    request.status ===
                    "pending"
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {typeLabel(
                          request.appointment_type
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(
                          request.requested_start_at
                        ).toLocaleDateString(
                          [],
                          {
                            weekday:
                              "short",
                            month:
                              "short",
                            day:
                              "numeric",
                            year:
                              "numeric",
                          }
                        )}{" "}
                        ·{" "}
                        {timeRangeLabel(
                          request.requested_start_at,
                          request.requested_end_at
                        )}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${statusClasses(
                        request.status
                      )}`}
                    >
                      {statusLabel(
                        request.status
                      )}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">
                      {modeLabel(
                        request.mode
                      )}
                    </span>
                    <span className="rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-medium text-cyan-700">
                      {request.clinician_name}
                    </span>
                  </div>

                  {request.client_message && (
                    <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                      {request.client_message}
                    </p>
                  )}

                  {request.clinician_response && (
                    <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                        Clinician response
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-cyan-950">
                        {
                          request.clinician_response
                        }
                      </p>
                    </div>
                  )}

                  {request.status ===
                    "pending" && (
                    <button
                      type="button"
                      onClick={() =>
                        void cancelRequest(
                          request
                        )
                      }
                      className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-500"
                    >
                      Cancel request
                    </button>
                  )}
                </article>
              ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-slate-900">
                Appointment calendar
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Confirmed appointments are marked directly on the calendar.
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() => {
                  const date =
                    new Date();
                  setVisibleMonth(
                    startOfMonth(date)
                  );
                  setSelectedDate(
                    localDateKey(date)
                  );
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
              >
                Today
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
              >
                ›
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <h4 className="pb-4 text-xl font-semibold text-slate-900">
              {visibleMonth.toLocaleDateString(
                [],
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </h4>

            <div className="grid grid-cols-7 border-b border-l border-slate-100 text-center">
              {[
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun",
              ].map((day) => (
                <div
                  key={day}
                  className="border-r border-t border-slate-100 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map(
                (day) => {
                  const key =
                    localDateKey(day);
                  const inMonth =
                    day.getMonth() ===
                    visibleMonth.getMonth();
                  const selected =
                    key === selectedDate;
                  const dayAppointments =
                    appointments.filter(
                      (
                        appointment
                      ) =>
                        localDateKey(
                          new Date(
                            appointment.starts_at
                          )
                        ) === key &&
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
                      className={`min-h-[98px] border-r border-t border-slate-100 p-2 text-left transition ${
                        selected
                          ? "bg-cyan-50/70"
                          : "hover:bg-slate-50"
                      } ${
                        inMonth
                          ? ""
                          : "bg-slate-50/40 text-slate-300"
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
                        {dayAppointments
                          .slice(0, 2)
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
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {new Date(
                `${selectedDate}T12:00:00`
              ).toLocaleDateString(
                [],
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }
              )}
            </h3>
          </div>

          <div className="max-h-[680px] space-y-3 overflow-y-auto p-4">
            {loading ? (
              <p className="p-3 text-sm text-slate-400">
                Loading appointments...
              </p>
            ) : selectedDayAppointments.length ===
              0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No appointment on this day
                </p>
              </div>
            ) : (
              selectedDayAppointments.map(
                (appointment) => {
                  const primaryLink =
                    appointment.client_link ||
                    appointment.meeting_url;

                  return (
                    <article
                      key={appointment.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {
                              appointment.title
                            }
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {timeRangeLabel(
                              appointment.starts_at,
                              appointment.ends_at
                            )}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${statusClasses(
                            appointment.status
                          )}`}
                        >
                          {statusLabel(
                            appointment.status
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">
                          {typeLabel(
                            appointment.appointment_type
                          )}
                        </span>
                        <span className="rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-medium text-cyan-700">
                          {modeLabel(
                            appointment.mode
                          )}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        With{" "}
                        {
                          appointment.clinician_name
                        }
                      </p>

                      {appointment.location && (
                        <div className="mt-3 rounded-xl bg-slate-50 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Location
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            {
                              appointment.location
                            }
                          </p>
                        </div>
                      )}

                      {appointment.client_message && (
                        <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                            Message from clinician
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-cyan-950">
                            {
                              appointment.client_message
                            }
                          </p>
                        </div>
                      )}

                      {primaryLink && (
                        <a
                          href={safeExternalUrl(
                            primaryLink
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block rounded-xl bg-slate-950 px-4 py-2.5 text-center text-xs font-semibold text-white"
                        >
                          Open appointment link
                        </a>
                      )}
                    </article>
                  );
                }
              )
            )}
          </div>
        </aside>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900">
            Upcoming appointments
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Your next confirmed sessions in chronological order.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {upcoming.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No upcoming appointments
              </p>
            </div>
          ) : (
            upcoming.map(
              (appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => {
                    const date =
                      new Date(
                        appointment.starts_at
                      );
                    setSelectedDate(
                      localDateKey(date)
                    );
                    setVisibleMonth(
                      startOfMonth(date)
                    );
                  }}
                  className="grid w-full gap-3 p-4 text-left transition hover:bg-slate-50 sm:grid-cols-[160px_1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(
                        appointment.starts_at
                      ).toLocaleDateString(
                        [],
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {timeRangeLabel(
                        appointment.starts_at,
                        appointment.ends_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {appointment.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {typeLabel(
                        appointment.appointment_type
                      )}{" "}
                      ·{" "}
                      {modeLabel(
                        appointment.mode
                      )}
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold text-cyan-700">
                    Scheduled
                  </span>
                </button>
              )
            )
          )}
        </div>
      </section>

      {requestOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <p className="text-lg font-semibold text-slate-950">
                  Request an appointment
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  With{" "}
                  {currentClinician?.clinician_name ||
                    "your clinician"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRequestOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                <p className="text-xs leading-5 text-cyan-900">
                  You are requesting a preferred time. Your clinician can accept it as requested or adjust the final date, time, duration and appointment details before confirming.
                </p>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Appointment type
                </span>
                <select
                  value={requestType}
                  onChange={(event) =>
                    setRequestType(
                      event.target
                        .value as AppointmentType
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  {appointmentTypeOptions.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_130px]">
                <label>
                  <span className="text-xs font-semibold text-slate-600">
                    Preferred date
                  </span>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(event) =>
                      setRequestDate(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </label>

                <label>
                  <span className="text-xs font-semibold text-slate-600">
                    Preferred time
                  </span>
                  <input
                    type="time"
                    value={requestTime}
                    onChange={(event) =>
                      setRequestTime(
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
                    value={
                      requestDuration
                    }
                    onChange={(event) =>
                      setRequestDuration(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    {durationOptions.map(
                      (minutes) => (
                        <option
                          key={minutes}
                          value={minutes}
                        >
                          {minutes} min
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Preferred format
                </span>
                <select
                  value={requestMode}
                  onChange={(event) =>
                    setRequestMode(
                      event.target
                        .value as AppointmentMode
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  {modeOptions.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Message for your clinician
                </span>
                <textarea
                  value={requestMessage}
                  onChange={(event) =>
                    setRequestMessage(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Optional: explain the reason for the appointment, scheduling constraints or anything your clinician should know."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-cyan-700"
                />
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setRequestOpen(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    submitting ||
                    !requestDate ||
                    !requestTime
                  }
                  onClick={() =>
                    void submitRequest()
                  }
                  className="rounded-xl bg-cyan-800 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {submitting
                    ? "Sending..."
                    : "Send request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
