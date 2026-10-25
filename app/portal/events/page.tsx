"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Check } from "lucide-react";

type EventItem = {
  _id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  rsvps: { clerkUserId: string; name: string; guests: number }[];
};

export default function PortalEventsPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load events");
      setEvents(data.events.filter((event: EventItem) => new Date(event.startsAt) >= new Date()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (loading) return;

    const eventId = window.location.hash.slice(1);
    if (!eventId) return;

    document.getElementById(eventId)?.scrollIntoView({ block: "center" });
  }, [events, loading]);

  async function toggleRsvp(eventId: string) {
    setPending(eventId);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to RSVP");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Events &amp; RSVPs</h1>
      <p className="mt-2 text-ink/60">HOA meetings and community gatherings.</p>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-8 space-y-4">
        {loading && <p className="text-sm text-ink/60">Loading…</p>}
        {!loading && events.length === 0 && !error && (
          <p className="text-sm text-ink/60">No upcoming events.</p>
        )}
        {events.map((e) => {
          const going = e.rsvps.some((r) => r.clerkUserId === user?.id);
          return (
            <div
              key={e._id}
              id={`event-${e._id}`}
              className="scroll-mt-8 rounded-xl border border-ink/10 p-4 sm:p-5"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-dune sm:text-lg sm:tracking-wider">
                {new Date(e.startsAt).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <div className="mt-2 flex flex-col items-stretch gap-4 sm:mt-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="break-words font-display text-xl leading-tight text-ink">{e.title}</h3>
                  <p className="text-sm text-ink/60">{e.location}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{e.description}</p>
                </div>
                <button
                  onClick={() => toggleRsvp(e._id)}
                  disabled={pending === e._id}
                  className={`inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 sm:w-auto sm:px-4 sm:py-2 ${
                    going ? "bg-sand text-ink" : "bg-marina text-fog hover:bg-marina-light"
                  }`}
                >
                  {going && <Check className="h-4 w-4" aria-hidden="true" />}
                  {going ? "You're going" : "RSVP"}
                </button>
              </div>
              <p className="mt-3 text-sm font-semibold text-marina/80">
                {e.rsvps.length} <span className="font-normal">resident{e.rsvps.length === 1 ? "" : "s"} going</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
