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
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
            <div key={e._id} className="rounded-xl border border-ink/10 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-dune">
                {new Date(e.startsAt).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <div className="mt-1 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl text-ink">{e.title}</h3>
                  <p className="text-sm text-ink/60">{e.location}</p>
                  <p className="mt-2 text-sm text-ink/70">{e.description}</p>
                </div>
                <button
                  onClick={() => toggleRsvp(e._id)}
                  disabled={pending === e._id}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                    going ? "bg-sand text-ink" : "bg-marina text-fog hover:bg-marina-light"
                  }`}
                >
                  {going && <Check className="h-4 w-4" aria-hidden="true" />}
                  {going ? "You're going" : "RSVP"}
                </button>
              </div>
              <p className="mt-3 text-xs text-ink/40">
                {e.rsvps.length} resident{e.rsvps.length === 1 ? "" : "s"} going
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
