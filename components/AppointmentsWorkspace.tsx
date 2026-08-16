"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import ReceptionistAccessManager from "./ReceptionistAccessManager";
type AppointmentClient = {
  connection_id: string;
  client_id: string;
  client_name: string;
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

type ClinicalAppointment = {
  id: string;
  clinician_id: string;
  client_id: string;
  connection_id: string | null;
  title: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  starts_at: string;
  ends_at: string;
  timezone: string;
  mode: AppointmentMode;
  location: string;
  meeting_url: string;
  client_visible: boolean;
  client_message: string;
  client_link: string;
  private_notes: string;
  created_at: string;
  updated_at: string;
};

type AppointmentRequest = {
  id: string;
  connection_id: string;
  clinician_id: string;
  client_id: string;
  client_name: string;
  appointment_type: AppointmentType;
  requested_start_at: string;
  requested_end_at: string;
  timezone: string;
  mode: AppointmentMode;
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

const appointmentTypeOptions: Array<{
  value: AppointmentType;
  label: string;
}> = [
  { value: "intake", label: "Intake" },
  { value: "therapy", label: "Therapy / session" },
  { value: "assessment", label: "Assessment" },
  { value: "review", label: "Review" },
  { value: "consultation", label: "Consultation" },
  { value: "other", label: "Other" },
];

const statusOptions: Array<{
  value: AppointmentStatus;
  label: string;
}> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

const modeOptions: Array<{
  value: AppointmentMode;
  label: string;
}> = [
  { value: "in_person", label: "In person" },
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

  // Monday-first calendar.
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

function appointmentTypeLabel(
  value: AppointmentType
) {
  return (
    appointmentTypeOptions.find(
      (option) =>
        option.value === value
    )?.label || value
  );
}

function statusLabel(
  value: AppointmentStatus
) {
  return (
    statusOptions.find(
      (option) =>
        option.value === value
    )?.label || value
  );
}

function modeLabel(
  value: AppointmentMode
) {
  return (
    modeOptions.find(
      (option) =>
        option.value === value
    )?.label || value
  );
}

function statusTone(
  value: AppointmentStatus
) {
  if (value === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "cancelled") {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  if (value === "no_show") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-cyan-200 bg-cyan-50 text-cyan-700";
}

function dateTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function timeRangeLabel(
  start: string,
  end: string
) {
  const startsAt = new Date(start);
  const endsAt = new Date(end);

  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime())
  ) {
    return "";
  }

  const format = (
    date: Date
  ) =>
    date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  return `${format(startsAt)}–${format(
    endsAt
  )}`;
}

function durationMinutes(
  start: string,
  end: string
) {
  const startsAt = new Date(start);
  const endsAt = new Date(end);

  return Math.max(
    1,
    Math.round(
      (endsAt.getTime() -
        startsAt.getTime()) /
        60_000
    )
  );
}

export default function AppointmentsWorkspace({
  client,
}: {
  client: AppointmentClient;
}) {
  const today = new Date();

  const [appointments, setAppointments] =
    useState<ClinicalAppointment[]>([]);
  const [requests, setRequests] =
    useState<AppointmentRequest[]>([]);
  const [
    requestResponses,
    setRequestResponses,
  ] = useState<Record<string, string>>({});
  const [
    acceptingRequestId,
    setAcceptingRequestId,
  ] = useState("");
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [message, setMessage] =
    useState("");

  const [visibleMonth, setVisibleMonth] =
    useState(
      startOfMonth(today)
    );
  const [selectedDate, setSelectedDate] =
    useState(localDateKey(today));

  const [formOpen, setFormOpen] =
    useState(false);
  const [
    editingAppointmentId,
    setEditingAppointmentId,
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
    useState(localDateKey(today));
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
  const [formPrivateNotes, setFormPrivateNotes] =
    useState("");

  const timezone = useMemo(
    () =>
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || "UTC",
    []
  );

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

  const upcomingAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            (appointment) =>
              appointment.status ===
                "scheduled" &&
              new Date(
                appointment.ends_at
              ).getTime() >=
                Date.now()
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

  const nextAppointment =
    upcomingAppointments[0] || null;

  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status === "pending"
      ),
    [requests]
  );

  const currentMonthKey =
    `${visibleMonth.getFullYear()}-${pad(
      visibleMonth.getMonth() + 1
    )}`;

  const monthAppointments =
    appointments.filter(
      (appointment) =>
        localDateKey(
          new Date(
            appointment.starts_at
          )
        ).startsWith(
          currentMonthKey
        ) &&
        appointment.status !==
          "cancelled"
    );

  const completedThisMonth =
    monthAppointments.filter(
      (appointment) =>
        appointment.status ===
        "completed"
    ).length;

  async function loadAppointments() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("clinical_appointments")
      .select(
        "id, clinician_id, client_id, connection_id, title, appointment_type, status, starts_at, ends_at, timezone, mode, location, meeting_url, client_visible, client_message, client_link, private_notes, created_at, updated_at"
      )
      .eq("client_id", client.client_id)
      .order("starts_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Could not load appointments:",
        error
      );
      setErrorMessage(
        error.message ||
          "Appointments could not be loaded."
      );
      setLoading(false);
      return;
    }

    setAppointments(
      (data || []) as ClinicalAppointment[]
    );
    setLoading(false);
  }

  async function loadRequests() {
    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_clinician_appointment_requests",
        {
          p_client_id:
            client.client_id,
        }
      );

    if (error) {
      console.error(
        "Could not load appointment requests:",
        error
      );
      setErrorMessage(
        error.message ||
          "Appointment requests could not be loaded."
      );
      return;
    }

    setRequests(
      (data || []) as AppointmentRequest[]
    );
  }

  async function markAppointmentNotificationsRead() {
    const supabase = createClient();

    const { error } =
      await supabase.rpc(
        "psylattice_mark_appointment_notifications_read",
        {
          p_scope: "clinician",
        }
      );

    if (error) {
      console.error(
        "Could not mark appointment notifications read:",
        error
      );
    }
  }

  useEffect(() => {
    setSelectedDate(
      localDateKey(new Date())
    );
    setVisibleMonth(
      startOfMonth(new Date())
    );
    setFormOpen(false);
    setEditingAppointmentId("");
    setAcceptingRequestId("");
    void Promise.all([
      loadAppointments(),
      loadRequests(),
    ]);
    void markAppointmentNotificationsRead();
  }, [
    client.client_id,
    client.connection_id,
  ]);

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
    setFormPrivateNotes("");
  }

  function openCreateForm(
    date = selectedDate
  ) {
    clearForm();
    setFormDate(date);
    setFormOpen(true);
    setErrorMessage("");
  }

  function openEditForm(
    appointment: ClinicalAppointment
  ) {
    const startsAt = new Date(
      appointment.starts_at
    );

    setEditingAppointmentId(
      appointment.id
    );
    setFormTitle(
      appointment.title
    );
    setFormType(
      appointment.appointment_type
    );
    setFormStatus(
      appointment.status
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
      appointment.mode
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
    setFormPrivateNotes(
      appointment.private_notes
    );
    setFormOpen(true);
    setErrorMessage("");
  }

  function openRequestForm(
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
      appointmentTypeLabel(
        request.appointment_type
      )
    );
    setFormType(
      request.appointment_type
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
    setFormMode(request.mode);
    setFormClientVisible(true);
    setFormClientMessage("");
    setFormOpen(true);
    setErrorMessage("");
  }

  const proposedStart = useMemo(() => {
    const value = new Date(
      `${formDate}T${formTime}:00`
    );

    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;
  }, [formDate, formTime]);

  const proposedEnd = useMemo(() => {
    if (!proposedStart) {
      return null;
    }

    return new Date(
      proposedStart.getTime() +
        formDuration * 60_000
    );
  }, [
    proposedStart,
    formDuration,
  ]);

  const overlapWarning = useMemo(() => {
    if (
      !proposedStart ||
      !proposedEnd ||
      formStatus !== "scheduled"
    ) {
      return null;
    }

    return (
      appointments.find(
        (appointment) => {
          if (
            appointment.id ===
              editingAppointmentId ||
            appointment.status !==
              "scheduled"
          ) {
            return false;
          }

          const existingStart =
            new Date(
              appointment.starts_at
            ).getTime();

          const existingEnd =
            new Date(
              appointment.ends_at
            ).getTime();

          return (
            proposedStart.getTime() <
              existingEnd &&
            proposedEnd.getTime() >
              existingStart
          );
        }
      ) || null
    );
  }, [
    appointments,
    proposedStart,
    proposedEnd,
    editingAppointmentId,
    formStatus,
  ]);

  async function saveAppointment() {
    if (
      saving ||
      !proposedStart ||
      !proposedEnd
    ) {
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
        "The appointment could not be saved."
      );
      setSaving(false);
      return;
    }

    const title =
      formTitle.trim() ||
      appointmentTypeLabel(
        formType
      );

    const payload = {
      clinician_id: user.id,
      client_id: client.client_id,
      connection_id:
        client.connection_id,
      title,
      appointment_type: formType,
      status: formStatus,
      starts_at:
        proposedStart.toISOString(),
      ends_at:
        proposedEnd.toISOString(),
      timezone,
      mode: formMode,
      location:
        formMode === "in_person"
          ? formLocation.trim()
          : "",
      meeting_url:
        formMode === "video"
          ? formMeetingUrl.trim()
          : "",
      client_visible:
        formClientVisible,
      client_message:
        formClientMessage.trim(),
      client_link:
        formClientLink.trim(),
      private_notes:
        formPrivateNotes.trim(),
    };

    if (acceptingRequestId) {
      const { error } =
        await supabase.rpc(
          "psylattice_accept_appointment_request",
          {
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
            p_private_notes:
              formPrivateNotes.trim(),
          }
        );

      if (error) {
        setErrorMessage(
          error.message ||
            "The appointment request could not be accepted."
        );
        setSaving(false);
        return;
      }

      setMessage(
        "Request accepted and appointment scheduled."
      );
      setFormOpen(false);
      setAcceptingRequestId("");
      setSaving(false);

      await Promise.all([
        loadAppointments(),
        loadRequests(),
      ]);

      window.setTimeout(
        () => setMessage(""),
        2200
      );
      return;
    }

    if (editingAppointmentId) {
      const { data, error } =
        await supabase
          .from(
            "clinical_appointments"
          )
          .update(payload)
          .eq(
            "id",
            editingAppointmentId
          )
          .select(
            "id, clinician_id, client_id, connection_id, title, appointment_type, status, starts_at, ends_at, timezone, mode, location, meeting_url, client_visible, client_message, client_link, private_notes, created_at, updated_at"
          )
          .single();

      if (error || !data) {
        setErrorMessage(
          error?.message ||
            "The appointment could not be updated."
        );
        setSaving(false);
        return;
      }

      const saved =
        data as ClinicalAppointment;

      setAppointments((current) =>
        current
          .map((appointment) =>
            appointment.id ===
            saved.id
              ? saved
              : appointment
          )
          .sort(
            (a, b) =>
              new Date(
                a.starts_at
              ).getTime() -
              new Date(
                b.starts_at
              ).getTime()
          )
      );

      setSelectedDate(
        localDateKey(
          new Date(
            saved.starts_at
          )
        )
      );
      setVisibleMonth(
        startOfMonth(
          new Date(
            saved.starts_at
          )
        )
      );
      setMessage(
        "Appointment updated."
      );
    } else {
      const { data, error } =
        await supabase
          .from(
            "clinical_appointments"
          )
          .insert(payload)
          .select(
            "id, clinician_id, client_id, connection_id, title, appointment_type, status, starts_at, ends_at, timezone, mode, location, meeting_url, client_visible, client_message, client_link, private_notes, created_at, updated_at"
          )
          .single();

      if (error || !data) {
        setErrorMessage(
          error?.message ||
            "The appointment could not be created."
        );
        setSaving(false);
        return;
      }

      const created =
        data as ClinicalAppointment;

      setAppointments((current) =>
        [...current, created].sort(
          (a, b) =>
            new Date(
              a.starts_at
            ).getTime() -
            new Date(
              b.starts_at
            ).getTime()
        )
      );

      setSelectedDate(
        localDateKey(
          new Date(
            created.starts_at
          )
        )
      );
      setVisibleMonth(
        startOfMonth(
          new Date(
            created.starts_at
          )
        )
      );
      setMessage(
        "Appointment created."
      );
    }

    setFormOpen(false);
    setEditingAppointmentId("");
    setSaving(false);

    window.setTimeout(
      () => setMessage(""),
      1800
    );
  }

  async function updateStatus(
    appointment: ClinicalAppointment,
    status: AppointmentStatus
  ) {
    const supabase = createClient();

    const { data, error } =
      await supabase
        .from("clinical_appointments")
        .update({ status })
        .eq("id", appointment.id)
        .select(
          "id, clinician_id, client_id, connection_id, title, appointment_type, status, starts_at, ends_at, timezone, mode, location, meeting_url, client_visible, client_message, client_link, private_notes, created_at, updated_at"
        )
        .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The appointment status could not be changed."
      );
      return;
    }

    setAppointments((current) =>
      current.map((candidate) =>
        candidate.id ===
        appointment.id
          ? (data as ClinicalAppointment)
          : candidate
      )
    );
  }

  async function deleteAppointment(
    appointment: ClinicalAppointment
  ) {
    const confirmed = window.confirm(
      `Permanently delete "${appointment.title}"?`
    );

    if (!confirmed) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("clinical_appointments")
      .delete()
      .eq("id", appointment.id);

    if (error) {
      setErrorMessage(
        error.message ||
          "The appointment could not be deleted."
      );
      return;
    }

    setAppointments((current) =>
      current.filter(
        (candidate) =>
          candidate.id !==
          appointment.id
      )
    );

    if (
      editingAppointmentId ===
      appointment.id
    ) {
      setFormOpen(false);
      setEditingAppointmentId("");
    }
  }

  async function rejectRequest(
    request: AppointmentRequest
  ) {
    const confirmed = window.confirm(
      `Reject ${request.client_name}'s appointment request?`
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_reject_appointment_request",
        {
          p_request_id:
            request.id,
          p_response:
            requestResponses[
              request.id
            ]?.trim() || "",
        }
      );

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The appointment request could not be rejected."
      );
      return;
    }

    setMessage(
      "Appointment request rejected."
    );
    await loadRequests();

    window.setTimeout(
      () => setMessage(""),
      1800
    );
  }


  return (
    <div className="space-y-5">
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

      {/* APPOINTMENT REQUESTS */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-amber-50/60 via-white to-white p-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">
                Appointment requests
              </h3>

              {pendingRequests.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                  {pendingRequests.length} pending
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Review requests from {client.client_name}. Accepting a request opens the normal appointment editor so you can adjust the final date, time, duration and other details before confirming.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadRequests()
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Refresh requests
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No appointment requests
            </p>
            <p className="mt-1 text-xs text-slate-400">
              New client requests will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {requests
              .slice(0, 8)
              .map((request) => (
                <article
                  key={request.id}
                  className={`rounded-2xl border p-4 ${
                    request.status ===
                    "pending"
                      ? "border-amber-200 bg-amber-50/35"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {appointmentTypeLabel(
                          request.appointment_type
                        )}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500">
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
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${
                        request.status ===
                        "pending"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : request.status ===
                              "accepted"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : request.status ===
                                "rejected"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      {request.status
                        .replaceAll(
                          "_",
                          " "
                        )
                        .replace(
                          /\b\w/g,
                          (char) =>
                            char.toUpperCase()
                        )}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-medium text-cyan-700">
                      {modeLabel(
                        request.mode
                      )}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">
                      Requested{" "}
                      {new Date(
                        request.requested_at
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  {request.client_message && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Client message
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                        {
                          request.client_message
                        }
                      </p>
                    </div>
                  )}

                  {request.status ===
                    "pending" && (
                    <>
                      <label className="mt-3 block">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Optional response if declining
                        </span>
                        <textarea
                          value={
                            requestResponses[
                              request.id
                            ] || ""
                          }
                          onChange={(
                            event
                          ) =>
                            setRequestResponses(
                              (
                                current
                              ) => ({
                                ...current,
                                [request.id]:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          rows={2}
                          placeholder="e.g. I am unavailable at this time. Please request another slot."
                          className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 outline-none focus:border-cyan-700"
                        />
                      </label>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openRequestForm(
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
                    </>
                  )}

                  {request.clinician_response && (
                    <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                        Response sent
                      </p>
                      <p className="mt-1 text-xs leading-5 text-cyan-950">
                        {
                          request.clinician_response
                        }
                      </p>
                    </div>
                  )}
                </article>
              ))}
          </div>
        )}
      </section>

      {/* SUMMARY */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Next appointment
          </p>
          {nextAppointment ? (
            <>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {dateTimeLabel(
                  nextAppointment.starts_at
                )}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {nextAppointment.title}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-500">
              None scheduled
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
            Upcoming
          </p>
          <p className="mt-2 text-2xl font-semibold text-cyan-950">
            {upcomingAppointments.length}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Completed this month
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">
            {completedThisMonth}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Timezone
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-800">
            {timezone}
          </p>
        </div>
      </div>

      {/* CALENDAR + AGENDA */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-slate-900">
                Calendar
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose a date to view or schedule appointments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                  const now = new Date();
                  setVisibleMonth(
                    startOfMonth(now)
                  );
                  setSelectedDate(
                    localDateKey(now)
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

              <button
                type="button"
                onClick={() =>
                  openCreateForm()
                }
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white"
              >
                + Appointment
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-4">
              <h4 className="text-xl font-semibold text-slate-900">
                {visibleMonth.toLocaleDateString(
                  [],
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}
              </h4>
            </div>

            <div className="grid grid-cols-7">
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
                  className="px-1 pb-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map(
                (day) => {
                  const key =
                    localDateKey(day);

                  const isCurrentMonth =
                    day.getMonth() ===
                    visibleMonth.getMonth();

                  const isToday =
                    key ===
                    localDateKey(
                      new Date()
                    );

                  const isSelected =
                    key === selectedDate;

                  const dayAppointments =
                    appointments.filter(
                      (appointment) =>
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
                      onClick={() => {
                        setSelectedDate(
                          key
                        );
                      }}
                      onDoubleClick={() => {
                        setSelectedDate(
                          key
                        );
                        openCreateForm(key);
                      }}
                      className={`relative min-h-[92px] border border-slate-100 p-2 text-left transition sm:min-h-[108px] ${
                        isSelected
                          ? "z-10 border-cyan-300 bg-cyan-50/60"
                          : "hover:bg-slate-50"
                      } ${
                        isCurrentMonth
                          ? ""
                          : "bg-slate-50/40 text-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? "bg-slate-950 font-semibold text-white"
                            : isSelected
                              ? "font-semibold text-cyan-900"
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
                                className={`truncate rounded-md px-1.5 py-1 text-[9px] font-medium ${
                                  appointment.status ===
                                  "completed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : appointment.status ===
                                        "no_show"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-cyan-100/70 text-cyan-900"
                                }`}
                              >
                                {new Date(
                                  appointment.starts_at
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "numeric",
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

                        {dayAppointments.length >
                          2 && (
                          <p className="text-[9px] font-medium text-slate-400">
                            +
                            {dayAppointments.length -
                              2}{" "}
                            more
                          </p>
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <p className="mt-3 text-[10px] text-slate-400">
              Tip: double-click a date to create an appointment on that day.
            </p>
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

            <button
              type="button"
              onClick={() =>
                openCreateForm(
                  selectedDate
                )
              }
              className="mt-4 w-full rounded-xl bg-cyan-800 px-4 py-2.5 text-xs font-semibold text-white"
            >
              + Add on this day
            </button>
          </div>

          <div className="max-h-[640px] space-y-3 overflow-y-auto p-4">
            {loading ? (
              <p className="p-3 text-sm text-slate-400">
                Loading appointments...
              </p>
            ) : selectedDayAppointments.length ===
              0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No appointments
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  This day is currently free for this client.
                </p>
              </div>
            ) : (
              selectedDayAppointments.map(
                (appointment) => (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            appointment.title
                          }
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {timeRangeLabel(
                            appointment.starts_at,
                            appointment.ends_at
                          )}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold ${statusTone(
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
                        {appointmentTypeLabel(
                          appointment.appointment_type
                        )}
                      </span>
                      <span className="rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-medium text-cyan-700">
                        {modeLabel(
                          appointment.mode
                        )}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-medium ${
                          appointment.client_visible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {appointment.client_visible
                          ? "Visible to client"
                          : "Clinician only"}
                      </span>
                    </div>

                    {appointment.mode ===
                      "in_person" &&
                      appointment.location && (
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          Location:{" "}
                          {
                            appointment.location
                          }
                        </p>
                      )}

                    {appointment.mode ===
                      "video" &&
                      appointment.meeting_url && (
                        <a
                          href={
                            appointment.meeting_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block truncate text-xs font-medium text-cyan-700 underline"
                        >
                          {
                            appointment.meeting_url
                          }
                        </a>
                      )}

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            appointment
                          )
                        }
                        className="rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-semibold text-slate-600"
                      >
                        Edit
                      </button>

                      {appointment.status ===
                        "scheduled" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(
                                appointment,
                                "completed"
                              )
                            }
                            className="rounded-lg border border-emerald-200 px-2.5 py-2 text-[10px] font-semibold text-emerald-700"
                          >
                            Complete
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(
                                appointment,
                                "no_show"
                              )
                            }
                            className="rounded-lg border border-red-200 px-2.5 py-2 text-[10px] font-semibold text-red-600"
                          >
                            No show
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(
                                appointment,
                                "cancelled"
                              )
                            }
                            className="rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-semibold text-slate-500"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                )
              )
            )}
          </div>
        </aside>
      </div>

      {/* UPCOMING */}
      <section className="rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900">
            Upcoming appointments
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Future scheduled appointments for this client.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {upcomingAppointments.length ===
          0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No upcoming appointments
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Create an appointment from the calendar.
              </p>
            </div>
          ) : (
            upcomingAppointments
              .slice(0, 8)
              .map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => {
                    const date = new Date(
                      appointment.starts_at
                    );
                    setSelectedDate(
                      localDateKey(date)
                    );
                    setVisibleMonth(
                      startOfMonth(date)
                    );
                    openEditForm(
                      appointment
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
                      {appointmentTypeLabel(
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
              ))
          )}
        </div>
      </section>

      <ReceptionistAccessManager />

      {/* CREATE / EDIT MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <p className="text-lg font-semibold text-slate-950">
                  {editingAppointmentId
                    ? "Edit appointment"
                    : acceptingRequestId
                      ? "Accept request & schedule"
                      : "New appointment"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {client.client_name}
                  {acceptingRequestId
                    ? " · Adjust the requested slot before confirming"
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setEditingAppointmentId(
                    ""
                  );
                  setAcceptingRequestId(
                    ""
                  );
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5">
              {overlapWarning && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-800">
                    Scheduling overlap
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    This overlaps with{" "}
                    <strong>
                      {
                        overlapWarning.title
                      }
                    </strong>{" "}
                    at{" "}
                    {timeRangeLabel(
                      overlapWarning.starts_at,
                      overlapWarning.ends_at
                    )}
                    . You can still save it if intentional.
                  </p>
                </div>
              )}

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Appointment title
                </span>
                <input
                  value={formTitle}
                  onChange={(event) =>
                    setFormTitle(
                      event.target.value
                    )
                  }
                  placeholder={appointmentTypeLabel(
                    formType
                  )}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
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

                <label>
                  <span className="text-xs font-semibold text-slate-600">
                    Status
                  </span>
                  <select
                    value={formStatus}
                    onChange={(event) =>
                      setFormStatus(
                        event.target
                          .value as AppointmentStatus
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    {statusOptions.map(
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
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_150px]">
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

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-semibold text-slate-600">
                    Session mode
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

                {formMode ===
                  "in_person" && (
                  <label>
                    <span className="text-xs font-semibold text-slate-600">
                      Location
                    </span>
                    <input
                      value={formLocation}
                      onChange={(
                        event
                      ) =>
                        setFormLocation(
                          event.target
                            .value
                        )
                      }
                      placeholder="Clinic / room / address"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>
                )}

                {formMode === "video" && (
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
                          event.target
                            .value
                        )
                      }
                      placeholder="https://..."
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>
                )}

                {formMode === "phone" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Phone session. Contact details remain managed separately from this private appointment record.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-cyan-950">
                      Client-visible appointment information
                    </p>
                    <p className="mt-1 text-xs leading-5 text-cyan-900/70">
                      The client can see the appointment on their PsyLattice calendar. Only the fields in this section, plus the basic appointment details, are shared.
                    </p>
                  </div>

                  <label className="flex shrink-0 items-center gap-2 rounded-xl border border-cyan-100 bg-white px-3 py-2 text-xs font-semibold text-cyan-900">
                    <input
                      type="checkbox"
                      checked={formClientVisible}
                      onChange={(event) =>
                        setFormClientVisible(
                          event.target.checked
                        )
                      }
                    />
                    Show to client
                  </label>
                </div>

                {formClientVisible && (
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">
                        Message for client
                      </span>
                      <textarea
                        value={formClientMessage}
                        onChange={(event) =>
                          setFormClientMessage(
                            event.target.value
                          )
                        }
                        rows={3}
                        placeholder="e.g. Please bring your completed sleep diary, or arrive 10 minutes early."
                        className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-cyan-700"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">
                        Client-visible link
                      </span>
                      <input
                        value={formClientLink}
                        onChange={(event) =>
                          setFormClientLink(
                            event.target.value
                          )
                        }
                        placeholder="https://..."
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
                      />
                      <p className="mt-1 text-[10px] text-slate-400">
                        Optional: use this for preparation material, forms, directions or another appointment resource.
                      </p>
                    </label>
                  </div>
                )}
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Private clinician note
                </span>
                <textarea
                  value={
                    formPrivateNotes
                  }
                  onChange={(event) =>
                    setFormPrivateNotes(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Optional preparation note, agenda, or scheduling context. Not shared with the client."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-cyan-700"
                />
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Local timezone
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {timezone}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <div>
                  {editingAppointmentId && (
                    <button
                      type="button"
                      onClick={() => {
                        const appointment =
                          appointments.find(
                            (
                              candidate
                            ) =>
                              candidate.id ===
                              editingAppointmentId
                          );

                        if (
                          appointment
                        ) {
                          void deleteAppointment(
                            appointment
                          );
                        }
                      }}
                      className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600"
                    >
                      Delete appointment
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormOpen(false);
                      setEditingAppointmentId(
                        ""
                      );
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      saving ||
                      !formDate ||
                      !formTime
                    }
                    onClick={() =>
                      void saveAppointment()
                    }
                    className="rounded-xl bg-cyan-800 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {saving
                      ? "Saving..."
                      : editingAppointmentId
                        ? "Save changes"
                        : acceptingRequestId
                          ? "Accept & schedule"
                          : "Create appointment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
