"use client";

import { useEffect, useState } from "react";

type Announcement = {
  _id: string;
  title: string;
  body: string;
  category: "general" | "safety" | "maintenance" | "event";
  authorName: string;
  pinned: boolean;
  createdAt: string;
};

type EditableFields = {
  title: string;
  body: string;
  category: Announcement["category"];
  pinned: boolean;
};

function toEditableFields(a: Announcement): EditableFields {
  return { title: a.title, body: a.body, category: a.category, pinned: a.pinned };
}

const emptyNew: EditableFields = { title: "", body: "", category: "general", pinned: false };
const categories: Announcement["category"][] = ["general", "safety", "maintenance", "event"];

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState<EditableFields>(emptyNew);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load announcements");
      setItems(data.announcements);
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

  function startEdit(a: Announcement) {
    setEditingId(a._id);
    setDraft(toEditableFields(a));
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
      const res = await fetch("/api/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save changes");
      setItems((prev) => prev.map((a) => (a._id === id ? data.announcement : a)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete announcement");
      setItems((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post announcement");
      setItems((prev) => [data.announcement, ...prev]);
      setNewItem(emptyNew);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Announcements</h2>
      <p className="mt-1 text-sm text-ink/60">Post, edit, or remove community announcements.</p>

      <form onSubmit={addItem} className="mt-6 space-y-3 rounded-xl border border-ink/10 p-5">
        <p className="font-display text-lg text-marina">New announcement</p>
        <input
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Title"
          value={newItem.title}
          onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
          required
        />
        <textarea
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Body"
          rows={3}
          value={newItem.body}
          onChange={(e) => setNewItem({ ...newItem, body: e.target.value })}
          required
        />
        <div className="flex flex-wrap items-center gap-4">
          <select
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value as Announcement["category"] })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={newItem.pinned}
              onChange={(e) => setNewItem({ ...newItem, pinned: e.target.checked })}
            />
            Pin to top
          </label>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
        >
          {adding ? "Posting…" : "Post announcement"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-ink/50">Loading…</p>}
        {!loading && items.length === 0 && <p className="text-sm text-ink/50">No announcements yet.</p>}
        {!loading &&
          items.map((a) => {
            const isEditing = editingId === a._id;
            return (
              <div key={a._id} className="rounded-xl border border-ink/10 p-5">
                {isEditing && draft ? (
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    />
                    <textarea
                      className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                      rows={3}
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-4">
                      <select
                        className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                        value={draft.category}
                        onChange={(e) => setDraft({ ...draft, category: e.target.value as Announcement["category"] })}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-sm text-ink/70">
                        <input
                          type="checkbox"
                          checked={draft.pinned}
                          onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
                        />
                        Pinned
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(a._id)}
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
                        <p className="font-display text-lg text-ink">
                          {a.pinned && <span className="mr-2 text-coral">📌</span>}
                          {a.title}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-dune">
                          {a.category} · {a.authorName}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <button
                          onClick={() => startEdit(a)}
                          className="text-xs font-medium text-marina underline underline-offset-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(a._id)}
                          className="text-xs font-medium text-coral underline underline-offset-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-ink/70">{a.body}</p>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
