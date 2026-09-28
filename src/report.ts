import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregateBfsgMapping,
  countViolations,
} from "./mapping.js";
import { computeRiskScore } from "./risk-score.js";
import type {
  AuditReport,
  Pa11yCiResults,
  Runner,
  WcagStandard,
} from "./types.js";

export function packageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgPath = join(here, "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
  return pkg.version;
}

export function buildAuditReport(
  results: Pa11yCiResults,
  standard: WcagStandard,
  runner: Runner,
): AuditReport {
  const violationsOnly = results.map((row) => ({
    url: row.url,
    issues: row.issues.filter((i) => i.type === "error").length,
    violations: row.issues.filter((i) => i.type === "error"),
  }));

  return {
    tool: "bfsgpulse",
    version: packageVersion(),
    standard,
    runner,
    scanned_at: new Date().toISOString(),
    urls: violationsOnly,
    total_violations: countViolations(results),
    bfsg_mapping: aggregateBfsgMapping(results),
    risk_score: computeRiskScore(results),
  };
}
