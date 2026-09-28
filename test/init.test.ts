import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG_FILENAME, SAMPLE_CONFIG } from "../src/config.js";
import { runInit } from "../src/init.js";
import { packageVersion } from "../src/report.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "dist", "cli.js");

describe("runInit (unit)", () => {
  it("writes sample config JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "bfsgpulse-init-"));
    const target = join(dir, ".bfsgpulse.json");
    const msg = await runInit(target);
    expect(msg).toContain(target);
    const raw = await readFile(target, "utf8");
    const parsed = JSON.parse(raw) as typeof SAMPLE_CONFIG;
    expect(parsed.urls).toEqual(SAMPLE_CONFIG.urls);
    expect(parsed.defaults?.standard).toBe("WCAG2AA");
  });
});

describe("packageVersion (unit)", () => {
  it("matches package.json version", () => {
    expect(packageVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("CLI init and version", () => {
  beforeAll(() => {
    execFileSync("npm", ["run", "build"], { cwd: repoRoot, stdio: "pipe" });
  });

  it("bfsgpulse version prints semver", () => {
    const out = execFileSync("node", [cliPath, "version"], {
      encoding: "utf8",
    });
    expect(out.trim()).toBe(packageVersion());
  });

  it("bfsgpulse --version prints semver", () => {
    const out = execFileSync("node", [cliPath, "--version"], {
      encoding: "utf8",
    });
    expect(out.trim()).toBe(packageVersion());
  });

  it("bfsgpulse init writes default config file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "bfsgpulse-cli-init-"));
    const configPath = join(dir, DEFAULT_CONFIG_FILENAME);
    execFileSync(
      "node",
      [cliPath, "init", "--config", configPath],
      { cwd: dir, stdio: "pipe" },
    );
    const info = await stat(configPath);
    expect(info.isFile()).toBe(true);
    const parsed = JSON.parse(await readFile(configPath, "utf8")) as {
      urls: string[];
    };
    expect(parsed.urls.length).toBeGreaterThan(0);
  });
});
