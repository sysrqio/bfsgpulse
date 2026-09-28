export { runAudit } from "./audit.js";
export { loadConfig, sampleConfigJson, SAMPLE_CONFIG } from "./config.js";
export {
  aggregateBfsgMapping,
  countViolations,
  loadBfsgMap,
  mapIssueToWcag,
  ruleIdFromIssue,
} from "./mapping.js";
export { computeRiskScore, issueWeight } from "./risk-score.js";
export { buildAuditReport, packageVersion } from "./report.js";
export { loadFixture, runPa11yScan } from "./pa11y-runner.js";
export type * from "./types.js";
