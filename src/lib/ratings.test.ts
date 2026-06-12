import { describe, it, expect } from "vitest";
import {
  isValidRating,
  tierForScore,
  tierName,
  eventSubjectKey,
  MAX_RATING,
} from "./ratings";

describe("isValidRating", () => {
  it("accepts integers within 1..MAX", () => {
    for (let v = 1; v <= MAX_RATING; v++) expect(isValidRating(v)).toBe(true);
  });
  it("rejects out-of-range, fractional, and non-finite values", () => {
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(MAX_RATING + 1)).toBe(false);
    expect(isValidRating(2.5)).toBe(false);
    expect(isValidRating(NaN)).toBe(false);
  });
});

describe("tierForScore", () => {
  it("returns null for missing/NaN averages", () => {
    expect(tierForScore(null)).toBeNull();
    expect(tierForScore(undefined)).toBeNull();
    expect(tierForScore(NaN)).toBeNull();
  });
  it("rounds to the nearest tier and clamps to range", () => {
    expect(tierForScore(1)!.name).toBe("Copper");
    expect(tierForScore(3.4)!.value).toBe(3);
    expect(tierForScore(4.6)!.value).toBe(5);
    expect(tierForScore(99)!.value).toBe(MAX_RATING);
    expect(tierForScore(0.1)!.value).toBe(1);
  });
});

describe("tierName / eventSubjectKey", () => {
  it("names known tiers and empty-strings unknown ones", () => {
    expect(tierName(1)).toBe("Copper");
    expect(tierName(999)).toBe("");
  });
  it("namespaces event subject keys", () => {
    expect(eventSubjectKey("abc")).toBe("event::abc");
  });
});
