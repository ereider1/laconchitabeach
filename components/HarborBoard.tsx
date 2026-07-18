// The La Conchita signature visual element: a
// hand-lettered conditions board like the ones posted at a marina office.
// It ships with representative sample data. To make it live, swap the
// `conditions` array for a fetch to a tide/weather API (e.g. NOAA CO-OPS
// or StormGlass) in a server component and pass the result down as props.

type Condition = {
  label: string;
  value: string;
  note?: string;
};

const conditions: Condition[] = [
  { label: "Water temp", value: "63°F" },
  { label: "High tide", value: "6:12 AM", note: "5.8 ft" },
  { label: "Low tide", value: "1:47 PM", note: "0.9 ft" },
  { label: "Sunset", value: "8:21 PM" },
  { label: "Swell", value: "3–4 ft", note: "W" },
];

export default function HarborBoard() {
  return (
    <div className="relative w-full rounded-2xl border border-white/35 bg-white/92 px-6 py-5 text-ink shadow-[0_22px_55px_rgba(4,54,75,0.22)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-marina">Today at La Conchita</span>
        <span className="h-2 w-2 rounded-full bg-marina-light" aria-hidden />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
        {conditions.map((c) => (
          <div key={c.label} className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-dune">{c.label}</dt>
            <dd className="mt-1 text-lg font-bold text-ink">
              {c.value}
              {c.note && <span className="ml-1 text-xs font-body font-normal text-dune">{c.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
