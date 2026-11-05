"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import InlineEditableLink from "@/components/InlineEditableLink";
import InlineEditableText from "@/components/InlineEditableText";
import PageSectionVisibilityToggle from "@/components/PageSectionVisibilityToggle";
import { isImageCollectionLayout } from "@/lib/pageSectionLayouts";
import type { PageSectionLayout } from "@/lib/pageSectionLayouts";
import type { PageSectionSlot } from "@/lib/pageSectionSlots";
import type { PageSectionVisibility } from "@/lib/pageSectionVisibility";

export type PageBuilderSection = {
  _id: string;
  name: string;
  slot: PageSectionSlot;
  layout: PageSectionLayout;
  eyebrow?: string;
  title?: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  buttonText?: string;
  buttonLink?: string;
  visibility?: PageSectionVisibility;
  isActive: boolean;
  order: number;
};

type Props = {
  slot: PageSectionSlot;
  label: string;
  sections: PageBuilderSection[];
  dirtySectionIds: Set<string>;
  savingSectionId: string | null;
  updatingVisibilitySectionId: string | null;
  onAdd: (slot: PageSectionSlot) => void;
  onSave: (section: PageBuilderSection) => void;
  onMove: (index: number, direction: "up" | "down", sections: PageBuilderSection[]) => void;
  onToggle: (section: PageBuilderSection) => void;
  onVisibilityChange: (
    section: PageBuilderSection,
    visibility: "everyone" | "residents",
  ) => void;
  onClone: (section: PageBuilderSection) => void;
  onEdit: (section: PageBuilderSection) => void;
  onDelete: (id: string, name: string) => void;
  onUpdate: (
    id: string,
    field: "eyebrow" | "title" | "content" | "buttonText" | "buttonLink",
    value: string,
  ) => void;
  onUpdateLink: (id: string, label: string, url: string) => void;
};

function getProxyUrl(url?: string) {
  if (!url) return "";
  if (url.includes("blob.vercel-storage.com") && url.includes("private.")) {
    return `/api/homepage-media?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function PageBuilderSectionSlot({
  slot,
  label,
  sections,
  dirtySectionIds,
  savingSectionId,
  updatingVisibilitySectionId,
  onAdd,
  onSave,
  onMove,
  onToggle,
  onVisibilityChange,
  onClone,
  onEdit,
  onDelete,
  onUpdate,
  onUpdateLink,
}: Props) {
  function editableCopy(section: PageBuilderSection, centered = false) {
    return (
      <>
        {section.eyebrow !== undefined && (
          <InlineEditableText
            label={`${section.name} eyebrow`}
            value={section.eyebrow}
            onChange={(value) => onUpdate(section._id, "eyebrow", value)}
            className={`block text-xs font-bold uppercase tracking-[0.18em] text-marina ${centered ? "text-center" : ""}`}
          />
        )}
        {section.title !== undefined && (
          <InlineEditableText
            label={`${section.name} title`}
            value={section.title}
            onChange={(value) => onUpdate(section._id, "title", value)}
            className={`mt-3 block w-full text-2xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-3xl ${centered ? "text-center" : ""}`}
          />
        )}
        {section.content !== undefined && section.layout !== "single-image-flyer" && (
          <InlineEditableText
            label={`${section.name} content`}
            value={section.content}
            onChange={(value) => onUpdate(section._id, "content", value)}
            multiline
            rows={4}
            className={`mt-4 block w-full whitespace-pre-wrap text-sm leading-7 text-ink/65 ${centered ? "text-center" : ""}`}
          />
        )}
        {(section.buttonText !== undefined || section.buttonLink !== undefined) && (
          <div className={`mt-5 flex ${centered ? "justify-center" : ""}`}>
            <span className="rounded-full bg-marina px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <InlineEditableLink
                label={section.buttonText ?? ""}
                url={section.buttonLink ?? ""}
                onSave={(label, url) => onUpdateLink(section._id, label, url)}
                className="text-white"
              />
            </span>
          </div>
        )}
      </>
    );
  }

  function preview(section: PageBuilderSection) {
    const images = section.imageUrls?.length
      ? section.imageUrls
      : section.imageUrl
        ? [section.imageUrl]
        : [];

    if (section.layout === "single-image-flyer") {
      return section.imageUrl ? (
        <div className="relative mx-auto aspect-[8.5/11] w-full max-w-xl overflow-hidden rounded-xl bg-sand">
          <Image
            src={getProxyUrl(section.imageUrl)}
            alt={section.name}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center rounded-xl bg-sand text-sm text-ink/45">
          <ImageIcon className="mr-2 inline h-5 w-5" /> Flyer image
        </div>
      );
    }

    if (isImageCollectionLayout(section.layout)) {
      return (
        <section className="border-y border-sand/30 bg-white px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-6 max-w-3xl">
              {editableCopy(section, true)}
            </div>
            <div className={section.layout === "image-gallery"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              : "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"}>
              {images.length ? images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand ${
                    section.layout === "image-carousel" ? "w-[80%] shrink-0 snap-center sm:w-[55%]" : ""
                  }`}
                >
                  <Image
                    src={getProxyUrl(image)}
                    alt={`${section.title || section.name}, image ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 85vw, 50vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )) : (
                <div className="col-span-full grid min-h-48 place-items-center rounded-xl bg-sand text-sm text-ink/45">
                  Add images to preview this collection.
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (section.layout === "two-col-img-left" || section.layout === "two-col-img-right") {
      const image = section.imageUrl;
      const imageBlock = (
        <div className="relative min-h-64 bg-sand sm:min-h-[360px]">
          {image ? (
            <Image
              src={getProxyUrl(image)}
              alt={section.title || section.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="grid h-full min-h-64 place-items-center text-ink/45"><ImageIcon className="h-8 w-8" /></div>
          )}
        </div>
      );
      const textBlock = (
        <div className="flex items-center px-6 py-10 sm:px-12 sm:py-14">
          <div className="w-full max-w-lg">{editableCopy(section)}</div>
        </div>
      );

      return (
        <section className="grid border-y border-sand bg-sand md:grid-cols-2">
          {section.layout === "two-col-img-left" ? imageBlock : textBlock}
          {section.layout === "two-col-img-left" ? textBlock : imageBlock}
        </section>
      );
    }

    return (
      <section className="border-y border-sand/30 bg-white px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {editableCopy(section, true)}
          {section.imageUrl && (
            <div className="relative mt-7 h-64 w-full max-w-2xl overflow-hidden rounded-2xl bg-sand">
              <Image
                src={getProxyUrl(section.imageUrl)}
                alt={section.title || section.name}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative border-y-2 border-dashed border-marina/25 bg-white" aria-label={`${label} custom sections`}>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-sand/60 px-4 py-3 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-marina">Custom section placement</p>
          <p className="mt-1 text-xs text-ink/55">{label}</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(slot)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-marina/30 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-marina transition hover:bg-sand"
        >
          <Plus className="h-3.5 w-3.5" /> Add section here
        </button>
      </div>

      {!sections.length ? (
        <p className="px-4 py-5 text-center text-xs italic text-ink/45">
          No custom sections in this position.
        </p>
      ) : (
        <div>
          {sections.map((section, index) => (
            <article
              key={section._id}
              className={`relative transition-opacity ${section.isActive ? "" : "opacity-65"}`}
            >
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-y border-ink/10 bg-white px-3 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="break-words text-xs font-bold text-ink">{section.name}</p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-ink/50">
                    {section.layout.replaceAll("-", " ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <PageSectionVisibilityToggle
                    value={section.visibility}
                    onChange={(visibility) => onVisibilityChange(section, visibility)}
                    disabled={updatingVisibilitySectionId === section._id}
                    label={`${section.name} audience`}
                  />
                  {dirtySectionIds.has(section._id) && (
                    <button
                      type="button"
                      onClick={() => onSave(section)}
                      disabled={savingSectionId === section._id}
                      className="min-h-9 rounded-full bg-marina px-3 text-[9px] font-bold uppercase tracking-wider text-white disabled:opacity-60"
                    >
                      {savingSectionId === section._id ? "Saving..." : "Save"}
                    </button>
                  )}
                  <span className={`px-1 text-[9px] font-extrabold uppercase tracking-wider ${section.isActive ? "text-marina" : "text-ink/45"}`}>
                    {section.isActive ? "Live" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggle(section)}
                    aria-label={section.isActive ? `Deactivate ${section.name}` : `Activate ${section.name}`}
                    aria-pressed={section.isActive}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-marina focus-visible:ring-offset-2 ${
                      section.isActive ? "bg-marina" : "bg-ink/20"
                    }`}
                    title={section.isActive ? "Click to set as Inactive" : "Click to set as LIVE"}
                  >
                    <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${section.isActive ? "translate-x-7" : "translate-x-1"}`} />
                  </button>
                  <button type="button" onClick={() => onMove(index, "up", sections)} disabled={index === 0} aria-label={`Move ${section.name} up`} className="grid h-9 w-8 place-items-center rounded-lg text-ink/60 hover:bg-sand disabled:opacity-30" title="Move up">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onMove(index, "down", sections)} disabled={index === sections.length - 1} aria-label={`Move ${section.name} down`} className="grid h-9 w-8 place-items-center rounded-lg text-ink/60 hover:bg-sand disabled:opacity-30" title="Move down">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onClone(section)} aria-label={`Clone ${section.name}`} className="grid h-9 w-8 place-items-center rounded-lg text-ink/60 hover:bg-sand hover:text-marina" title="Clone section">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onEdit(section)} aria-label={`Edit ${section.name}`} className="grid h-9 w-8 place-items-center rounded-lg text-marina hover:bg-sand" title="Edit section">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onDelete(section._id, section.name)} aria-label={`Delete ${section.name}`} className="grid h-9 w-8 place-items-center rounded-lg text-coral hover:bg-coral/10" title="Delete section">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {section.isActive ? (
                preview(section)
              ) : (
                <div className="relative">
                  {preview(section)}
                  <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/25">
                    <span className="rounded-full bg-deep-ocean/85 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white">
                      Inactive — not shown on the public page
                    </span>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
