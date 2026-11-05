"use client";

import { Eye, UsersRound } from "lucide-react";
import type { PageSectionVisibility } from "@/lib/pageSectionVisibility";

type Props = {
  value?: PageSectionVisibility;
  onChange: (visibility: "everyone" | "residents") => void;
  disabled?: boolean;
  label?: string;
};

export default function PageSectionVisibilityToggle({
  value = "everyone",
  onChange,
  disabled = false,
  label = "Section audience",
}: Props) {
  const isResidentsOnly = value === "residents";

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex min-h-9 items-center rounded-full border border-marina/20 bg-sand/45 p-0.5"
    >
      <button
        type="button"
        onClick={() => onChange("everyone")}
        disabled={disabled}
        aria-pressed={!isResidentsOnly}
        className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full px-3 text-[9px] font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60 ${
          !isResidentsOnly
            ? "bg-white text-marina shadow-sm"
            : "text-ink/55 hover:text-ink"
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
        Public
      </button>
      <button
        type="button"
        onClick={() => onChange("residents")}
        disabled={disabled}
        aria-pressed={isResidentsOnly}
        className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full px-3 text-[9px] font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isResidentsOnly
            ? "bg-white text-marina shadow-sm"
            : "text-ink/55 hover:text-ink"
        }`}
      >
        <UsersRound className="h-3.5 w-3.5" />
        Residents Only
      </button>
    </div>
  );
}
