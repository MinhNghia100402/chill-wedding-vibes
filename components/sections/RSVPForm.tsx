"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button-styles";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { formatDeadline } from "@/lib/date";
import { flattenErrors, rsvpSchema, type RsvpFieldErrors, type RsvpResponse } from "@/lib/rsvp-schema";
import type { RsvpConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RSVPFormProps {
  slug: string;
  config: RsvpConfig;
  /** Computed on the server so the open/closed state is consistent on first paint. */
  isOpen: boolean;
}

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "success" | "error"; message: string };

const inputClasses =
  "w-full rounded-xl border border-on-surface/15 bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface/40 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-red-500";

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function RSVPForm({ slug, config, isOpen }: RSVPFormProps) {
  const uid = useId();
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [errors, setErrors] = useState<RsvpFieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const deadline = formatDeadline(config.deadline);
  const fieldId = (name: string) => `${uid}-${name}`;
  const a11y = (name: keyof RsvpFieldErrors) => ({
    id: fieldId(name),
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${fieldId(name)}-error` : undefined,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form));
    // Empty optional inputs are omitted rather than sent as "".
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== "")) as Record<string, unknown>;
    payload.slug = slug;
    payload.guests ??= 1;

    const parsed = rsvpSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(flattenErrors(parsed.error));
      return;
    }
    if (parsed.data.attending === "yes" && parsed.data.guests > config.maxGuests) {
      setErrors({ guests: `Your invitation covers up to ${config.maxGuests} guest(s).` });
      return;
    }

    setErrors({});
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as RsvpResponse;
      if (!res.ok || !data.ok) {
        setErrors(data.fieldErrors ?? {});
        setStatus({ kind: "error", message: data.message });
        return;
      }
      setStatus({ kind: "success", message: data.message });
      form.reset();
      setAttending("");
    } catch {
      setStatus({ kind: "error", message: "Network error — please check your connection and try again." });
    }
  }

  return (
    <Section
      id="rsvp"
      eyebrow="Will you join us?"
      title="RSVP"
      intro={isOpen ? `Kindly respond by ${deadline}.` : undefined}
    >
      <Reveal className="mx-auto max-w-2xl">
        <div className="rounded-3xl bg-surface p-6 text-on-surface shadow-xl shadow-on-canvas/5 ring-1 ring-primary/10 sm:p-10">
          {!isOpen ? (
            <div className="py-6 text-center">
              <Heading as="h3" size="md" className="text-accent">
                RSVPs are closed
              </Heading>
              <p className="mt-3 opacity-75">
                The RSVP deadline was {deadline}. If you have questions, please reach out to the couple directly.
              </p>
            </div>
          ) : status.kind === "success" ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
              <CircleCheck className="mx-auto h-14 w-14 text-accent" aria-hidden />
              <p role="status" className="mt-4 text-lg">
                {status.message}
              </p>
              <button type="button" onClick={() => setStatus({ kind: "idle" })} className={buttonClasses("outline", "mt-6")}>
                Submit another response
              </button>
            </motion.div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot — visually hidden, skipped by keyboard and screen readers. */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={fieldId("name")} label="Full name" error={errors.name}>
                  <input {...a11y("name")} autoComplete="name" className={inputClasses} placeholder="Jane Doe" />
                </Field>
                <Field id={fieldId("email")} label="Email" error={errors.email}>
                  <input {...a11y("email")} type="email" autoComplete="email" className={inputClasses} placeholder="jane@example.com" />
                </Field>
              </div>

              <fieldset>
                <legend className="mb-1.5 block text-sm font-medium">Will you attend?</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["yes", "Joyfully accept"],
                      ["no", "Regretfully decline"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-medium transition",
                        attending === value
                          ? "border-primary bg-primary text-on-primary"
                          : "border-on-surface/15 hover:border-primary/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="attending"
                        value={value}
                        checked={attending === value}
                        onChange={() => setAttending(value)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {errors.attending && (
                  <p role="alert" className="mt-1.5 text-sm text-red-600">
                    {errors.attending}
                  </p>
                )}
              </fieldset>

              <AnimatePresence initial={false}>
                {attending === "yes" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <Field id={fieldId("guests")} label="Number of guests (including you)" error={errors.guests}>
                      <select {...a11y("guests")} defaultValue="1" className={inputClasses}>
                        {Array.from({ length: config.maxGuests }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {config.askDietary && (
                      <Field id={fieldId("dietary")} label="Dietary requirements" error={errors.dietary}>
                        <input {...a11y("dietary")} className={inputClasses} placeholder="Vegetarian, nut allergy…" />
                      </Field>
                    )}
                    {config.askSong && (
                      <Field id={fieldId("song")} label="A song that will get you dancing" error={errors.song}>
                        <input {...a11y("song")} className={inputClasses} placeholder="Artist – Song" />
                      </Field>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <Field id={fieldId("message")} label="A note for the couple (optional)" error={errors.message}>
                <textarea {...a11y("message")} rows={3} className={cn(inputClasses, "resize-y")} />
              </Field>

              {status.kind === "error" && (
                <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
                  {status.message}
                </p>
              )}

              <button type="submit" disabled={status.kind === "submitting"} className={buttonClasses("solid", "w-full py-3.5 text-base")}>
                {status.kind === "submitting" ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden /> Send RSVP
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </Reveal>
    </Section>
  );
}
