import type { HomePageContent } from "@/lib/homePageContent";

type FooterContent = Pick<
  HomePageContent,
  "footerTitle" | "footerSubtitle" | "footerTagline" | "footerCopyright"
>;

export default function SiteFooter({ content }: { content?: FooterContent }) {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-white">{content?.footerTitle ?? "La Conchita Beach"}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">{content?.footerSubtitle ?? "California coast"}</p>
        </div>
        <p>{content?.footerTagline ?? "Community news, neighbors, and beach life."}</p>
        <p>&copy; {new Date().getFullYear()} {content?.footerCopyright ?? "La Conchita."}</p>
      </div>
    </footer>
  );
}
