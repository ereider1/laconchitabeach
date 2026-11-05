export const PAGE_SECTION_SLOTS = [
  { value: "below-hero", label: "Homepage - Below Hero (Above Services)" },
  { value: "below-services", label: "Homepage - Below Services (Above Community Preparedness)" },
  { value: "above-footer", label: "Homepage - Above Footer (Below About Section)" },
  { value: "about-below-hero", label: "About Page - Below Hero" },
  { value: "about-below-content", label: "About Page - Below Page Copy" },
  { value: "about-above-footer", label: "About Page - Above Footer (Below Image Carousel)" },
] as const;

export type PageSectionSlot = (typeof PAGE_SECTION_SLOTS)[number]["value"];

export function isPageSectionSlot(value: unknown): value is PageSectionSlot {
  return PAGE_SECTION_SLOTS.some((slot) => slot.value === value);
}
