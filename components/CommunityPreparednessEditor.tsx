"use client";

import { Check, CloudRain, ExternalLink, TriangleAlert } from "lucide-react";
import type { CommunityPreparednessContent } from "@/lib/communityPreparedness";
import InlineEditableText from "@/components/InlineEditableText";

type Props = {
  value: CommunityPreparednessContent;
  onChange: (value: CommunityPreparednessContent) => void;
  onSave: () => Promise<boolean>;
  saving: boolean;
};

const editableClass =
  "inline-block max-w-full rounded-md outline-none transition hover:bg-marina/[0.06] focus-visible:ring-2 focus-visible:ring-marina";

export default function CommunityPreparednessEditor({
  value,
  onChange,
  onSave,
  saving,
}: Props) {
  function updateField<K extends keyof CommunityPreparednessContent>(
    key: K,
    next: CommunityPreparednessContent[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  function updateArray(
    key: "historyParagraphs" | "concernsParagraphs" | "rainfallThresholds" | "contacts",
    index: number,
    next: string,
  ) {
    updateField(
      key,
      value[key].map((item, itemIndex) => (itemIndex === index ? next : item)),
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-marina/20 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-marina/10 bg-sand/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-marina">
            Home page content
          </p>
          <p className="mt-1 text-xs text-ink/60">
            Select any highlighted text to edit it in place. Changes are saved when you choose Save.
          </p>
        </div>
      </div>

      <div className="bg-sand/35 p-3 sm:p-6">
        <section
          className="preparedness-section rounded-2xl px-4 py-8 sm:rounded-3xl sm:px-8 sm:py-12"
          aria-label="Community preparedness homepage preview"
        >
          <div className="mx-auto max-w-6xl">
            <header className="mx-auto max-w-3xl text-center">
              <InlineEditableText
                label="Preparedness eyebrow"
                value={value.eyebrow}
                onChange={(next) => updateField("eyebrow", next)}
                className="eyebrow text-white/75"
              />
              <InlineEditableText
                label="Preparedness title"
                value={value.title}
                onChange={(next) => updateField("title", next)}
                className="mt-3 block w-full text-3xl font-bold uppercase tracking-[-0.05em] text-white sm:text-5xl"
              />
              <InlineEditableText
                label="Preparedness introduction"
                value={value.intro}
                onChange={(next) => updateField("intro", next)}
                multiline
                rows={3}
                className="mx-auto mt-4 block max-w-2xl text-sm leading-6 text-white/80 sm:text-base"
              />
            </header>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <article className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-deep-ocean/10 sm:p-7">
                <InlineEditableText
                  label="History heading"
                  value={value.historyTitle}
                  onChange={(next) => updateField("historyTitle", next)}
                  className="block text-2xl font-bold tracking-[-0.04em] text-marina sm:text-3xl"
                />
                <div className="mt-3 space-y-3">
                  {value.historyParagraphs.map((paragraph, index) => (
                    <InlineEditableText
                      key={`history-${index}`}
                      label={`History paragraph ${index + 1}`}
                      value={paragraph}
                      onChange={(next) => updateArray("historyParagraphs", index, next)}
                      multiline
                      rows={4}
                      className="block w-full text-sm leading-7 text-ink/70"
                    />
                  ))}
                </div>

                <div className="mt-6 border-t border-marina/10 pt-5">
                  <InlineEditableText
                    label="Concerns heading"
                    value={value.concernsTitle}
                    onChange={(next) => updateField("concernsTitle", next)}
                    className="block text-xl font-bold tracking-[-0.03em] text-marina"
                  />
                  <div className="mt-2 space-y-2">
                    {value.concernsParagraphs.map((paragraph, index) => (
                      <InlineEditableText
                        key={`concerns-${index}`}
                        label={`Concerns paragraph ${index + 1}`}
                        value={paragraph}
                        onChange={(next) => updateArray("concernsParagraphs", index, next)}
                        multiline
                        rows={4}
                        className="block w-full text-sm leading-7 text-ink/70"
                      />
                    ))}
                  </div>
                  <InlineEditableText
                    label="Safety warning"
                    value={value.warning}
                    onChange={(next) => updateField("warning", next)}
                    multiline
                    rows={2}
                    className="mt-3 block w-full font-bold text-marina"
                  />
                </div>
              </article>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <article className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-deep-ocean/10 sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <InlineEditableText
                        label="Rainfall heading"
                        value={value.rainfallTitle}
                        onChange={(next) => updateField("rainfallTitle", next)}
                        className="block text-2xl font-bold tracking-[-0.04em] text-marina"
                      />
                      <InlineEditableText
                        label="Rainfall introduction"
                        value={value.rainfallIntro}
                        onChange={(next) => updateField("rainfallIntro", next)}
                        multiline
                        rows={3}
                        className="mt-2 block w-full text-sm leading-6 text-ink/65"
                      />
                    </div>
                    <CloudRain className="h-8 w-8 shrink-0 text-ocean sm:h-10 sm:w-10" aria-hidden="true" />
                  </div>
                  <ul className="mt-4 space-y-2 text-sm font-bold text-marina">
                    {value.rainfallThresholds.map((threshold, index) => (
                      <li
                        key={`threshold-${index}`}
                        className={index === 0 ? "flex items-start gap-2" : "pl-6"}
                      >
                        {index === 0 && (
                          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
                        )}
                        <InlineEditableText
                          label={`Rainfall threshold ${index + 1}`}
                          value={threshold}
                          onChange={(next) => updateArray("rainfallThresholds", index, next)}
                          className={editableClass}
                        />
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-deep-ocean/10 sm:p-7">
                  <InlineEditableText
                    label="Contacts heading"
                    value={value.contactsTitle}
                    onChange={(next) => updateField("contactsTitle", next)}
                    className="block text-2xl font-bold tracking-[-0.04em] text-marina"
                  />
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/70">
                    {value.contacts.map((contact, index) => (
                      <li key={`contact-${index}`}>
                        <InlineEditableText
                          label={`Contact ${index + 1}`}
                          value={contact}
                          onChange={(next) => updateArray("contacts", index, next)}
                          multiline
                          rows={3}
                          className="block w-full whitespace-pre-line"
                        />
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>

            <article className="mt-4 rounded-[1.5rem] bg-white p-5 shadow-xl shadow-deep-ocean/10 sm:p-7">
              <InlineEditableText
                label="Resources heading"
                value={value.resourcesTitle}
                onChange={(next) => updateField("resourcesTitle", next)}
                className="block text-2xl font-bold tracking-[-0.04em] text-marina sm:text-3xl"
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {value.resources.map((resource, index) => (
                  <div key={`resource-${index}`} className="resource-link">
                    <InlineEditableText
                      label={`Resource ${index + 1} title`}
                      value={resource.title}
                      onChange={(next) =>
                        updateField(
                          "resources",
                          value.resources.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, title: next } : item,
                          ),
                        )
                      }
                      className="block text-left text-lg font-bold"
                    />
                    <InlineEditableText
                      label={`Resource ${index + 1} subtitle`}
                      value={resource.subtitle}
                      onChange={(next) =>
                        updateField(
                          "resources",
                          value.resources.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, subtitle: next } : item,
                          ),
                        )
                      }
                      className="mt-1 block w-full text-sm text-ink/60"
                    />
                    <InlineEditableText
                      label={`Resource ${index + 1} URL`}
                      value={resource.url}
                      onChange={(next) =>
                        updateField(
                          "resources",
                          value.resources.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, url: next } : item,
                          ),
                        )
                      }
                      className="mt-2 block w-full break-all text-xs text-marina"
                    />
                    <ExternalLink className="mt-3 h-4 w-4" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>

      <div className="flex justify-end border-t border-marina/10 bg-white px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-marina px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-marina-light disabled:cursor-wait disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {saving ? "Saving..." : "Save preparedness section"}
        </button>
      </div>
    </section>
  );
}
