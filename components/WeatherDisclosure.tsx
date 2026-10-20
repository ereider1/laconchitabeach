"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type WeatherDisclosureContextValue = {
  contentId: string;
  isOpen: boolean;
  toggle: () => void;
};

const WeatherDisclosureContext = createContext<WeatherDisclosureContextValue | null>(null);

function useWeatherDisclosure() {
  const context = useContext(WeatherDisclosureContext);

  if (!context) {
    throw new Error("Weather disclosure components must be used within WeatherDisclosureProvider.");
  }

  return context;
}

export function WeatherDisclosureProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <WeatherDisclosureContext.Provider
      value={{
        contentId,
        isOpen,
        toggle: () => setIsOpen((open) => !open),
      }}
    >
      {children}
    </WeatherDisclosureContext.Provider>
  );
}

export function WeatherDisclosureButton() {
  const { contentId, isOpen, toggle } = useWeatherDisclosure();

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={contentId}
      onClick={toggle}
      className="rounded-full border border-white/55 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur transition hover:bg-white/20"
    >
      WEATHER IN LA CONCHITA
      <ChevronDown
        className={`ml-2 inline h-4 w-4 transition-transform duration-300 ease-out ${isOpen ? "rotate-180" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

export function WeatherDisclosurePanel({ children }: { children: ReactNode }) {
  const { contentId, isOpen } = useWeatherDisclosure();

  return (
    <div id={contentId} hidden={!isOpen}>
      {children}
    </div>
  );
}

export function WeatherDisclosureContent({ children }: { children: ReactNode }) {
  const { isOpen } = useWeatherDisclosure();

  return (
    <div
      data-open={isOpen}
      aria-hidden={!isOpen}
      inert={!isOpen}
      className="weather-details-content col-span-full row-start-4 sm:row-start-2"
    >
      {children}
    </div>
  );
}
