"use client";

import { useEffect, useState } from "react";

type Event = {
  _id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  isPublic: boolean;
  rsvps: { clerkUserId: string; name: string; guests: number }[];
};

type EditableFields = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  isPublic: boolean;
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toEditableFields(e: Event): EditableFields {
  return {
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: toLocalInput(e.startsAt),
    isPublic: e.isPublic,
  };
}

const emptyNew: EditableFields = { title: "", description: "", location: "", startsAt: "", isPublic: false };

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [newEvent, setNewEvent] = useState<EditableFields>(emptyNew);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load events");
      setEvents(data.events);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(e: Event) {
    setEditingId(e._id);
    setDraft(toEditableFields(e));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...draft, startsAt: new Date(draft.startsAt).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save changes");
      setEvents((prev) =>
        prev.map((e) => (e._id === id ? data.event : e)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      );
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete event");
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvent, startsAt: new Date(newEvent.startsAt).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create event");
      setEvents((prev) => [...prev, data.event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setNewEvent(emptyNew);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Calendar & Events</h2>
      <p className="mt-1 text-sm text-ink/60">
        Create, edit, or cancel events. These power both the Calendar and Events & RSVPs
        pages.
      </p>

      <form onSubmit={addEvent} className="mt-6 space-y-3 rounded-xl border border-ink/10 p-5">
        <p className="font-display text-lg text-marina">New event</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Location"
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
            required
          />
          <input
            type="datetime-local"
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            value={newEvent.startsAt}
            onChange={(e) => setNewEvent({ ...newEvent, startsAt: e.target.value })}
            required
          />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={newEvent.isPublic}
              onChange={(e) => setNewEvent({ ...newEvent, isPublic: e.target.checked })}
            />
            Visible to the public site
          </label>
        </div>
        <textarea
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Description"
          rows={2}
          value={newEvent.description}
          onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          required
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
        >
          {adding ? "Creating…" : "Create event"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-ink/50">Loading…</p>}
        {!loading && events.length === 0 && <p className="text-sm text-ink/50">No events yet.</p>}
        {!loading &&
          events.map((e) => {
            const isEditing = editingId === e._id;
            return (
              <div key={e._id} className="rounded-xl border border-ink/10 p-5">
                {isEditing && draft ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                        value={draft.title}
                        onChange={(ev) => setDraft({ ...draft, title: ev.target.value })}
                      />
                      <input
                        className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                        value={draft.location}
                        onChange={(ev) => setDraft({ ...draft, location: ev.target.value })}
                      />
                      <input
                        type="datetime-local"
                        className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                        value={draft.startsAt}
                        onChange={(ev) => setDraft({ ...draft, startsAt: ev.target.value })}
                      />
                      <label className="flex items-center gap-2 text-sm text-ink/70">
                        <input
                          type="checkbox"
                          checked={draft.isPublic}
                          onChange={(ev) => setDraft({ ...draft, isPublic: ev.target.checked })}
                        />
                        Visible to the public site
                      </label>
                    </div>
                    <textarea
                      className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                      rows={2}
                      value={draft.description}
                      onChange={(ev) => setDraft({ ...draft, description: ev.target.value })}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(e._id)}
                        disabled={saving}
                        className="rounded-full bg-marina px-3 py-1 text-xs font-semibold text-fog disabled:opacity-50"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink/70"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-lg text-ink">{e.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-dune">
                          {new Date(e.startsAt).toLocaleString()} · {e.location}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <button
                          onClick={() => startEdit(e)}
                          className="text-xs font-medium text-marina underline underline-offset-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(e._id)}
                          className="text-xs font-medium text-coral underline underline-offset-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-ink/70">{e.description}</p>
                    <p className="mt-2 text-xs text-ink/50">
                      {e.rsvps.length} RSVP{e.rsvps.length === 1 ? "" : "s"}
                      {e.isPublic ? " · Public" : ""}
                    </p>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
