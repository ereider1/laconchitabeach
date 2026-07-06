"use client";

import { useEffect, useState } from "react";

type Req = {
  _id: string;
  address: string;
  description: string;
  category: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
};

const statusColor: Record<Req["status"], string> = {
  open: "bg-coral/20 text-coral",
  "in-progress": "bg-dune/20 text-dune",
  resolved: "bg-green-100 text-green-700",
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ address: "", category: "other", description: "" });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/maintenance");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load requests");
      setRequests(data.requests);
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
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setForm({ address: "", category: "other", description: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Community Corner</h1>
      <p className="mt-2 text-ink/60">
        Report an issue with common areas, the beach path, or lighting.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-ink/10 p-5">
        <p className="font-display text-lg text-marina">New Post</p>
        <input
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Address or location (e.g. Beach path near Stair 3)"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="common-area">Common area</option>
            <option value="beach-access">Beach access</option>
            <option value="Lost & Found">Lost & Found</option>
            <option value="for sale">For Sale</option>
            <option value="looking for">Looking For</option>
            <option value="free">Free</option>
            <option value="other">Other</option>
          </select>
        </div>
        <textarea
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
          placeholder="Describe the issue"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-8 space-y-3">
        {loading && <p className="text-sm text-ink/60">Loading…</p>}
        {!loading && requests.length === 0 && !error && (
          <p className="text-sm text-ink/60">No requests yet.</p>
        )}
        {requests.map((r) => (
          <div key={r._id} className="flex items-start justify-between rounded-xl border border-ink/10 p-4">
            <div>
              <p className="font-medium text-ink">{r.address}</p>
              <p className="text-sm text-ink/70">{r.description}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-dune">{r.category}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[r.status]}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
