const STORAGE_KEY = "courier-board-saved";

let savedIds = new Set<string>();
let listeners: (() => void)[] = [];
let hydrated = false;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...savedIds]));
  } catch {
    // ponytail: dummy demo storage, ignore quota/availability errors
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) savedIds = new Set(JSON.parse(raw));
  } catch {
    // ignore malformed storage
  }
}

export function toggleSaved(id: string) {
  hydrate();
  if (savedIds.has(id)) savedIds.delete(id);
  else savedIds.add(id);
  persist();
  listeners.forEach((l) => l());
}

export function getSavedIds() {
  hydrate();
  return savedIds;
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
