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
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
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
  const [loading, setLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [visibleMonth, setVisibleMonth] =
    useState(startOfMonth(now));
  const [selectedDate, setSelectedDate] =
    useState(localDateKey(now));

  async function loadAppointments() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_my_appointments"
      );

    if (error) {
      console.error(
        "Could not load client appointments:",
        error
      );
      setErrorMessage(
        error.message ||
          "Your appointments could not be loaded."
      );
      setLoading(false);
      return;
    }

    setAppointments(
      (data || []) as ClientAppointment[]
    );
    setLoading(false);
  }

  useEffect(() => {
    void loadAppointments();
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

  const nextAppointment =
    upcoming[0] || null;

  return (
    <div className="space-y-5">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Your calendar
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            Clinician-scheduled appointments
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Private clinician notes are never shown here.
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-slate-900">
                Appointment calendar
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Upcoming appointments are marked directly on the calendar.
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
                  const today =
                    new Date();
                  setVisibleMonth(
                    startOfMonth(today)
                  );
                  setSelectedDate(
                    localDateKey(today)
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
                        ) === key
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
                                  "scheduled"
                                    ? "bg-cyan-100/80 text-cyan-900"
                                    : appointment.status ===
                                        "completed"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : appointment.status ===
                                          "no_show"
                                        ? "bg-red-50 text-red-700"
                                        : "bg-slate-100 text-slate-500"
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

                      {appointment.client_link &&
                        appointment.meeting_url &&
                        appointment.client_link !==
                          appointment.meeting_url && (
                          <a
                            href={safeExternalUrl(
                              appointment.meeting_url
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block rounded-xl border border-slate-200 px-4 py-2.5 text-center text-xs font-semibold text-slate-600"
                          >
                            Open video meeting
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
            Your next clinician-scheduled sessions in chronological order.
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
                      {
                        appointment.clinician_name
                      }{" "}
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
    </div>
  );
}
