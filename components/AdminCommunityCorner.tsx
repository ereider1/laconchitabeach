"use client";

import { useEffect, useState } from "react";

type Post = {
  _id: string;
  submittedByName: string;
  address: string;
  category:
    | "common-area"
    | "beach-access"
    | "landscaping"
    | "lighting"
    | "Lost & Found"
    | "for sale"
    | "looking for"
    | "free"
    | "other";
  description: string;
  status: "open" | "in-progress" | "resolved";
};

type EditableFields = {
  address: string;
  category: Post["category"];
  description: string;
  status: Post["status"];
};

function toEditableFields(p: Post): EditableFields {
  return { address: p.address, category: p.category, description: p.description, status: p.status };
}

const categories: Post["category"][] = [
  "common-area",
  "beach-access",
  "landscaping",
  "lighting",
  "Lost & Found",
  "for sale",
  "looking for",
  "free",
  "other",
];
const statuses: Post["status"][] = ["open", "in-progress", "resolved"];

export default function AdminCommunityCorner() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/maintenance");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load posts");
      setPosts(data.requests);
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

  function startEdit(p: Post) {
    setEditingId(p._id);
    setDraft(toEditableFields(p));
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
      const res = await fetch("/api/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save changes");
      setPosts((prev) => prev.map((p) => (p._id === id ? data.request : p)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/maintenance?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete post");
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Community Corner</h2>
      <p className="mt-1 text-sm text-ink/60">
        Manage bulletin-board posts — maintenance requests, lost &amp; found, for sale, and
        more.
      </p>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-ink/50">Loading…</p>}
        {!loading && posts.length === 0 && <p className="text-sm text-ink/50">No posts yet.</p>}
        {!loading &&
          posts.map((p) => {
            const isEditing = editingId === p._id;
            return (
              <div key={p._id} className="rounded-xl border border-ink/10 p-5">
                {isEditing && draft ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                        placeholder="Address"
                        value={draft.address}
                        onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                      />
                      <select
                        className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                        value={draft.category}
                        onChange={(e) => setDraft({ ...draft, category: e.target.value as Post["category"] })}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <select
                        className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
                        value={draft.status}
                        onChange={(e) => setDraft({ ...draft, status: e.target.value as Post["status"] })}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                      rows={2}
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(p._id)}
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
                        <p className="text-xs uppercase tracking-wider text-dune">
                          {p.category} · {p.address}
                        </p>
                        <p className="mt-1 text-sm text-ink/50">Posted by {p.submittedByName}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            p.status === "resolved"
                              ? "bg-marina/10 text-marina"
                              : p.status === "in-progress"
                                ? "bg-coral/10 text-coral"
                                : "bg-ink/5 text-ink/50"
                          }`}
                        >
                          {p.status}
                        </span>
                        <button
                          onClick={() => startEdit(p)}
                          className="text-xs font-medium text-marina underline underline-offset-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(p._id)}
                          className="text-xs font-medium text-coral underline underline-offset-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-ink/70">{p.description}</p>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
