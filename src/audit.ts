import { writeFile } from "node:fs/promises";
import { loadConfig, mergeAuditInputs } from "./config.js";
import { formatReport } from "./formatters.js";
import { runPa11yScan } from "./pa11y-runner.js";
import { buildAuditReport } from "./report.js";
import type { AuditOptions } from "./types.js";
import {
  EXIT_OK,
  EXIT_RUNTIME_ERROR,
  EXIT_THRESHOLD_EXCEEDED,
} from "./types.js";

export interface AuditResult {
  exitCode: number;
  output: string;
}

export async function runAudit(options: AuditOptions): Promise<AuditResult> {
  try {
    const config = await loadConfig(options.configPath);
    const { urls, sitemap, standard } = mergeAuditInputs(
      config,
      options.urls,
      options.sitemap,
      options.standard,
    );

    const results = await runPa11yScan({
      urls,
      sitemap,
      standard,
      runner: options.runner,
      config,
      fixturePath: options.fixture,
    });

    const report = buildAuditReport(results, standard, options.runner);
    const output = formatReport(report, options.output, options.color);

    if (options.outFile) {
      await writeFile(options.outFile, output, "utf8");
    }

    const exitCode =
      report.total_violations > options.threshold
        ? EXIT_THRESHOLD_EXCEEDED
        : EXIT_OK;

    return { exitCode, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      exitCode: EXIT_RUNTIME_ERROR,
      output: `bfsgpulse audit error: ${message}\n`,
    };
  }
}
