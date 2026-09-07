type Condition = {
  label: string;
  value: string;
  note?: string;
};

type SurfForecastTide = {
  timestamp: number;
  height: number;
  type: "high" | "low" | null;
};

type SurfForecastDay = {
  date: string;
  sunrise: number;
  sunset: number;
  tides: SurfForecastTide[];
};

type SurfForecastResponse = {
  tideDays?: SurfForecastDay[];
};

const timezone = "America/Los_Angeles";
const surfForecastUrl = "https://www.surf-forecast.com/breaks/La-Conchita-Beach/tides/latest";

function currentLocalDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replaceAll("-", "");
}

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(timestamp * 1000));
}

function formatSunTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(timestamp * 1000));
}

async function getConditions(): Promise<Condition[]> {
  const date = currentLocalDate();

  try {
    const response = await fetch(surfForecastUrl, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Surf-Forecast request failed");

    const html = await response.text();
    const marker = "window.FCGON = ";
    const payloadStart = html.indexOf(marker);
    const scriptEnd = html.indexOf("</script>", payloadStart);
    const payloadEnd = html.lastIndexOf(";", scriptEnd);
    const payload = payloadStart >= 0 && scriptEnd > payloadStart && payloadEnd > payloadStart
      ? html.slice(payloadStart + marker.length, payloadEnd)
      : undefined;
    if (!payload) throw new Error("Surf-Forecast data was not found");

    const surfForecast = JSON.parse(payload) as SurfForecastResponse;
    const day = surfForecast.tideDays?.find((tideDay) => tideDay.date === `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`);
    const highs = day?.tides.filter((tide) => tide.type === "high") ?? [];
    const lows = day?.tides.filter((tide) => tide.type === "low") ?? [];

    if (!day || !highs.length || !lows.length) {
      throw new Error("Conditions API returned incomplete data");
    }

    return [
      {
        label: "High tides",
        value: highs.map((tide) => formatClock(tide.timestamp)).join(" / "),
        note: highs.map((tide) => `${tide.height.toFixed(2)} m`).join(" / "),
      },
      {
        label: "Low tides",
        value: lows.map((tide) => formatClock(tide.timestamp)).join(" / "),
        note: lows.map((tide) => `${tide.height.toFixed(2)} m`).join(" / "),
      },
      { label: "Sunrise", value: formatSunTime(day.sunrise) },
      { label: "Sunset", value: formatSunTime(day.sunset) },
    ];
  } catch {
    return [
      { label: "High tides", value: "Unavailable" },
      { label: "Low tides", value: "Unavailable" },
      { label: "Sunrise", value: "Unavailable" },
      { label: "Sunset", value: "Unavailable" },
    ];
  }
}

export default async function HarborBoard() {
  const conditions = await getConditions();

  return (
    <div className="relative w-full rounded-2xl border border-white/35 bg-white/92 px-6 py-5 text-ink shadow-[0_22px_55px_rgba(4,54,75,0.22)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-marina">Today at La Conchita</span>
        <span className="h-2 w-2 rounded-full bg-marina-light" aria-hidden />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5 items-center">
        {conditions.map((c) => (
          <div key={c.label} className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-dune">{c.label}</dt>
            <dd className="mt-1 text-lg font-bold text-ink">
              {c.value}
              {c.note && <span className="ml-1 text-xs font-body font-normal text-dune">{c.note}</span>}
            </dd>
          </div>
        ))}
        
        {/* Surf Forecast Navigation Button */}
        <div className="col-span-2 sm:col-span-1 flex items-center justify-stretch pt-2 sm:pt-0">
          <a
            href="/surf-forecast"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-marina py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 18c-3 0-4-3-6-3s-4 3-6 3V2h24v16c-2 0-3-3-6-3s-3 3-6 3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Surf Forecast
          </a>
        </div>
      </dl>
    </div>
  );
}
