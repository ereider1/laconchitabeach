import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { connectToDatabase } from "@/lib/mongodb";
import GlobalSettings from "@/lib/models/GlobalSettings";
import AboutImageCarousel from "@/components/AboutImageCarousel";

const defaultAboutContent = {
  eyebrow: "A small place with a big horizon",
  paragraphs: `La Conchita sits between the coastal bluffs and the Pacific, a compact neighborhood shaped by salt air, ocean views, and the easy familiarity of people who know the same stretch of beach.

The community shares responsibility for the paths, common areas, neighborhood gatherings, and the practical work of caring for a place this close to the water. Residents are always welcome to take part and stay informed.

This site is our public front door. Residents have a second, private door for directory lookups, community requests, shared documents, and the announcements that keep everyday life moving.`,
  images: [],
};

export default async function AboutPage() {
  let aboutContent = defaultAboutContent;
  try {
    await connectToDatabase();
    const setting = await GlobalSettings.findOne({ key: "about-page-content" }).lean();
    if (setting?.value && typeof setting.value === "object" && "eyebrow" in setting.value && "paragraphs" in setting.value) {
      aboutContent = { ...defaultAboutContent, ...(setting.value as Partial<typeof defaultAboutContent>) };
    }
  } catch (error) {
    console.error("Error loading About page content:", error);
  }

  return (
    <div className="site-frame">
      <SiteHeader />
      <main>
        <section className="subpage-hero">
          <div>
            <p className="eyebrow text-white/75">Since 1962</p>
            <h1 className="mt-3 text-4xl font-bold uppercase tracking-[-0.05em] sm:text-6xl">
              About La Conchita
            </h1>
          </div>
        </section>
        <section className="content-card relative max-w-3xl px-7 py-10 sm:px-12 sm:py-14">
          <p className="eyebrow text-marina">{aboutContent.eyebrow}</p>
          <div className="mt-6 space-y-6 text-base leading-8 text-ink/70 sm:text-lg">
            {aboutContent.paragraphs.split(/\n\s*\n/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>
        <AboutImageCarousel images={aboutContent.images} />
      </main>
      <SiteFooter />
    </div>
  );
}
