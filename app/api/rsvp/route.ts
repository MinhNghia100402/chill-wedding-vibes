import { NextResponse } from "next/server";
import { getCoupleBySlug } from "@/lib/couples";
import { isRsvpOpen } from "@/lib/date";
import { flattenErrors, rsvpSchema, type RsvpResponse } from "@/lib/rsvp-schema";
import { upsertRsvp } from "@/lib/rsvp-store";

const json = (body: RsvpResponse, status: number) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, message: "Please check the highlighted fields.", fieldErrors: flattenErrors(parsed.error) }, 422);
  }

  const { website, ...data } = parsed.data;
  // Honeypot tripped: pretend success so bots don't learn to adapt.
  if (website) return json({ ok: true, message: "Thank you!" }, 200);

  const couple = await getCoupleBySlug(data.slug);
  if (!couple) return json({ ok: false, message: "Wedding not found." }, 404);

  const { rsvpConfig } = couple;
  if (!isRsvpOpen(rsvpConfig.deadline)) {
    return json({ ok: false, message: "Sorry, RSVPs for this wedding are closed." }, 403);
  }
  if (data.attending === "yes" && data.guests > rsvpConfig.maxGuests) {
    return json(
      {
        ok: false,
        message: "Please check the highlighted fields.",
        fieldErrors: { guests: `Your invitation covers up to ${rsvpConfig.maxGuests} guest(s).` },
      },
      422,
    );
  }

  // Drop anything this couple didn't ask for.
  const record = {
    ...data,
    guests: data.attending === "yes" ? data.guests : 0,
    dietary: rsvpConfig.askDietary && data.attending === "yes" ? data.dietary : undefined,
    song: rsvpConfig.askSong && data.attending === "yes" ? data.song : undefined,
  };

  try {
    const { updated } = await upsertRsvp(record);
    const firstName = data.name.split(" ")[0];
    const message =
      data.attending === "yes"
        ? `Thank you, ${firstName}! We can't wait to celebrate with you.`
        : `Thank you for letting us know, ${firstName}. You'll be missed!`;
    return json({ ok: true, message: updated ? `${message} (Your previous response was updated.)` : message }, updated ? 200 : 201);
  } catch (error) {
    console.error("[api/rsvp] failed to save RSVP", error);
    return json({ ok: false, message: "Something went wrong saving your RSVP. Please try again." }, 500);
  }
}
