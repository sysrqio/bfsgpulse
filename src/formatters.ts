import chalk from "chalk";
import type { AuditReport, OutputFormat } from "./types.js";

export function formatReport(
  report: AuditReport,
  format: OutputFormat,
  useColor: boolean,
): string {
  switch (format) {
    case "json":
      return `${JSON.stringify(report, null, 2)}\n`;
    case "markdown":
      return formatMarkdown(report);
    case "text":
    default:
      return formatText(report, useColor);
  }
}

function formatMarkdown(report: AuditReport): string {
  const lines: string[] = [
    `# BfsgPulse audit report`,
    "",
    `- **Tool:** ${report.tool} v${report.version}`,
    `- **Standard:** ${report.standard}`,
    `- **Scanned:** ${report.scanned_at}`,
    `- **Risk score:** ${report.risk_score}/100`,
    `- **Total violations:** ${report.total_violations}`,
    "",
    "## URLs",
    "",
    "| URL | Violations |",
    "| --- | ---: |",
  ];

  for (const row of report.urls) {
    lines.push(`| ${row.url} | ${row.issues} |`);
  }

  if (report.bfsg_mapping.length > 0) {
    lines.push("", "## BFSG / EN 301 549 mapping", "");
    lines.push("| WCAG | BFSG ref | EN 301 549 | Count | Title |");
    lines.push("| --- | --- | --- | ---: | --- |");
    for (const m of report.bfsg_mapping) {
      lines.push(
        `| ${m.wcag} | ${m.bfsg_ref} | ${m.en301549_ref} | ${m.count} | ${m.title} |`,
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}

function formatText(report: AuditReport, useColor: boolean): string {
  const c = useColor
    ? {
        title: chalk.bold.cyan,
        ok: chalk.green,
        warn: chalk.yellow,
        bad: chalk.red,
        dim: chalk.dim,
      }
    : {
        title: (s: string) => s,
        ok: (s: string) => s,
        warn: (s: string) => s,
        bad: (s: string) => s,
        dim: (s: string) => s,
      };

  const lines: string[] = [
    c.title(`bfsgpulse audit — ${report.standard}`),
    c.dim(`Scanned at ${report.scanned_at}`),
    "",
    `Risk score: ${report.risk_score}/100`,
    `Total violations: ${report.total_violations}`,
    "",
    "URLs:",
  ];

  for (const row of report.urls) {
    const label =
      row.issues === 0
        ? c.ok(`${row.url} — 0 issues`)
        : c.bad(`${row.url} — ${row.issues} issue(s)`);
    lines.push(`  ${label}`);
  }

  if (report.bfsg_mapping.length > 0) {
    lines.push("", "BFSG mapping (top):");
    for (const m of report.bfsg_mapping.slice(0, 10)) {
      lines.push(
        `  WCAG ${m.wcag} → BFSG ${m.bfsg_ref} (${m.count}×) — ${m.title}`,
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}
