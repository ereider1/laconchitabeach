"use client";

import { useState, type FormEvent } from "react";

const emptyForm = { name: "", email: "", subject: "", message: "" };

export default function ContactForm() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result: { message?: string; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to send your message.");
      }

      setForm(emptyForm);
      setFeedback({
        kind: "success",
        message: result.message ?? "Your message has been sent.",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to send your message.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <h2 className="font-display text-xl text-ink">Send a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-ink/75">
          Your name
          <input
            className="w-full rounded-lg border border-ink/15 px-3 py-2"
            name="name"
            autoComplete="name"
            maxLength={100}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink/75">
          Email address
          <input
            className="w-full rounded-lg border border-ink/15 px-3 py-2"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
      </div>
      <label className="block space-y-1 text-sm font-medium text-ink/75">
        Subject
        <input
          className="w-full rounded-lg border border-ink/15 px-3 py-2"
          name="subject"
          maxLength={150}
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
          required
        />
      </label>
      <label className="block space-y-1 text-sm font-medium text-ink/75">
        Message
        <textarea
          className="w-full rounded-lg border border-ink/15 px-3 py-2"
          name="message"
          rows={5}
          maxLength={5000}
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          required
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-marina px-5 py-2 text-sm font-semibold text-fog disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
      {feedback && (
        <p
          className={`text-sm ${feedback.kind === "success" ? "text-green-700" : "text-coral"}`}
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      )}
    </form>
  );
}
