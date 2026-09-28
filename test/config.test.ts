import { describe, expect, it } from "vitest";
import { mergeAuditInputs, sampleConfigJson } from "../src/config.js";

describe("mergeAuditInputs", () => {
  it("prefers CLI urls over config", () => {
    const merged = mergeAuditInputs(
      { urls: ["https://a.test"] },
      "https://b.test,https://c.test",
    );
    expect(merged.urls).toEqual(["https://b.test", "https://c.test"]);
  });

  it("throws when no urls or sitemap", () => {
    expect(() => mergeAuditInputs({})).toThrow("No URLs");
  });
});

describe("sampleConfigJson", () => {
  it("is valid JSON with urls array", () => {
    const parsed = JSON.parse(sampleConfigJson()) as { urls: string[] };
    expect(Array.isArray(parsed.urls)).toBe(true);
  });
});
