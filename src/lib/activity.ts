const KEY = "awpa.activity.v1";

export type ActivityItem = {
  id: string;
  tool: string;
  detail: string;
  at: number;
};

export function readActivity(): ActivityItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ActivityItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function logActivity(tool: string, detail: string) {
  if (typeof window === "undefined") return;
  const item: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tool,
    detail: detail.slice(0, 120),
    at: Date.now(),
  };
  const next = [item, ...readActivity()].slice(0, 12);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — activity is non-critical */
  }
  window.dispatchEvent(new Event("awpa:activity"));
}

export function timeAgo(at: number): string {
  const s = Math.max(1, Math.round((Date.now() - at) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
