"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

type Props = {
  label: string;
  url: string;
  onSave: (label: string, url: string) => void;
  className?: string;
};

export default function InlineEditableLink({ label, url, onSave, className = "" }: Props) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [draftLabel, setDraftLabel] = useState(label);
  const [draftUrl, setDraftUrl] = useState(url);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function openEditor() {
    setDraftLabel(label);
    setDraftUrl(url);
    setOpen(true);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draftLabel, draftUrl);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Edit link: ${label}`}
        onClick={openEditor}
        className={`group/link rounded-md text-left outline-none transition hover:bg-marina/[0.08] focus-visible:ring-2 focus-visible:ring-marina ${className}`}
      >
        {label || <span className="italic opacity-60">Add link label</span>}
        <span className="ml-2 inline-flex rounded-full bg-white px-2 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wider text-marina opacity-0 shadow-sm transition group-hover/link:opacity-100 group-focus-visible/link:opacity-100">
          Edit link
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-ocean/65 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <h2 id={titleId} className="text-lg font-bold text-ink">
              Edit button or link
            </h2>
            <p className="mt-1 text-sm text-ink/60">Update its visible label and destination.</p>
            <form onSubmit={save} className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-ink">
                Label
                <input
                  autoFocus
                  type="text"
                  value={draftLabel}
                  onChange={(event) => setDraftLabel(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-marina/25 px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-marina focus:ring-2 focus:ring-marina/15"
                />
              </label>
              <label className="block text-xs font-bold text-ink">
                URL
                <input
                  type="text"
                  value={draftUrl}
                  onChange={(event) => setDraftUrl(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-marina/25 px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-marina focus:ring-2 focus:ring-marina/15"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-10 rounded-full border border-ink/15 px-4 text-xs font-bold text-ink/70 hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 rounded-full bg-marina px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-marina-light"
                >
                  Apply
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
