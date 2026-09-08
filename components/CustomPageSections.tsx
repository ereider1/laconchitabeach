import Link from "next/link";
import Image from "next/image";
import { connectToDatabase } from "@/lib/mongodb";
import PageSection, { IPageSection } from "@/lib/models/PageSection";
import GlobalSettings from "@/lib/models/GlobalSettings";

interface CustomPageSectionsProps {
  slot: "below-hero" | "below-services" | "above-footer";
}

export default async function CustomPageSections({ slot }: CustomPageSectionsProps) {
  try {
    await connectToDatabase();

    // 1. Check Global Settings Kill Switch
    const globalSetting = await GlobalSettings.findOne({ key: "page-builder-active" }).lean();
    
    // If global setting doesn't exist, default to active: true
    const isModuleActive = globalSetting ? globalSetting.value : true;
    if (!isModuleActive) {
      return null;
    }

    // 2. Fetch Active Sections for this Slot
    const sections = (await PageSection.find({
      slot,
      isActive: true,
    })
      .sort({ order: 1 })
      .lean()) as IPageSection[];

    if (!sections || sections.length === 0) {
      return null;
    }

    return (
      <>
        {sections.map((section) => {
          const {
            _id,
            layout,
            eyebrow,
            title,
            content,
            imageUrl,
            buttonText,
            buttonLink,
          } = section as any;

          // Render button if text and link are provided
          const renderButton = buttonText && buttonLink && (
            <div className="mt-7">
              <Link
                href={buttonLink}
                className="inline-flex rounded-full bg-marina px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-marina-light"
              >
                {buttonText}
              </Link>
            </div>
          );

          // Content Box
          const contentElement = (
            <div className="max-w-lg">
              {eyebrow && <p className="eyebrow text-marina">{eyebrow}</p>}
              {title && (
                <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">
                  {title}
                </h2>
              )}
              {content && (
                <div className="mt-5 whitespace-pre-wrap leading-7 text-ink/65">
                  {content}
                </div>
              )}
              {renderButton}
            </div>
          );

          if (layout === "two-col-img-left") {
            return (
              <section key={String(_id)} className="grid bg-sand md:grid-cols-2 border-t border-b border-sand">
                <div
                  className="min-h-[360px] bg-cover bg-center"
                  style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : { backgroundColor: "#e2e8f0" }}
                />
                <div className="flex items-center px-8 py-16 sm:px-14">
                  {contentElement}
                </div>
              </section>
            );
          }

          if (layout === "two-col-img-right") {
            return (
              <section key={String(_id)} className="grid bg-sand md:grid-cols-2 border-t border-b border-sand">
                <div className="flex items-center px-8 py-16 sm:px-14 order-last md:order-first">
                  {contentElement}
                </div>
                <div
                  className="min-h-[360px] bg-cover bg-center"
                  style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : { backgroundColor: "#e2e8f0" }}
                />
              </section>
            );
          }

          // Default: full-width
          return (
            <section key={String(_id)} className="bg-white px-6 py-20 sm:px-10 border-t border-b border-sand/30">
              <div className="mx-auto max-w-4xl text-center flex flex-col items-center">
                {eyebrow && <p className="eyebrow text-marina">{eyebrow}</p>}
                {title && (
                  <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-4xl">
                    {title}
                  </h2>
                )}
                {content && (
                  <div className="mt-5 max-w-2xl whitespace-pre-wrap leading-7 text-ink/65 text-center">
                    {content}
                  </div>
                )}
                {imageUrl && (
                  <div className="mt-8 max-w-2xl w-full h-[300px] relative overflow-hidden rounded-2xl">
                    <img
                      src={imageUrl}
                      alt={title || "Section Media"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {renderButton}
              </div>
            </section>
          );
        })}
      </>
    );
  } catch (error) {
    console.error("Error loading custom page sections:", error);
    return null;
  }
}
