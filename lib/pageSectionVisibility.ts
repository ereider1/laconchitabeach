export const PAGE_SECTION_VISIBILITIES = ["everyone", "visitors", "residents"] as const;

export type PageSectionVisibility = (typeof PAGE_SECTION_VISIBILITIES)[number];

export function isPageSectionVisibility(value: unknown): value is PageSectionVisibility {
  return PAGE_SECTION_VISIBILITIES.some((visibility) => visibility === value);
}
