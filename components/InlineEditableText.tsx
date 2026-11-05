"use client";

import { useRef, useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  textAlign?: "left" | "center";
  multiline?: boolean;
  rows?: number;
};

export default function InlineEditableText({
  label,
  value,
  onChange,
  className = "",
  textAlign = "left",
  multiline = false,
  rows = 3,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const initialValue = useRef(value);
  const cancelled = useRef(false);

  function startEditing() {
    cancelled.current = false;
    initialValue.current = value;
    setDraft(value);
    setEditing(true);
  }

  function cancelEditing() {
    cancelled.current = true;
    setDraft(initialValue.current);
    onChange(initialValue.current);
    setEditing(false);
  }

  function commitEditing() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    onChange(draft);
    setEditing(false);
  }

  const fieldClassName =
    "w-full rounded-lg border border-marina/50 bg-white px-3 py-2 font-[inherit] text-inherit shadow-sm outline-none focus:ring-2 focus:ring-marina/25 !text-deep-ocean";
  const alignmentClassName = textAlign === "center" ? "text-center" : "text-left";

  if (editing) {
    const sharedProps = {
      "aria-label": label,
      autoFocus: true,
      className: `${fieldClassName} ${className}`,
      onBlur: commitEditing,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDraft(event.target.value);
        onChange(event.target.value);
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelEditing();
        }
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      },
      value: draft,
    };

    return multiline ? (
      <textarea {...sharedProps} rows={rows} />
    ) : (
      <input {...sharedProps} type="text" />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      onClick={startEditing}
      className={`group relative rounded-md ${alignmentClassName} outline-none transition hover:bg-marina/[0.06] focus-visible:ring-2 focus-visible:ring-marina ${className}`}
    >
      {value || <span className="italic text-ink/40">Click to add {label.toLowerCase()}</span>}
      <span className="ml-2 inline-flex rounded-full bg-white px-2 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wider text-marina opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
        Edit
      </span>
    </button>
  );
}
