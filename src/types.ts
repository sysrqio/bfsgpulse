export type OutputFormat = "text" | "json" | "markdown";
export type WcagStandard = "WCAG2A" | "WCAG2AA" | "WCAG2AAA";
export type Runner = "axe" | "htmlcs";

export interface BfsgPulseDefaults {
  standard?: WcagStandard;
  runners?: Runner[];
  concurrency?: number;
  timeout?: number;
}

export interface BfsgPulseConfig {
  urls?: string[];
  sitemap?: string;
  defaults?: BfsgPulseDefaults;
}

export type Pa11yIssueType = "error" | "warning" | "notice";

export interface Pa11yIssue {
  code: string;
  type: Pa11yIssueType;
  typeCode?: number;
  message: string;
  context?: string;
  selector?: string;
  runner?: string;
  runnerExtras?: Record<string, unknown>;
}

export interface Pa11yUrlResult {
  url: string;
  issues: Pa11yIssue[];
}

/** pa11y-ci JSON reporter shape (array of per-URL results). */
export type Pa11yCiResults = Pa11yUrlResult[];

export interface BfsgMappingEntry {
  wcag: string;
  bfsg_ref: string;
  en301549_ref: string;
  title: string;
  count: number;
}

export interface AuditReport {
  tool: "bfsgpulse";
  version: string;
  standard: WcagStandard;
  runner: Runner;
  scanned_at: string;
  urls: Array<{
    url: string;
    issues: number;
    violations: Pa11yIssue[];
  }>;
  total_violations: number;
  bfsg_mapping: BfsgMappingEntry[];
  risk_score: number;
}

export interface AuditOptions {
  configPath: string;
  urls?: string;
  sitemap?: string;
  standard: WcagStandard;
  runner: Runner;
  threshold: number;
  output: OutputFormat;
  outFile?: string;
  color: boolean;
  fixture?: string;
}

export const EXIT_OK = 0;
export const EXIT_RUNTIME_ERROR = 1;
export const EXIT_THRESHOLD_EXCEEDED = 2;
