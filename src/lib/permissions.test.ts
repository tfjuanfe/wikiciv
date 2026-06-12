import { describe, it, expect } from "vitest";
import {
  resolveSubmissionStatus,
  canEditEntry,
  canContributeNow,
} from "./permissions";
import type { SessionUser } from "./types";

function user(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "u1",
    username: "tester",
    role: "contributor",
    trusted: false,
    emailVerified: true,
    ...overrides,
  } as SessionUser;
}

describe("resolveSubmissionStatus", () => {
  it("parks anything saved as a draft", () => {
    expect(resolveSubmissionStatus(user(), "account", true)).toBe("draft");
    expect(
      resolveSubmissionStatus(user({ role: "archivist" }), "record", true),
    ).toBe("draft");
  });

  it("publishes archivist submissions directly", () => {
    expect(
      resolveSubmissionStatus(user({ role: "archivist" }), "record", false),
    ).toBe("published");
  });

  it("always routes RECORD entries through review", () => {
    expect(
      resolveSubmissionStatus(user({ trusted: true }), "record", false),
    ).toBe("pending");
  });

  it("auto-publishes ACCOUNT entries only for trusted contributors", () => {
    expect(
      resolveSubmissionStatus(user({ trusted: true }), "account", false),
    ).toBe("published");
    expect(
      resolveSubmissionStatus(user({ trusted: false }), "account", false),
    ).toBe("pending");
  });
});

describe("canEditEntry", () => {
  it("rejects anonymous users", () => {
    expect(canEditEntry(null, { authorId: "u1" })).toBe(false);
  });
  it("lets authors edit their own entries", () => {
    expect(canEditEntry(user({ id: "u1" }), { authorId: "u1" })).toBe(true);
    expect(canEditEntry(user({ id: "u1" }), { authorId: "u2" })).toBe(false);
  });
  it("lets archivists edit anything", () => {
    expect(
      canEditEntry(user({ id: "u1", role: "archivist" }), { authorId: "u2" }),
    ).toBe(true);
  });
});

describe("canContributeNow", () => {
  it("requires a verified email", () => {
    expect(canContributeNow(user({ emailVerified: true }))).toBe(true);
    expect(canContributeNow(user({ emailVerified: false }))).toBe(false);
  });
  it("rejects non-contributors", () => {
    expect(canContributeNow(user({ role: "reader" as any }))).toBe(false);
    expect(canContributeNow(null)).toBe(false);
  });
});
