"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export default function WeatherDisclosure({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((open) => !open)}
        className="col-start-1 row-start-2 inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-marina/10 bg-marina/[0.04] px-3 py-2 text-xs font-semibold text-marina transition-colors hover:bg-marina/[0.08] hover:text-ink sm:col-start-2 sm:row-start-1 sm:text-sm"
      >
        {isOpen ? "Hide" : "Show"} today&apos;s conditions
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ease-out ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        id={contentId}
        data-open={isOpen}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className="weather-details-content col-span-full row-start-4 sm:row-start-2"
      >
        {children}
      </div>
    </>
  );
}
