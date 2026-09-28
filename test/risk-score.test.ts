import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { computeRiskScore } from "../src/risk-score.js";
import type { Pa11yCiResults } from "../src/types.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("computeRiskScore", () => {
  it("returns 0-100 bounded score", () => {
    const results = JSON.parse(
      readFileSync(join(fixturesDir, "sample-violations.json"), "utf8"),
    ) as Pa11yCiResults;
    const score = computeRiskScore(results);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBe(3 * 8 + 1 * 3);
  });

  it("returns 0 for no issues", () => {
    const results = JSON.parse(
      readFileSync(join(fixturesDir, "clean.json"), "utf8"),
    ) as Pa11yCiResults;
    expect(computeRiskScore(results)).toBe(0);
  });
});
