import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runAudit } from "../src/audit.js";
import {
  EXIT_OK,
  EXIT_RUNTIME_ERROR,
  EXIT_THRESHOLD_EXCEEDED,
} from "../src/types.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const sampleFixture = join(fixturesDir, "sample-violations.json");
const cleanFixture = join(fixturesDir, "clean.json");

describe("runAudit (offline fixture)", () => {
  const prevFixture = process.env.BFSGPULSE_FIXTURE;

  afterEach(() => {
    if (prevFixture === undefined) {
      delete process.env.BFSGPULSE_FIXTURE;
    } else {
      process.env.BFSGPULSE_FIXTURE = prevFixture;
    }
  });

  it("returns exit 2 when violations exceed threshold", async () => {
    const result = await runAudit({
      configPath: "/nonexistent/.bfsgpulse.json",
      urls: "https://example.com",
      standard: "WCAG2AA",
      runner: "axe",
      threshold: 0,
      output: "json",
      color: false,
      fixture: sampleFixture,
    });
    expect(result.exitCode).toBe(EXIT_THRESHOLD_EXCEEDED);
    const json = JSON.parse(result.output) as { total_violations: number };
    expect(json.total_violations).toBe(3);
  });

  it("returns exit 0 when within threshold", async () => {
    const result = await runAudit({
      configPath: "/nonexistent/.bfsgpulse.json",
      urls: "https://example.com",
      standard: "WCAG2AA",
      runner: "axe",
      threshold: 10,
      output: "json",
      color: false,
      fixture: sampleFixture,
    });
    expect(result.exitCode).toBe(EXIT_OK);
  });

  it("returns exit 0 for clean scan", async () => {
    const result = await runAudit({
      configPath: "/nonexistent/.bfsgpulse.json",
      urls: "https://example.com",
      standard: "WCAG2AA",
      runner: "axe",
      threshold: 0,
      output: "json",
      color: false,
      fixture: cleanFixture,
    });
    expect(result.exitCode).toBe(EXIT_OK);
    const json = JSON.parse(result.output) as { risk_score: number };
    expect(json.risk_score).toBe(0);
  });

  it("supports BFSGPULSE_FIXTURE env", async () => {
    process.env.BFSGPULSE_FIXTURE = cleanFixture;
    const result = await runAudit({
      configPath: "/nonexistent/.bfsgpulse.json",
      standard: "WCAG2AA",
      runner: "axe",
      threshold: 0,
      output: "text",
      color: false,
      urls: "https://example.com",
    });
    expect(result.exitCode).toBe(EXIT_OK);
  });

  it("returns exit 1 when no URLs and no sitemap", async () => {
    const result = await runAudit({
      configPath: "/nonexistent/.bfsgpulse.json",
      standard: "WCAG2AA",
      runner: "axe",
      threshold: 0,
      output: "text",
      color: false,
    });
    expect(result.exitCode).toBe(EXIT_RUNTIME_ERROR);
    expect(result.output).toContain("No URLs");
  });

  it("writes markdown to out-file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "bfsgpulse-test-"));
    const outFile = join(dir, "report.md");
    const result = await runAudit({
      configPath: "/nonexistent/.bfsgpulse.json",
      urls: "https://example.com",
      standard: "WCAG2AA",
      runner: "axe",
      threshold: 10,
      output: "markdown",
      outFile,
      color: false,
      fixture: sampleFixture,
    });
    expect(result.exitCode).toBe(EXIT_OK);
    const md = await readFile(outFile, "utf8");
    expect(md).toContain("BFSG / EN 301 549 mapping");
  });
});

describe("runAudit with config file", () => {
  let configDir: string;

  beforeEach(async () => {
    configDir = await mkdtemp(join(tmpdir(), "bfsgpulse-cfg-"));
    await writeFile(
      join(configDir, ".bfsgpulse.json"),
      JSON.stringify({ urls: ["https://example.com"] }),
    );
  });

  it("loads URLs from config with fixture override", async () => {
    const result = await runAudit({
      configPath: join(configDir, ".bfsgpulse.json"),
      standard: "WCAG2AA",
      runner: "axe",
      threshold: 0,
      output: "json",
      color: false,
      fixture: cleanFixture,
    });
    expect(result.exitCode).toBe(EXIT_OK);
  });
});
