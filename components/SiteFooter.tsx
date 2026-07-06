export default function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-fog">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-ink/60 md:flex-row md:items-center md:justify-between">
        <p className="font-display text-base text-marina">La Conchita Residents</p>
        <p>La Conchita, CA 93001</p>
        <p>&copy; {new Date().getFullYear()} La Conchita.</p>
      </div>
    </footer>
  );
}
