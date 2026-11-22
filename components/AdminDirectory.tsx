"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, X, XCircle } from "lucide-react";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [sendNotice, setSendNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  async function sendEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/directory-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, content, residentIds: selectedIds.length ? selectedIds : undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to send the email.");
      setSentCount(data.recipientCount);
      setSubject("");
      setContent("");
      setComposeOpen(false);
      setSendNotice({ type: "success", message: `Email sent to ${data.recipientCount} resident${data.recipientCount === 1 ? "" : "s"}.` });
      window.setTimeout(() => setSendNotice(null), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send the email.";
      setError(message);
      setSendNotice({ type: "error", message: "Email was not sent." });
      window.setTimeout(() => setSendNotice(null), 2000);
    } finally {
      setSending(false);
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
        <button type="button" disabled={selectedIds.length === 0} onClick={() => { setComposeOpen(true); setSentCount(null); }} className="rounded-full border border-marina/30 px-4 py-2 text-xs font-semibold tracking-wide text-marina transition hover:bg-marina/5 disabled:cursor-not-allowed disabled:opacity-40">
          EMAIL SELECTED{selectedIds.length ? ` (${selectedIds.length})` : ""}
        </button>
        <button type="button" onClick={() => { setSelectedIds([]); setComposeOpen(true); setSentCount(null); }} className="rounded-full border border-marina/30 px-4 py-2 text-xs font-semibold tracking-wide text-marina transition hover:bg-marina/5">
          EMAIL ALL
        </button>
        <span className="shrink-0 text-xs text-ink/50">
          {residents.filter((r) => r.listedInDirectory).length} listed of {residents.length}
        </span>
      </div>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      {sendNotice && (
        <div role="alert" aria-live="assertive" className={`fixed left-1/2 top-6 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border-2 px-5 py-4 text-base font-semibold shadow-2xl ${sendNotice.type === "success" ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-red-600 bg-red-50 text-red-950"}`}>
          {sendNotice.type === "success" ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" /> : <XCircle className="h-6 w-6 shrink-0 text-red-700" aria-hidden="true" />}
          {sendNotice.message}
        </div>
      )}

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

      {composeOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-deep-ocean/30 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-compose-email-title">
          <form onSubmit={sendEmail} className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <h2 id="admin-compose-email-title" className="font-display text-2xl text-ink">Email directory</h2>
            <p className="mt-1 text-sm text-ink/60">Sending via Zoho to {selectedIds.length ? `${selectedIds.length} selected resident${selectedIds.length === 1 ? "" : "s"}` : "all listed directory residents"} in Bcc.</p>
            <label className="mt-5 block text-sm font-semibold text-ink">Subject<input required value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 font-normal" /></label>
            <label className="mt-4 block text-sm font-semibold text-ink">Message<textarea required rows={8} value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 w-full resize-y rounded-lg border border-ink/15 px-3 py-2 font-normal" /></label>
            {sentCount !== null && <p className="mt-3 text-sm text-marina" role="status">Sent to {sentCount} residents.</p>}
            <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setComposeOpen(false)} className="rounded-lg px-4 py-2 text-sm text-ink/70 hover:bg-sand">Cancel</button><button type="submit" disabled={sending} className="rounded-lg bg-marina px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{sending ? "Sending…" : "Send email"}</button></div>
          </form>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="w-12 px-4 py-3" aria-label="Select residents"><span className="sr-only">Select</span></th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Directory</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={6}>Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={6}>No matches.</td></tr>
            )}
            {!loading &&
              filtered.map((r) => (
                <tr key={r._id} className="border-t border-ink/10">
                  <td className="px-4 py-3">{r.email && <input type="checkbox" checked={selectedIds.includes(r._id)} onChange={() => setSelectedIds((ids) => ids.includes(r._id) ? ids.filter((id) => id !== r._id) : [...ids, r._id])} className="h-4 w-4 accent-marina" aria-label={`Select ${r.fullName}`} />}</td>
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
