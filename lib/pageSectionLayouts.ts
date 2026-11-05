export const PAGE_SECTION_LAYOUTS = [
  "full-width",
  "two-col-img-left",
  "two-col-img-right",
  "single-image-flyer",
  "image-gallery",
  "image-carousel",
] as const;

export type PageSectionLayout = (typeof PAGE_SECTION_LAYOUTS)[number];

export function isPageSectionLayout(value: unknown): value is PageSectionLayout {
  return PAGE_SECTION_LAYOUTS.some((layout) => layout === value);
}

export function isImageCollectionLayout(layout: PageSectionLayout) {
  return layout === "image-gallery" || layout === "image-carousel";
}
