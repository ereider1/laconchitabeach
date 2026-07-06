export default function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-fog">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-ink/60 md:flex-row md:items-center md:justify-between">
        <p className="font-display text-base text-marina">Sandpiper Cove Homeowners Association</p>
        <p>142 Shoreline Lane, Sandpiper Cove, CA 93109</p>
        <p>&copy; {new Date().getFullYear()} Sandpiper Cove HOA. Residents only beyond this point.</p>
      </div>
    </footer>
  );
}
