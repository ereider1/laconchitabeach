"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

type Announcement = {
  _id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  authorName: string;
  createdAt: string;
};

export default function AnnouncementsPage() {
  const { user } = useUser();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "general", pinned: false });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load announcements");
      setAnnouncements(data.announcements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post");
      setForm({ title: "", body: "", category: "general", pinned: false });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPosting(false);
    }
  }

  const isAdminUser = Boolean(
    user?.publicMetadata?.role === "admin" || process.env.NEXT_PUBLIC_SHOW_ADMIN_FORMS === "true"
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Announcements</h1>
      <p className="mt-2 text-ink/60">Board updates, closures, and safety notices.</p>

      {isAdminUser && (
        <form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-ink/10 p-5">
          <p className="font-display text-lg text-marina">Post an announcement</p>
          <input
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
            placeholder="Details"
            rows={3}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
          <div className="flex items-center gap-4">
            <select
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="general">General</option>
              <option value="safety">Safety</option>
              <option value="maintenance">Maintenance</option>
              <option value="event">Event</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              Pin to top
            </label>
            <button
              type="submit"
              disabled={posting}
              className="ml-auto rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
            >
              {posting ? "Posting…" : "Post announcement"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-8 space-y-4">
        {loading && <p className="text-sm text-ink/60">Loading…</p>}
        {!loading && announcements.length === 0 && !error && (
          <p className="text-sm text-ink/60">No announcements yet.</p>
        )}
        {announcements.map((a) => (
          <div key={a._id} className="rounded-xl border border-ink/10 p-5">
            <div className="flex items-center gap-2">
              {a.pinned && <span className="text-xs font-semibold text-coral">PINNED</span>}
              <span className="text-xs uppercase tracking-wider text-dune">{a.category}</span>
            </div>
            <h3 className="mt-1 font-display text-xl text-ink">{a.title}</h3>
            <p className="mt-2 text-sm text-ink/70">{a.body}</p>
            <p className="mt-3 text-xs text-ink/40">
              {a.authorName} &middot; {new Date(a.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
