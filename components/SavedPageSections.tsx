"use client";

import { useState } from "react";
import { ChevronDown, Edit2, RotateCcw, Trash2 } from "lucide-react";
import type { PageBuilderSection } from "@/components/PageBuilderSectionSlot";
import PageSectionVisibilityToggle from "@/components/PageSectionVisibilityToggle";
import type { PageSectionSlot } from "@/lib/pageSectionSlots";

type Props = {
  sections: PageBuilderSection[];
  restoringSectionId: string | null;
  updatingVisibilitySectionId: string | null;
  defaultExpanded?: boolean;
  defaultSlot: PageSectionSlot;
  onRestore: (section: PageBuilderSection, slot: PageSectionSlot) => void;
  onVisibilityChange: (
    section: PageBuilderSection,
    visibility: "everyone" | "residents",
  ) => void;
  onEdit: (section: PageBuilderSection) => void;
  onDelete: (id: string, name: string) => void;
};

export default function SavedPageSections({
  sections,
  restoringSectionId,
  updatingVisibilitySectionId,
  defaultExpanded = false,
  defaultSlot,
  onRestore,
  onVisibilityChange,
  onEdit,
  onDelete,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section className="rounded-2xl border border-marina/20 bg-sand/30 p-4 sm:p-6" aria-labelledby="saved-sections-title">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="saved-sections-content"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-marina transition-transform ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
          <span>
          <span id="saved-sections-title" className="block text-sm font-bold uppercase tracking-wider text-marina">
            Saved Sections
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-ink/60">
            Inactive sections are kept here. Choose one to insert it at the selected page position.
          </span>
          </span>
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink/60">
          {sections.length} saved
        </span>
      </button>

      {isExpanded && (
        <div id="saved-sections-content" className="mt-4">
          {sections.length === 0 ? (
            <p className="rounded-xl border border-dashed border-marina/25 bg-white px-4 py-8 text-center text-xs text-ink/50">
              No inactive sections. Sections you set to Inactive will be saved here.
            </p>
          ) : (
            <div className="w-full space-y-3">
              {sections.map((section) => (
                <SavedSectionCard
                  key={section._id}
                  section={section}
                  isRestoring={restoringSectionId === section._id}
                  isUpdatingVisibility={updatingVisibilitySectionId === section._id}
                  defaultSlot={defaultSlot}
                  onRestore={onRestore}
                  onVisibilityChange={onVisibilityChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SavedSectionCard({
  section,
  isRestoring,
  isUpdatingVisibility,
  defaultSlot,
  onRestore,
  onVisibilityChange,
  onEdit,
  onDelete,
}: {
  section: PageBuilderSection;
  isRestoring: boolean;
  isUpdatingVisibility: boolean;
  defaultSlot: PageSectionSlot;
  onRestore: Props["onRestore"];
  onVisibilityChange: Props["onVisibilityChange"];
  onEdit: Props["onEdit"];
  onDelete: Props["onDelete"];
}) {
  return (
    <article className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-xs font-bold text-ink">{section.name}</h3>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink/50">
            {section.layout.replaceAll("-", " ")}
          </p>
          {section.title && <p className="mt-2 text-sm font-semibold text-ink/75">{section.title}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(section)}
            aria-label={`Edit saved section ${section.name}`}
            title="Edit section"
            className="grid h-9 w-9 place-items-center rounded-lg text-marina hover:bg-sand"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(section._id, section.name)}
            aria-label={`Delete saved section ${section.name}`}
            title="Delete section"
            className="grid h-9 w-9 place-items-center rounded-lg text-coral hover:bg-coral/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <PageSectionVisibilityToggle
          value={section.visibility}
          onChange={(visibility) => onVisibilityChange(section, visibility)}
          disabled={isUpdatingVisibility}
          label={`${section.name} audience`}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onRestore(section, defaultSlot)}
          disabled={isRestoring}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-marina px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-marina-light disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {isRestoring ? "Inserting..." : "Insert section"}
        </button>
      </div>
    </article>
  );
}
