import Link from "next/link";
import Image from "next/image";
import FlyerImage from "@/components/FlyerImage";
import CustomImageCollection from "@/components/CustomImageCollection";
import { connectToDatabase } from "@/lib/mongodb";
import PageSection, { IPageSection } from "@/lib/models/PageSection";
import type { PageSectionSlot } from "@/lib/pageSectionSlots";

interface CustomPageSectionsProps {
  slot: PageSectionSlot;
  isLoggedIn: boolean;
  isResident: boolean;
}

function getPublicImageUrl(url?: string) {
  if (!url) return "";

  if (url.includes("blob.vercel-storage.com") && url.includes("private.")) {
    return `/api/homepage-media?url=${encodeURIComponent(url)}`;
  }

  return url;
}

export default async function CustomPageSections({
  slot,
  isLoggedIn,
  isResident,
}: CustomPageSectionsProps) {
  let sections: IPageSection[] = [];

  try {
    await connectToDatabase();

    const activeSections = (await PageSection.find({
      slot,
      isActive: true,
    })
      .sort({ order: 1 })
      .lean()) as IPageSection[];
    sections = activeSections.filter((section) => {
      const visibility = section.visibility ?? "everyone";
      return (
        visibility === "everyone" ||
        (visibility === "visitors" && !isLoggedIn) ||
        (visibility === "residents" && isResident)
      );
    });
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
          imageUrls,
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

        if (layout === "image-gallery" || layout === "image-carousel") {
          const publicImages = (imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : [])
            .map(getPublicImageUrl)
            .filter(Boolean);
          return (
            <CustomImageCollection
              key={String(_id)}
              layout={layout}
              images={publicImages}
              eyebrow={eyebrow}
              title={title}
              content={content}
            />
          );
        }

        if (layout === "single-image-flyer") {
          return publicImageUrl ? (
            <FlyerImage key={String(_id)} src={publicImageUrl} />
          ) : null;
        }

        if (layout === "two-col-img-left") {
          return (
            <section key={String(_id)} className="grid bg-sand md:grid-cols-2 border-t border-b border-sand">
              <div className="relative min-h-[360px] bg-sand-dark">
                {publicImageUrl && (
                  <Image
                    src={publicImageUrl}
                    alt={title || "Section image"}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    unoptimized
                  />
                )}
              </div>
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
              <div className="relative min-h-[360px] bg-sand-dark">
                {publicImageUrl && (
                  <Image
                    src={publicImageUrl}
                    alt={title || "Section image"}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    unoptimized
                  />
                )}
              </div>
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
                <div className="relative mt-8 h-[300px] w-full max-w-2xl overflow-hidden rounded-2xl bg-sand/30">
                  <Image
                    src={publicImageUrl}
                    alt={title || "Section Media"}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-contain"
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
