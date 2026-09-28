import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BfsgMappingEntry, Pa11yIssue, Pa11yUrlResult } from "./types.js";

interface RuleMeta {
  wcag: string;
  bfsg_ref: string;
  en301549_ref: string;
  title: string;
}

interface BfsgMapFile {
  rules: Record<string, RuleMeta>;
}

let cachedMap: BfsgMapFile | null = null;

function mapFilePath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "bfsg-map.json");
}

export function loadBfsgMap(): BfsgMapFile {
  if (cachedMap) return cachedMap;
  const raw = readFileSync(mapFilePath(), "utf8");
  cachedMap = JSON.parse(raw) as BfsgMapFile;
  return cachedMap;
}

/** Reset cache (tests). */
export function resetBfsgMapCache(): void {
  cachedMap = null;
}

export function ruleIdFromIssue(issue: Pa11yIssue): string {
  const extras = issue.runnerExtras as { axeDescription?: string } | undefined;
  if (extras?.axeDescription) {
    return extras.axeDescription;
  }
  const code = issue.code;
  const colon = code.indexOf(":");
  if (colon >= 0) {
    return code.slice(colon + 1).trim();
  }
  return code.trim();
}

export function mapIssueToWcag(issue: Pa11yIssue): RuleMeta | null {
  const map = loadBfsgMap();
  const ruleId = ruleIdFromIssue(issue);
  if (map.rules[ruleId]) {
    return map.rules[ruleId];
  }
  const wcagMatch = issue.code.match(/WCAG2(?:A{1,3})?\s*([\d.]+)/i);
  if (wcagMatch) {
    return {
      wcag: wcagMatch[1],
      bfsg_ref: `9.${wcagMatch[1]}`,
      en301549_ref: `9.${wcagMatch[1]}`,
      title: issue.message.slice(0, 80),
    };
  }
  return null;
}

export function aggregateBfsgMapping(
  results: Pa11yUrlResult[],
): BfsgMappingEntry[] {
  const counts = new Map<
    string,
    { meta: RuleMeta; count: number }
  >();

  for (const row of results) {
    for (const issue of row.issues) {
      if (issue.type !== "error") continue;
      const meta = mapIssueToWcag(issue);
      if (!meta) continue;
      const key = `${meta.wcag}|${meta.bfsg_ref}`;
      const prev = counts.get(key);
      if (prev) {
        prev.count += 1;
      } else {
        counts.set(key, { meta, count: 1 });
      }
    }
  }

  return [...counts.values()]
    .map(({ meta, count }) => ({
      wcag: meta.wcag,
      bfsg_ref: meta.bfsg_ref,
      en301549_ref: meta.en301549_ref,
      title: meta.title,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.wcag.localeCompare(b.wcag));
}

export function countViolations(results: Pa11yUrlResult[]): number {
  return results.reduce(
    (sum, r) => sum + r.issues.filter((i) => i.type === "error").length,
    0,
  );
}
