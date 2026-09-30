import "server-only";
import rawCouples from "@/data/couples.json";
import type { Couple, CoupleDatabase } from "@/lib/types";

/**
 * Mock data-access layer. Swap the body of these functions for a real
 * database/CMS query — the rest of the app only depends on this interface.
 */
const couples = rawCouples as CoupleDatabase;

export async function getCoupleBySlug(slug: string): Promise<Couple | null> {
  return Object.hasOwn(couples, slug) ? couples[slug] : null;
}

export async function getAllCouples(): Promise<Couple[]> {
  return Object.values(couples);
}

export async function getAllSlugs(): Promise<string[]> {
  return Object.keys(couples);
}
