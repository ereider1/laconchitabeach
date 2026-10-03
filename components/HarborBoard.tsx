import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  CalendarDays,
  ArrowRight,
  Sun,
  Thermometer,
  Waves,
  type LucideIcon,
} from "lucide-react";

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

type DailyForecast = {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
};

type WeatherResponse = {
  daily?: DailyForecast;
};

type MarineResponse = {
  current?: {
    sea_surface_temperature?: number;
  };
};

type DailyConditions = {
  highTides: SurfForecastTide[];
  lowTides: SurfForecastTide[];
  sunrise: number;
  sunset: number;
};

type TodayWeather = {
  code: number;
  high: number;
  low: number;
  precipitation: number;
  forecast: WeatherDay[];
};

type WeatherDay = {
  date: string;
  code: number;
  high: number;
  low: number;
  precipitation: number;
};

const timezone = "America/Los_Angeles";
const surfForecastUrl = "https://www.surf-forecast.com/breaks/La-Conchita-Beach/tides/latest";
const forecastUrl =
  "https://api.open-meteo.com/v1/forecast?latitude=34.36&longitude=-119.45&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&forecast_days=7";
const marineTemperatureUrl =
  "https://marine-api.open-meteo.com/v1/marine?latitude=34.36&longitude=-119.45&current=sea_surface_temperature&timezone=America%2FLos_Angeles";
const openMeteoUrl = "https://open-meteo.com/";
const marineApiDocsUrl = "https://open-meteo.com/en/docs/marine-weather-api";

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

function formatForecastDay(date: string, index: number) {
  if (index === 0) return "Today";

  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timezone,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function getWeather(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Clear", Icon: Sun };
  if (code === 1) return { label: "Mostly clear", Icon: CloudSun };
  if (code === 2) return { label: "Partly cloudy", Icon: CloudSun };
  if (code === 3) return { label: "Cloudy", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Fog", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Drizzle", Icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { label: "Rain", Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Snow", Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: "Showers", Icon: CloudRain };
  if (code === 85 || code === 86) return { label: "Snow showers", Icon: CloudSnow };
  if (code >= 95) return { label: "Thunderstorms", Icon: CloudLightning };
  return { label: "Forecast", Icon: Cloud };
}

async function getDailyConditions(): Promise<DailyConditions | null> {
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
    const date = currentLocalDate();
    const day = surfForecast.tideDays?.find(
      (tideDay) => tideDay.date === `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`,
    );
    const highTides = day?.tides.filter((tide) => tide.type === "high") ?? [];
    const lowTides = day?.tides.filter((tide) => tide.type === "low") ?? [];

    if (!day || !highTides.length || !lowTides.length) {
      throw new Error("Conditions API returned incomplete data");
    }

    return { highTides, lowTides, sunrise: day.sunrise, sunset: day.sunset };
  } catch (error) {
    console.error("Unable to load tide and sun data:", error);
    return null;
  }
}

async function getTodayWeather(): Promise<TodayWeather | null> {
  try {
    const response = await fetch(forecastUrl, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Weather request failed");

    const payload = (await response.json()) as WeatherResponse;
    const daily = payload.daily;
    if (!daily) throw new Error("Weather forecast was empty");

    const code = daily.weather_code?.[0];
    const high = daily.temperature_2m_max?.[0];
    const low = daily.temperature_2m_min?.[0];
    const precipitation = daily.precipitation_probability_max?.[0];
    if (
      typeof code !== "number" ||
      typeof high !== "number" ||
      typeof low !== "number" ||
      typeof precipitation !== "number"
    ) {
      throw new Error("Today's weather forecast was incomplete");
    }

    const forecast = (daily.time ?? []).flatMap((date, index) => {
      const forecastCode = daily.weather_code?.[index];
      const forecastHigh = daily.temperature_2m_max?.[index];
      const forecastLow = daily.temperature_2m_min?.[index];
      const forecastPrecipitation = daily.precipitation_probability_max?.[index];
      if (
        typeof forecastCode !== "number" ||
        typeof forecastHigh !== "number" ||
        typeof forecastLow !== "number" ||
        typeof forecastPrecipitation !== "number"
      ) {
        return [];
      }
      return [{
        date,
        code: forecastCode,
        high: forecastHigh,
        low: forecastLow,
        precipitation: forecastPrecipitation,
      }];
    });

    return { code, high, low, precipitation, forecast };
  } catch (error) {
    console.error("Unable to load today's weather:", error);
    return null;
  }
}

async function getOceanTemperature() {
  try {
    const response = await fetch(marineTemperatureUrl, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Marine temperature request failed");

    const payload = (await response.json()) as MarineResponse;
    const temperatureCelsius = payload.current?.sea_surface_temperature;
    if (typeof temperatureCelsius !== "number" || !Number.isFinite(temperatureCelsius)) {
      throw new Error("Marine temperature data was unavailable");
    }

    return {
      value: `${Math.round((temperatureCelsius * 9) / 5 + 32)}°F`,
      available: true,
    };
  } catch (error) {
    console.error("Unable to load ocean temperature:", error);
    return { value: "Unavailable", available: false };
  }
}

function TideRow({ label, tides }: { label: string; tides: SurfForecastTide[] | undefined }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="shrink-0 text-xs font-semibold text-ink/70">{label}</dt>
      <dd className="text-right text-sm font-bold text-ink">
        {tides?.length
          ? tides.map((tide) => (
              <span key={tide.timestamp} className="block whitespace-nowrap">
                {formatClock(tide.timestamp)}
                <span className="ml-1 text-xs font-normal text-dune">{tide.height.toFixed(2)} m</span>
              </span>
            ))
          : "Unavailable"}
      </dd>
    </div>
  );
}

export default async function HarborBoard() {
  const [conditions, weather, oceanTemperature] = await Promise.all([
    getDailyConditions(),
    getTodayWeather(),
    getOceanTemperature(),
  ]);
  const { Icon, label } = weather ? getWeather(weather.code) : { Icon: Cloud, label: "Unavailable" };
  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <section
      aria-label="Today's weather and conditions for La Conchita"
      className="w-full rounded-2xl border border-marina/10 bg-white/95 px-5 py-5 text-left text-ink shadow-[0_22px_55px_rgba(4,54,75,0.16)] backdrop-blur-md sm:px-7 sm:py-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-base font-bold uppercase tracking-[0.16em] text-marina sm:text-lg">
          Today at La Conchita
        </h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm">
          <p className="inline-flex items-center gap-2 text-ink/70">
            <CalendarDays className="h-4 w-4 text-marina" aria-hidden="true" />
            {today}
          </p>
          {weather?.forecast.length ? (
            <details className="group relative">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 font-medium text-marina hover:text-ink [&::-webkit-details-marker]:hidden">
                View 7-Day Forecast
                <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
              </summary>
              <div className="absolute right-0 top-full z-20 mt-3 grid w-[min(88vw,34rem)] grid-cols-4 gap-2 rounded-2xl border border-marina/10 bg-white p-3 text-ink shadow-xl sm:grid-cols-7">
                {weather.forecast.map((day, index) => {
                  const { Icon: DayIcon, label: dayLabel } = getWeather(day.code);
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1 rounded-xl bg-marina/[0.04] px-1.5 py-2 text-center">
                      <span className="text-[10px] font-semibold text-ink/70">
                        {formatForecastDay(day.date, index)}
                      </span>
                      <DayIcon className="h-5 w-5 text-marina" aria-label={dayLabel} />
                      <span className="whitespace-nowrap text-xs font-bold tabular-nums">
                        {Math.round(day.high)}° <span className="font-normal text-dune">{Math.round(day.low)}°</span>
                      </span>
                      <span className="text-[9px] text-ocean">{day.precipitation}% rain</span>
                    </div>
                  );
                })}
              </div>
            </details>
          ) : (
            <a
              href={openMeteoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-medium text-marina hover:text-ink"
            >
              View 7-Day Forecast
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-marina/10 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        <article className="py-4 first:pt-0 last:pb-0 lg:px-5 lg:py-0 lg:first:pl-0 lg:last:pr-0">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ocean">Weather</h3>
          <div className="mt-3 flex items-center gap-5 lg:flex-col lg:gap-2">
            <Icon className="h-14 w-14 shrink-0 text-marina lg:h-16 lg:w-16" aria-label={label} />
            {weather ? (
              <div className="min-w-0 lg:text-center">
                <p className="whitespace-nowrap text-2xl font-bold tabular-nums text-ink sm:text-3xl">
                  {Math.round(weather.high)}° <span className="font-normal text-dune">/ {Math.round(weather.low)}°F</span>
                </p>
                <p className="mt-1 text-sm text-ink/75">{label}</p>
                <p className="mt-0.5 text-sm text-ocean">{weather.precipitation}% chance of rain</p>
              </div>
            ) : <p className="text-sm text-dune">Unavailable</p>}
          </div>
          <a
            href={openMeteoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-marina underline decoration-marina/40 underline-offset-2 hover:text-ink lg:justify-center"
          >
          </a>
        </article>

        <article className="py-4 lg:px-5 lg:py-0">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ocean">Tides</h3>
          <div className="mt-3 flex items-center gap-5 lg:flex-col lg:gap-2">
            <Waves className="h-14 w-14 shrink-0 text-marina lg:h-16 lg:w-16" aria-hidden="true" />
            <dl className="w-full space-y-2 lg:max-w-xs">
              <TideRow label="High tide" tides={conditions?.highTides} />
              <div className="border-t border-marina/10 pt-2">
                <TideRow label="Low tide" tides={conditions?.lowTides} />
              </div>
            </dl>
          </div>
        </article>

        <article className="py-4 lg:px-5 lg:py-0">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ocean">Sun</h3>
          <div className="mt-3 flex items-center gap-5 lg:flex-col lg:gap-2">
            <Sun className="h-14 w-14 shrink-0 text-amber-400 lg:h-16 lg:w-16" aria-hidden="true" />
            <dl className="w-full space-y-3 lg:text-center">
              <div className="flex items-center justify-between gap-2 text-sm lg:flex-col lg:gap-0.5">
                <dt className="text-ink/70">Sunrise</dt>
                <dd className="whitespace-nowrap font-bold text-ink">
                  {conditions ? formatSunTime(conditions.sunrise) : "Unavailable"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm lg:flex-col lg:gap-0.5">
                <dt className="text-ink/70">Sunset</dt>
                <dd className="whitespace-nowrap font-bold text-ink">
                  {conditions ? formatSunTime(conditions.sunset) : "Unavailable"}
                </dd>
              </div>
            </dl>
          </div>
        </article>

        <article className="py-4 lg:px-5 lg:py-0">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ocean">Ocean temp</h3>
          <div className="mt-3 flex items-center gap-5 lg:flex-col lg:gap-2">
            <Thermometer className="h-14 w-14 shrink-0 text-marina lg:h-16 lg:w-16" aria-hidden="true" />
            <p className="text-3xl font-bold tabular-nums text-ink">{oceanTemperature.value}</p>
          </div>
          {oceanTemperature.available && (
            <a
              href={marineApiDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-marina underline decoration-marina/40 underline-offset-2 hover:text-ink"
            >
            </a>
          )}
          <a id="surf-button"
            href="/surf-forecast"
            className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-full bg-ocean px-5 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:scale-[1.02] hover:bg-ink active:scale-[0.98] lg:mt-5"
          >
            <Waves className="h-5 w-5" aria-hidden="true" />
            Surf Forecast
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </a>
        </article>
      </div>
    </section>
  );
}
