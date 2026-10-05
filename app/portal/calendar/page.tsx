"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type EventItem = {
  _id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function PortalCalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const eventDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (selectedEvent && eventDialogRef.current && !eventDialogRef.current.open) {
      eventDialogRef.current.showModal();
    }
  }, [selectedEvent]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load events");
        setEvents(data.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const weeks = useMemo(() => {
    const firstOfMonth = startOfMonth(cursor);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + i);
      days.push(day);
    }

    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const key = new Date(e.startsAt).toDateString();
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const selectedEvents = selected ? eventsByDay.get(selected.toDateString()) ?? [] : [];
  const today = new Date();

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Calendar</h1>
      <p className="mt-2 text-ink/60">
        Select a date to see event times, locations, and descriptions.
      </p>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Prev
        </button>
        <h2 className="font-display text-xl text-ink">
          {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 hover:text-ink"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink/60">Loading…</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-ink/10">
          <div className="grid grid-cols-7 border-b border-ink/10 bg-fog">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center font-mono text-[11px] uppercase tracking-wider text-dune"
              >
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day) => {
                const inMonth = day.getMonth() === cursor.getMonth();
                const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
                const isToday = sameDay(day, today);
                const isSelected = selected && sameDay(day, selected);
                return (
                  <div
                    key={day.toISOString()}
                    className={`flex min-h-24 flex-col items-start gap-1 border-b border-r border-ink/10 p-2 text-left transition last:border-r-0 hover:bg-ink/5 ${
                      inMonth ? "bg-white" : "bg-fog/40"
                    } ${isSelected ? "ring-2 ring-inset ring-marina" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(day)}
                      aria-label={`Select ${day.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}`}
                      aria-pressed={Boolean(isSelected)}
                      className={`rounded-sm font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marina ${
                        isToday
                          ? "rounded-full bg-marina px-1.5 py-0.5 text-fog"
                          : inMonth
                          ? "text-ink/70"
                          : "text-ink/30"
                      }`}
                    >
                      {day.getDate()}
                    </button>
                    <div className="flex w-full flex-col gap-0.5">
                      {dayEvents.slice(0, 2).map((e) => (
                        <button
                          type="button"
                          key={e._id}
                          onClick={() => {
                            setSelected(day);
                            setSelectedEvent(e);
                          }}
                          aria-label={`View event details: ${e.title}`}
                          title={e.title}
                          className="w-full truncate rounded bg-sand px-1 py-0.5 text-left text-[11px] text-ink hover:bg-marina/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marina"
                        >
                          {e.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[11px] text-ink/50">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <section
          aria-labelledby="selected-day-heading"
          aria-live="polite"
          className="mt-6 rounded-xl border border-ink/10 p-5"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-dune">
            {selected.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h2 id="selected-day-heading" className="sr-only">
            Events for selected day
          </h2>
          {selectedEvents.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">No events this day.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {selectedEvents.map((e) => (
                <button
                  key={e._id}
                  type="button"
                  onClick={() => setSelectedEvent(e)}
                  aria-label={`View event details: ${e.title}`}
                  className="block w-full rounded-lg bg-fog/60 p-4 text-left transition hover:bg-fog focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marina"
                >
                  <h3 className="font-display text-xl text-ink">{e.title}</h3>
                  <p className="mt-1 text-sm text-ink/60">
                    <time dateTime={e.startsAt}>
                      {new Date(e.startsAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                    {" · "}
                    {e.location}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink/70">
                    {e.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <dialog
        ref={eventDialogRef}
        aria-labelledby="event-dialog-title"
        onClose={() => setSelectedEvent(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/60"
      >
        {selectedEvent && (
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-dune">
                  Event details
                </p>
                <h2 id="event-dialog-title" className="mt-2 font-display text-2xl text-ink">
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => eventDialogRef.current?.close()}
                aria-label="Close event details"
                className="shrink-0 rounded-full p-2 text-ink/60 transition hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marina"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-4 text-sm font-medium text-ink/70">
              {new Date(selectedEvent.startsAt).toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-2 text-sm text-ink/60">{selectedEvent.location}</p>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-ink/80">
              {selectedEvent.description}
            </p>
          </div>
        )}
      </dialog>
    </div>
  );
}
