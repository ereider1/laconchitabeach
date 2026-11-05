"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

type Props = {
  layout: "image-gallery" | "image-carousel";
  images: string[];
  eyebrow?: string;
  title?: string;
  content?: string;
};

export default function CustomImageCollection({ layout, images, eyebrow, title, content }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const selectedImage = selectedImageIndex === null ? null : images[selectedImageIndex] ?? null;

  useEffect(() => {
    if (selectedImageIndex === null) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedImageIndex(null);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedImageIndex((current) =>
          current === null ? null : (current + 1) % images.length,
        );
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedImageIndex((current) =>
          current === null ? null : (current - 1 + images.length) % images.length,
        );
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [images.length, selectedImageIndex]);

  function moveCarousel(direction: -1 | 1) {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({ left: direction * carousel.clientWidth * 0.8, behavior: "smooth" });
  }

  function moveLightbox(direction: -1 | 1) {
    setSelectedImageIndex((current) =>
      current === null ? null : (current + direction + images.length) % images.length,
    );
  }

  function handleLightboxTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleLightboxTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch || images.length < 2) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    moveLightbox(deltaX < 0 ? 1 : -1);
  }

  if (!images.length) return null;

  return (
    <section className="border-y border-sand/30 bg-white px-6 py-12 sm:px-10 sm:py-16" aria-label={title || "Image collection"}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title || content || (layout === "image-carousel" && images.length > 1)) && (
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && <p className="eyebrow text-marina">{eyebrow}</p>}
              {title && (
                <h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-3xl">
                  {title}
                </h2>
              )}
              {content && <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-7 text-ink/65">{content}</p>}
            </div>
            {layout === "image-carousel" && images.length > 1 && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => moveCarousel(-1)}
                  aria-label="Previous image"
                  className="rounded-full border border-ink/15 p-2 text-ink transition hover:bg-ink/5"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCarousel(1)}
                  aria-label="Next image"
                  className="rounded-full border border-ink/15 p-2 text-ink transition hover:bg-ink/5"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div
          ref={carouselRef}
          className={
            layout === "image-gallery"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              : "flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3"
          }
          aria-label={layout === "image-gallery" ? "Image gallery" : "Image carousel"}
        >
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              className={`group relative block overflow-hidden rounded-2xl bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-marina focus-visible:ring-offset-2 ${
                layout === "image-gallery"
                  ? "aspect-[4/3] w-full"
                  : "aspect-[4/3] w-[85%] shrink-0 snap-center sm:w-[65%] lg:w-[48%]"
              }`}
            >
              <Image
                src={image}
                alt={title ? `${title} — image ${index + 1}` : `Gallery image ${index + 1}`}
                fill
                sizes={layout === "image-gallery" ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 85vw, 50vw"}
                className="object-cover transition duration-300 group-hover:scale-[1.02]"
                unoptimized
              />
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-deep-ocean/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title || "Image gallery"}, image ${(selectedImageIndex ?? 0) + 1} of ${images.length}`}
          onClick={() => setSelectedImageIndex(null)}
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <button
            type="button"
            onClick={() => setSelectedImageIndex(null)}
            aria-label="Close image"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-3 text-white backdrop-blur transition hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveLightbox(-1);
                }}
                aria-label="Previous lightbox image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur transition hover:bg-white/25 sm:left-6"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveLightbox(1);
                }}
                aria-label="Next lightbox image"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur transition hover:bg-white/25 sm:right-6"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div
            className="relative h-[82vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt={`${title || "Gallery image"} ${((selectedImageIndex ?? 0) + 1)} of ${images.length}`}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized
            />
          </div>
          {images.length > 1 && (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {(selectedImageIndex ?? 0) + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
