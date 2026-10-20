export const COMMUNITY_POST_CATEGORIES = [
  { value: "Beach Info", label: "Beach Info" },
  { value: "Lost & Found", label: "Lost & Found" },
  { value: "for sale", label: "For Sale" },
  { value: "free", label: "Free" },
  { value: "other", label: "Other" },
] as const;

export type CommunityPostCategory = (typeof COMMUNITY_POST_CATEGORIES)[number]["value"];

// Retain these values for existing posts; the API does not allow them for new or changed categories.
export const LEGACY_COMMUNITY_POST_CATEGORIES = {
  "common-area": "Common area",
  "beach-access": "Beach access",
  landscaping: "Landscaping",
  lighting: "Lighting",
  "looking for": "Looking For",
} as const;

export type LegacyCommunityPostCategory = keyof typeof LEGACY_COMMUNITY_POST_CATEGORIES;

export function isCommunityPostCategory(value: unknown): value is CommunityPostCategory {
  return COMMUNITY_POST_CATEGORIES.some((category) => category.value === value);
}

export function isLegacyCommunityPostCategory(
  value: unknown
): value is LegacyCommunityPostCategory {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(LEGACY_COMMUNITY_POST_CATEGORIES, value)
  );
}

export function getCommunityPostCategoryOptions(currentCategory?: string) {
  const options: { value: string; label: string }[] = [...COMMUNITY_POST_CATEGORIES];

  if (currentCategory && isLegacyCommunityPostCategory(currentCategory)) {
    options.push({
      value: currentCategory,
      label: LEGACY_COMMUNITY_POST_CATEGORIES[currentCategory],
    });
  }

  return options;
}
