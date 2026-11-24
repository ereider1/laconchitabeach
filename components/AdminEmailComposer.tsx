"use client";

import { useState } from "react";
import { Mail, Search } from "lucide-react";

type Resident = { _id: string; fullName: string; address: string; email: string };

export default function AdminEmailComposer() {
  const [open, setOpen] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<"select" | "compose">("select");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function openComposer() {
    setOpen(true);
    setStep("select");
    setError(null);
    setNotice(null);
    if (residents.length > 0) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/residents");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load residents.");
      setResidents(data.residents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load residents.");
    } finally {
      setLoading(false);
    }
  }

  async function sendEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("subject", subject);
      formData.set("content", content);
      selectedIds.forEach((id) => formData.append("residentIds", id));
      attachments.forEach((file) => formData.append("attachments", file));
      const response = await fetch("/api/admin/directory-email", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to send the email.");
      setOpen(false);
      setSubject("");
      setContent("");
      setAttachments([]);
      setSelectedIds([]);
      setNotice(`Email sent to ${data.recipientCount} resident${data.recipientCount === 1 ? "" : "s"}.`);
      window.setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the email.");
    } finally {
      setSending(false);
    }
  }

  const filteredResidents = residents.filter((resident) => {
    const term = query.trim().toLowerCase();
    return !term || `${resident.fullName} ${resident.address} ${resident.email}`.toLowerCase().includes(term);
  });

  return (
    <>
      <button type="button" onClick={openComposer} className="inline-flex items-center gap-2 rounded-full bg-marina px-4 py-2 text-xs font-semibold tracking-wide text-fog transition hover:opacity-90">
        <Mail className="h-4 w-4" aria-hidden="true" /> Compose Email
      </button>
      {notice && <p role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-4 text-base font-semibold text-emerald-950 shadow-2xl">{notice}</p>}
      {open && <div className="fixed inset-0 z-40 grid place-items-center bg-deep-ocean/30 p-4" role="dialog" aria-modal="true" aria-labelledby="compose-admin-email-title">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h2 id="compose-admin-email-title" className="font-display text-2xl text-ink">Compose Email</h2><p className="mt-1 text-sm text-ink/60">Select residents to receive this message privately in Bcc.</p></div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-xl text-ink/50 hover:bg-sand" aria-label="Close compose window">×</button>
          </div>
          {step === "select" ? <>
            <div className="relative mt-5"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search residents…" className="w-full rounded-lg border border-ink/15 py-2 pl-9 pr-3 text-sm" /></div>
            {loading ? <p className="py-8 text-center text-sm text-ink/60">Loading residents…</p> : <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-ink/10">{filteredResidents.map((resident) => <label key={resident._id} className="flex cursor-pointer items-center gap-3 border-b border-ink/10 px-4 py-3 last:border-0 hover:bg-sand/30"><input type="checkbox" checked={selectedIds.includes(resident._id)} onChange={() => setSelectedIds((ids) => ids.includes(resident._id) ? ids.filter((id) => id !== resident._id) : [...ids, resident._id])} className="h-4 w-4 accent-marina" /><span className="min-w-0"><span className="block text-sm font-medium text-ink">{resident.fullName}</span><span className="block break-all text-xs text-ink/55">{resident.email}</span></span></label>)}</div>}
            {error && <p className="mt-3 text-sm text-coral" role="alert">{error}</p>}
            <div className="mt-5 flex justify-end"><button type="button" disabled={selectedIds.length === 0} onClick={() => { setStep("compose"); setError(null); }} className="rounded-lg bg-marina px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Continue with {selectedIds.length} resident{selectedIds.length === 1 ? "" : "s"}</button></div>
          </> : <form onSubmit={sendEmail}>
            <p className="mt-4 text-sm text-ink/60">Sending to {selectedIds.length} selected resident{selectedIds.length === 1 ? "" : "s"} in Bcc.</p>
            <label className="mt-5 block text-sm font-semibold text-ink">Subject<input required value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 font-normal" /></label>
            <label className="mt-4 block text-sm font-semibold text-ink">Message<textarea required rows={8} value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 w-full resize-y rounded-lg border border-ink/15 px-3 py-2 font-normal" /></label>
            <label className="mt-4 block text-sm font-semibold text-ink">Attachments <span className="font-normal text-ink/50">(up to 5 files, 10 MB total)</span><input type="file" multiple onChange={(event) => setAttachments(Array.from(event.target.files ?? []))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-normal" /></label>
            {attachments.length > 0 && <p className="mt-2 text-xs text-ink/60">{attachments.map((file) => file.name).join(", ")}</p>}
            {error && <p className="mt-3 text-sm text-coral" role="alert">{error}</p>}
            <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setStep("select")} className="rounded-lg px-4 py-2 text-sm text-ink/70 hover:bg-sand">Back</button><button type="submit" disabled={sending} className="rounded-lg bg-marina px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{sending ? "Sending…" : "Send email"}</button></div>
          </form>}
        </div>
      </div>}
    </>
  );
}
