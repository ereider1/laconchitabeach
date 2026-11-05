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
import CommunityPreparednessEditor from "@/components/CommunityPreparednessEditor";
import CustomImageCollection from "@/components/CustomImageCollection";
import InlineEditableLink from "@/components/InlineEditableLink";
import InlineEditableText from "@/components/InlineEditableText";
import PageBuilderSectionSlot, { type PageBuilderSection } from "@/components/PageBuilderSectionSlot";
import PageSectionVisibilityToggle from "@/components/PageSectionVisibilityToggle";
import SavedPageSections from "@/components/SavedPageSections";
import { defaultCommunityPreparednessContent, type CommunityPreparednessContent } from "@/lib/communityPreparedness";
import { defaultHomePageContent, isHomePageContent, type HomePageContent } from "@/lib/homePageContent";
import { isImageCollectionLayout } from "@/lib/pageSectionLayouts";
import type { PageSectionVisibility } from "@/lib/pageSectionVisibility";
import { PAGE_SECTION_SLOTS } from "@/lib/pageSectionSlots";

type Section = PageBuilderSection;
type LeaveTarget =
  | { type: "url"; href: string }
  | { type: "list" }
  | { type: "tab"; tab: "home" | "about" };

type AboutContent = { eyebrow: string; paragraphs: string; images: string[] };
const inlineSectionFields = ["eyebrow", "title", "content", "buttonText", "buttonLink"] as const;

const defaultAboutContent: AboutContent = {
  eyebrow: "A small place with a big horizon",
  paragraphs: "La Conchita sits between the coastal bluffs and the Pacific, a compact neighborhood shaped by salt air, ocean views, and the easy familiarity of people who know the same stretch of beach.\n\nThe community shares responsibility for the paths, common areas, neighborhood gatherings, and the practical work of caring for a place this close to the water. Residents are always welcome to take part and stay informed.\n\nThis site is our public front door. Residents have a second, private door for directory lookups, community requests, shared documents, and the announcements that keep everyday life moving.",
  images: [],
};

export default function PageBuilder() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirtySectionIds, setDirtySectionIds] = useState<Set<string>>(new Set());
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
  const [restoringSectionId, setRestoringSectionId] = useState<string | null>(null);
  const [updatingVisibilitySectionId, setUpdatingVisibilitySectionId] = useState<string | null>(null);
  const [aboutContent, setAboutContent] = useState<AboutContent>(defaultAboutContent);
  const [originalAboutContent, setOriginalAboutContent] = useState<AboutContent>(defaultAboutContent);
  const [originalPreparednessContent, setOriginalPreparednessContent] = useState<CommunityPreparednessContent>(defaultCommunityPreparednessContent);
  const [originalHomePageContent, setOriginalHomePageContent] = useState<HomePageContent>(defaultHomePageContent);
  const originalSections = useRef<Map<string, Section>>(new Map());
  const sectionsRef = useRef<Section[]>(sections);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutImageUploading, setAboutImageUploading] = useState(false);
  const aboutImageInputRef = useRef<HTMLInputElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<Array<{ _id: string; title: string; fileUrl: string }>>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<"about" | "section">("about");
  const [gallerySelectedUrls, setGallerySelectedUrls] = useState<string[]>([]);
  const [preparednessContent, setPreparednessContent] = useState<CommunityPreparednessContent>(defaultCommunityPreparednessContent);
  const [preparednessSaving, setPreparednessSaving] = useState(false);
  const [homePageContent, setHomePageContent] = useState<HomePageContent>(defaultHomePageContent);
  const [homePageSaving, setHomePageSaving] = useState(false);
  const [homeImageTarget, setHomeImageTarget] = useState<"headerLogoUrl" | "heroImageUrl" | "lifeImageUrl" | "aboutImageUrl">("heroImageUrl");
  const homeImageInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"home" | "about">("home");

  // View state: 'list' | 'create' | 'edit'
  const [view, setView] = useState<"list" | "choose" | "create" | "edit">("list");
  const [requestedSlot, setRequestedSlot] = useState<Section["slot"]>("below-hero");
  const [wizardStep, setWizardStep] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<LeaveTarget | null>(null);
  const [savingBeforeLeave, setSavingBeforeLeave] = useState(false);
  const [originalFormSnapshot, setOriginalFormSnapshot] = useState("");
  const bypassBeforeUnload = useRef(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formLayout, setFormLayout] = useState<Section["layout"]>("full-width");
  const [formEyebrow, setFormEyebrow] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formButtonText, setFormButtonText] = useState("");
  const [formButtonLink, setFormButtonLink] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImageUrls, setFormImageUrls] = useState<string[]>([]);
  const [formSlot, setFormSlot] = useState<Section["slot"]>("below-hero");
  const [formVisibility, setFormVisibility] = useState<PageSectionVisibility>("everyone");
  const [formIsActive, setFormIsActive] = useState(true);
  const [flyerPreviewOpen, setFlyerPreviewOpen] = useState(false);

  function getFormSnapshot() {
    return JSON.stringify({
      name: formName,
      layout: formLayout,
      eyebrow: formEyebrow,
      title: formTitle,
      content: formContent,
      buttonText: formButtonText,
      buttonLink: formButtonLink,
      imageUrl: formImageUrl,
      imageUrls: formImageUrls,
      slot: formSlot,
      visibility: formVisibility,
      isActive: formIsActive,
    });
  }

  const hasUnsavedChanges =
    JSON.stringify(homePageContent) !== JSON.stringify(originalHomePageContent) ||
    JSON.stringify(aboutContent) !== JSON.stringify(originalAboutContent) ||
    JSON.stringify(preparednessContent) !== JSON.stringify(originalPreparednessContent) ||
    dirtySectionIds.size > 0 ||
    ((view === "create" || view === "edit") && getFormSnapshot() !== originalFormSnapshot);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const collectionFileInputRef = useRef<HTMLInputElement>(null);

  // Document Selector state
  const [docSelectorOpen, setDocSelectorOpen] = useState(false);
  const [docSelectorTarget, setDocSelectorTarget] = useState<"image" | "link">("image");
  const [availableDocs, setAvailableDocs] = useState<Array<{ _id: string; title: string; category: string; fileUrl: string }>>([]);
  const [docSearchQuery, setDocSelectorSearchQuery] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

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

  // 1. Fetch sections and page content
  async function loadData(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/admin/page-builder");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load builder data");
      const loadedSections: Section[] = data.sections || [];
      setSections(loadedSections);
      originalSections.current = new Map(loadedSections.map((section) => [section._id, section]));
      setDirtySectionIds(new Set());
      const loadedAboutContent = data.aboutContent
        ? { ...defaultAboutContent, ...data.aboutContent }
        : defaultAboutContent;
      const loadedPreparednessContent = data.preparednessContent
        ? { ...defaultCommunityPreparednessContent, ...data.preparednessContent }
        : defaultCommunityPreparednessContent;
      setAboutContent(loadedAboutContent);
      setOriginalAboutContent(loadedAboutContent);
      setPreparednessContent(loadedPreparednessContent);
      setOriginalPreparednessContent(loadedPreparednessContent);
      if (data.homePageContent && isHomePageContent(data.homePageContent)) {
        setHomePageContent(data.homePageContent);
        setOriginalHomePageContent(data.homePageContent);
      } else {
        setHomePageContent(defaultHomePageContent);
        setOriginalHomePageContent(defaultHomePageContent);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function savePreparednessContent(): Promise<boolean> {
    setPreparednessSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/page-builder", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settingKey: "community-preparedness-content", value: preparednessContent }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save Community Preparedness content");
      setOriginalPreparednessContent(preparednessContent);
      showSuccess("Community Preparedness content saved successfully.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Community Preparedness content");
      return false;
    } finally {
      setPreparednessSaving(false);
    }
  }

  async function saveHomePageContent(): Promise<boolean> {
    setHomePageSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingKey: "home-page-content", value: homePageContent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to save Home page content");
      setOriginalHomePageContent(homePageContent);
      showSuccess("Home page content saved successfully.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Home page content");
      return false;
    } finally {
      setHomePageSaving(false);
    }
  }

  function updateHomePageField<K extends keyof HomePageContent>(field: K, value: HomePageContent[K]) {
    setHomePageContent((current) => ({ ...current, [field]: value }));
  }

  function updateHomeService(
    index: number,
    field: keyof HomePageContent["services"][number],
    value: string,
  ) {
    setHomePageContent((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, [field]: value } : service,
      ),
    }));
  }

  function updateHomeNavItem(index: number, field: "label" | "href", value: string) {
    setHomePageContent((current) => ({
      ...current,
      navItems: current.navItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  async function handleHomeImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadHomepageImage(file);
      updateHomePageField(homeImageTarget, url);
      showSuccess("Homepage image updated. Save Home Page to publish it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Homepage image upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function saveAboutContent(): Promise<boolean> {
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
      setOriginalAboutContent(aboutContent);
      showSuccess("About page content saved successfully.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save About page content");
      return false;
    } finally {
      setAboutSaving(false);
    }
  }

  function updateAboutParagraph(index: number, paragraph: string) {
    setAboutContent((current) => {
      const paragraphs = current.paragraphs.split(/\n\s*\n/);
      paragraphs[index] = paragraph;
      return { ...current, paragraphs: paragraphs.join("\n\n") };
    });
  }

  function addAboutParagraph() {
    setAboutContent((current) => ({
      ...current,
      paragraphs: [current.paragraphs.trim(), "New paragraph"].filter(Boolean).join("\n\n"),
    }));
  }

  function removeAboutParagraph(index: number) {
    setAboutContent((current) => ({
      ...current,
      paragraphs: current.paragraphs
        .split(/\n\s*\n/)
        .filter((_, paragraphIndex) => paragraphIndex !== index)
        .join("\n\n"),
    }));
  }

  async function openGallery(target: "about" | "section") {
    setGalleryTarget(target);
    setGallerySelectedUrls([]);
    setGalleryOpen(true);
    setGalleryLoading(true);
    try {
      const response = await fetch("/api/admin/documents");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load gallery");
      setGalleryPhotos((data.documents ?? []).filter((photo: { title?: string; fileUrl?: string }) => photo.fileUrl && photo.title?.match(/\.(avif|gif|jpe?g|png|webp)$/i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load gallery");
    } finally {
      setGalleryLoading(false);
    }
  }

  function chooseGalleryImage(imageUrl: string) {
    if (galleryTarget === "about") {
      setAboutContent((current) =>
        current.images.includes(imageUrl) ? current : { ...current, images: [...current.images, imageUrl] },
      );
      setGalleryOpen(false);
    } else {
      setGallerySelectedUrls((current) =>
        current.includes(imageUrl)
          ? current.filter((url) => url !== imageUrl)
          : [...current, imageUrl],
      );
    }
  }

  function addSelectedGalleryImages() {
    setFormImageUrls((current) => [...current, ...gallerySelectedUrls.filter((url) => !current.includes(url))]);
    setGalleryOpen(false);
  }

  async function handleCollectionImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    setError(null);
    const failedFiles: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        failedFiles.push(`${file.name}: not an image`);
        continue;
      }
      try {
        const url = await uploadHomepageImage(file);
        setFormImageUrls((current) => current.includes(url) ? current : [...current, url]);
      } catch (err) {
        failedFiles.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
    }
    setUploading(false);
    event.target.value = "";
    if (failedFiles.length) {
      setError(`Some images could not be uploaded. ${failedFiles.join("; ")}`);
    } else {
      showSuccess(`${files.length} image${files.length === 1 ? "" : "s"} added.`);
    }
  }

  async function handleAboutImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAboutImageUploading(true);
    setError(null);
    try {
      const url = await uploadHomepageImage(file);
      setAboutContent((current) => ({ ...current, images: [...current.images, url] }));
      showSuccess("About page image added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setAboutImageUploading(false);
      event.target.value = "";
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData(false);
    });
  }, []);

  // 3. Helper to display success message
  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  // 4. Open creator wizard
  function openCreate(slot?: Section["slot"]) {
    const targetSlot = slot ?? requestedSlot;
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
    setFormImageUrls([]);
    setFormSlot(targetSlot ?? (activeTab === "about" ? "about-below-content" : "below-hero"));
    setFormVisibility("everyone");
    setFormIsActive(true);
    setOriginalFormSnapshot(JSON.stringify({
      name: "",
      layout: "full-width",
      eyebrow: "",
      title: "",
      content: "",
      buttonText: "",
      buttonLink: "",
      imageUrl: "",
      imageUrls: [],
      slot: targetSlot ?? (activeTab === "about" ? "about-below-content" : "below-hero"),
      visibility: "everyone",
      isActive: true,
    }));
    setWizardStep(1);
    setView("create");
  }

  function openSectionOptions(slot?: Section["slot"]) {
    setRequestedSlot(slot ?? (activeTab === "about" ? "about-below-content" : "below-hero"));
    setError(null);
    setSuccess(null);
    setView("choose");
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
    setFormImageUrl(sec.imageUrl || sec.imageUrls?.[0] || "");
    setFormImageUrls(sec.imageUrls ?? (sec.imageUrl ? [sec.imageUrl] : []));
    setFormSlot(sec.slot);
    setFormVisibility(sec.visibility ?? "everyone");
    setFormIsActive(sec.isActive);
    setOriginalFormSnapshot(JSON.stringify({
      name: sec.name,
      layout: sec.layout,
      eyebrow: sec.eyebrow || "",
      title: sec.title || "",
      content: sec.content,
      buttonText: sec.buttonText || "",
      buttonLink: sec.buttonLink || "",
      imageUrl: sec.imageUrl || sec.imageUrls?.[0] || "",
      imageUrls: sec.imageUrls ?? (sec.imageUrl ? [sec.imageUrl] : []),
      slot: sec.slot,
      visibility: sec.visibility ?? "everyone",
      isActive: sec.isActive,
    }));
    setWizardStep(1);
    setView("edit");
  }

  function updateInlineSection(
    id: string,
    field: "eyebrow" | "title" | "content" | "buttonText" | "buttonLink",
    value: string,
  ) {
    updateInlineSectionFields(id, { [field]: value });
  }

  function updateInlineSectionFields(
    id: string,
    updates: Partial<Pick<Section, "eyebrow" | "title" | "content" | "buttonText" | "buttonLink">>,
  ) {
    const updatedSection = sections.find((section) => section._id === id);
    if (!updatedSection) return;
    const nextSection = { ...updatedSection, ...updates };
    const original = originalSections.current.get(id);
    const hasChanges = !original || inlineSectionFields.some((key) => original[key] !== nextSection[key]);

    setSections((current) => current.map((section) => (section._id === id ? nextSection : section)));
    setDirtySectionIds((current) => {
      const next = new Set(current);
      if (hasChanges) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function saveInlineSection(section: Section): Promise<boolean> {
    setSavingSectionId(section._id);
    setError(null);
    const { _id, ...updates } = section;
    try {
      const response = await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: _id, ...updates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to save section");
      originalSections.current.set(_id, section);
      const latestSection = sectionsRef.current.find((item) => item._id === _id);
      const hasChanges = latestSection
        ? inlineSectionFields.some((field) => latestSection[field] !== section[field])
        : false;
      setDirtySectionIds((current) => {
        const next = new Set(current);
        if (hasChanges) next.add(_id);
        else next.delete(_id);
        return next;
      });
      showSuccess(`Section "${section.name}" saved successfully.`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save section");
      return false;
    } finally {
      setSavingSectionId(null);
    }
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
  async function saveSection(): Promise<boolean> {
    const isFlyer = formLayout === "single-image-flyer";
    const isImageCollection = isImageCollectionLayout(formLayout);
    if (!isFlyer && !formName.trim()) {
      setError("Reference Name is required.");
      return false;
    }
    if (isImageCollection ? formImageUrls.length === 0 : isFlyer ? !formImageUrl : !formContent.trim()) {
      setError(
        isImageCollection
          ? "Add at least one image to the gallery or carousel."
          : isFlyer
          ? "Upload a flyer image before saving."
          : "Section content is required."
      );
      return false;
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
      imageUrl: isImageCollection ? formImageUrls[0] : formImageUrl,
      imageUrls: isImageCollection ? formImageUrls : undefined,
      slot: formSlot,
      visibility: formVisibility,
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
      await loadData(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function completeLeave(target: LeaveTarget) {
    setPendingLeave(null);
    if (target.type === "url") {
      bypassBeforeUnload.current = true;
      window.location.assign(target.href);
    } else if (target.type === "list") {
      setView("list");
    } else {
      setActiveTab(target.tab);
    }
  }

  function requestLeave(target: LeaveTarget) {
    if (hasUnsavedChangesRef.current) {
      setPendingLeave(target);
      return;
    }
    completeLeave(target);
  }

  async function saveBeforeLeave() {
    if (!pendingLeave) return;
    const target = pendingLeave;
    setSavingBeforeLeave(true);
    setError(null);
    try {
      if (JSON.stringify(homePageContent) !== JSON.stringify(originalHomePageContent)) {
        if (!(await saveHomePageContent())) return;
      }
      if (JSON.stringify(aboutContent) !== JSON.stringify(originalAboutContent)) {
        if (!(await saveAboutContent())) return;
      }
      if (JSON.stringify(preparednessContent) !== JSON.stringify(originalPreparednessContent)) {
        if (!(await savePreparednessContent())) return;
      }
      for (const id of dirtySectionIds) {
        const section = sections.find((item) => item._id === id);
        if (section && !(await saveInlineSection(section))) return;
      }
      if (
        (view === "create" || view === "edit") &&
        getFormSnapshot() !== originalFormSnapshot &&
        !(await saveSection())
      ) {
        return;
      }
      completeLeave(target);
    } finally {
      setSavingBeforeLeave(false);
    }
  }

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChangesRef.current || bypassBeforeUnload.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function guardLinkNavigation(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (
        !link ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        !link.href ||
        !hasUnsavedChangesRef.current
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setPendingLeave({ type: "url", href: link.href });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", guardLinkNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", guardLinkNavigation, true);
    };
  }, []);

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

  async function updateSectionVisibility(
    sec: Section,
    visibility: "everyone" | "residents",
  ) {
    if ((sec.visibility ?? "everyone") === visibility) return;

    setUpdatingVisibilitySectionId(sec._id);
    setError(null);
    try {
      const response = await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sec._id, visibility }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to update section audience");
      setSections((current) =>
        current.map((section) =>
          section._id === sec._id ? { ...section, visibility } : section,
        ),
      );
      originalSections.current.set(sec._id, { ...sec, visibility });
      showSuccess(`Section "${sec.name}" is now ${visibility === "residents" ? "Residents Only" : "Public"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update section audience");
    } finally {
      setUpdatingVisibilitySectionId(null);
    }
  }

  async function restoreSection(sec: Section, slot: Section["slot"]) {
    setRestoringSectionId(sec._id);
    setError(null);
    try {
      const nextOrder = sections
        .filter((section) => section.slot === slot)
        .reduce((maxOrder, section) => Math.max(maxOrder, section.order), -1) + 1;
      const response = await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sec._id, slot, isActive: true, order: nextOrder }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to restore section");
      showSuccess(`Section "${sec.name}" restored to the page.`);
      await loadData(true);
      if (view === "choose") setView("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore section");
    } finally {
      setRestoringSectionId(null);
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
        imageUrls: sec.imageUrls,
        buttonText: sec.buttonText,
        buttonLink: sec.buttonLink,
        visibility: sec.visibility ?? "everyone",
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

  const sectionsBySlot = PAGE_SECTION_SLOTS.map(({ value, label }) => ({
    value,
    label,
    sections: [...sections.filter((section) => section.slot === value && section.isActive)].sort((a, b) => a.order - b.order),
  }));
  const savedSections = [...sections.filter((section) => !section.isActive)]
    .sort((a, b) => a.name.localeCompare(b.name));
  const aboutParagraphs = aboutContent.paragraphs
    ? aboutContent.paragraphs.split(/\n\s*\n/)
    : [""];
  const formIsImageCollection = isImageCollectionLayout(formLayout);
  const stepLabels = [
    "Layout",
    formLayout === "single-image-flyer" || isImageCollectionLayout(formLayout) ? "Images" : "Content",
    "Preview",
    "Insertion",
  ];
  const renderSlot = (slot: Section["slot"]) => {
    const slotDetails = sectionsBySlot.find((item) => item.value === slot);
    if (!slotDetails) return null;
    return (
      <PageBuilderSectionSlot
        key={slot}
        slot={slot}
        label={slotDetails.label}
        sections={slotDetails.sections}
        dirtySectionIds={dirtySectionIds}
        savingSectionId={savingSectionId}
        updatingVisibilitySectionId={updatingVisibilitySectionId}
        onAdd={openSectionOptions}
        onSave={(section) => void saveInlineSection(section)}
        onMove={(index, direction, slotSections) => void moveOrder(index, direction, slotSections)}
        onToggle={(section) => void toggleSectionActive(section)}
        onVisibilityChange={(section, visibility) =>
          void updateSectionVisibility(section, visibility)
        }
        onClone={(section) => void cloneSection(section)}
        onEdit={openEdit}
        onDelete={(id, name) => void deleteSection(id, name)}
        onUpdate={updateInlineSection}
        onUpdateLink={(id, label, url) =>
          updateInlineSectionFields(id, { buttonText: label, buttonLink: url })
        }
      />
    );
  };
  const renderSiteHeader = () => (
    <div className="site-header flex min-h-20 items-center justify-between gap-5 px-5 py-4 text-white sm:px-8" aria-label="Site header preview">
      <div className="flex items-center gap-3">
        <span className="group/logo relative grid h-10 w-10 place-items-center rounded-full bg-white/15">
          <NextImage src={getProxyUrl(homePageContent.headerLogoUrl)} alt="" width={36} height={36} unoptimized />
          <button type="button" onClick={() => { setHomeImageTarget("headerLogoUrl"); homeImageInputRef.current?.click(); }} disabled={uploading} className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-deep-ocean/90 px-2 py-1 text-[8px] font-bold uppercase text-white">
            Change logo
          </button>
        </span>
        <span className="min-w-0">
          <InlineEditableText label="Header brand name" value={homePageContent.headerTitle} onChange={(value) => updateHomePageField("headerTitle", value)} className="block text-base font-semibold text-white" />
          <InlineEditableText label="Header brand subtitle" value={homePageContent.headerSubtitle} onChange={(value) => updateHomePageField("headerSubtitle", value)} className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-white/70" />
        </span>
      </div>
      <nav className="hidden items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 sm:flex" aria-label="Preview navigation">
        {homePageContent.navItems.map((item, index) => (
          <InlineEditableLink
            key={`nav-${index}`}
            label={item.label}
            url={item.href}
            onSave={(label, href) => {
              updateHomeNavItem(index, "label", label);
              updateHomeNavItem(index, "href", href);
            }}
            className="text-white/80"
          />
        ))}
      </nav>
      <span className="rounded-full border border-white/45 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-white">
        <InlineEditableLink
          label={homePageContent.headerLoginText}
          url={homePageContent.headerLoginHref}
          onSave={(label, href) => setHomePageContent((current) => ({ ...current, headerLoginText: label, headerLoginHref: href }))}
          className="text-white"
        />
      </span>
      <span className="sm:hidden">
        <InlineEditableText label="Mobile navigation label" value={homePageContent.headerExploreLabel} onChange={(value) => updateHomePageField("headerExploreLabel", value)} className="text-[9px] font-bold uppercase text-white" />
      </span>
    </div>
  );
  const renderSiteFooter = () => (
    <footer className="bg-ink px-6 py-8 text-white sm:px-8" aria-label="Site footer preview">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <InlineEditableText label="Footer site name" value={homePageContent.footerTitle} onChange={(value) => updateHomePageField("footerTitle", value)} className="block text-sm font-semibold text-white" />
          <InlineEditableText label="Footer location" value={homePageContent.footerSubtitle} onChange={(value) => updateHomePageField("footerSubtitle", value)} className="mt-1 block text-[9px] uppercase tracking-[0.2em] text-white/45" />
        </div>
        <InlineEditableText label="Footer tagline" value={homePageContent.footerTagline} onChange={(value) => updateHomePageField("footerTagline", value)} className="text-xs text-white/60" />
        <span className="text-white/60">© {new Date().getFullYear()} <InlineEditableText label="Footer copyright name" value={homePageContent.footerCopyright} onChange={(value) => updateHomePageField("footerCopyright", value)} className="text-white/60" /></span>
      </div>
    </footer>
  );

  return (
    <div className="min-w-0 rounded-2xl border border-marina/15 bg-white p-4 shadow-xl shadow-deep-ocean/5 sm:rounded-3xl sm:p-6">
      {/* Header with Title */}
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
            <button
              type="button"
              onClick={() => openSectionOptions()}
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

      {pendingLeave && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-deep-ocean/65 p-4"
          role="presentation"
        >
          <section
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-changes-title"
          >
            <h2 id="unsaved-changes-title" className="text-lg font-bold text-ink">
              Save your changes?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              You have unsaved page changes. Save them before leaving?
            </p>
            {error && <p className="mt-3 text-xs font-medium text-coral">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => completeLeave(pendingLeave)}
                disabled={savingBeforeLeave}
                className="min-h-10 rounded-full border border-ink/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink/70 hover:bg-sand disabled:opacity-60"
              >
                Leave without saving
              </button>
              <button
                type="button"
                onClick={() => setPendingLeave(null)}
                disabled={savingBeforeLeave}
                className="min-h-10 rounded-full border border-marina/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-marina hover:bg-sand disabled:opacity-60"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => void saveBeforeLeave()}
                disabled={savingBeforeLeave}
                className="min-h-10 rounded-full bg-marina px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-marina-light disabled:opacity-60"
              >
                {savingBeforeLeave ? "Saving..." : "Save changes"}
              </button>
            </div>
          </section>
        </div>
      )}

      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-deep-ocean/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose images from the gallery"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-ink">Choose from gallery</h4>
                <p className="mt-1 text-xs text-ink/60">
                  {galleryTarget === "section"
                    ? `${gallerySelectedUrls.length} image${gallerySelectedUrls.length === 1 ? "" : "s"} selected.`
                    : "Select an image to add to the About page carousel."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="rounded-full px-3 py-2 text-xs font-bold text-ink/60 hover:bg-sand"
              >
                Close
              </button>
            </div>
            {galleryLoading ? (
              <p className="py-10 text-center text-sm text-ink/60">Loading gallery...</p>
            ) : galleryPhotos.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink/60">No gallery images found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryPhotos.map((photo) => {
                  const selected = gallerySelectedUrls.includes(photo.fileUrl);
                  return (
                    <button
                      key={photo._id}
                      type="button"
                      aria-pressed={galleryTarget === "section" ? selected : undefined}
                      onClick={() => chooseGalleryImage(photo.fileUrl)}
                      className={`group relative aspect-[4/3] overflow-hidden rounded-xl bg-sand text-left ${
                        selected ? "ring-4 ring-marina" : ""
                      }`}
                    >
                      <NextImage
                        src={getProxyUrl(photo.fileUrl)}
                        alt={photo.title}
                        fill
                        sizes="240px"
                        className="object-cover transition group-hover:scale-105"
                        unoptimized
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-deep-ocean/75 px-2 py-1 text-[10px] font-semibold text-white">
                        {photo.title}
                      </span>
                      {selected && (
                        <span className="absolute right-2 top-2 rounded-full bg-marina p-1 text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {galleryTarget === "section" && (
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={addSelectedGalleryImages}
                  disabled={gallerySelectedUrls.length === 0}
                  className="min-h-10 rounded-full bg-marina px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-marina-light disabled:opacity-50"
                >
                  Add selected images
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- VIEW: LIST / DASHBOARD ----------------- */}
      {view === "list" && (
        <div className="mt-6 space-y-8">
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-marina/15 bg-sand/40 p-1 sm:gap-2 sm:p-1.5" role="tablist" aria-label="Choose a page to edit">
            {([
              ["home", "Home Page"],
              ["about", "About Page"],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`min-h-11 rounded-xl px-2 py-2 text-[10px] font-bold uppercase leading-tight tracking-wider transition sm:px-4 sm:text-xs ${
                  activeTab === tab ? "bg-white text-marina shadow-sm" : "text-ink/55 hover:bg-white/60 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-relaxed text-ink/60">
              {activeTab === "home"
                ? "Edit text and links in place, change the page images, then Save Home Page. Preparedness content has its own save control."
                : "About page copy and imagery are shown in context. Click any text block to edit it directly."}
            </p>
            <a
              href={activeTab === "home" ? "/" : "/about"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center rounded-full border border-marina/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-marina transition hover:bg-sand"
            >
              View live page
            </a>
            {activeTab === "home" && (
              <button
                type="button"
                onClick={() => void saveHomePageContent()}
                disabled={homePageSaving || uploading}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-marina px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-marina-light disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                {homePageSaving ? "Saving..." : "Save Home Page"}
              </button>
            )}
          </div>

          {activeTab === "home" && (
            <div className="overflow-hidden rounded-2xl border border-marina/20 bg-white shadow-sm">
              <input
                ref={homeImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleHomeImageUpload}
                className="hidden"
              />
              {renderSiteHeader()}
              <div aria-label="Homepage full-page preview">
                <section
                  className="hero-beach relative grid min-h-[440px] place-items-center px-6 py-16 text-center text-white sm:min-h-[520px]"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(3, 30, 44, 0.68), rgba(3, 55, 73, 0.5) 46%, rgba(3, 35, 48, 0.68)), url("${getProxyUrl(homePageContent.heroImageUrl)}")`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setHomeImageTarget("heroImageUrl");
                      homeImageInputRef.current?.click();
                    }}
                    disabled={uploading}
                    className="absolute right-4 top-4 z-20 rounded-full bg-deep-ocean/75 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-white disabled:opacity-60"
                  >
                    {uploading && homeImageTarget === "heroImageUrl" ? "Uploading..." : "Change hero image"}
                  </button>
                  <div className="relative z-10 max-w-3xl">
                    <InlineEditableText
                      label="Homepage hero eyebrow"
                      value={homePageContent.heroEyebrow}
                      onChange={(value) => updateHomePageField("heroEyebrow", value)}
                      textAlign="center"
                      className="eyebrow text-white/80"
                    />
                    <h1 className="mt-4 text-5xl font-bold uppercase leading-[0.92] tracking-[-0.055em] drop-shadow-md sm:text-7xl">
                      <InlineEditableText label="Homepage hero title" value={homePageContent.heroTitle} onChange={(value) => updateHomePageField("heroTitle", value)} textAlign="center" className="inline-block" />
                      <InlineEditableText label="Homepage hero subtitle" value={homePageContent.heroSubtitle} onChange={(value) => updateHomePageField("heroSubtitle", value)} textAlign="center" className="mt-2 block w-full text-white/95" />
                    </h1>
                    <InlineEditableText
                      label="Homepage hero description"
                      value={homePageContent.heroDescription}
                      onChange={(value) => updateHomePageField("heroDescription", value)}
                      textAlign="center"
                      multiline
                      rows={3}
                      className="mx-auto mt-6 block max-w-xl text-sm leading-7 text-white/90 sm:text-base"
                    />
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <span className="rounded-full bg-marina px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white">
                        <InlineEditableText label="Weather button label" value={homePageContent.heroWeatherLabel} onChange={(value) => updateHomePageField("heroWeatherLabel", value)} />
                      </span>
                      <span className="rounded-full border border-white/55 bg-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white">
                        <InlineEditableLink
                          label={homePageContent.heroLinkText}
                          url={homePageContent.heroLinkHref}
                          onSave={(label, href) => setHomePageContent((current) => ({ ...current, heroLinkText: label, heroLinkHref: href }))}
                          className="text-white"
                        />
                      </span>
                    </div>
                  </div>
                </section>
                {renderSlot("below-hero")}

                <section className="bg-white px-6 py-14 sm:px-10 sm:py-16">
                  <div className="mx-auto max-w-6xl">
                    <div className="mx-auto mb-9 max-w-2xl text-center">
                      <InlineEditableText label="Services eyebrow" value={homePageContent.servicesEyebrow} onChange={(value) => updateHomePageField("servicesEyebrow", value)} className="eyebrow text-marina" />
                      <InlineEditableText label="Services heading" value={homePageContent.servicesTitle} onChange={(value) => updateHomePageField("servicesTitle", value)} className="mt-3 block w-full text-center text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl" />
                      <InlineEditableText label="Services description" value={homePageContent.servicesDescription} onChange={(value) => updateHomePageField("servicesDescription", value)} multiline rows={3} className="mt-4 block w-full text-center text-sm text-ink/60" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {homePageContent.services.map((service, index) => (
                        <article key={`service-${index}`} data-mark={String(index + 1).padStart(2, "0")} className="service-card rounded-2xl p-5">
                          <button
                            type="button"
                            onClick={() => updateHomePageField("services", homePageContent.services.filter((_, serviceIndex) => serviceIndex !== index))}
                            aria-label={`Remove service card ${index + 1}`}
                            className="mb-2 rounded-full bg-coral/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-coral"
                          >
                            Remove card
                          </button>
                          <InlineEditableText label={`Service ${index + 1} title`} value={service.title} onChange={(value) => updateHomeService(index, "title", value)} className="block text-xs font-bold uppercase tracking-[0.08em] text-ink" />
                          <InlineEditableText label={`Service ${index + 1} description`} value={service.description} onChange={(value) => updateHomeService(index, "description", value)} multiline rows={3} className="mt-3 block w-full text-xs leading-6 text-ink/60" />
                          <span className="mt-4 inline-flex text-[10px] font-bold uppercase tracking-wider text-marina">
                            <InlineEditableLink
                              label={service.actionText}
                              url={service.href}
                              onSave={(label, href) => {
                                updateHomeService(index, "actionText", label);
                                updateHomeService(index, "href", href);
                              }}
                            /> →
                          </span>
                        </article>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateHomePageField("services", [...homePageContent.services, { title: "New service", description: "Add a short description.", actionText: "Open portal", href: "/sign-in" }])}
                      disabled={homePageContent.services.length >= 12}
                      className="mt-4 rounded-full border border-dashed border-marina/40 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-marina disabled:opacity-50"
                    >
                      <Plus className="mr-1 inline h-3 w-3" /> Add service card
                    </button>
                  </div>
                </section>
                {renderSlot("below-services")}

                <CommunityPreparednessEditor
                  value={preparednessContent}
                  onChange={setPreparednessContent}
                  onSave={savePreparednessContent}
                  saving={preparednessSaving}
                />

                <section className="grid bg-sand md:grid-cols-2">
                  <div className="relative min-h-64 bg-cover bg-center sm:min-h-[360px]" style={{ backgroundImage: `url("${getProxyUrl(homePageContent.lifeImageUrl)}")` }}>
                    <button type="button" onClick={() => { setHomeImageTarget("lifeImageUrl"); homeImageInputRef.current?.click(); }} disabled={uploading} className="absolute right-3 top-3 rounded-full bg-deep-ocean/75 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-white disabled:opacity-60">
                      {uploading && homeImageTarget === "lifeImageUrl" ? "Uploading..." : "Change image"}
                    </button>
                  </div>
                  <div className="flex items-center px-7 py-12 sm:px-12 sm:py-14">
                    <div className="max-w-lg">
                      <InlineEditableText label="Life section eyebrow" value={homePageContent.lifeEyebrow} onChange={(value) => updateHomePageField("lifeEyebrow", value)} className="eyebrow text-marina" />
                      <InlineEditableText label="Life section heading" value={homePageContent.lifeTitle} onChange={(value) => updateHomePageField("lifeTitle", value)} className="mt-3 block w-full text-2xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-3xl" />
                      <InlineEditableText label="Life section description" value={homePageContent.lifeDescription} onChange={(value) => updateHomePageField("lifeDescription", value)} multiline rows={4} className="mt-4 block w-full text-sm leading-7 text-ink/65" />
                      <span className="mt-6 inline-flex rounded-full bg-marina px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                        <InlineEditableLink
                          label={homePageContent.lifeButtonText}
                          url={homePageContent.lifeButtonHref}
                          onSave={(label, href) => setHomePageContent((current) => ({ ...current, lifeButtonText: label, lifeButtonHref: href }))}
                          className="text-white"
                        />
                      </span>
                    </div>
                  </div>
                </section>

                <section className="bg-marina px-6 py-10 text-white sm:px-10 sm:py-12">
                  <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                    <div>
                      <InlineEditableText label="Community CTA eyebrow" value={homePageContent.communityEyebrow} onChange={(value) => updateHomePageField("communityEyebrow", value)} className="eyebrow text-white/65" />
                      <InlineEditableText label="Community CTA heading" value={homePageContent.communityTitle} onChange={(value) => updateHomePageField("communityTitle", value)} className="mt-2 block w-full text-2xl font-bold uppercase tracking-[-0.04em] sm:text-3xl" />
                    </div>
                    <span className="inline-flex rounded-full bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-marina">
                      <InlineEditableLink
                        label={homePageContent.communityButtonText}
                        url={homePageContent.communityButtonHref}
                        onSave={(label, href) => setHomePageContent((current) => ({ ...current, communityButtonText: label, communityButtonHref: href }))}
                      />
                    </span>
                  </div>
                </section>

                <section className="grid bg-sand md:grid-cols-2">
                  <div className="flex items-center px-7 py-12 sm:px-12 sm:py-14">
                    <div className="max-w-lg">
                      <InlineEditableText label="Homepage about eyebrow" value={homePageContent.aboutEyebrow} onChange={(value) => updateHomePageField("aboutEyebrow", value)} className="eyebrow text-marina" />
                      <InlineEditableText label="Homepage about heading" value={homePageContent.aboutTitle} onChange={(value) => updateHomePageField("aboutTitle", value)} className="mt-3 block w-full text-2xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-3xl" />
                      {homePageContent.aboutParagraphs.map((paragraph, index) => (
                        <div key={`home-about-${index}`} className="mt-4 flex items-start gap-2">
                          <InlineEditableText
                            label={`Homepage about paragraph ${index + 1}`}
                            value={paragraph}
                            onChange={(value) => updateHomePageField("aboutParagraphs", homePageContent.aboutParagraphs.map((item, itemIndex) => itemIndex === index ? value : item))}
                            multiline
                            rows={3}
                            className="block w-full flex-1 text-sm leading-7 text-ink/65"
                          />
                          <button
                            type="button"
                            onClick={() => updateHomePageField("aboutParagraphs", homePageContent.aboutParagraphs.filter((_, paragraphIndex) => paragraphIndex !== index))}
                            aria-label={`Remove homepage about paragraph ${index + 1}`}
                            className="shrink-0 rounded-full bg-coral/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-coral"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateHomePageField("aboutParagraphs", [...homePageContent.aboutParagraphs, "New paragraph"])}
                        className="mt-3 rounded-full border border-dashed border-marina/40 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-marina"
                      >
                        <Plus className="mr-1 inline h-3 w-3" /> Add paragraph
                      </button>
                    </div>
                  </div>
                  <div className="relative min-h-64 bg-cover bg-center sm:min-h-[360px]" style={{ backgroundImage: `url("${getProxyUrl(homePageContent.aboutImageUrl)}")` }}>
                    <button type="button" onClick={() => { setHomeImageTarget("aboutImageUrl"); homeImageInputRef.current?.click(); }} disabled={uploading} className="absolute right-3 top-3 rounded-full bg-deep-ocean/75 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-white disabled:opacity-60">
                      {uploading && homeImageTarget === "aboutImageUrl" ? "Uploading..." : "Change image"}
                    </button>
                  </div>
                </section>
                {renderSlot("above-footer")}
              </div>
              {renderSiteFooter()}
            </div>
          )}

          {activeTab === "about" && (
            <div className="overflow-hidden rounded-2xl border border-marina/20 bg-white shadow-sm">
              {renderSiteHeader()}
              <div aria-label="About page full-page preview">
              <div className="subpage-hero">
                <div>
                <p className="eyebrow text-white/75">Since 1924</p>
                <h1 className="mt-3 text-4xl font-bold uppercase tracking-[-0.05em] sm:text-6xl">About La Conchita</h1>
                </div>
              </div>
              {renderSlot("about-below-hero")}
              <section className="overflow-hidden bg-white">
              <div className="bg-sand/35 p-3 sm:p-6">
                <div className="content-card mx-auto max-w-3xl px-5 py-8 sm:px-10 sm:py-12">
                  <InlineEditableText
                    label="About page intro"
                    value={aboutContent.eyebrow}
                    onChange={(eyebrow) => setAboutContent((current) => ({ ...current, eyebrow }))}
                    className="eyebrow text-marina"
                  />
                  <div className="mt-5 space-y-4 text-sm leading-7 text-ink/70 sm:text-base">
                    {aboutParagraphs.map((paragraph, index) => (
                      <div key={`about-paragraph-${index}`} className="flex items-start gap-2">
                        <InlineEditableText
                          label={`About paragraph ${index + 1}`}
                          value={paragraph}
                          onChange={(next) => updateAboutParagraph(index, next)}
                          multiline
                          rows={4}
                          className="block w-full flex-1"
                        />
                        <button
                          type="button"
                          aria-label={`Remove paragraph ${index + 1}`}
                          onClick={() => removeAboutParagraph(index)}
                          className="mt-1 shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-coral transition hover:bg-coral/10"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addAboutParagraph}
                      className="rounded-full border border-dashed border-marina/40 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-marina hover:bg-sand"
                    >
                      Add paragraph
                    </button>
                  </div>
                </div>

                {renderSlot("about-below-content")}

                <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-marina/15 bg-white p-4 sm:p-6">
                  <div className="mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-marina">
                      About page image carousel
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-ink/55">
                      Images are shown below the page copy. Visitors can swipe through them and open a larger preview.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => aboutImageInputRef.current?.click()}
                      disabled={aboutImageUploading}
                      className="min-h-10 rounded-xl bg-marina px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-marina-light disabled:opacity-60"
                    >
                      {aboutImageUploading ? "Uploading..." : "Upload image"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void openGallery("about")}
                      className="min-h-10 rounded-xl border border-marina/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-marina hover:bg-sand"
                    >
                      Choose from gallery
                    </button>
                  </div>
                  <input
                    ref={aboutImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAboutImageUpload}
                    className="hidden"
                  />
                  {aboutContent.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {aboutContent.images.map((image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="group/image relative aspect-[4/3] overflow-hidden rounded-xl bg-sand"
                        >
                          <NextImage
                            src={getProxyUrl(image)}
                            alt={`About carousel image ${index + 1}`}
                            fill
                            sizes="160px"
                            className="object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAboutContent((current) => ({
                                ...current,
                                images: current.images.filter((_, imageIndex) => imageIndex !== index),
                              }))
                            }
                            className="absolute right-2 top-2 rounded-full bg-deep-ocean/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition group-hover/image:opacity-100 focus:opacity-100"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={saveAboutContent}
                      disabled={aboutSaving}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-marina px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-marina-light disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      {aboutSaving ? "Saving..." : "Save About Page"}
                    </button>
                  </div>
                </div>
                <section className="mx-auto mt-8 w-full max-w-6xl px-3 py-8 sm:px-6" aria-label="About page image carousel preview">
                  <div className="mb-5">
                    <p className="eyebrow text-marina">See the neighborhood</p>
                    <h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-3xl">Life by the water</h2>
                  </div>
                  {aboutContent.images.length ? (
                    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
                      {aboutContent.images.map((image, index) => (
                        <div key={`${image}-${index}`} className="relative h-48 w-[80%] shrink-0 snap-center overflow-hidden rounded-2xl bg-sand shadow-lg sm:h-64 sm:w-[min(28rem,42vw)]">
                          <NextImage src={getProxyUrl(image)} alt={`La Conchita neighborhood view ${index + 1}`} fill sizes="(max-width: 640px) 80vw, 42vw" className="object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-marina/25 bg-white px-4 py-8 text-center text-xs text-ink/50">
                      The public image carousel will appear here after images are added above.
                    </p>
                  )}
                </section>
              </div>
            </section>
            {renderSlot("about-above-footer")}
            </div>
            {renderSiteFooter()}
            </div>
          )}

          {false && activeTab === "home" && (
            <CommunityPreparednessEditor
              value={preparednessContent}
              onChange={setPreparednessContent}
              onSave={savePreparednessContent}
              saving={preparednessSaving}
            />
          )}

          {false && (loading && sections.length === 0 ? (
            <p className="text-center text-sm text-ink/65 py-12">Loading page builder details...</p>
          ) : (
            sectionsBySlot
              .filter(({ value: slotName }) =>
                activeTab === "about"
                  ? slotName.startsWith("about-")
                  : !slotName.startsWith("about-"),
              )
              .map(({ value: slotName, label, sections: slotSections }) => (
              <div key={slotName} className="rounded-2xl border border-sand-dark bg-sand/30 p-3 sm:p-5">
                <div className="mb-4 flex flex-col gap-1 border-b border-marina/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-bold uppercase leading-relaxed tracking-wider text-marina sm:text-sm">
                    Slot: {label}
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
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-[10px] font-bold uppercase tracking-wider text-ink/45">
                              {sec.name}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold uppercase leading-relaxed tracking-wider text-marina">
                              {sec.layout.replaceAll("-", " ")} <span aria-hidden="true">·</span> {sec.visibility === "residents" ? "Residents only" : sec.visibility === "visitors" ? "Visitors only" : "Everyone"} <span aria-hidden="true">·</span> {sec.isActive ? "LIVE" : "Inactive"}
                            </p>
                            <div className="mt-3 space-y-2 rounded-xl bg-sand/30 p-3">
                              <InlineEditableText
                                label={`${sec.name} eyebrow`}
                                value={sec.eyebrow ?? ""}
                                onChange={(value) => updateInlineSection(sec._id, "eyebrow", value)}
                                className="block text-[10px] font-bold uppercase tracking-wider text-marina"
                              />
                              <InlineEditableText
                                label={`${sec.name} title`}
                                value={sec.title ?? ""}
                                onChange={(value) => updateInlineSection(sec._id, "title", value)}
                                className="block text-base font-bold text-ink"
                              />
                              {sec.layout !== "single-image-flyer" && (
                                <InlineEditableText
                                  label={`${sec.name} content`}
                                  value={sec.content}
                                  onChange={(value) => updateInlineSection(sec._id, "content", value)}
                                  multiline
                                  rows={3}
                                  className="block w-full whitespace-pre-wrap text-sm leading-6 text-ink/65"
                                />
                              )}
                              {sec.buttonText !== undefined && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <InlineEditableText
                                    label={`${sec.name} button text`}
                                    value={sec.buttonText ?? ""}
                                    onChange={(value) => updateInlineSection(sec._id, "buttonText", value)}
                                    className="text-xs font-bold uppercase tracking-wider text-marina"
                                  />
                                  <span className="text-xs text-ink/35">→</span>
                                  <InlineEditableText
                                    label={`${sec.name} button link`}
                                    value={sec.buttonLink ?? ""}
                                    onChange={(value) => updateInlineSection(sec._id, "buttonLink", value)}
                                    className="break-all text-xs text-ink/55"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex w-full flex-wrap items-center gap-1.5 border-t border-ink/5 pt-2 sm:w-auto sm:flex-nowrap sm:justify-end sm:border-0 sm:pt-0">
                          {dirtySectionIds.has(sec._id) && (
                            <button
                              type="button"
                              onClick={() => void saveInlineSection(sec)}
                              disabled={savingSectionId === sec._id}
                              className="min-h-10 rounded-full bg-marina px-3 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-marina-light disabled:opacity-60"
                            >
                              {savingSectionId === sec._id ? "Saving..." : "Save"}
                            </button>
                          )}
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
          ))}
        </div>
      )}

      {view === "choose" && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink">Add a section</h3>
              <p className="mt-1 text-xs text-ink/60">
                Start from scratch or insert a section you have already saved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("list")}
              className="min-h-10 rounded-full border border-marina/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-marina hover:bg-sand"
            >
              Back to Page Builder
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openCreate(requestedSlot)}
              className="flex min-h-36 flex-col items-start justify-center rounded-2xl border-2 border-marina bg-white p-5 text-left shadow-sm transition hover:bg-sand/30"
            >
              <span className="text-sm font-bold uppercase tracking-wider text-marina">Start a New Section</span>
              <span className="mt-2 text-xs leading-relaxed text-ink/60">
                Open the section wizard to choose a layout and add new content.
              </span>
            </button>
            <div className="flex min-h-36 flex-col justify-center rounded-2xl border border-marina/20 bg-sand/30 p-5">
              <span className="text-sm font-bold uppercase tracking-wider text-marina">Insert a Saved Section</span>
              <span className="mt-2 text-xs leading-relaxed text-ink/60">
                Choose an inactive section below to add it at the selected page position.
              </span>
            </div>
          </div>

          <SavedPageSections
            sections={savedSections}
            restoringSectionId={restoringSectionId}
            updatingVisibilitySectionId={updatingVisibilitySectionId}
            defaultExpanded
            defaultSlot={requestedSlot}
            onRestore={(section, slot) => void restoreSection(section, slot)}
            onVisibilityChange={(section, visibility) =>
              void updateSectionVisibility(section, visibility)
            }
            onEdit={openEdit}
            onDelete={(id, name) => void deleteSection(id, name)}
          />
        </div>
      )}

      {/* ----------------- VIEW: WIZARD (CREATE / EDIT) ----------------- */}
      {(view === "create" || view === "edit") && (
        <div className="mt-6">
          {/* Breadcrumb / Step Indicator */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink/65">
            <button
              onClick={() => requestLeave({ type: "list" })}
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

              <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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

                <button
                  type="button"
                  onClick={() => setFormLayout("image-gallery")}
                  aria-pressed={formLayout === "image-gallery"}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition sm:p-5 ${
                    formLayout === "image-gallery"
                      ? "border-marina bg-sand/35"
                      : "border-marina/10 bg-white hover:border-marina/30"
                  }`}
                >
                  <div className="mb-4 grid h-24 w-full grid-cols-3 gap-1.5 rounded-lg bg-sand p-2">
                    <span className="rounded bg-marina/25" />
                    <span className="rounded bg-ink/15" />
                    <span className="rounded bg-marina/35" />
                  </div>
                  <h4 className="text-sm font-bold text-ink">Image Gallery</h4>
                  <p className="mt-2 text-xxs leading-relaxed text-ink/60">
                    Display all selected images together in a responsive grid. Visitors can open images larger.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormLayout("image-carousel")}
                  aria-pressed={formLayout === "image-carousel"}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition sm:p-5 ${
                    formLayout === "image-carousel"
                      ? "border-marina bg-sand/35"
                      : "border-marina/10 bg-white hover:border-marina/30"
                  }`}
                >
                  <div className="mb-4 flex h-24 w-full gap-2 overflow-hidden rounded-lg bg-sand p-2">
                    <span className="h-full w-2/3 shrink-0 rounded bg-marina/25" />
                    <span className="h-full w-2/3 shrink-0 rounded bg-ink/15" />
                  </div>
                  <h4 className="text-sm font-bold text-ink">Image Carousel</h4>
                  <p className="mt-2 text-xxs leading-relaxed text-ink/60">
                    Let visitors browse selected images horizontally with next and previous controls.
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
                  {formLayout === "single-image-flyer"
                    ? "Upload Flyer Image"
                    : formIsImageCollection
                      ? "Add Images"
                      : "Section Content & Media"}
                </h3>
                <p className="text-xs text-ink/60 mt-1">
                  {formLayout === "single-image-flyer"
                    ? "Upload the single image to display. No additional content is needed."
                    : formIsImageCollection
                      ? "Upload multiple images or choose several from the photo gallery. You can remove or reorder them before publishing."
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
                        : formIsImageCollection
                          ? "e.g. Summer beach photos"
                          : "e.g. Fall Beach Cleanup Flyer Section"
                    }
                    className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none"
                  />
                  <p className="mt-1 text-[10px] text-ink/50">
                    {formLayout === "single-image-flyer"
                      ? "Optional; only shown in the admin dashboard. Leave blank to use “Single Image/Flyer”."
                      : formIsImageCollection
                        ? "This is only shown in the admin dashboard to organize sections."
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
                    {formIsImageCollection ? "Intro (Optional)" : <>Section Content Block <span className="text-coral">*</span></>}
                  </label>
                  <textarea
                    required={!formIsImageCollection}
                    rows={5}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder={formIsImageCollection ? "Add an optional introduction for this image collection..." : "Describe the announcements, listings, or general community details in full detail..."}
                    className="w-full rounded-xl border border-marina/20 px-4 py-2.5 text-sm text-ink focus:border-marina focus:ring-1 focus:ring-marina outline-none resize-y"
                  />
                </div>}

                {formIsImageCollection ? (
                  <div className="rounded-2xl border border-marina/15 bg-sand/20 p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => collectionFileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-marina px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-marina-light disabled:opacity-60"
                      >
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload images"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void openGallery("section")}
                        className="min-h-10 rounded-xl border border-marina/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-marina transition hover:bg-sand"
                      >
                        Choose from gallery
                      </button>
                    </div>
                    <input
                      ref={collectionFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleCollectionImageUpload}
                      className="hidden"
                    />
                    <p className="mt-2 text-[10px] text-ink/50">
                      Add images in the order you want them shown. Each uploaded image must be 4 MB or smaller.
                    </p>
                    {formImageUrls.length > 0 ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {formImageUrls.map((image, index) => (
                          <div
                            key={`${image}-${index}`}
                            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-sand"
                          >
                            <NextImage
                              src={getProxyUrl(image)}
                              alt={`Selected image ${index + 1}`}
                              fill
                              sizes="240px"
                              className="object-cover"
                              unoptimized
                            />
                            <span className="absolute left-2 top-2 rounded-full bg-deep-ocean/75 px-2 py-1 text-[10px] font-bold text-white">
                              {index + 1}
                            </span>
                            <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1 opacity-100 sm:opacity-0 sm:transition group-hover:opacity-100 group-focus-within:opacity-100">
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormImageUrls((current) => {
                                      const reordered = [...current];
                                      [reordered[index - 1], reordered[index]] = [
                                        reordered[index],
                                        reordered[index - 1],
                                      ];
                                      return reordered;
                                    })
                                  }
                                  aria-label={`Move image ${index + 1} earlier`}
                                  className="rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold uppercase text-ink shadow"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                              )}
                              {index < formImageUrls.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormImageUrls((current) => {
                                      const reordered = [...current];
                                      [reordered[index], reordered[index + 1]] = [
                                        reordered[index + 1],
                                        reordered[index],
                                      ];
                                      return reordered;
                                    })
                                  }
                                  aria-label={`Move image ${index + 1} later`}
                                  className="rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold uppercase text-ink shadow"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setFormImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                aria-label={`Remove image ${index + 1}`}
                                className="rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold uppercase text-coral shadow"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-marina/25 bg-white/70 px-4 py-8 text-center text-xs text-ink/55">
                        No images selected yet.
                      </div>
                    )}
                  </div>
                ) : (
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
                )}

                {formLayout !== "single-image-flyer" && !formIsImageCollection && <div className="grid gap-4 sm:grid-cols-2">
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
                    if (formIsImageCollection && formImageUrls.length === 0) {
                      setError("Add at least one image before previewing.");
                      return;
                    }
                    if (formLayout !== "single-image-flyer" && !formIsImageCollection && !formContent.trim()) {
                      setError("Section content is required before previewing.");
                      return;
                    }
                    if (formLayout !== "full-width" && formLayout !== "single-image-flyer" && !formIsImageCollection && !formImageUrl) {
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
                  {formIsImageCollection && (
                    <CustomImageCollection
                      layout={formLayout}
                      images={formImageUrls.map(getProxyUrl)}
                      eyebrow={formEyebrow}
                      title={formTitle}
                      content={formContent}
                    />
                  )}

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

          {/* STEP 4: Choose Slot, Visibility & Publish Switch */}
          {wizardStep === 4 && (
            <div className="space-y-6 animate-fadeIn max-w-md mx-auto">
              <div className="text-center">
                <h3 className="text-lg font-bold text-ink">Placement &amp; Status</h3>
                <p className="text-xs text-ink/60 mt-1">
                  Choose where to insert this section, and set it live immediately or save as draft.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-marina/15 bg-sand/20 p-4 sm:p-6">
                {/* Slot Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
                    Page Insertion Point
                  </label>
                  <select
                    value={formSlot}
                    onChange={(e) => setFormSlot(e.target.value as Section["slot"])}
                    className="w-full rounded-xl border border-marina/20 bg-white px-4 py-2.5 text-sm text-ink focus:border-marina outline-none"
                  >
                    {PAGE_SECTION_SLOTS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink">
                    Section audience
                  </p>
                  <PageSectionVisibilityToggle
                    value={formVisibility}
                    onChange={setFormVisibility}
                    label="Section audience"
                  />
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
