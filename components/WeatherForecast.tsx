import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";

type DailyForecast = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
};

type WeatherResponse = {
  daily?: DailyForecast;
};

const forecastUrl =
  "https://api.open-meteo.com/v1/forecast?latitude=34.36&longitude=-119.45&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&forecast_days=6";
const californiaTimeZone = "America/Los_Angeles";

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

async function getForecast() {
  try {
    const response = await fetch(forecastUrl, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Weather request failed");

    const payload = (await response.json()) as WeatherResponse;
    const daily = payload.daily;
    if (!daily?.time?.length) throw new Error("Weather forecast was empty");

    return daily.time.map((date, index) => ({
      date,
      code: daily.weather_code[index],
      high: daily.temperature_2m_max[index],
      low: daily.temperature_2m_min[index],
      precipitation: daily.precipitation_probability_max[index],
    }));
  } catch {
    return [];
  }
}

function formatDay(date: string, index: number) {
  if (index === 0) return "Today";

  const [year, month, day] = date.split("-").map(Number);
  const noonPacific = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: californiaTimeZone,
  }).format(noonPacific);
}

export default async function WeatherForecast() {
  const forecast = await getForecast();

  return (
    <section
      aria-label="Six-day weather forecast for La Conchita, California"
      className="w-full rounded-2xl border border-white/35 bg-white/95 px-4 py-4 text-ink shadow-[0_18px_45px_rgba(4,54,75,0.16)] backdrop-blur-md sm:px-6"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-marina">
          Weather <span className="font-medium text-dune">/ La Conchita, CA</span>
        </h2>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-[10px] text-dune underline decoration-dune/40 underline-offset-2"
        >
          Open-Meteo
        </a>
      </div>

      {forecast.length ? (
        <div className="grid grid-cols-3 sm:grid-cols-6">
          {forecast.map((day, index) => {
            const { label, Icon } = getWeather(day.code);
            return (
              <div
                key={day.date}
                className={`flex min-w-0 flex-col items-center px-1 py-2 sm:px-2 ${index > 0 ? "border-l border-marina/10" : ""} ${index >= 3 ? "border-t border-marina/10 sm:border-t-0" : ""}`}
              >
                <p className="text-xs font-semibold text-ink/75">{formatDay(day.date, index)}</p>
                <Icon className="my-2 h-6 w-6 text-marina" aria-label={label} />
                <p className="text-sm font-bold tabular-nums text-ink">
                  {Math.round(day.high)}°
                  <span className="ml-1 font-normal text-dune">{Math.round(day.low)}°</span>
                </p>
                <p className="mt-1 min-h-3 text-[10px] text-ocean">
                  {day.precipitation > 0 ? `${day.precipitation}% rain` : " "}
                </p>
                <span className="sr-only">{label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-dune">Forecast temporarily unavailable</p>
      )}
    </section>
  );
}