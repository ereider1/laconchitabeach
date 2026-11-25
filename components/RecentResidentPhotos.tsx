import Link from "next/link";
import Image from "next/image";

type Photo = { _id: string; caption?: string; thumbnailUrl: string };

export default function RecentResidentPhotos({ photos }: { photos: Photo[] }) {
  return (
    <section className="mb-10 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-marina">Recent beach photos</h2>
          <p className="mt-1 text-sm text-ink/55">Moments shared by your neighbors.</p>
        </div>
        <Link href="/portal/gallery" className="rounded-full bg-marina px-4 py-2 text-sm font-semibold text-white transition hover:bg-marina/90">Open photo gallery</Link>
      </div>
      {photos.length === 0 ? <p className="rounded-lg bg-sand/50 px-4 py-5 text-sm text-ink/60">No resident photos yet. Share the first one from the gallery.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((photo) => <Link key={photo._id} href="/portal/gallery" className="group relative aspect-square overflow-hidden rounded-xl bg-sand"><Image src={photo.thumbnailUrl} alt={photo.caption || "Resident beach photo"} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition group-hover:scale-105" unoptimized /></Link>)}</div>}
    </section>
  );
}
