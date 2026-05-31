import type { QuerySnapshot } from "./types";

const HISTORY_KEY = "visual-query-builder-history";
const PRESETS_KEY = "visual-query-builder-presets";
const THEME_KEY = "visual-query-builder-theme";

export function loadSnapshots(kind: "history" | "presets"): QuerySnapshot[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(kind === "history" ? HISTORY_KEY : PRESETS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSnapshots(kind: "history" | "presets", snapshots: QuerySnapshot[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(kind === "history" ? HISTORY_KEY : PRESETS_KEY, JSON.stringify(snapshots.slice(0, 12)));
}

export function loadTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

export function saveTheme(theme: "light" | "dark") {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_KEY, theme);
  }
}
