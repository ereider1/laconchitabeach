"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, Copy, FileText, Grid2X2, List, Trash2, X } from "lucide-react";
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_SORT_OPTIONS,
  normalizeDocumentCategory,
  sortDocuments,
  type DocumentSortOrder,
} from "@/lib/documentCategories";

type DocumentItem = {
  _id: string;
  title: string;
  description?: string;
  category: string;
  createdAt?: string;
};

type ViewMode = "grid" | "list";

function isImage(document: DocumentItem) {
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(document.title);
}

function isPdf(document: DocumentItem) {
  return /\.pdf$/i.test(document.title);
}

function Thumbnail({ document, large = false }: { document: DocumentItem; large?: boolean }) {
  const size = large ? "h-20 w-20" : "h-10 w-10";

  if (isImage(document)) {
    return (
      <Image
        src={`/api/documents/${document._id}`}
        alt=""
        fill
        sizes={large ? "(max-width: 768px) 100vw, 768px" : "96px"}
        className="object-cover"
        unoptimized
      />
    );
  }

  if (isPdf(document)) {
    return (
      <object
        data={`/api/documents/${document._id}`}
        type="application/pdf"
        title={`Preview of ${document.title}`}
        className="pointer-events-none h-full w-full"
      >
        <FileText className={size} aria-hidden="true" />
      </object>
    );
  }

  return <FileText className={`${size} text-ink/30`} aria-hidden="true" />;
}

export default function PortalDocuments({ documents }: { documents: DocumentItem[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortOrder, setSortOrder] = useState<DocumentSortOrder>("category");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copied, setCopied] = useState(false);

  const visibleDocuments = documents.filter((document) => !deletedIds.includes(document._id));
  const sortedDocuments = sortDocuments(visibleDocuments, sortOrder);
  const groupedDocuments = sortOrder === "category"
    ? Object.entries(sortedDocuments.reduce<Record<string, DocumentItem[]>>((groups, document) => {
        const category = normalizeDocumentCategory(document.category);
        (groups[category] ??= []).push(document);
        return groups;
      }, {}))
    : [["all", sortedDocuments] as [string, DocumentItem[]]];

  async function copyLink(document: DocumentItem) {
    setMessage(null);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard access is unavailable.");
      const link = new URL(`/api/documents/${document._id}`, window.location.origin);
      await navigator.clipboard.writeText(link.toString());
      setMessage({ text: `Link copied for ${document.title}.`, type: "success" });
      setCopied(true);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not copy the document link.",
        type: "error",
      });
      setCopied(false);
    }
  }

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function deleteDocument(document: DocumentItem) {
    if (!window.confirm(`Delete "${document.title}"? This cannot be undone.`)) return;

    setBusyId(document._id);
    setMessage(null);
    setCopied(false);
    try {
      const response = await fetch(`/api/admin/documents?id=${encodeURIComponent(document._id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to delete the document.");

      setDeletedIds((ids) => [...ids, document._id]);
      setMessage({ text: `${document.title} was deleted.`, type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not delete the document.",
        type: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-ink/60">
          {visibleDocuments.length} {visibleDocuments.length === 1 ? "document" : "documents"}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-sm text-ink/70">
            Sort by
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as DocumentSortOrder)}
              aria-label="Sort documents"
              className="rounded-full border border-ink/15 px-3 py-2 text-sm"
            >
              {DOCUMENT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex rounded-full border border-ink/15 p-1" aria-label="Document view mode">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              className={`rounded-full p-2 ${viewMode === "grid" ? "bg-marina text-fog" : "text-ink/50 hover:text-ink"}`}
            >
              <Grid2X2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              className={`rounded-full p-2 ${viewMode === "list" ? "bg-marina text-fog" : "text-ink/50 hover:text-ink"}`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {message && (
        <p
          className="mt-3 text-sm text-ink/70"
          role={message.type === "success" ? "status" : "alert"}
        >
          {message.text}
        </p>
      )}

      {copied && (
        <div
          role="status"
          className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg bg-emerald-600 px-4 py-3 text-fog shadow-lg"
        >
          <Check
            aria-hidden="true"
            className="h-5 w-5 rounded-full bg-fog p-0.5 text-emerald-600"
          />
          <span className="text-sm font-medium">Link copied to clipboard</span>
          <span aria-hidden="true" className="h-7 w-px bg-fog/25" />
          <button
            type="button"
            aria-label="Dismiss copied message"
            onClick={() => setCopied(false)}
            className="text-fog/90 transition hover:text-fog"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="mt-6 space-y-8">
        {groupedDocuments.map(([category, categoryDocuments]) => (
          <section key={category}>
            <h2 className="font-display text-lg text-marina">
              {sortOrder === "category"
                ? DOCUMENT_CATEGORY_LABELS[normalizeDocumentCategory(category)]
                : "All documents"}
            </h2>

            {viewMode === "grid" ? (
              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {categoryDocuments.map((document) => (
                  <article
                    key={document._id}
                    className="overflow-hidden rounded-xl border border-ink/10 bg-white"
                  >
                    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-sand/40">
                      <Thumbnail document={document} large />
                    </div>
                    <div className="p-4">
                      <p className="truncate font-medium text-ink" title={document.title}>
                        {document.title}
                      </p>
                      {document.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-ink/60">
                          {document.description}
                        </p>
                      )}
                      {sortOrder !== "category" && (
                        <p className="mt-2 text-xs uppercase tracking-wider text-ink/50">
                          {DOCUMENT_CATEGORY_LABELS[normalizeDocumentCategory(document.category)]}
                        </p>
                      )}
                      <DocumentActions
                        document={document}
                        busy={busyId === document._id}
                        onCopy={copyLink}
                        onDelete={deleteDocument}
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
                {categoryDocuments.map((document) => (
                  <li
                    key={document._id}
                    className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap"
                  >
                    <div className="relative flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sand/40">
                      <Thumbnail document={document} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{document.title}</p>
                      {document.description && (
                        <p className="mt-1 line-clamp-1 text-sm text-ink/60">
                          {document.description}
                        </p>
                      )}
                      {sortOrder !== "category" && (
                        <p className="mt-1 text-xs uppercase tracking-wider text-ink/50">
                          {DOCUMENT_CATEGORY_LABELS[normalizeDocumentCategory(document.category)]}
                        </p>
                      )}
                    </div>
                    <DocumentActions
                      document={document}
                      busy={busyId === document._id}
                      onCopy={copyLink}
                      onDelete={deleteDocument}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function DocumentActions({
  document,
  busy,
  onCopy,
  onDelete,
}: {
  document: DocumentItem;
  busy: boolean;
  onCopy: (document: DocumentItem) => void;
  onDelete: (document: DocumentItem) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <a
        href={`/api/documents/${document._id}`}
        className="text-xs font-medium text-marina underline underline-offset-4"
      >
        Open
      </a>
      <button
        type="button"
        onClick={() => onCopy(document)}
        className="inline-flex items-center gap-1 text-xs font-medium text-marina underline underline-offset-4"
        aria-label={`Copy link to ${document.title}`}
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        Copy link
      </button>
      <button
        type="button"
        onClick={() => onDelete(document)}
        disabled={busy}
        className="inline-flex items-center gap-1 text-xs font-medium text-coral underline underline-offset-4 disabled:opacity-50"
        aria-label={`Delete ${document.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {busy ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
