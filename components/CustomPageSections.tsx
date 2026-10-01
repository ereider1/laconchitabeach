import Link from "next/link";
import Image from "next/image";
import { connectToDatabase } from "@/lib/mongodb";
import PageSection, { IPageSection } from "@/lib/models/PageSection";
import GlobalSettings from "@/lib/models/GlobalSettings";

interface CustomPageSectionsProps {
  slot: "below-hero" | "below-services" | "above-footer";
}

function getPublicImageUrl(url?: string) {
  if (!url) return "";

  if (url.includes("blob.vercel-storage.com") && url.includes("private.")) {
    return `/api/homepage-media?url=${encodeURIComponent(url)}`;
  }

  return url;
}

export default async function CustomPageSections({ slot }: CustomPageSectionsProps) {
  let sections: IPageSection[] = [];

  try {
    await connectToDatabase();

    const globalSetting = await GlobalSettings.findOne({ key: "page-builder-active" }).lean();
    const isModuleActive = globalSetting ? globalSetting.value : true;
    if (!isModuleActive) {
      return null;
    }

    sections = (await PageSection.find({
      slot,
      isActive: true,
    })
      .sort({ order: 1 })
      .lean()) as IPageSection[];
  } catch (error) {
    console.error("Error loading custom page sections:", error);
    return null;
  }

  if (!sections.length) {
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
        } = section as IPageSection & { _id?: string | number };

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

        const publicImageUrl = getPublicImageUrl(imageUrl);

        if (layout === "two-col-img-left") {
          return (
            <section key={String(_id)} className="grid bg-sand md:grid-cols-2 border-t border-b border-sand">
              <div
                className="min-h-[360px] bg-cover bg-center"
                style={publicImageUrl ? { backgroundImage: `url(${publicImageUrl})` } : { backgroundColor: "#e2e8f0" }}
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
                style={publicImageUrl ? { backgroundImage: `url(${publicImageUrl})` } : { backgroundColor: "#e2e8f0" }}
              />
            </section>
          );
        }

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
              {publicImageUrl && (
                <div className="mt-8 max-w-2xl w-full h-[300px] relative overflow-hidden rounded-2xl">
                  <Image
                    src={publicImageUrl}
                    alt={title || "Section Media"}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                    unoptimized
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
}
