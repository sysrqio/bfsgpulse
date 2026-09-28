import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatReport } from "../src/formatters.js";
import { buildAuditReport, packageVersion } from "../src/report.js";
import type { AuditReport, Pa11yCiResults } from "../src/types.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

function loadFixture(name: string): Pa11yCiResults {
  return JSON.parse(
    readFileSync(join(fixturesDir, name), "utf8"),
  ) as Pa11yCiResults;
}

function expectFullAuditReport(report: AuditReport): void {
  expect(report.tool).toBe("bfsgpulse");
  expect(report.version).toBe(packageVersion());
  expect(report.standard).toBe("WCAG2AA");
  expect(report.runner).toBe("axe");
  expect(report.scanned_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(Array.isArray(report.urls)).toBe(true);
  expect(report.urls.length).toBeGreaterThan(0);
  for (const row of report.urls) {
    expect(typeof row.url).toBe("string");
    expect(typeof row.issues).toBe("number");
    expect(Array.isArray(row.violations)).toBe(true);
  }
  expect(typeof report.total_violations).toBe("number");
  expect(Array.isArray(report.bfsg_mapping)).toBe(true);
  for (const entry of report.bfsg_mapping) {
    expect(entry).toMatchObject({
      wcag: expect.any(String),
      bfsg_ref: expect.any(String),
      en301549_ref: expect.any(String),
      title: expect.any(String),
      count: expect.any(Number),
    });
    expect(entry.count).toBeGreaterThan(0);
  }
  expect(typeof report.risk_score).toBe("number");
  expect(report.risk_score).toBeGreaterThanOrEqual(0);
  expect(report.risk_score).toBeLessThanOrEqual(100);
}

describe("buildAuditReport JSON schema fields", () => {
  it("includes all top-level fields and bfsg_mapping from fixture", () => {
    const results = loadFixture("sample-violations.json");
    const report = buildAuditReport(results, "WCAG2AA", "axe");
    expectFullAuditReport(report);
    expect(report.total_violations).toBe(3);
    const alt = report.bfsg_mapping.find((m) => m.wcag === "1.1.1");
    expect(alt?.bfsg_ref).toBe("9.1.1.1");
    expect(alt?.count).toBe(1);
  });
});

describe("formatReport", () => {
  const report = buildAuditReport(
    loadFixture("sample-violations.json"),
    "WCAG2AA",
    "axe",
  );

  it("json output is parseable and matches schema fields", () => {
    const out = formatReport(report, "json", false);
    const parsed = JSON.parse(out) as AuditReport;
    expectFullAuditReport(parsed);
    expect(parsed.bfsg_mapping.some((m) => m.wcag === "1.1.1")).toBe(true);
  });

  it("markdown output includes URLs and BFSG mapping table", () => {
    const md = formatReport(report, "markdown", false);
    expect(md).toContain("# BfsgPulse audit report");
    expect(md).toContain("## URLs");
    expect(md).toContain("## BFSG / EN 301 549 mapping");
    expect(md).toContain("| WCAG | BFSG ref | EN 301 549 | Count | Title |");
    expect(md).toContain("1.1.1");
    expect(md).toContain("9.1.1.1");
  });

  it("text output lists risk score and BFSG mapping without ANSI when color off", () => {
    const text = formatReport(report, "text", false);
    expect(text).toContain("bfsgpulse audit — WCAG2AA");
    expect(text).toContain("Risk score:");
    expect(text).toContain("Total violations: 3");
    expect(text).toContain("BFSG mapping (top):");
    expect(text).toContain("WCAG 1.1.1 → BFSG 9.1.1.1");
    expect(text).not.toMatch(/\u001b\[/);
  });
});
