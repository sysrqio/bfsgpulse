import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  aggregateBfsgMapping,
  countViolations,
  loadBfsgMap,
  mapIssueToWcag,
  ruleIdFromIssue,
} from "../src/mapping.js";
import type { Pa11yCiResults } from "../src/types.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

function loadFixture(name: string): Pa11yCiResults {
  return JSON.parse(
    readFileSync(join(fixturesDir, name), "utf8"),
  ) as Pa11yCiResults;
}

describe("bfsg-map.json", () => {
  it("contains at least 30 axe rule mappings", () => {
    const map = loadBfsgMap();
    expect(Object.keys(map.rules).length).toBeGreaterThanOrEqual(30);
  });
});

describe("ruleIdFromIssue", () => {
  it("reads axeDescription from runnerExtras", () => {
    const issue = loadFixture("sample-violations.json")[0].issues[0];
    expect(ruleIdFromIssue(issue)).toBe("image-alt");
  });
});

describe("aggregateBfsgMapping", () => {
  it("maps missing alt to WCAG 1.1.1 / BFSG 9.1.1.1", () => {
    const results = loadFixture("sample-violations.json");
    const mapping = aggregateBfsgMapping(results);
    const alt = mapping.find((m) => m.wcag === "1.1.1");
    expect(alt).toBeDefined();
    expect(alt?.bfsg_ref).toBe("9.1.1.1");
    expect(alt?.count).toBe(1);
  });

  it("counts only error-type issues in mapping", () => {
    const results = loadFixture("sample-violations.json");
    const titleWarning = results[0].issues.find(
      (i) => i.runnerExtras?.axeDescription === "document-title",
    );
    expect(titleWarning?.type).toBe("warning");
    const mapped = mapIssueToWcag(titleWarning!);
    expect(mapped?.wcag).toBe("2.4.2");
    const mapping = aggregateBfsgMapping(results);
    expect(mapping.some((m) => m.wcag === "2.4.2")).toBe(false);
  });
});

describe("countViolations", () => {
  it("counts errors across URLs", () => {
    const results = loadFixture("sample-violations.json");
    expect(countViolations(results)).toBe(3);
  });

  it("returns zero for clean fixture", () => {
    expect(countViolations(loadFixture("clean.json"))).toBe(0);
  });
});
