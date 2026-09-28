import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { BfsgPulseConfig, WcagStandard } from "./types.js";

export const DEFAULT_CONFIG_FILENAME = ".bfsgpulse.json";

export const SAMPLE_CONFIG: BfsgPulseConfig = {
  urls: [
    "https://example.com/",
    "https://example.com/checkout",
  ],
  defaults: {
    standard: "WCAG2AA",
    runners: ["axe"],
    concurrency: 4,
    timeout: 60000,
  },
};

export async function loadConfig(configPath: string): Promise<BfsgPulseConfig> {
  const absolute = resolve(configPath);
  let raw: string;
  try {
    raw = await readFile(absolute, "utf8");
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return {};
    }
    throw new Error(`Failed to read config at ${absolute}: ${String(err)}`);
  }
  try {
    return JSON.parse(raw) as BfsgPulseConfig;
  } catch {
    throw new Error(`Invalid JSON in config file: ${absolute}`);
  }
}

export function mergeAuditInputs(
  config: BfsgPulseConfig,
  cliUrls?: string,
  cliSitemap?: string,
  cliStandard?: WcagStandard,
): { urls: string[]; sitemap?: string; standard: WcagStandard } {
  const standard =
    cliStandard ?? config.defaults?.standard ?? ("WCAG2AA" as WcagStandard);

  let urls: string[] = config.urls ?? [];
  if (cliUrls?.trim()) {
    urls = cliUrls.split(",").map((u) => u.trim()).filter(Boolean);
  }

  const sitemap = cliSitemap ?? config.sitemap;

  if (!sitemap && urls.length === 0) {
    throw new Error(
      "No URLs to scan. Provide urls in config, --urls, or --sitemap.",
    );
  }

  return { urls, sitemap, standard };
}

export function sampleConfigJson(): string {
  return `${JSON.stringify(SAMPLE_CONFIG, null, 2)}\n`;
}
