"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function FlyerImage({ src }: { src: string }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!previewOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewOpen]);

  return (
    <section className="flex h-screen w-full items-center justify-center bg-white">
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        aria-label="Open flyer preview"
        className="relative h-full w-full cursor-zoom-in"
      >
        <Image
          src={src}
          alt="Community flyer"
          fill
          sizes="100vw"
          className="object-contain"
          unoptimized
        />
      </button>

      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Flyer preview"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            type="button"
            aria-label="Close flyer preview"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
          <div
            className="relative h-[94vh] w-[94vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={src}
              alt="Enlarged community flyer"
              fill
              sizes="94vw"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </section>
  );
}
