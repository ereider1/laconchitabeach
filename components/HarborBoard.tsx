// The Harbor Board is Sandpiper Cove's signature visual element: a
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
    <div className="paper-grain relative rounded-2xl border border-dune/30 bg-marina px-6 py-5 shadow-[0_18px_40px_-20px_rgba(27,58,75,0.6)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-sm italic text-sand/70">Today at the Cove</span>
        <span className="h-2 w-2 rounded-full bg-coral" aria-hidden />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
        {conditions.map((c) => (
          <div key={c.label} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wider text-sand/60">{c.label}</dt>
            <dd className="font-display text-xl text-sand">
              {c.value}
              {c.note && <span className="ml-1 text-xs font-body text-sand/50">{c.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
