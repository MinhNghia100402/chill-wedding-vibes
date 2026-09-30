import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RsvpInput } from "@/lib/rsvp-schema";

export interface RsvpRecord extends Omit<RsvpInput, "website"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Minimal persistence for RSVPs: a JSON file under `.data/` (git-ignored).
 * Good for local development and single-instance deploys. On read-only /
 * serverless filesystems it degrades to in-memory storage — replace this
 * module with a real database (Postgres, Supabase, etc.) for production.
 */
const FILE = path.join(process.cwd(), ".data", "rsvps.json");

let memory: RsvpRecord[] | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<RsvpRecord[]> {
  if (memory) return memory;
  try {
    memory = JSON.parse(await readFile(FILE, "utf8")) as RsvpRecord[];
  } catch {
    memory = [];
  }
  return memory;
}

async function persist(records: RsvpRecord[]) {
  try {
    await mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(records, null, 2));
    await rename(tmp, FILE); // atomic replace
  } catch (error) {
    console.warn("[rsvp-store] could not write to disk; keeping RSVPs in memory only", error);
  }
}

/** Inserts a new RSVP, or updates the guest's previous one (same couple + email). */
export function upsertRsvp(input: Omit<RsvpInput, "website">): Promise<{ record: RsvpRecord; updated: boolean }> {
  // Serialise writes so concurrent requests can't clobber each other.
  const task = queue.then(async () => {
    const records = await load();
    const now = new Date().toISOString();
    const index = records.findIndex((r) => r.slug === input.slug && r.email === input.email);

    if (index !== -1) {
      // Replace (not merge) so fields cleared in the new response don't linger.
      const { id, createdAt } = records[index];
      const record: RsvpRecord = { ...input, id, createdAt, updatedAt: now };
      records[index] = record;
      await persist(records);
      return { record, updated: true };
    }
    const record: RsvpRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    records.push(record);
    await persist(records);
    return { record, updated: false };
  });
  queue = task.catch(() => undefined);
  return task;
}
