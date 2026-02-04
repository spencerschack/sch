import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { promisify } from "node:util";

export const execAsync = promisify(exec);

export async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export function isMain(importMetaUrl: string): boolean {
  return process.argv[1] === fileURLToPath(importMetaUrl);
}
