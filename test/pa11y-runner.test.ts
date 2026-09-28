import { vi, describe, expect, it, beforeEach } from "vitest";

const { execaMock } = vi.hoisted(() => ({
  execaMock: vi.fn(),
}));

vi.mock("execa", () => ({
  execa: execaMock,
}));

import { runAudit } from "../src/audit.js";
import { runPa11yScan } from "../src/pa11y-runner.js";
import { EXIT_RUNTIME_ERROR } from "../src/types.js";

const baseScanOptions = {
  urls: ["https://unreachable.example/"],
  standard: "WCAG2AA" as const,
  runner: "axe" as const,
  config: {},
};

describe("runPa11yScan (execa mock)", () => {
  beforeEach(() => {
    execaMock.mockReset();
    delete process.env.BFSGPULSE_FIXTURE;
  });

  it("throws when execa fails (network / unreachable)", async () => {
    execaMock.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(runPa11yScan(baseScanOptions)).rejects.toThrow(
      /Failed to run pa11y-ci/,
    );
  });

  it("throws when pa11y-ci stderr and no stdout", async () => {
    execaMock.mockResolvedValue({
      stdout: "",
      stderr: "Error: Navigation timeout",
      exitCode: 1,
    });
    await expect(runPa11yScan(baseScanOptions)).rejects.toThrow(
      /Navigation timeout/,
    );
  });

  it("throws when stdout is not valid JSON", async () => {
    execaMock.mockResolvedValue({
      stdout: "not json",
      stderr: "",
      exitCode: 0,
    });
    await expect(runPa11yScan(baseScanOptions)).rejects.toThrow(
      /Could not parse pa11y-ci JSON/,
    );
  });
});

describe("runAudit without fixture (execa mock)", () => {
  beforeEach(() => {
    execaMock.mockReset();
    delete process.env.BFSGPULSE_FIXTURE;
  });

  it("returns exit 1 when pa11y-ci is unreachable", async () => {
    execaMock.mockRejectedValue(new Error("spawn ENOENT"));
    const result = await runAudit({
      configPath: "/nonexistent/.bfsgpulse.json",
      urls: "https://example.com",
      standard: "WCAG2AA",
      runner: "axe",
      threshold: 0,
      output: "text",
      color: false,
    });
    expect(result.exitCode).toBe(EXIT_RUNTIME_ERROR);
    expect(result.output).toMatch(/bfsgpulse audit error:/);
  });
});
