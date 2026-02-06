import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { exec, type ExecOptions } from "node:child_process";
import { promisify } from "node:util";

const execPromise = promisify(exec);

// Wrapper with larger buffer to avoid ERR_CHILD_PROCESS_STDIO_MAXBUFFER
export function execAsync(command: string, options?: ExecOptions): Promise<{ stdout: string; stderr: string }> {
  return execPromise(command, { maxBuffer: 10 * 1024 * 1024, ...options }) as Promise<{ stdout: string; stderr: string }>;
}

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
