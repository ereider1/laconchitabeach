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
  const [error, setError] = useState<string | null>(null);

  async function removeMessage(id: string) {
    if (!confirm("Delete this message? This cannot be undone.")) return;

    setDeletingId(id);
    setError(null);
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
        <p className="rounded-2xl bg-sand/55 px-5 py-8 text-sm text-ink/60">
          No contact form messages yet.
        </p>
      </>
    );
  }

  return (
    <>
      {error && <p role="alert" className="mb-4 text-sm text-coral">{error}</p>}
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
              <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                <time dateTime={message.dateTime} className="text-xs text-ink/50">
                  {message.createdAt}
                </time>
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
          </li>
        ))}
      </ul>
    </>
  );
}
