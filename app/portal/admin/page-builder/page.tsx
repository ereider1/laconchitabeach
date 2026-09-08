"use client";

import { useState, useEffect, useRef } from "react";
import { upload } from "@vercel/blob/client";
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
} from "lucide-react";

type Section = {
  _id: string;
  name: string;
  slot: "below-hero" | "below-services" | "above-footer";
  layout: "full-width" | "two-col-img-left" | "two-col-img-right";
  eyebrow?: string;
  title?: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  order: number;
};

export default function PageBuilder() {
  const [sections, setSections] = useState<Section[]>([]);
  const [masterActive, setMasterActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to proxy private Vercel Blob URLs so they can render in the browser
  const getProxyUrl = (url?: string) => {
    return url || "";
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
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
    setUploadProgress(0);
    setError(null);

    try {
      // Direct browser-to-cloud upload bypasses Vercel Serverless payload limits (4.5MB)
      // and timeouts, making it extremely reliable for high-resolution images.
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/documents/upload", // Authorized endpoint generated token
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(percentage);
        },
      });

      setFormImageUrl(blob.url);
      showSuccess("Image uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  // 7. Save / Update section
  async function saveSection() {
    if (!formName.trim() || !formContent.trim()) {
      setError("Reference Name and Content are required.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: formName,
      layout: formLayout,
      eyebrow: formEyebrow,
      title: formTitle,
      content: formContent,
      buttonText: formButtonText,
      buttonLink: formButtonLink,
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

      showSuccess(`Section "${formName}" saved successfully.`);
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

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-deep-ocean/5 border border-marina/15">
      {/* Header with Title & Master Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-marina/10 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-marina" />
            Homepage Section Builder
          </h2>
          <p className="text-xs text-ink/60 mt-0.5">
            Add custom elements, announcements, or clean text-image layouts directly into the public homepage.
          </p>
        </div>

        {view === "list" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-sand px-3 py-1.5 rounded-full border border-marina/20">
              <span className="text-xs font-semibold text-ink">Module Active:</span>
              <button
                onClick={toggleMasterActive}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  masterActive ? "bg-marina" : "bg-ink/20"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    masterActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-full bg-marina hover:bg-marina-light px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md transition"
            >
              <Plus className="h-4 w-4" /> New Section
            </button>
          </div>
        )}
      </div>

      {/* Message banners */}
      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-coral/10 border border-coral text-sm text-ink flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-ink/60 hover:text-ink"><X className="h-4 w-4" /></button>
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
          {loading && sections.length === 0 ? (
            <p className="text-center text-sm text-ink/65 py-12">Loading page builder details...</p>
          ) : (
            Object.entries(sectionsBySlot).map(([slotName, slotSections]) => (
              <div key={slotName} className="bg-sand/30 rounded-2xl p-5 border border-sand-dark">
                <div className="flex items-center justify-between border-b border-marina/10 pb-3 mb-4">
                  <span className="text-sm font-bold uppercase tracking-wider text-marina">
                    Slot: {slotName === "below-hero" ? "Below Hero Wave" : slotName === "below-services" ? "Below Resident Services" : "Above Footer"}
                  </span>
                  <span className="text-xs text-ink/65 font-medium">{slotSections.length} sections</span>
                </div>

                {slotSections.length === 0 ? (
                  <p className="text-center text-xs text-ink/40 py-6 italic">No custom sections active in this slot.</p>
                ) : (
                  <div className="space-y-3">
                    {slotSections.map((sec, idx) => (
                      <div
                        key={sec._id}
                        className={`flex items-center justify-between bg-white rounded-xl p-4 border transition ${
                          sec.isActive ? "border-marina/10" : "border-ink/10 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Image preview thumbnail */}
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sand-dark relative flex items-center justify-center">
                            {sec.imageUrl ? (
                              <img src={getProxyUrl(sec.imageUrl)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-ink/30" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-ink leading-tight">{sec.name}</h4>
                            <p className="text-xxs uppercase font-semibold text-marina tracking-wider mt-1">
                              Layout: {sec.layout} | Status: {sec.isActive ? "LIVE" : "Inactive"}
                            </p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => moveOrder(idx, "up", slotSections)}
                            disabled={idx === 0}
                            className="p-1.5 text-ink/60 hover:text-ink disabled:opacity-30 transition"
                            title="Move Up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveOrder(idx, "down", slotSections)}
                            disabled={idx === slotSections.length - 1}
                            className="p-1.5 text-ink/60 hover:text-ink disabled:opacity-30 transition"
                            title="Move Down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>

                          <div className="flex items-center gap-2 ml-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              sec.isActive ? "text-marina font-extrabold" : "text-ink/40"
                            }`}>
                              {sec.isActive ? "LIVE" : "Inactive"}
                            </span>
                            <button
                              onClick={() => toggleSectionActive(sec)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                sec.isActive ? "bg-marina" : "bg-ink/20"
                              }`}
                              title={sec.isActive ? "Click to set as Inactive" : "Click to set as LIVE"}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  sec.isActive ? "translate-x-5" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="h-5 w-px bg-ink/10 mx-1" />

                          <button
                            onClick={() => cloneSection(sec)}
                            className="p-1.5 text-ink/60 hover:text-marina hover:bg-sand rounded-lg transition"
                            title="Clone Section"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openEdit(sec)}
                            className="p-1.5 text-marina hover:bg-sand rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSection(sec._id, sec.name)}
                            className="p-1.5 text-coral hover:bg-coral/10 rounded-lg transition"
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
          <div className="flex items-center gap-2 text-xs font-semibold text-ink/65 mb-6">
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-1 text-marina hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Dashboard
            </button>
            <span>/</span>
            <span className="text-ink">
              {view === "create" ? "Add Custom Section" : `Editing: ${formName}`}
            </span>
          </div>

          {/* Stepper bar */}
          <div className="relative mb-8">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-sand-dark -translate-y-1/2 -z-10" />
            <div className="flex justify-between max-w-lg mx-auto">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  onClick={() => step < wizardStep && setWizardStep(step)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
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
            <div className="flex justify-between max-w-lg mx-auto text-[10px] uppercase font-bold tracking-wider text-ink/65 mt-2">
              <span className={wizardStep === 1 ? "text-marina" : ""}>1. Layout</span>
              <span className={wizardStep === 2 ? "text-marina" : ""}>2. Content</span>
              <span className={wizardStep === 3 ? "text-marina" : ""}>3. Preview</span>
              <span className={wizardStep === 4 ? "text-marina" : ""}>4. Insertion</span>
            </div>
          </div>

          {/* STEP 1: Layout Selection */}
          {wizardStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center max-w-md mx-auto mb-8">
                <h3 className="text-lg font-bold text-ink">Choose Layout Style</h3>
                <p className="text-xs text-ink/60 mt-1">
                  How should your section present on the homepage? Choose from three core styles.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3 max-w-3xl mx-auto">
                {/* Option 1: Full-Width */}
                <button
                  onClick={() => setFormLayout("full-width")}
                  className={`border-2 rounded-2xl p-5 flex flex-col items-center text-center transition ${
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
                  className={`border-2 rounded-2xl p-5 flex flex-col items-center text-center transition ${
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
                  className={`border-2 rounded-2xl p-5 flex flex-col items-center text-center transition ${
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
              </div>

              <div className="flex justify-end max-w-3xl mx-auto pt-6 border-t border-marina/10 mt-8">
                <button
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-1 rounded-full bg-marina hover:bg-marina-light px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition shadow"
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
                <h3 className="text-lg font-bold text-ink">Section Content &amp; Media</h3>
                <p className="text-xs text-ink/60 mt-1">
                  Fill in the text, upload optional images, and specify buttons or links to insert.
                </p>
              </div>

              <div className="space-y-4">
                {/* Reference Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                    Internal Reference Name <span className="text-coral">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Fall Beach Cleanup Flyer Section"
                    className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none"
                  />
                  <p className="text-[10px] text-ink/50 mt-1">This is only seen in the admin dashboard to organize sections.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>

                {/* Content */}
                <div>
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
                </div>

                {/* Media Image Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                    Section Image {formLayout !== "full-width" && <span className="text-coral">*</span>}
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-sand/20 rounded-2xl p-4 border border-marina/10">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-dark relative flex items-center justify-center border border-marina/15">
                      {formImageUrl ? (
                        <img src={formImageUrl} alt="Upload preview" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-ink/30" />
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="Paste image URL or click Upload"
                          className="flex-1 rounded-xl border border-marina/20 px-3 py-1.5 text-xs text-ink focus:border-marina outline-none"
                        />
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
                      {uploadProgress !== null && (
                        <div className="mt-2 w-full bg-sand-dark rounded-full h-1.5">
                          <div
                            className="bg-marina h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                      Button Destination Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={formButtonLink}
                      onChange={(e) => setFormButtonLink(e.target.value)}
                      placeholder="e.g. /portal/events or https://..."
                      className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6 border-t border-marina/10 mt-8">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="flex items-center gap-1 rounded-full border border-marina/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marina hover:bg-sand/20 transition"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous Style
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formName.trim() || !formContent.trim()) {
                      setError("Reference Name and Content are required before previewing.");
                      return;
                    }
                    if (formLayout !== "full-width" && !formImageUrl) {
                      setError("Two-column layouts require an uploaded image to render beautifully.");
                      return;
                    }
                    setError(null);
                    setWizardStep(3);
                  }}
                  className="flex items-center gap-1 rounded-full bg-marina hover:bg-marina-light px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition shadow"
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
                        className="min-h-[360px] bg-cover bg-center"
                        style={formImageUrl ? { backgroundImage: `url(${formImageUrl})` } : { backgroundColor: "#cbd5e1" }}
                      />
                      <div className="flex items-center px-8 py-16 sm:px-14">
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
                      <div className="flex items-center px-8 py-16 sm:px-14 order-last md:order-first">
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
                        className="min-h-[360px] bg-cover bg-center"
                        style={formImageUrl ? { backgroundImage: `url(${formImageUrl})` } : { backgroundColor: "#cbd5e1" }}
                      />
                    </section>
                  )}

                  {formLayout === "full-width" && (
                    <section className="bg-white px-6 py-20 sm:px-10 border-t border-b border-sand/30">
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
                          <div className="mt-8 max-w-2xl w-full h-[300px] relative overflow-hidden rounded-2xl">
                            <img
                              src={formImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
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
              <div className="flex justify-between pt-6 border-t border-marina/10 mt-8">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-1 rounded-full border border-marina/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marina hover:bg-sand/20 transition"
                >
                  <ArrowLeft className="h-4 w-4" /> Edit Content
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="flex items-center gap-1 rounded-full bg-marina hover:bg-marina-light px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition shadow"
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

              <div className="space-y-4 bg-sand/20 rounded-2xl p-6 border border-marina/15">
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
                <div className="flex items-center justify-between pt-4 border-t border-marina/10 mt-4">
                  <div>
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        formIsActive ? "bg-marina" : "bg-ink/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formIsActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6 border-t border-marina/10 mt-8">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="flex items-center gap-1 rounded-full border border-marina/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-marina hover:bg-sand/20 transition"
                >
                  <ArrowLeft className="h-4 w-4" /> Live Preview
                </button>
                <button
                  type="button"
                  onClick={saveSection}
                  disabled={loading}
                  className="flex items-center gap-1 rounded-full bg-marina hover:bg-marina-light px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition shadow-md disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> {view === "edit" ? "Save Section" : "Publish Section"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
