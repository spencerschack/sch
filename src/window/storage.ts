import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { exists } from "../utils.js";

export interface OpenedWindow {
  folder: string;
  path: string;
  exists: boolean;
}

export async function getOpenedWindows(): Promise<OpenedWindow[]> {
  const storagePath = join(
    homedir(),
    "Library/Application Support/Cursor/User/globalStorage/storage.json"
  );

  if (!(await exists(storagePath))) {
    return [];
  }

  const data = JSON.parse(await readFile(storagePath, "utf-8"));
  const windowsState = data.windowsState ?? {};
  const allWindows = [...(windowsState.openedWindows ?? [])];

  if (windowsState.lastActiveWindow) {
    allWindows.push(windowsState.lastActiveWindow);
  }

  const seen = new Set<string>();
  const windows: OpenedWindow[] = [];

  for (const w of allWindows) {
    const folder = w.folder ?? "";
    if (!folder.startsWith("file://")) continue;

    const path = decodeURIComponent(folder.replace("file://", ""));
    if (seen.has(path)) continue;
    seen.add(path);

    windows.push({
      folder,
      path,
      exists: await exists(path),
    });
  }

  return windows;
}

export async function findMissingWindows(): Promise<OpenedWindow[]> {
  const windows = await getOpenedWindows();
  return windows.filter((w) => !w.exists);
}
