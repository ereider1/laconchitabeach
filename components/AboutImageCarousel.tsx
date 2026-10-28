"use client";

import Image from "next/image";
import { useState } from "react";

function publicImageUrl(url: string) {
  return url.includes("blob.vercel-storage.com") && url.includes("private.")
    ? `/api/homepage-media?url=${encodeURIComponent(url)}`
    : url;
}

export default function AboutImageCarousel({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  if (!images.length) return null;

  return (
    <section className="w-full max-w-6xl px-6 pb-16 sm:px-10" aria-label="La Conchita photo gallery">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><p className="eyebrow text-marina">See the neighborhood</p><h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em] text-ink sm:text-3xl">Life by the water</h2></div>
        <p className="hidden text-xs font-bold uppercase tracking-wider text-ink/40 sm:block">Swipe to explore</p>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(image)} className="relative h-56 w-[82vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-sand shadow-lg transition hover:-translate-y-1 hover:shadow-xl sm:h-72 sm:w-[min(28rem,42vw)]" aria-label={`Open gallery image ${index + 1}`}><Image src={publicImageUrl(image)} alt={`La Conchita neighborhood view ${index + 1}`} fill sizes="(max-width: 640px) 82vw, 42vw" className="object-cover" unoptimized /></button>)}
      </div>
      {selectedImage && <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-ocean/85 p-4" role="dialog" aria-modal="true" aria-label="Expanded gallery image" onClick={() => setSelectedImage(null)}><button type="button" onClick={() => setSelectedImage(null)} className="absolute right-4 top-4 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/25" aria-label="Close expanded image">Close</button><div className="relative h-[82vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}><Image src={publicImageUrl(selectedImage)} alt="Expanded La Conchita neighborhood view" fill sizes="100vw" className="object-contain" unoptimized /></div></div>}
    </section>
  );
}
