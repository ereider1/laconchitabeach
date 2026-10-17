export const DOCUMENT_CATEGORIES = [
  "governing",
  "minutes",
  "emails",
  "emergency-awareness",
  "flyers",
  "forms",
  "other",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  governing: "Governing",
  minutes: "Minutes",
  emails: "Emails",
  "emergency-awareness": "Emergency Awareness",
  flyers: "Flyers",
  forms: "Forms",
  other: "Other",
};

export const DOCUMENT_SORT_OPTIONS = [
  { value: "category", label: "Category" },
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" },
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
] as const;

export type DocumentSortOrder = (typeof DOCUMENT_SORT_OPTIONS)[number]["value"];

export function normalizeDocumentCategory(category: string): DocumentCategory {
  if (category === "financial") return "other";
  return DOCUMENT_CATEGORIES.find((value) => value === category) ?? "other";
}

export function isDocumentCategory(category: unknown): category is DocumentCategory {
  return typeof category === "string" && DOCUMENT_CATEGORIES.some((value) => value === category);
}

export function sortDocuments<T extends {
  title: string;
  category: string;
  createdAt?: Date | string;
}>(documents: T[], sortOrder: DocumentSortOrder): T[] {
  const categoryOrder = new Map(DOCUMENT_CATEGORIES.map((category, index) => [category, index]));
  const compareCategory = (a: T, b: T) =>
    (categoryOrder.get(normalizeDocumentCategory(a.category)) ?? DOCUMENT_CATEGORIES.length) -
    (categoryOrder.get(normalizeDocumentCategory(b.category)) ?? DOCUMENT_CATEGORIES.length);
  const compareTitle = (a: T, b: T) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" });

  return [...documents].sort((a, b) => {
    if (sortOrder === "category") return compareCategory(a, b) || compareTitle(a, b);
    if (sortOrder === "title-asc") return compareTitle(a, b) || compareCategory(a, b);
    if (sortOrder === "title-desc") return compareTitle(b, a) || compareCategory(a, b);

    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    const dateOrder = sortOrder === "date-desc" ? dateB - dateA : dateA - dateB;
    return dateOrder || compareTitle(a, b) || compareCategory(a, b);
  });
}
