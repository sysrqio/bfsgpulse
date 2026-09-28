import { readFile } from "node:fs/promises";
import { execa } from "execa";
import type {
  BfsgPulseConfig,
  Pa11yCiResults,
  Runner,
  WcagStandard,
} from "./types.js";

export interface RunPa11yOptions {
  urls: string[];
  sitemap?: string;
  standard: WcagStandard;
  runner: Runner;
  config: BfsgPulseConfig;
  fixturePath?: string;
}

function standardFlag(standard: WcagStandard): string {
  return standard;
}

export async function loadFixture(path: string): Promise<Pa11yCiResults> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Fixture must be a JSON array: ${path}`);
  }
  return parsed as Pa11yCiResults;
}

export async function runPa11yScan(
  options: RunPa11yOptions,
): Promise<Pa11yCiResults> {
  const envFixture = process.env.BFSGPULSE_FIXTURE;
  const fixture = options.fixturePath ?? envFixture;
  if (fixture) {
    return loadFixture(fixture);
  }

  const args: string[] = [
    "pa11y-ci",
    "--reporter",
    "json",
    "--standard",
    standardFlag(options.standard),
    "--runner",
    options.runner,
  ];

  const timeout = options.config.defaults?.timeout ?? 60000;
  args.push("--config", JSON.stringify({ timeout }));

  if (options.sitemap) {
    args.push("--sitemap", options.sitemap);
  } else {
    for (const url of options.urls) {
      args.push(url);
    }
  }

  let stdout: string;
  try {
    const result = await execa("npx", args, {
      stdout: "pipe",
      stderr: "pipe",
      reject: false,
    });
    stdout = result.stdout;
    if (!stdout?.trim() && result.stderr) {
      throw new Error(result.stderr.trim());
    }
  } catch (err) {
    throw new Error(`Failed to run pa11y-ci: ${String(err)}`);
  }

  const text = stdout.trim();
  if (!text) {
    throw new Error(
      "pa11y-ci produced no JSON output. Install pa11y-ci or use --fixture / BFSGPULSE_FIXTURE for offline runs.",
    );
  }

  try {
    return JSON.parse(text) as Pa11yCiResults;
  } catch {
    throw new Error("Could not parse pa11y-ci JSON from stdout.");
  }
}
