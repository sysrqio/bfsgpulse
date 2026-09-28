#!/usr/bin/env node
import { Command } from "commander";
import { runAudit } from "./audit.js";
import { DEFAULT_CONFIG_FILENAME } from "./config.js";
import { runInit } from "./init.js";
import { packageVersion } from "./report.js";
import type { OutputFormat, Runner, WcagStandard } from "./types.js";

const program = new Command();

program
  .name("bfsgpulse")
  .description(
    "BFSG/EAA accessibility evidence CLI — WCAG scans with EN 301 549 mapping (no telemetry)",
  )
  .version(packageVersion());

program
  .command("audit")
  .description("Run WCAG accessibility audit via pa11y-ci (or offline fixture)")
  .option("--config <path>", "Config file path", DEFAULT_CONFIG_FILENAME)
  .option("--urls <list>", "Comma-separated URLs (overrides config)")
  .option("--sitemap <url>", "Sitemap URL for pa11y-ci")
  .option("--standard <std>", "WCAG standard", "WCAG2AA")
  .option("--runner <name>", "pa11y runner: axe or htmlcs", "axe")
  .option("--threshold <n>", "Allowed violations before exit 2", "0")
  .option("--output <fmt>", "Output format: text, json, markdown", "text")
  .option("--out-file <path>", "Write report to file")
  .option(
    "--fixture <path>",
    "Load pa11y-like JSON results (offline CI; also BFSGPULSE_FIXTURE env)",
  )
  .option("--no-color", "Disable ANSI colors")
  .action(async (opts: Record<string, unknown>) => {
    const threshold = Number.parseInt(String(opts.threshold), 10);
    const output = String(opts.output) as OutputFormat;
    const standard = String(opts.standard) as WcagStandard;
    const runner = String(opts.runner) as Runner;
    const color = opts.color !== false;

    const result = await runAudit({
      configPath: String(opts.config),
      urls: opts.urls ? String(opts.urls) : undefined,
      sitemap: opts.sitemap ? String(opts.sitemap) : undefined,
      standard,
      runner,
      threshold: Number.isFinite(threshold) ? threshold : 0,
      output,
      outFile: opts.outFile ? String(opts.outFile) : undefined,
      color,
      fixture: opts.fixture ? String(opts.fixture) : undefined,
    });

    if (!opts.outFile) {
      process.stdout.write(result.output);
    } else if (result.exitCode === 0 || result.exitCode === 2) {
      process.stdout.write(`Report written to ${opts.outFile}\n`);
    }

    if (result.exitCode === 1) {
      process.stderr.write(result.output);
    }

    process.exit(result.exitCode);
  });

program
  .command("init")
  .description("Write a sample .bfsgpulse.json in the current directory")
  .option("--config <path>", "Target config path", DEFAULT_CONFIG_FILENAME)
  .action(async (opts: Record<string, unknown>) => {
    const msg = await runInit(String(opts.config));
    process.stdout.write(msg);
  });

program
  .command("version")
  .description("Print version")
  .action(() => {
    process.stdout.write(`${packageVersion()}\n`);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  process.stderr.write(`bfsgpulse: ${String(err)}\n`);
  process.exit(1);
});
