import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "myflove-collapsed-views";

type CollapseMap = Record<string, boolean>;

let state: CollapseMap = {};
let loaded = false;
const listeners = new Set<() => void>();
/** Alla sektioner som just nu finns på skärmen: id -> antal monterade instanser */
const mounted = new Map<string, number>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw) as CollapseMap;
  } catch {
    state = {};
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isCollapsed(id: string) {
  load();
  return Boolean(state[id]);
}

export function setCollapsed(id: string, collapsed: boolean, explicit = false) {
  load();
  if (collapsed) state[id] = true;
  else if (explicit) state[id] = false;
  else delete state[id];
  state = { ...state };
  persist();
  emit();
}

export function setAllVisible(collapsed: boolean) {
  load();
  const next: CollapseMap = { ...state };
  mounted.forEach((_count, id) => {
    next[id] = collapsed;
  });
  state = next;
  persist();
  emit();
}

function registerMounted(id: string) {
  mounted.set(id, (mounted.get(id) ?? 0) + 1);
  emit();
  return () => {
    const count = (mounted.get(id) ?? 1) - 1;
    if (count <= 0) mounted.delete(id);
    else mounted.set(id, count);
    emit();
  };
}

function snapshotVisible() {
  let total = 0;
  let collapsedCount = 0;
  mounted.forEach((_c, id) => {
    total += 1;
    if (state[id]) collapsedCount += 1;
  });
  return `${total}:${collapsedCount}`;
}

/** Hopfällbart läge för en enskild vy/sektion. Sparas tills du väljer något annat. */
export function useCollapsible(id: string | null, defaultCollapsed = false) {
  const collapsed = useSyncExternalStore(
    subscribe,
    () => (id ? (id in state ? Boolean(state[id]) : defaultCollapsed) : false),
    () => false,
  );

  useEffect(() => {
    if (!id) return;
    return registerMounted(id);
  }, [id]);

  const toggle = useCallback(() => {
    if (!id) return;
    const current = id in state ? Boolean(state[id]) : defaultCollapsed;
    setCollapsed(id, !current, true);
  }, [id, defaultCollapsed]);

  return { collapsed, toggle };
}

/** Sammanfattning av alla synliga sektioner – används av "minimera/visa allt". */
export function useVisibleSections() {
  const snap = useSyncExternalStore(subscribe, snapshotVisible, () => "0:0");
  return useMemo(() => {
    const [total, collapsedCount] = snap.split(":").map(Number);
    return { total, collapsedCount, allCollapsed: total > 0 && collapsedCount === total };
  }, [snap]);
}

/** Stabilt id per vy: sidan + rubrikens text. */
export function useSectionId(title: string | null) {
  const [path, setPath] = useState("");
  useEffect(() => {
    setPath(window.location.pathname);
  }, []);
  if (!title) return null;
  return `${path}::${title.slice(0, 60)}`;
}
