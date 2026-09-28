import type { Pa11yIssue, Pa11yUrlResult } from "./types.js";

const SEVERITY_WEIGHT: Record<string, number> = {
  error: 8,
  warning: 3,
  notice: 1,
};

export function issueWeight(issue: Pa11yIssue): number {
  return SEVERITY_WEIGHT[issue.type] ?? 4;
}

/** Risk score 0–100 from severity-weighted issue sum. */
export function computeRiskScore(results: Pa11yUrlResult[]): number {
  let total = 0;
  for (const row of results) {
    for (const issue of row.issues) {
      total += issueWeight(issue);
    }
  }
  return Math.min(100, total);
}
