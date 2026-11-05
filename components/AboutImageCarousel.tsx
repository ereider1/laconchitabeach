"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function publicImageUrl(url: string) {
  return url.includes("blob.vercel-storage.com") && url.includes("private.")
    ? `/api/homepage-media?url=${encodeURIComponent(url)}`
    : url;
}

export default function AboutImageCarousel({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const currentSlideRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slides = images.length > 1 ? [images[images.length - 1], ...images, images[0]] : images;

  function centerSlide(index: number, behavior: ScrollBehavior) {
    const carousel = carouselRef.current;
    const slide = slideRefs.current[index];
    if (!carousel || !slide) return;

    const carouselBounds = carousel.getBoundingClientRect();
    const slideBounds = slide.getBoundingClientRect();
    const offset = slideBounds.left + slideBounds.width / 2 - carouselBounds.left - carousel.clientLeft - carousel.clientWidth / 2;
    carousel.scrollTo({ left: carousel.scrollLeft + offset, behavior });
  }

  function moveSlide(direction: -1 | 1) {
    if (images.length < 2) return;
    const target = (currentSlideRef.current - 1 + direction + images.length) % images.length + 1;
    const isWrappingForward = direction === 1 && currentSlideRef.current === images.length;
    const isWrappingBackward = direction === -1 && currentSlideRef.current === 1;
    currentSlideRef.current = target;
    centerSlide(isWrappingForward ? images.length + 1 : isWrappingBackward ? 0 : target, "smooth");
  }

  useEffect(() => {
    if (images.length < 2) return;

    const carousel = carouselRef.current;
    if (!carousel) return;

    const initialFrame = window.requestAnimationFrame(() => {
      currentSlideRef.current = 1;
      centerSlide(1, "auto");
    });
    const handleScroll = () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        const carouselBounds = carousel.getBoundingClientRect();
        const carouselCenter = carouselBounds.left + carousel.clientLeft + carousel.clientWidth / 2;
        const nearest = slideRefs.current.reduce(
          (closest, slide, index) => {
            if (!slide) return closest;
            const bounds = slide.getBoundingClientRect();
            const distance = Math.abs(bounds.left + bounds.width / 2 - carouselCenter);
            return distance < closest.distance ? { index, distance } : closest;
          },
          { index: 0, distance: Number.POSITIVE_INFINITY },
        );

        if (nearest.index === 0) {
          currentSlideRef.current = images.length;
          centerSlide(images.length, "auto");
        } else if (nearest.index === images.length + 1) {
          currentSlideRef.current = 1;
          centerSlide(1, "auto");
        } else {
          currentSlideRef.current = nearest.index;
        }
      }, 120);
    };

    carousel.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(initialFrame);
      carousel.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [images.length]);

  if (!images.length) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10" aria-label="La Conchita photo gallery">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><p className="eyebrow text-marina">See the neighborhood</p><h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-3xl">Life by the water</h2></div>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs font-bold uppercase tracking-wider text-ink/40 sm:block">Swipe to explore</p>
          {images.length > 1 && (
            <div className="flex gap-2">
              <button type="button" onClick={() => moveSlide(-1)} className="rounded-full border border-ink/15 p-2 text-ink transition hover:bg-ink/5" aria-label="Previous gallery image">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => moveSlide(1)} className="rounded-full border border-ink/15 p-2 text-ink transition hover:bg-ink/5" aria-label="Next gallery image">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        ref={carouselRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc((100%_-_82vw)/2)] pb-4 [scrollbar-width:thin] sm:px-[calc((100%_-_min(28rem,42vw))/2)]"
      >
        {slides.map((image, index) => {
          const isClone = images.length > 1 && (index === 0 || index === slides.length - 1);
          const imageIndex = index === 0 && isClone ? images.length - 1 : (index - 1 + images.length) % images.length;

          return (
            <div
              key={`${image}-${index}`}
              ref={(element) => { slideRefs.current[index] = element; }}
              className="shrink-0 snap-center"
              aria-hidden={isClone}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(image)}
                tabIndex={isClone ? -1 : undefined}
                className="relative block h-56 w-[82vw] overflow-hidden rounded-2xl bg-sand shadow-lg transition hover:-translate-y-1 hover:shadow-xl sm:h-72 sm:w-[min(28rem,42vw)]"
                aria-label={`Open gallery image ${imageIndex + 1}`}
              >
                <Image src={publicImageUrl(image)} alt={`La Conchita neighborhood view ${imageIndex + 1}`} fill sizes="(max-width: 640px) 82vw, 42vw" className="object-cover" unoptimized />
              </button>
            </div>
          );
        })}
      </div>
      {selectedImage && <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-ocean/85 p-4" role="dialog" aria-modal="true" aria-label="Expanded gallery image" onClick={() => setSelectedImage(null)}><button type="button" onClick={() => setSelectedImage(null)} className="absolute right-4 top-4 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/25" aria-label="Close expanded image">Close</button><div className="relative h-[82vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}><Image src={publicImageUrl(selectedImage)} alt="Expanded La Conchita neighborhood view" fill sizes="100vw" className="object-contain" unoptimized /></div></div>}
    </section>
  );
}
