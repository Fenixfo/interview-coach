import { app, safeStorage } from "electron";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const file = (name: string) => join(app.getPath("userData"), name);

function writeAtomic(path: string, data: string | Buffer): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, path);
}

export function loadPersisted(): unknown | null {
  try {
    return JSON.parse(readFileSync(file("settings.json"), "utf8"));
  } catch {
    return null;
  }
}

export function savePersisted(data: unknown): void {
  writeAtomic(file("settings.json"), JSON.stringify(data, null, 2));
}

/** La clave se cifra con el sistema operativo (DPAPI en Windows). Nunca se guarda en claro. */
export function hasKey(): boolean {
  return existsSync(file("gemini.key"));
}

export function getKey(): string | null {
  try {
    if (!hasKey() || !safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(readFileSync(file("gemini.key")));
  } catch {
    return null;
  }
}

export function setKey(key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("El sistema no ofrece almacenamiento cifrado; no se guardó la clave.");
  }
  writeAtomic(file("gemini.key"), safeStorage.encryptString(key));
}

export function clearKey(): void {
  if (hasKey()) unlinkSync(file("gemini.key"));
}
