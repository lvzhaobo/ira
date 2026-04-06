/** 工作台侧栏：最近操作 + 待关注（与研报问答页模式一致，按 page 隔离 localStorage） */

export type WorkshopRecentEntry = { text: string; ts: number; meta?: string };

export type WorkshopAttentionItem = { id: string; title: string; hint: string; preset?: string };

export function wsRecentKey(page: string) {
  return `ira-ws-recent-v1-${page}`;
}

export function wsDismissKey(page: string) {
  return `ira-ws-att-dismiss-v1-${page}`;
}

export function loadRecent(page: string): WorkshopRecentEntry[] {
  try {
    const raw = localStorage.getItem(wsRecentKey(page));
    return raw ? (JSON.parse(raw) as WorkshopRecentEntry[]) : [];
  } catch {
    return [];
  }
}

export function mergeRecent(page: string, text: string, meta?: string, max = 12): WorkshopRecentEntry[] {
  const key = wsRecentKey(page);
  let list: WorkshopRecentEntry[] = [];
  try {
    const raw = localStorage.getItem(key);
    list = raw ? (JSON.parse(raw) as WorkshopRecentEntry[]) : [];
  } catch {
    list = [];
  }
  list = list.filter((x) => x.text !== text);
  list.unshift({ text, ts: Date.now(), meta });
  list = list.slice(0, max);
  localStorage.setItem(key, JSON.stringify(list));
  return list;
}

export function loadDismissed(page: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(wsDismissKey(page)) || "[]") as string[];
  } catch {
    return [];
  }
}

export function saveDismissed(page: string, ids: string[]) {
  localStorage.setItem(wsDismissKey(page), JSON.stringify(ids));
}
