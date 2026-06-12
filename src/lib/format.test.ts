import { describe, it, expect } from "vitest";
import { readingStats, formatRelative } from "./format";

describe("readingStats", () => {
  it("counts words and estimates at least a 1-minute read", () => {
    expect(readingStats("")).toEqual({ words: 0, minutes: 1 });
    expect(readingStats("hello world")).toEqual({ words: 2, minutes: 1 });
  });
  it("scales minutes at ~200 wpm", () => {
    const text = Array.from({ length: 600 }, () => "word").join(" ");
    expect(readingStats(text)).toEqual({ words: 600, minutes: 3 });
  });
});

describe("formatRelative", () => {
  it("handles empty and invalid input", () => {
    expect(formatRelative(null)).toBe("-");
    expect(formatRelative("not a date")).toBe("-");
  });
  it("produces coarse 'ago' buckets", () => {
    const ago = (ms: number) => formatRelative(new Date(Date.now() - ms));
    expect(ago(5 * 1000)).toBe("just now");
    expect(ago(3 * 60 * 1000)).toBe("3 minutes ago");
    expect(ago(2 * 60 * 60 * 1000)).toBe("2 hours ago");
    expect(ago(3 * 24 * 60 * 60 * 1000)).toBe("3 days ago");
  });
});
