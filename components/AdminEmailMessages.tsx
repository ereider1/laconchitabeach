"use client";

import { useState } from "react";

export type AdminEmailMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  dateTime: string;
};

export default function AdminEmailMessages({
  initialMessages,
}: {
  initialMessages: AdminEmailMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: message.id, reply }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed to send response.");

      setReplyingId(null);
      setReplyText("");
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
      <ul className="space-y-4">
        {messages.map((message) => (
          <li
            key={message.id}
            className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h3 className="font-display text-lg text-ink">{message.subject}</h3>
                <p className="mt-1 text-sm text-ink/70">
                  {message.name} ·{" "}
                  <a
                    href={`mailto:${message.email}`}
                    className="text-marina underline underline-offset-2"
                  >
                    {message.email}
                  </a>
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                <time dateTime={message.dateTime} className="text-xs text-ink/50">
                  {message.createdAt}
                </time>
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
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink/80">
              {message.message}
            </p>
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
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingId(null);
                      setReplyText("");
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
