"use client";

import NextImage from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  DOCUMENT_CATEGORY_LABELS,
  normalizeDocumentCategory,
} from "@/lib/documentCategories";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  Check,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
  Copy,
  FileText,
} from "lucide-react";

type Section = {
  _id: string;
  name: string;
  slot: "below-hero" | "below-services" | "above-footer";
  layout: "full-width" | "two-col-img-left" | "two-col-img-right" | "single-image-flyer";
  eyebrow?: string;
  title?: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  order: number;
};

type AboutContent = { eyebrow: string; paragraphs: string };

const defaultAboutContent: AboutContent = {
  eyebrow: "A small place with a big horizon",
  paragraphs: "La Conchita sits between the coastal bluffs and the Pacific, a compact neighborhood shaped by salt air, ocean views, and the easy familiarity of people who know the same stretch of beach.\n\nThe community shares responsibility for the paths, common areas, neighborhood gatherings, and the practical work of caring for a place this close to the water. Residents are always welcome to take part and stay informed.\n\nThis site is our public front door. Residents have a second, private door for directory lookups, community requests, shared documents, and the announcements that keep everyday life moving.",
};

export default function PageBuilder() {
  const [sections, setSections] = useState<Section[]>([]);
  const [masterActive, setMasterActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aboutContent, setAboutContent] = useState<AboutContent>(defaultAboutContent);
  const [aboutSaving, setAboutSaving] = useState(false);

  // View state: 'list' | 'create' | 'edit'
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [wizardStep, setWizardStep] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formLayout, setFormLayout] = useState<Section["layout"]>("full-width");
  const [formEyebrow, setFormEyebrow] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formButtonText, setFormButtonText] = useState("");
  const [formButtonLink, setFormButtonLink] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formSlot, setFormSlot] = useState<Section["slot"]>("below-hero");
  const [formIsActive, setFormIsActive] = useState(true);
  const [flyerPreviewOpen, setFlyerPreviewOpen] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document Selector state
  const [docSelectorOpen, setDocSelectorOpen] = useState(false);
  const [docSelectorTarget, setDocSelectorTarget] = useState<"image" | "link">("image");
  const [availableDocs, setAvailableDocs] = useState<Array<{ _id: string; title: string; category: string; fileUrl: string }>>([]);
  const [docSearchQuery, setDocSelectorSearchQuery] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (!flyerPreviewOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFlyerPreviewOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [flyerPreviewOpen]);

  // Open Document Selector modal and fetch items
  async function openDocumentSelector(target: "image" | "link") {
    setDocSelectorTarget(target);
    setDocSelectorOpen(true);
    setLoadingDocs(true);
    setDocSelectorSearchQuery("");
    try {
      const res = await fetch("/api/admin/documents");
      const data = await res.json();
      if (res.ok) {
        setAvailableDocs(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  }

  // Handle choosing a document
  function selectDocument(doc: { _id: string; fileUrl: string }) {
    if (docSelectorTarget === "image") {
      setFormImageUrl(doc.fileUrl);
    } else {
      setFormButtonLink(`/api/documents/${doc._id}`);
    }
    setDocSelectorOpen(false);
  }

  // Drag and Drop state & handlers
  const [isDragging, setIsDragging] = useState(false);

  async function uploadHomepageImage(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      throw new Error("Image must be 4 MB or smaller");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/page-builder/upload", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Image upload failed");
    return result.url as string;
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate that dropped file is an image
    if (!file.type.startsWith("image/")) {
      setError("Please drop an image file (PNG, JPG, WEBP, etc.).");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      setFormImageUrl(await uploadHomepageImage(file));
      showSuccess("Image uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Helper to proxy private Vercel Blob URLs so they can render in the browser
  const getProxyUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("blob.vercel-storage.com") && url.includes("private.")) {
      return `/api/homepage-media?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // 1. Fetch sections & global toggle
  async function loadData(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/admin/page-builder");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load builder data");
      setSections(data.sections || []);
      setMasterActive(data.pageBuilderActive);
      if (data.aboutContent) setAboutContent(data.aboutContent);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function saveAboutContent() {
    setAboutSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingKey: "about-page-content", value: aboutContent }),
      });
      const responseText = await res.text();
      let data: { error?: string } = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`Save failed with HTTP ${res.status}. Please refresh and try again.`);
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to save About page content");
      showSuccess("About page content saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save About page content");
    } finally {
      setAboutSaving(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData(false);
    });
  }, []);

  // 2. Toggle master active
  async function toggleMasterActive() {
    const nextVal = !masterActive;
    setMasterActive(nextVal);
    try {
      const res = await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleKey: "page-builder-active", value: nextVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update global switch");
      showSuccess(`Page Section Builder module globally ${nextVal ? "ENABLED" : "DISABLED"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMasterActive(!nextVal); // rollback
    }
  }

  // 3. Helper to display success message
  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  // 4. Open creator wizard
  function openCreate() {
    setEditingId(null);
    setError(null);
    setSuccess(null);
    setFormName("");
    setFormLayout("full-width");
    setFormEyebrow("");
    setFormTitle("");
    setFormContent("");
    setFormButtonText("");
    setFormButtonLink("");
    setFormImageUrl("");
    setFormSlot("below-hero");
    setFormIsActive(true);
    setWizardStep(1);
    setView("create");
  }

  // 5. Open editing wizard
  function openEdit(sec: Section) {
    setEditingId(sec._id);
    setError(null);
    setSuccess(null);
    setFormName(sec.name);
    setFormLayout(sec.layout);
    setFormEyebrow(sec.eyebrow || "");
    setFormTitle(sec.title || "");
    setFormContent(sec.content);
    setFormButtonText(sec.buttonText || "");
    setFormButtonLink(sec.buttonLink || "");
    setFormImageUrl(sec.imageUrl || "");
    setFormSlot(sec.slot);
    setFormIsActive(sec.isActive);
    setWizardStep(1);
    setView("edit");
  }

  // 6. Handle image upload directly to Vercel Blob from the client
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      setFormImageUrl(await uploadHomepageImage(file));
      showSuccess("Image uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  // 7. Save / Update section
  async function saveSection() {
    const isFlyer = formLayout === "single-image-flyer";
    if (!isFlyer && !formName.trim()) {
      setError("Reference Name is required.");
      return;
    }
    if (isFlyer ? !formImageUrl : !formContent.trim()) {
      setError(
        isFlyer
          ? "Upload a flyer image before saving."
          : "Section content is required."
      );
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: formName.trim() || "Single Image/Flyer",
      layout: formLayout,
      eyebrow: isFlyer ? "" : formEyebrow,
      title: isFlyer ? "" : formTitle,
      content: isFlyer ? "" : formContent,
      buttonText: isFlyer ? "" : formButtonText,
      buttonLink: isFlyer ? "" : formButtonLink,
      imageUrl: formImageUrl,
      slot: formSlot,
      isActive: formIsActive,
    };

    try {
      let res;
      if (view === "edit" && editingId) {
        res = await fetch("/api/admin/page-builder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
      } else {
        res = await fetch("/api/admin/page-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save section");

      showSuccess(`Section "${payload.name}" saved successfully.`);
      setView("list");
      loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // 8. Delete section
  async function deleteSection(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/page-builder?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete section");

      showSuccess(`Section "${name}" deleted.`);
      loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // 9. Move section order inside slot
  async function moveOrder(index: number, direction: "up" | "down", slotGroup: Section[]) {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slotGroup.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...slotGroup];

    // Swap items
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Build payload mapping ID to next order
    const payload = reordered.map((item, idx) => ({
      id: item._id,
      order: idx,
    }));

    try {
      const res = await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: payload }),
      });
      if (!res.ok) throw new Error("Failed to reorder sections");
      loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reordering failed");
    }
  }

  // 10. Inline toggle section active/draft
  async function toggleSectionActive(sec: Section) {
    setError(null);
    try {
      const res = await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sec._id, isActive: !sec.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to toggle status");
      showSuccess(`Section "${sec.name}" ${!sec.isActive ? "activated" : "deactivated"}.`);
      loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggling status failed");
    }
  }

  // 11. Clone section (saves as draft)
  async function cloneSection(sec: Section) {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: `${sec.name} (Clone)`,
        slot: sec.slot,
        layout: sec.layout,
        eyebrow: sec.eyebrow,
        title: sec.title,
        content: sec.content,
        imageUrl: sec.imageUrl,
        buttonText: sec.buttonText,
        buttonLink: sec.buttonLink,
        isActive: false, // Clone starts as draft for safety
      };
      const res = await fetch("/api/admin/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to clone section");
      showSuccess(`Section "${sec.name}" cloned successfully.`);
      loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cloning failed");
    } finally {
      setLoading(false);
    }
  }

  // Group and sort sections (Active first, then by order)
  const sortActiveFirst = (list: Section[]) => {
    return [...list].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return a.order - b.order;
    });
  };

  const sectionsBySlot = {
    "below-hero": sortActiveFirst(sections.filter((s) => s.slot === "below-hero")),
    "below-services": sortActiveFirst(sections.filter((s) => s.slot === "below-services")),
    "above-footer": sortActiveFirst(sections.filter((s) => s.slot === "above-footer")),
  };
  const stepLabels = [
    "Layout",
    formLayout === "single-image-flyer" ? "Image" : "Content",
    "Preview",
    "Insertion",
  ];

  return (
    <div className="min-w-0 rounded-2xl border border-marina/15 bg-white p-4 shadow-xl shadow-deep-ocean/5 sm:rounded-3xl sm:p-6">
      {/* Header with Title & Master Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-marina/10 pb-5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink sm:text-xl">
            <Sparkles className="h-5 w-5 shrink-0 text-marina" />
            Page Builder
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/60">
            Add custom elements, announcements, or clean text-image layouts directly into the public facing website.
          </p>
        </div>

        {view === "list" && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center justify-between gap-3 rounded-full border border-marina/20 bg-sand px-3 py-1.5 sm:justify-start">
              <span className="text-xs font-semibold text-ink">Module Active:</span>
              <button
                type="button"
                onClick={toggleMasterActive}
                aria-label={masterActive ? "Deactivate page builder module" : "Activate page builder module"}
                aria-pressed={masterActive}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-marina focus-visible:ring-offset-2 ${
                  masterActive ? "bg-marina" : "bg-ink/20"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    masterActive ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-marina px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-marina-light sm:min-h-10"
            >
              <Plus className="h-4 w-4" /> New Section
            </button>
          </div>
        )}
      </div>

      {/* Message banners */}
      {error && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-coral bg-coral/10 p-4 text-sm text-ink">
          <span className="min-w-0 break-words">{error}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setError(null)} className="shrink-0 p-1 text-ink/60 hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 rounded-2xl bg-sand border border-marina/30 text-sm text-ink font-semibold flex items-center gap-2">
          <Check className="h-4 w-4 text-marina" />
          <span>{success}</span>
        </div>
      )}

      {/* ----------------- VIEW: LIST / DASHBOARD ----------------- */}
      {view === "list" && (
        <div className="mt-6 space-y-8">
          <section className="rounded-2xl border border-marina/25 bg-sand/20 p-4 sm:p-5">
            <div className="mb-5 flex flex-col gap-1 border-b border-marina/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-marina">About Page Content</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">Edit the public copy shown at <span className="font-semibold text-ink">/about</span>. Separate paragraphs with a blank line.</p>
              </div>
              <FileText className="hidden h-5 w-5 text-marina/70 sm:block" />
            </div>
            <div className="grid gap-4">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">
                Intro label
                <input value={aboutContent.eyebrow} onChange={(e) => setAboutContent({ ...aboutContent, eyebrow: e.target.value })} className="mt-1.5 w-full rounded-xl border border-marina/20 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-marina focus:ring-1 focus:ring-marina" />
              </label>
              <label className="text-xs font-bold uppercase tracking-wider text-ink">
                Page paragraphs
                <textarea rows={8} value={aboutContent.paragraphs} onChange={(e) => setAboutContent({ ...aboutContent, paragraphs: e.target.value })} className="mt-1.5 w-full resize-y rounded-xl border border-marina/20 bg-white px-4 py-3 text-sm font-normal normal-case leading-7 tracking-normal text-ink outline-none focus:border-marina focus:ring-1 focus:ring-marina" />
              </label>
              <div className="flex justify-end">
                <button type="button" onClick={saveAboutContent} disabled={aboutSaving} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-marina px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-marina-light disabled:opacity-60">
                  <Check className="h-4 w-4" /> {aboutSaving ? "Saving..." : "Save About Page"}
                </button>
              </div>
            </div>
          </section>
          {loading && sections.length === 0 ? (
            <p className="text-center text-sm text-ink/65 py-12">Loading page builder details...</p>
          ) : (
            Object.entries(sectionsBySlot).map(([slotName, slotSections]) => (
              <div key={slotName} className="rounded-2xl border border-sand-dark bg-sand/30 p-3 sm:p-5">
                <div className="mb-4 flex flex-col gap-1 border-b border-marina/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-bold uppercase leading-relaxed tracking-wider text-marina sm:text-sm">
                    Slot: {slotName === "below-hero" ? "Below Hero Wave" : slotName === "below-services" ? "Below Resident Services" : "Above Footer"}
                  </span>
                  <span className="text-xs font-medium text-ink/65">{slotSections.length} sections</span>
                </div>

                {slotSections.length === 0 ? (
                  <p className="text-center text-xs text-ink/40 py-6 italic">No custom sections active in this slot.</p>
                ) : (
                  <div className="space-y-3">
                    {slotSections.map((sec, idx) => (
                      <div
                        key={sec._id}
                        className={`flex min-w-0 flex-col gap-3 rounded-xl border bg-white p-3 transition sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
                          sec.isActive ? "border-marina/10" : "border-ink/10 opacity-60"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {/* Image preview thumbnail */}
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sand-dark relative flex items-center justify-center">
                            {sec.imageUrl ? (
                              <NextImage
                                src={getProxyUrl(sec.imageUrl)}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-ink/30" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="break-words text-sm font-bold leading-tight text-ink">{sec.name}</h4>
                            <p className="mt-1 text-[10px] font-semibold uppercase leading-relaxed tracking-wider text-marina">
                              {sec.layout.replaceAll("-", " ")} <span aria-hidden="true">·</span> {sec.isActive ? "LIVE" : "Inactive"}
                            </p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex w-full flex-wrap items-center gap-1.5 border-t border-ink/5 pt-2 sm:w-auto sm:flex-nowrap sm:justify-end sm:border-0 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => moveOrder(idx, "up", slotSections)}
                            disabled={idx === 0}
                            aria-label={`Move ${sec.name} up`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-1.5 text-ink/60 transition hover:bg-sand hover:text-ink disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOrder(idx, "down", slotSections)}
                            disabled={idx === slotSections.length - 1}
                            aria-label={`Move ${sec.name} down`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-1.5 text-ink/60 transition hover:bg-sand hover:text-ink disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>

                          <div className="ml-1 flex items-center gap-2 sm:ml-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              sec.isActive ? "text-marina font-extrabold" : "text-ink/40"
                            }`}>
                              {sec.isActive ? "LIVE" : "Inactive"}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSectionActive(sec)}
                              aria-label={sec.isActive ? `Deactivate ${sec.name}` : `Activate ${sec.name}`}
                              aria-pressed={sec.isActive}
                              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-marina focus-visible:ring-offset-2 ${
                                sec.isActive ? "bg-marina" : "bg-ink/20"
                              }`}
                              title={sec.isActive ? "Click to set as Inactive" : "Click to set as LIVE"}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  sec.isActive ? "translate-x-7" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="mx-1 hidden h-5 w-px bg-ink/10 sm:block" />

                          <button
                            type="button"
                            onClick={() => cloneSection(sec)}
                            aria-label={`Clone ${sec.name}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-1.5 text-ink/60 transition hover:bg-sand hover:text-marina"
                            title="Clone Section"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEdit(sec)}
                            aria-label={`Edit ${sec.name}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-1.5 text-marina transition hover:bg-sand"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSection(sec._id, sec.name)}
                            aria-label={`Delete ${sec.name}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-1.5 text-coral transition hover:bg-coral/10"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ----------------- VIEW: WIZARD (CREATE / EDIT) ----------------- */}
      {(view === "create" || view === "edit") && (
        <div className="mt-6">
          {/* Breadcrumb / Step Indicator */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink/65">
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-1 text-marina hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Dashboard
            </button>
            <span>/</span>
            <span className="min-w-0 break-words text-ink">
              {view === "create" ? "Add Custom Section" : `Editing: ${formName}`}
            </span>
          </div>

          {/* Stepper bar */}
          <div className="relative mb-8">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-sand-dark -translate-y-1/2 -z-10" />
            <div className="mx-auto grid max-w-lg grid-cols-4 justify-items-center">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  onClick={() => step < wizardStep && setWizardStep(step)}
                  aria-label={`Step ${step}: ${stepLabels[step - 1]}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                    wizardStep === step
                      ? "border-marina bg-marina text-white scale-110"
                      : wizardStep > step
                      ? "border-marina bg-sand text-marina"
                      : "border-sand-dark bg-white text-ink/40 cursor-not-allowed"
                  }`}
                  disabled={step > wizardStep}
                >
                  {step}
                </button>
              ))}
            </div>
            <div className="mx-auto mt-2 grid max-w-lg grid-cols-4 justify-items-center gap-1 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-ink/65 sm:text-[10px] sm:tracking-wider">
              {stepLabels.map((label, index) => (
                <span key={label} className={wizardStep === index + 1 ? "text-marina" : ""}>
                  {index + 1}. {label}
                </span>
              ))}
            </div>
          </div>

          {/* STEP 1: Layout Selection */}
          {wizardStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center max-w-md mx-auto mb-8">
                <h3 className="text-lg font-bold text-ink">Choose Layout Style</h3>
                <p className="text-xs text-ink/60 mt-1">
                  How should your section present on the homepage?
                </p>
              </div>

              <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                {/* Option 1: Full-Width */}
                <button
                  onClick={() => setFormLayout("full-width")}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition sm:p-5 ${
                    formLayout === "full-width"
                      ? "border-marina bg-sand/35"
                      : "border-marina/10 bg-white hover:border-marina/30"
                  }`}
                >
                  <div className="h-24 w-full bg-sand rounded-lg flex flex-col justify-center items-center gap-1.5 p-3 mb-4">
                    <div className="h-2.5 w-16 bg-marina rounded" />
                    <div className="h-1.5 w-24 bg-ink/30 rounded" />
                    <div className="h-1 w-20 bg-ink/20 rounded" />
                  </div>
                  <h4 className="text-sm font-bold text-ink">Full Width Centered</h4>
                  <p className="text-xxs text-ink/60 mt-2 leading-relaxed">
                    Great for general messages, announcements, or single prominent headings. Includes optional full-width image below.
                  </p>
                </button>

                {/* Option 2: Image Left, Text Right */}
                <button
                  onClick={() => setFormLayout("two-col-img-left")}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition sm:p-5 ${
                    formLayout === "two-col-img-left"
                      ? "border-marina bg-sand/35"
                      : "border-marina/10 bg-white hover:border-marina/30"
                  }`}
                >
                  <div className="h-24 w-full bg-sand rounded-lg flex p-2 gap-2 mb-4">
                    <div className="w-1/2 h-full bg-ink/20 rounded" />
                    <div className="w-1/2 h-full flex flex-col justify-center gap-1.5">
                      <div className="h-2 w-8 bg-marina rounded" />
                      <div className="h-1 w-12 bg-ink/30 rounded" />
                      <div className="h-1 w-8 bg-ink/20 rounded" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-ink">Image Left, Text Right</h4>
                  <p className="text-xxs text-ink/60 mt-2 leading-relaxed">
                    Perfect side-by-side splits with an image on the left and colored background text on the right.
                  </p>
                </button>

                {/* Option 3: Text Left, Image Right */}
                <button
                  onClick={() => setFormLayout("two-col-img-right")}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition sm:p-5 ${
                    formLayout === "two-col-img-right"
                      ? "border-marina bg-sand/35"
                      : "border-marina/10 bg-white hover:border-marina/30"
                  }`}
                >
                  <div className="h-24 w-full bg-sand rounded-lg flex p-2 gap-2 mb-4">
                    <div className="w-1/2 h-full flex flex-col justify-center gap-1.5">
                      <div className="h-2 w-8 bg-marina rounded" />
                      <div className="h-1 w-12 bg-ink/30 rounded" />
                      <div className="h-1 w-8 bg-ink/20 rounded" />
                    </div>
                    <div className="w-1/2 h-full bg-ink/20 rounded" />
                  </div>
                  <h4 className="text-sm font-bold text-ink">Text Left, Image Right</h4>
                  <p className="text-xxs text-ink/60 mt-2 leading-relaxed">
                    Splits with a clean text column on the left and a prominent image filling the right column.
                  </p>
                </button>

                {/* Option 4: Single Image/Flyer */}
                <button
                  onClick={() => {
                    setFormLayout("single-image-flyer");
                  }}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition sm:p-5 ${
                    formLayout === "single-image-flyer"
                      ? "border-marina bg-sand/35"
                      : "border-marina/10 bg-white hover:border-marina/30"
                  }`}
                >
                  <div className="mb-4 flex h-24 w-full items-center justify-center rounded-lg bg-sand p-2">
                    <div className="h-full w-14 rounded border border-marina/30 bg-white p-1 shadow-sm">
                      <div className="h-full w-full bg-marina/20" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-ink">Single Image/Flyer</h4>
                  <p className="mt-2 text-xxs leading-relaxed text-ink/60">
                    Display one centered, full-height image. Visitors can click it to enlarge.
                  </p>
                </button>
              </div>

              <div className="mx-auto mt-8 flex max-w-3xl justify-end border-t border-marina/10 pt-6">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="flex min-h-11 w-full items-center justify-center gap-1 rounded-full bg-marina px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-marina-light sm:min-h-10 sm:w-auto"
                >
                  Next Step <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Content & Media Upload */}
          {wizardStep === 2 && (
            <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  {formLayout === "single-image-flyer" ? "Upload Flyer Image" : "Section Content & Media"}
                </h3>
                <p className="text-xs text-ink/60 mt-1">
                  {formLayout === "single-image-flyer"
                    ? "Upload the single image to display. No additional content is needed."
                    : "Fill in the text, upload optional images, and specify buttons or links to insert."}
                </p>
              </div>

              <div className="space-y-4">
                {/* Reference Name */}
                <div>
                  <label htmlFor="section-reference-name" className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                    Internal Reference Name{" "}
                    {formLayout !== "single-image-flyer" && <span className="text-coral">*</span>}
                  </label>
                  <input
                    id="section-reference-name"
                    type="text"
                    required={formLayout !== "single-image-flyer"}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={
                      formLayout === "single-image-flyer"
                        ? "Optional name for your flyer"
                        : "e.g. Fall Beach Cleanup Flyer Section"
                    }
                    className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none"
                  />
                  <p className="mt-1 text-[10px] text-ink/50">
                    {formLayout === "single-image-flyer"
                      ? "Optional; only shown in the admin dashboard. Leave blank to use “Single Image/Flyer”."
                      : "This is only seen in the admin dashboard to organize sections."}
                  </p>
                </div>

                {formLayout !== "single-image-flyer" && <div className="grid gap-4 sm:grid-cols-2">
                  {/* Eyebrow */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                      Eyebrow (Optional)
                    </label>
                    <input
                      type="text"
                      value={formEyebrow}
                      onChange={(e) => setFormEyebrow(e.target.value)}
                      placeholder="e.g. Community Event"
                      className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                      Section Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Let's tidy our shores together"
                      className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none"
                    />
                  </div>
                </div>}

                {/* Content */}
                {formLayout !== "single-image-flyer" && <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                    Section Content Block <span className="text-coral">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Describe the announcements, listings, or general community details in full detail..."
                    className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none resize-y"
                  />
                </div>}

                {/* Media Image Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                    {formLayout === "single-image-flyer" ? "Flyer Image" : "Section Image"}{" "}
                    {formLayout !== "full-width" && <span className="text-coral">*</span>}
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col sm:flex-row items-center gap-4 bg-sand/20 rounded-2xl p-4 border transition-all duration-200 ${
                      isDragging
                        ? "border-2 border-dashed border-marina bg-sand-dark/40 scale-[1.01]"
                        : "border border-marina/10"
                    }`}
                  >
                    <div className={`shrink-0 overflow-hidden rounded-xl bg-sand-dark relative flex items-center justify-center border border-marina/15 ${
                      formLayout === "single-image-flyer" ? "h-32 w-24" : "h-20 w-20"
                    }`}>
                      {formImageUrl ? (
                        <NextImage
                          src={getProxyUrl(formImageUrl)}
                          alt="Upload preview"
                          fill
                          sizes="96px"
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-ink/30" />
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap gap-2">
                        {formLayout !== "single-image-flyer" && <input
                          type="text"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="Paste image URL or choose file"
                          className="flex-1 min-w-[150px] rounded-xl border border-marina/20 px-3 py-1.5 text-xs text-ink focus:border-marina outline-none"
                        />}
                        {formLayout !== "single-image-flyer" && <button
                          type="button"
                          onClick={() => openDocumentSelector("image")}
                          className="flex items-center gap-1 rounded-lg border border-marina/30 hover:bg-sand/35 px-3 py-1.5 text-xs font-bold text-marina transition whitespace-nowrap"
                        >
                          Choose Document
                        </button>}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-1 rounded-lg bg-marina hover:bg-marina-light px-3 py-1.5 text-xs font-bold text-white transition whitespace-nowrap disabled:opacity-50"
                        >
                          <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload File"}
                        </button>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className="text-[10px] text-ink/40 mt-2">
                        {formLayout === "single-image-flyer"
                          ? "Upload one image, up to 4 MB. You can also drag and drop it here."
                          : "Images must be 4 MB or smaller. You can also drag and drop an image here."}
                      </p>
                    </div>
                  </div>
                </div>

                {formLayout !== "single-image-flyer" && <div className="grid gap-4 sm:grid-cols-2">
                  {/* Button Text */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                      Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={formButtonText}
                      onChange={(e) => setFormButtonText(e.target.value)}
                      placeholder="e.g. Read Event Details"
                      className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none"
                    />
                  </div>

                  {/* Button Link */}
                  <div>
                    <div className="mb-1 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                        Button Destination Link (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => openDocumentSelector("link")}
                        className="inline-flex min-h-10 items-center text-[10px] font-bold uppercase tracking-wider text-marina hover:underline"
                      >
                        Link to Document
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formButtonLink}
                      onChange={(e) => setFormButtonLink(e.target.value)}
                      placeholder="e.g. /portal/events or https://..."
                      className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none"
                    />
                  </div>
                </div>}
              </div>

              {/* Navigation buttons */}
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-marina/10 pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-marina/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marina transition hover:bg-sand/20 sm:min-h-10 sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous Style
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formLayout !== "single-image-flyer" && !formName.trim()) {
                      setError("Reference Name is required before previewing.");
                      return;
                    }
                    if (formLayout === "single-image-flyer" && !formImageUrl) {
                      setError("Upload a flyer image before previewing.");
                      return;
                    }
                    if (formLayout !== "single-image-flyer" && !formContent.trim()) {
                      setError("Section content is required before previewing.");
                      return;
                    }
                    if (formLayout !== "full-width" && formLayout !== "single-image-flyer" && !formImageUrl) {
                      setError("Two-column layouts require an uploaded image to render beautifully.");
                      return;
                    }
                    setError(null);
                    setWizardStep(3);
                  }}
                  className="flex min-h-11 w-full items-center justify-center gap-1 rounded-full bg-marina px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-marina-light sm:min-h-10 sm:w-auto"
                >
                  Preview Layout <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Live Preview Component */}
          {wizardStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center max-w-md mx-auto">
                <h3 className="text-lg font-bold text-ink">Live Layout Preview</h3>
                <p className="text-xs text-ink/60 mt-1">
                  This is exactly how this section will look and align with other elements on the La Conchita homepage.
                </p>
              </div>

              {/* In-context Render Simulation */}
              <div className="border-4 border-dashed border-marina/30 rounded-3xl overflow-hidden mt-6 shadow-lg">
                <div className="bg-sand/20 px-3 py-1 text-center text-xxs text-marina/70 border-b border-dashed border-marina/30 uppercase font-bold tracking-wider">
                  Public Homepage Live Sandbox Rendering
                </div>

                {/* Simulating CustomPageSection Layouts */}
                <div className="bg-white">
                  {formLayout === "two-col-img-left" && (
                    <section className="grid bg-sand md:grid-cols-2 border-t border-b border-sand">
                      <div
                        className="min-h-[220px] bg-cover bg-center sm:min-h-[360px]"
                        style={formImageUrl ? { backgroundImage: `url(${getProxyUrl(formImageUrl)})` } : { backgroundColor: "#cbd5e1" }}
                      />
                      <div className="flex items-center px-5 py-10 sm:px-8 sm:py-16 md:px-14">
                        <div className="max-w-lg">
                          {formEyebrow && <p className="eyebrow text-marina">{formEyebrow}</p>}
                          {formTitle && (
                            <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">
                              {formTitle}
                            </h2>
                          )}
                          <div className="mt-5 whitespace-pre-wrap leading-7 text-ink/65">
                            {formContent}
                          </div>
                          {formButtonText && formButtonLink && (
                            <div className="mt-7">
                              <span className="inline-flex rounded-full bg-marina px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white">
                                {formButtonText}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {formLayout === "two-col-img-right" && (
                    <section className="grid bg-sand md:grid-cols-2 border-t border-b border-sand">
                      <div className="order-last flex items-center px-5 py-10 sm:px-8 sm:py-16 md:order-first md:px-14">
                        <div className="max-w-lg">
                          {formEyebrow && <p className="eyebrow text-marina">{formEyebrow}</p>}
                          {formTitle && (
                            <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">
                              {formTitle}
                            </h2>
                          )}
                          <div className="mt-5 whitespace-pre-wrap leading-7 text-ink/65">
                            {formContent}
                          </div>
                          {formButtonText && formButtonLink && (
                            <div className="mt-7">
                              <span className="inline-flex rounded-full bg-marina px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white">
                                {formButtonText}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className="min-h-[220px] bg-cover bg-center sm:min-h-[360px]"
                        style={formImageUrl ? { backgroundImage: `url(${getProxyUrl(formImageUrl)})` } : { backgroundColor: "#cbd5e1" }}
                      />
                    </section>
                  )}

                  {formLayout === "single-image-flyer" && (
                    <section className="flex h-[70vh] w-full items-center justify-center bg-ink">
                      {formImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setFlyerPreviewOpen(true)}
                          aria-label="Open flyer preview"
                          className="relative h-full w-full cursor-zoom-in"
                        >
                          <NextImage
                            src={getProxyUrl(formImageUrl)}
                            alt="Flyer preview"
                            fill
                            sizes="100vw"
                            className="object-contain"
                            unoptimized
                          />
                        </button>
                      ) : (
                        <ImageIcon className="h-12 w-12 text-white/40" />
                      )}
                    </section>
                  )}

                  {formLayout === "full-width" && (
                    <section className="border-y border-sand/30 bg-white px-4 py-12 sm:px-10 sm:py-20">
                      <div className="mx-auto max-w-4xl text-center flex flex-col items-center">
                        {formEyebrow && <p className="eyebrow text-marina">{formEyebrow}</p>}
                        {formTitle && (
                          <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">
                            {formTitle}
                          </h2>
                        )}
                        <div className="mt-5 max-w-2xl whitespace-pre-wrap leading-7 text-ink/65 text-center">
                          {formContent}
                        </div>
                        {formImageUrl && (
                          <div className="relative mt-8 h-[300px] w-full max-w-2xl overflow-hidden rounded-2xl bg-sand/30">
                            <NextImage
                              src={getProxyUrl(formImageUrl)}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 100vw, 672px"
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        {formButtonText && formButtonLink && (
                          <div className="mt-7">
                            <span className="inline-flex rounded-full bg-marina px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white">
                              {formButtonText}
                            </span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-marina/10 pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-marina/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marina transition hover:bg-sand/20 sm:min-h-10 sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> Edit Content
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="flex min-h-11 w-full items-center justify-center gap-1 rounded-full bg-marina px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-marina-light sm:min-h-10 sm:w-auto"
                >
                  Set Placement <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Choose Slot & Publish Switch */}
          {wizardStep === 4 && (
            <div className="space-y-6 animate-fadeIn max-w-md mx-auto">
              <div className="text-center">
                <h3 className="text-lg font-bold text-ink">Placement &amp; Status</h3>
                <p className="text-xs text-ink/60 mt-1">
                  Decide where on the homepage to insert this section, and set it live immediately or save as draft.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-marina/15 bg-sand/20 p-4 sm:p-6">
                {/* Slot Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
                    Homepage Insertion Point Slot
                  </label>
                  <select
                    value={formSlot}
                    onChange={(e) => setFormSlot(e.target.value as Section["slot"])}
                    className="w-full rounded-xl border border-marina/20 bg-white px-4 py-2.5 text-sm text-ink focus:border-marina outline-none"
                  >
                    <option value="below-hero">Below Hero (Above Services)</option>
                    <option value="below-services">Below Services (Above Community Preparedness)</option>
                    <option value="above-footer">Above Footer (Below About Section)</option>
                  </select>
                </div>

                {/* Active Status Checkbox */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-marina/10 pt-4">
                  <div className="min-w-0 flex-1">
                    <label className="block text-sm font-bold text-ink leading-tight">
                      Set Section Status
                    </label>
                    <p className="text-[10px] text-ink/50 mt-1">If set to LIVE, it will instantly render for public visitors.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      formIsActive ? "text-marina font-extrabold" : "text-ink/40"
                    }`}>
                      {formIsActive ? "LIVE" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      aria-label={formIsActive ? "Set section inactive" : "Set section live"}
                      aria-pressed={formIsActive}
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-marina focus-visible:ring-offset-2 ${
                        formIsActive ? "bg-marina" : "bg-ink/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formIsActive ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-marina/10 pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-marina/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marina transition hover:bg-sand/20 sm:min-h-10 sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> Live Preview
                </button>
                <button
                  type="button"
                  onClick={saveSection}
                  disabled={loading}
                  className="flex min-h-11 w-full items-center justify-center gap-1 rounded-full bg-marina px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-marina-light disabled:opacity-50 sm:min-h-10 sm:w-auto"
                >
                  <Check className="h-4 w-4" /> {view === "edit" ? "Save Section" : "Publish Section"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Document Selector Modal */}
      {flyerPreviewOpen && formImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Flyer preview"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          onClick={() => setFlyerPreviewOpen(false)}
        >
          <button
            type="button"
            aria-label="Close flyer preview"
            onClick={() => setFlyerPreviewOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
          <div
            className="relative h-[94vh] w-[94vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <NextImage
              src={getProxyUrl(formImageUrl)}
              alt="Enlarged flyer preview"
              fill
              sizes="94vw"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      {docSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-marina/20 bg-white p-4 shadow-2xl animate-fadeIn sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between border-b border-marina/10 pb-4 mb-4">
              <h3 className="min-w-0 text-base font-bold text-ink sm:text-lg">
                Choose from Portal Documents
              </h3>
              <button
                type="button"
                onClick={() => setDocSelectorOpen(false)}
                aria-label="Close document selector"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-1 text-ink/40 transition hover:bg-sand hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSelectorSearchQuery(e.target.value)}
                placeholder="Search documents by title..."
                className="w-full rounded-xl border border-marina/20 px-4 py-2 text-sm text-ink focus:border-marina outline-none"
              />
            </div>

            {/* Documents List */}
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {loadingDocs ? (
                <p className="text-center text-xs text-ink/50 py-12">Loading documents...</p>
              ) : availableDocs.length === 0 ? (
                <p className="text-center text-xs text-ink/40 py-12 italic">No documents found in the portal.</p>
              ) : (
                (() => {
                  const filtered = availableDocs.filter((d) =>
                    d.title.toLowerCase().includes(docSearchQuery.toLowerCase())
                  );
                  if (filtered.length === 0) {
                    return <p className="text-center text-xs text-ink/40 py-12 italic">No matches found for your search.</p>;
                  }
                  return filtered.map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() => selectDocument(doc)}
                      className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-marina/10 p-3 transition hover:border-marina/40 hover:bg-sand/20"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-8 w-8 shrink-0 bg-sand rounded-lg flex items-center justify-center text-marina">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-ink truncate leading-snug">{doc.title}</h4>
                          <p className="text-[10px] uppercase font-bold text-marina tracking-wider mt-0.5">
                            {DOCUMENT_CATEGORY_LABELS[normalizeDocumentCategory(doc.category)]}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectDocument(doc)}
                        className="min-h-10 shrink-0 rounded-full bg-sand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-marina"
                      >
                        Select
                      </button>
                    </div>
                  ));
                })()
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-marina/10 text-right">
              <button
                type="button"
                onClick={() => setDocSelectorOpen(false)}
                className="rounded-full border border-marina/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-marina hover:bg-sand/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
