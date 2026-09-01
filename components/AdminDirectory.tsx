"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

type Resident = {
  _id: string;
  fullName: string;
  address: string;
  email: string;
  phone?: string;
  listedInDirectory: boolean;
};

export default function AdminDirectory() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/residents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load directory");
      setResidents(data.residents);
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

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyEmails() {
    const emails = filtered.map((resident) => resident.email.trim()).filter(Boolean);
    if (emails.length === 0) {
      setError("There are no email addresses to copy.");
      return;
    }

    try {
      if (!navigator.clipboard) throw new Error("Clipboard access is unavailable");
      await navigator.clipboard.writeText(emails.join("\n"));
      setError(null);
      setCopied(true);
    } catch {
      setError("Unable to copy email addresses. Check your browser permissions and try again.");
    }
  }

  async function toggleListed(r: Resident) {
    setTogglingId(r._id);
    setError(null);
    try {
      const res = await fetch("/api/admin/residents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r._id, listedInDirectory: !r.listedInDirectory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update visibility");
      setResidents((prev) => prev.map((x) => (x._id === r._id ? data.resident : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTogglingId(null);
    }
  }

  const filtered = residents.filter((r) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      r.fullName.toLowerCase().includes(term) ||
      r.address.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <h2 className="font-display text-xl text-ink">Directory</h2>
      <p className="mt-1 text-sm text-ink/60">
        See who&apos;s currently listed in the resident directory and toggle visibility.
        For full editing (name, address, contact info), use Profiles.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <input
          className="w-full max-w-sm flex-1 rounded-lg border border-ink/15 px-4 py-2 text-sm"
          placeholder="Search residents…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void copyEmails()}
          className="rounded-full bg-marina px-4 py-2 text-xs font-semibold tracking-wide text-fog transition hover:opacity-90"
        >
          COPY EMAILS
        </button>
        <span className="shrink-0 text-xs text-ink/50">
          {residents.filter((r) => r.listedInDirectory).length} listed of {residents.length}
        </span>
      </div>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      {copied && (
        <div
          role="status"
          className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg bg-emerald-600 px-4 py-3 text-fog shadow-lg"
        >
          <Check aria-hidden="true" className="h-5 w-5 rounded-full bg-fog p-0.5 text-emerald-600" />
          <span className="text-sm font-medium">Copied to clipboard</span>
          <span aria-hidden="true" className="h-7 w-px bg-fog/25" />
          <button
            type="button"
            aria-label="Dismiss copied message"
            onClick={() => setCopied(false)}
            className="text-fog/90 transition hover:text-fog"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Directory</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={5}>Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={5}>No matches.</td></tr>
            )}
            {!loading &&
              filtered.map((r) => (
                <tr key={r._id} className="border-t border-ink/10">
                  <td className="px-4 py-3 font-medium text-ink">{r.fullName}</td>
                  <td className="px-4 py-3 text-ink/70">{r.address}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.phone ?? ""}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleListed(r)}
                      disabled={togglingId === r._id}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                        r.listedInDirectory
                          ? "bg-marina/10 text-marina"
                          : "bg-ink/5 text-ink/50"
                      }`}
                    >
                      {togglingId === r._id ? "Saving…" : r.listedInDirectory ? "Listed" : "Hidden"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
