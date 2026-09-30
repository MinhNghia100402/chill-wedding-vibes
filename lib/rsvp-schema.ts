import { z } from "zod";

/** Shared by the RSVP form (client-side hints) and the API route (authoritative). */
export const rsvpSchema = z
  .object({
    slug: z.string().min(1).max(100),
    name: z.string({ required_error: "Please enter your full name" }).trim().min(2, "Please enter your full name").max(100),
    email: z.string({ required_error: "Please enter your email" }).trim().toLowerCase().email("Please enter a valid email"),
    attending: z.enum(["yes", "no"], {
      required_error: "Please let us know if you can make it",
      invalid_type_error: "Please let us know if you can make it",
      message: "Please let us know if you can make it",
    }),
    guests: z.coerce.number().int().min(1).max(10),
    dietary: z.string().trim().max(300).optional(),
    song: z.string().trim().max(150).optional(),
    message: z.string().trim().max(1000).optional(),
    /**
     * Honeypot: humans never see this field, so any value means a bot. Accepted
     * here (not rejected) so the API can answer bots with a fake success.
     */
    website: z.string().max(500).optional(),
  })
  .strict();

export type RsvpInput = z.infer<typeof rsvpSchema>;

export type RsvpFieldErrors = Partial<Record<keyof RsvpInput, string>>;

export interface RsvpResponse {
  ok: boolean;
  message: string;
  fieldErrors?: RsvpFieldErrors;
}

export function flattenErrors(error: z.ZodError): RsvpFieldErrors {
  const out: RsvpFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof RsvpInput;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
