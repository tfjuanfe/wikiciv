// Minecraft-tier event rating scale (1..5). Plain module (no server-only) so it
// can be shared by server pages and client components.

export interface RatingTier {
  value: number;
  name: string;
  color: string; // background for the tier block
}

export const RATING_TIERS: RatingTier[] = [
  { value: 1, name: "Copper", color: "#b87333" },
  { value: 2, name: "Iron", color: "#c9ccd1" },
  { value: 3, name: "Gold", color: "#f0c244" },
  { value: 4, name: "Diamond", color: "#43d0d8" },
  { value: 5, name: "Netherite", color: "#594f55" },
];

export const MAX_RATING = RATING_TIERS.length;

export function isValidRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_RATING;
}

// Map an average score to the nearest tier (for display badges).
export function tierForScore(avg: number | null | undefined): RatingTier | null {
  if (avg == null || Number.isNaN(avg)) return null;
  const idx = Math.min(MAX_RATING, Math.max(1, Math.round(avg)));
  return RATING_TIERS[idx - 1];
}

export function tierName(value: number): string {
  return RATING_TIERS[value - 1]?.name ?? "";
}

// Comments reuse the shared Comment model keyed by subjectKey. Events get their
// own namespace so they never collide with entry subjects.
export function eventSubjectKey(eventId: string): string {
  return `event::${eventId}`;
}
