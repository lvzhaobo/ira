import { useEffect, useState } from "react";

function readBool(key: string, defaultValue: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "true") return true;
    if (v === "false") return false;
  } catch {
    /* quota / private mode */
  }
  return defaultValue;
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "true" : "false");
  } catch {
    /* ignore */
  }
}

/**
 * 与 localStorage 同步的布尔状态（字符串 "true"/"false"）。
 */
export function usePersistedBoolean(storageKey: string, defaultValue: boolean) {
  const [value, setValue] = useState(() => readBool(storageKey, defaultValue));

  useEffect(() => {
    writeBool(storageKey, value);
  }, [storageKey, value]);

  return [value, setValue] as const;
}
