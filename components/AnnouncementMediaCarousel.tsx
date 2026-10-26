"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function AnnouncementMediaCarousel({ announcementId, imageDocumentIds }: { announcementId: string; imageDocumentIds: string[] }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  if (!imageDocumentIds.length) return null;
  const src = `/api/announcements/${announcementId}/image?documentId=${encodeURIComponent(imageDocumentIds[index])}`;
  const move = (direction: number) => setIndex((current) => (current + direction + imageDocumentIds.length) % imageDocumentIds.length);

  return <>
    <div className="relative mt-3 overflow-hidden rounded-lg bg-sand">
      <button type="button" onClick={() => setLightbox(true)} className="relative block aspect-[4/3] w-full focus:outline-none focus:ring-2 focus:ring-marina focus:ring-inset"><Image src={src} alt={`Announcement image ${index + 1} of ${imageDocumentIds.length}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" unoptimized /></button>
      {imageDocumentIds.length > 1 && <><button type="button" onClick={() => move(-1)} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-ink/65 p-2 text-white"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => move(1)} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-ink/65 p-2 text-white"><ChevronRight className="h-5 w-5" /></button><div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-ink/65 px-2.5 py-1 text-xs text-white">{index + 1} / {imageDocumentIds.length}</div></>}
    </div>
    {lightbox && <div role="dialog" aria-modal="true" aria-label="Announcement image preview" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-3 sm:p-8" onClick={() => setLightbox(false)}><div className="relative h-[min(82vh,48rem)] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}><Image src={src} alt={`Announcement image ${index + 1} of ${imageDocumentIds.length}`} fill sizes="100vw" className="object-contain" unoptimized /><button type="button" onClick={() => setLightbox(false)} aria-label="Close image preview" className="absolute right-0 top-0 rounded-full bg-white/90 p-2 text-ink"><X className="h-5 w-5" /></button>{imageDocumentIds.length > 1 && <><button type="button" onClick={() => move(-1)} aria-label="Previous image" className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => move(1)} aria-label="Next image" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink"><ChevronRight className="h-5 w-5" /></button></>}</div></div>}
  </>;
}
