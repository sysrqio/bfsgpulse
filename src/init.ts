import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DEFAULT_CONFIG_FILENAME, sampleConfigJson } from "./config.js";

export async function runInit(targetPath?: string): Promise<string> {
  const path = resolve(targetPath ?? DEFAULT_CONFIG_FILENAME);
  await writeFile(path, sampleConfigJson(), "utf8");
  return `Wrote sample config to ${path}\n`;
}
