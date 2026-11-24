"use client";

import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";

export type AdminEmailMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  dateTime: string;
  isOutbound?: boolean;
  recipients?: string[];
  replies: {
    body: string;
    sentAt: string;
    dateTime: string;
    attachments?: { filename: string; contentType: string; size: number }[];
  }[];
};

export default function AdminEmailMessages({
  initialMessages,
}: {
  initialMessages: AdminEmailMessage[];
}) {
  const [messages, setMessages] = useState(
    initialMessages.map((message) => ({ ...message, replies: message.replies ?? [] }))
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [trashing, setTrashing] = useState(false);

  const visibleMessages = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return messages;
    return messages.filter((message) => `${message.subject} ${message.name} ${message.email} ${message.message}`.toLowerCase().includes(term));
  }, [messages, query]);
  const allVisibleSelected = visibleMessages.length > 0 && visibleMessages.every((message) => selectedIds.includes(message.id));

  async function moveSelectedToTrash() {
    if (selectedIds.length === 0 || !confirm(`Move ${selectedIds.length} email${selectedIds.length === 1 ? "" : "s"} to trash?`)) return;
    setTrashing(true);
    try {
      await Promise.all(selectedIds.map(async (id) => {
        const response = await fetch(`/api/admin/emails?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Unable to move selected emails to trash.");
      }));
      setMessages((current) => current.filter((message) => !selectedIds.includes(message.id)));
      setSelectedIds([]);
      setSuccess("Selected emails moved to trash.");
    } catch (trashError) {
      setError(trashError instanceof Error ? trashError.message : "Unable to move emails to trash.");
    } finally {
      setTrashing(false);
    }
  }

  async function sendReply(message: AdminEmailMessage) {
    const reply = replyText.trim();
    if (!reply) {
      setError("Write a response before sending.");
      return;
    }

    setSendingId(message.id);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.set("id", message.id);
      formData.set("reply", reply);
      replyAttachments.forEach((file) => formData.append("attachments", file));
      const response = await fetch("/api/admin/emails", {
        method: "POST",
        body: formData,
      });
      const result: { error?: string; reply?: AdminEmailMessage["replies"][number] } =
        await response.json();
      const sentReply = result.reply;
      if (!response.ok || !sentReply) {
        throw new Error(result.error ?? "Failed to send response.");
      }

      setMessages((currentMessages) =>
        currentMessages.map((currentMessage) =>
          currentMessage.id === message.id
            ? { ...currentMessage, replies: [...currentMessage.replies, sentReply] }
            : currentMessage
        )
      );
      setReplyingId(null);
      setReplyText("");
      setReplyAttachments([]);
      setSuccess(`Response sent to ${message.email}.`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Something went wrong.");
    } finally {
      setSendingId(null);
    }
  }

  async function removeMessage(id: string) {
    if (!confirm("Delete this message? This cannot be undone.")) return;

    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/emails?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed to delete message.");

      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  if (messages.length === 0) {
    return (
      <>
        {error && <p role="alert" className="mb-4 text-sm text-coral">{error}</p>}
        {success && <p role="status" className="mb-4 text-sm text-marina">{success}</p>}
        <p className="rounded-2xl bg-sand/55 px-5 py-8 text-sm text-ink/60">
          No contact form messages yet.
        </p>
      </>
    );
  }

  return (
    <>
      {error && <p role="alert" className="mb-4 text-sm text-coral">{error}</p>}
      {success && <p role="status" className="mb-4 text-sm text-marina">{success}</p>}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-sand/25 p-3 sm:flex-row sm:items-center">
        <label className="flex shrink-0 items-center gap-2 px-1 text-sm font-medium text-ink/70"><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedIds((ids) => allVisibleSelected ? ids.filter((id) => !visibleMessages.some((message) => message.id === id)) : [...new Set([...ids, ...visibleMessages.map((message) => message.id)])])} className="h-4 w-4 accent-marina" aria-label="Select all visible emails" /> Select all</label>
        <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search emails…" className="w-full rounded-lg border border-ink/15 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm" /></div>
        <button type="button" disabled={selectedIds.length === 0 || trashing} onClick={() => void moveSelectedToTrash()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-coral/30 px-4 py-2 text-sm font-semibold text-coral hover:bg-coral/10 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" aria-hidden="true" /> Move to trash{selectedIds.length ? ` (${selectedIds.length})` : ""}</button>
      </div>
      {visibleMessages.length === 0 && <p className="rounded-2xl bg-sand/55 px-5 py-8 text-sm text-ink/60">No emails match your search.</p>}
      <ul className="space-y-4">
        {visibleMessages.map((message) => (
          <li
            key={message.id}
            className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <input type="checkbox" checked={selectedIds.includes(message.id)} onChange={() => setSelectedIds((ids) => ids.includes(message.id) ? ids.filter((id) => id !== message.id) : [...ids, message.id])} className="mt-1 h-4 w-4 shrink-0 accent-marina" aria-label={`Select ${message.subject}`} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg text-ink">{message.subject}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider ${message.isOutbound ? "bg-marina/10 text-marina" : "bg-sand text-ink/60"}`}>
                    {message.isOutbound ? "Resident email" : "Web form"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/70">
                  {message.name} ·{" "}
                  {message.isOutbound ? message.email : <a
                    href={`mailto:${message.email}`}
                    className="text-marina underline underline-offset-2"
                  >
                    {message.email}
                  </a>}
                </p>
                {message.isOutbound && (
                  <p className="mt-2 max-w-3xl break-words text-xs leading-5 text-ink/60">
                    <span className="font-semibold text-ink/75">Bcc recipients:</span>{" "}
                    {message.recipients?.length ? message.recipients.join(", ") : message.email}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                <div className="text-right">
                  <span className="block text-xs font-semibold text-marina">{message.isOutbound ? "Sent" : "Received"}</span>
                  <time dateTime={message.dateTime} className="text-xs text-ink/50">
                    {message.createdAt}
                  </time>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setReplyText("");
                    setReplyingId((currentId) => currentId === message.id ? null : message.id);
                  }}
                  disabled={sendingId !== null}
                  className="rounded-full border border-marina/30 px-3 py-1.5 text-xs font-semibold text-marina transition hover:bg-sand/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {replyingId === message.id ? "Cancel" : "Respond"}
                </button>
                <button
                  type="button"
                  onClick={() => removeMessage(message.id)}
                  disabled={deletingId !== null}
                  className="rounded-full border border-coral/30 px-3 py-1.5 text-xs font-semibold text-coral transition hover:bg-coral/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === message.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-sand/30 px-4 py-3">
              <p className="whitespace-pre-wrap text-sm leading-7 text-ink/85">
              {message.message}
              </p>
            </div>
            {message.replies.length > 0 && (
              <ol className="mt-4 space-y-3 border-l-2 border-marina/20 pl-4">
                {message.replies.map((reply, index) => (
                  <li key={`${reply.dateTime}-${index}`} className="rounded-xl bg-sand/40 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-marina">Sent</span>
                      <time dateTime={reply.dateTime} className="text-xs text-ink/50">
                        {reply.sentAt}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-ink/80">
                      {reply.body}
                    </p>
                    {reply.attachments?.length ? <p className="mt-2 text-xs text-ink/60">Attachments: {reply.attachments.map((attachment) => attachment.filename).join(", ")}</p> : null}
                  </li>
                ))}
              </ol>
            )}
            {replyingId === message.id && (
              <div className="mt-5 border-t border-ink/10 pt-4">
                <label
                  htmlFor={`reply-${message.id}`}
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  Response to {message.name} ({message.email})
                </label>
                <textarea
                  id={`reply-${message.id}`}
                  rows={5}
                  maxLength={10000}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Write your response…"
                  className="w-full resize-y rounded-xl border border-marina/20 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-marina focus:ring-1 focus:ring-marina"
                  disabled={sendingId === message.id}
                />
                <label className="mt-3 block text-sm font-semibold text-ink">Attachments <span className="font-normal text-ink/50">(up to 5 files, 10 MB total)</span><input type="file" multiple onChange={(event) => setReplyAttachments(Array.from(event.target.files ?? []))} className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-normal" disabled={sendingId === message.id} /></label>
                {replyAttachments.length > 0 && <p className="mt-2 text-xs text-ink/60">{replyAttachments.map((file) => file.name).join(", ")}</p>}
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingId(null);
                      setReplyText("");
                      setReplyAttachments([]);
                    }}
                    disabled={sendingId === message.id}
                    className="rounded-full border border-marina/30 px-4 py-2 text-xs font-semibold text-marina transition hover:bg-sand/50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => sendReply(message)}
                    disabled={sendingId === message.id || !replyText.trim()}
                    className="rounded-full bg-marina px-4 py-2 text-xs font-semibold text-white transition hover:bg-marina-light disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingId === message.id ? "Sending…" : "Send Response"}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
