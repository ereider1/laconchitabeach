export type HomePageContent = {
  headerTitle: string;
  headerSubtitle: string;
  headerLogoUrl: string;
  headerExploreLabel: string;
  headerLoginText: string;
  headerLoginHref: string;
  navItems: Array<{ label: string; href: string }>;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroWeatherLabel: string;
  heroLinkText: string;
  heroLinkHref: string;
  heroImageUrl: string;
  servicesEyebrow: string;
  servicesTitle: string;
  servicesDescription: string;
  services: Array<{
    title: string;
    description: string;
    actionText: string;
    href: string;
  }>;
  lifeEyebrow: string;
  lifeTitle: string;
  lifeDescription: string;
  lifeButtonText: string;
  lifeButtonHref: string;
  lifeImageUrl: string;
  communityEyebrow: string;
  communityTitle: string;
  communityButtonText: string;
  communityButtonHref: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  aboutImageUrl: string;
  footerTitle: string;
  footerSubtitle: string;
  footerTagline: string;
  footerCopyright: string;
};

export const defaultHomePageContent: HomePageContent = {
  headerTitle: "La Conchita",
  headerSubtitle: "Beach Community",
  headerLogoUrl: "/favicon/favicon-64x64.png",
  headerExploreLabel: "Explore",
  headerLoginText: "Resident Login",
  headerLoginHref: "/sign-in",
  navItems: [
    { label: "About", href: "/about" },
    { label: "Events", href: "/events" },
    { label: "Contact", href: "/contact" },
  ],
  heroEyebrow: "Welcome to the coast",
  heroTitle: "La Conchita",
  heroSubtitle: "Beach",
  heroDescription:
    "A close-knit California beach community between the bluffs and the Pacific — where neighbors share news, lend a hand, and meet at the water's edge.",
  heroWeatherLabel: "WEATHER IN LA CONCHITA",
  heroLinkText: "Discover La Conchita",
  heroLinkHref: "/about",
  heroImageUrl: "/beach-hero-bg.jpg",
  servicesEyebrow: "Resident services",
  servicesTitle: "Everything close to home",
  servicesDescription:
    "One simple place for the information, resources, and small moments that keep our beach community connected.",
  services: [
    {
      title: "Announcements",
      description: "Board updates, closures, and safety notices in one clear community feed.",
      actionText: "Open portal",
      href: "/sign-in",
    },
    {
      title: "Resident directory",
      description: "Find a neighbor by name or street, with privacy controlled by each resident.",
      actionText: "Open portal",
      href: "/sign-in",
    },
    {
      title: "Documents",
      description: "Bylaws, budgets, meeting minutes, and community forms in one organized place.",
      actionText: "Open portal",
      href: "/sign-in",
    },
    {
      title: "Community corner",
      description: "Lost and found, local listings, maintenance requests, and neighbor-to-neighbor help.",
      actionText: "Open portal",
      href: "/sign-in",
    },
  ],
  lifeEyebrow: "Life by the water",
  lifeTitle: "More than a place on the map",
  lifeDescription:
    "Beach cleanups, neighborhood gatherings, shared resources, and everyday check-ins make La Conchita feel like home. The resident portal keeps all of it within easy reach.",
  lifeButtonText: "See what's happening",
  lifeButtonHref: "/events",
  lifeImageUrl: "/beach-cleanup-1536x880.jpg",
  communityEyebrow: "For neighbors",
  communityTitle: "Your community is one login away.",
  communityButtonText: "Resident login",
  communityButtonHref: "/sign-in",
  aboutEyebrow: "About La Conchita",
  aboutTitle: "A small place with a big horizon",
  aboutParagraphs: [
    "La Conchita sits between the coastal bluffs and the Pacific, a compact neighborhood shaped by salt air, ocean views, and the easy familiarity of people who know the same stretch of beach.",
    "The community shares responsibility for the paths, common areas, neighborhood gatherings, and the practical work of caring for a place this close to the water. Residents are always welcome to take part and stay informed.",
    "This site is our public front door. Residents have a second, private door for directory lookups, community requests, shared documents, and the announcements that keep everyday life moving.",
  ],
  aboutImageUrl: "/beach-access.png",
  footerTitle: "La Conchita Beach",
  footerSubtitle: "California coast",
  footerTagline: "Community news, neighbors, and beach life.",
  footerCopyright: "La Conchita.",
};

function isSafeUrl(value: string) {
  if (/[\u0000-\u001f"'<>\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isHomePageContent(value: unknown): value is HomePageContent {
  if (!value || typeof value !== "object") return false;
  const content = value as Record<string, unknown>;
  const stringFields: Array<keyof HomePageContent> = [
    "headerTitle",
    "headerSubtitle",
    "headerLogoUrl",
    "headerExploreLabel",
    "headerLoginText",
    "headerLoginHref",
    "heroEyebrow",
    "heroTitle",
    "heroSubtitle",
    "heroDescription",
    "heroWeatherLabel",
    "heroLinkText",
    "heroLinkHref",
    "heroImageUrl",
    "servicesEyebrow",
    "servicesTitle",
    "servicesDescription",
    "lifeEyebrow",
    "lifeTitle",
    "lifeDescription",
    "lifeButtonText",
    "lifeButtonHref",
    "lifeImageUrl",
    "communityEyebrow",
    "communityTitle",
    "communityButtonText",
    "communityButtonHref",
    "aboutEyebrow",
    "aboutTitle",
    "aboutImageUrl",
    "footerTitle",
    "footerSubtitle",
    "footerTagline",
    "footerCopyright",
  ];

  return (
    stringFields.every((field) => typeof content[field] === "string") &&
    Array.isArray(content.services) &&
    content.services.length <= 12 &&
    content.services.every(
      (service: unknown) =>
        service &&
        typeof service === "object" &&
        "title" in service &&
        typeof service.title === "string" &&
        "description" in service &&
        typeof service.description === "string" &&
        "actionText" in service &&
        typeof service.actionText === "string" &&
        "href" in service &&
        typeof service.href === "string" &&
        isSafeUrl(service.href),
    ) &&
    Array.isArray(content.navItems) &&
    content.navItems.length === defaultHomePageContent.navItems.length &&
    content.navItems.every(
      (item: unknown) =>
        item &&
        typeof item === "object" &&
        "label" in item &&
        typeof item.label === "string" &&
        "href" in item &&
        typeof item.href === "string" &&
        isSafeUrl(item.href),
    ) &&
    Array.isArray(content.aboutParagraphs) &&
    content.aboutParagraphs.every((paragraph) => typeof paragraph === "string") &&
    isSafeUrl(content.heroImageUrl as string) &&
    isSafeUrl(content.headerLogoUrl as string) &&
    isSafeUrl(content.lifeImageUrl as string) &&
    isSafeUrl(content.aboutImageUrl as string) &&
    isSafeUrl(content.heroLinkHref as string) &&
    isSafeUrl(content.headerLoginHref as string) &&
    isSafeUrl(content.lifeButtonHref as string) &&
    isSafeUrl(content.communityButtonHref as string)
  );
}
