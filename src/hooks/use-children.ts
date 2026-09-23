import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PERSON_COLOR_VALUES } from "@/lib/palette";

// Barn-delen: allt är privat för den som lagt in det, men varje sak kan
// delas med en eller flera familjemedlemmar.

export interface Child {
  id: string;
  owner_id: string;
  name: string;
  birthdate: string | null;
  color: string;
  note: string | null;
  /**
   * Förälderns egna observationer: "det här brukar hjälpa mitt barn".
   * Detta är privat familjeinformation – inte diagnos eller medicinsk data.
   */
  helps: string[];
  /** Valfri avatar (emoji eller bild-url). */
  avatar: string | null;
}


export type ChildItemKind = "activity" | "task" | "note" | "doc";

export interface ChildItem {
  id: string;
  child_id: string;
  owner_id: string;
  kind: ChildItemKind;
  title: string;
  notes: string | null;
  date: string | null;
  time: string | null;
  completed: boolean;
  remind: boolean;
  repeat: "none" | "daily" | "weekdays" | "weekly";
  file_path: string | null;
  created_at: string;
  updated_at: string;
  /** Vilka användare denna sak är delad med (bara ägaren ser hela listan) */
  sharedWith: string[];
}

export interface FamilyMember {
  user_id: string;
  display_name: string;
  color: string;
}

/** Barnens färger följer MyFloves gemensamma personpalett. */
export const CHILD_COLORS = PERSON_COLOR_VALUES;

/* ------------------------------------------------------------------ */
/* Delad butik – alla vyer (t.ex. Barn-sidan och Kalendern) läser samma  */
/* data, så en ändring syns direkt överallt utan omladdning.             */
/* ------------------------------------------------------------------ */

/** Konflikt: någon annan hann ändra samma aktivitet först. */
export interface ChildItemConflict {
  /** Så som saken ser ut hos oss, med mina ändringar. */
  mine: ChildItem;
  /** Så som den ser ut i molnet just nu (den andres version). */
  theirs: ChildItem;
  /** Ändringen jag försökte spara. */
  patch: ChildItemPatch;
  /** Om min ändring var en radering. */
  intent: "update" | "delete";
}

export type ChildItemPatch = Partial<
  Pick<ChildItem, "title" | "notes" | "date" | "time" | "remind" | "completed" | "kind" | "repeat">
>;

interface ChildrenState {
  userId: string | null;
  children: Child[];
  items: ChildItem[];
  members: FamilyMember[];
  loading: boolean;
  error: string | null;
  conflict: ChildItemConflict | null;
}

let state: ChildrenState = {
  userId: null,
  children: [],
  items: [],
  members: [],
  loading: true,
  error: null,
  conflict: null,
};

const listeners = new Set<(s: ChildrenState) => void>();

function setState(
  patch: Partial<ChildrenState> | ((prev: ChildrenState) => Partial<ChildrenState>),
) {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  for (const l of listeners) l(state);
}

let inFlight: Promise<void> | null = null;

async function loadAll(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    setState({ loading: true, error: null });
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (!uid) {
        setState({ userId: null, children: [], items: [], members: [] });
        return;
      }

      const [{ data: kids, error: kidsErr }, { data: rows, error: rowsErr }, { data: shares }] =
        await Promise.all([
          supabase
            .from("children")
            .select("id, owner_id, name, birthdate, color, note")
            .order("created_at"),
          supabase
            .from("child_items")
            .select(
              "id, child_id, owner_id, kind, title, notes, date, time, completed, remind, repeat, file_path, created_at, updated_at",
            )
            .order("created_at", { ascending: false }),
          supabase.from("child_item_shares").select("item_id, user_id"),
        ]);
      if (kidsErr) throw kidsErr;
      if (rowsErr) throw rowsErr;

      const shareMap = new Map<string, string[]>();
      for (const s of shares ?? []) {
        shareMap.set(s.item_id, [...(shareMap.get(s.item_id) ?? []), s.user_id]);
      }

      // Familjemedlemmar att dela med – användaren kan vara med i flera familjer,
      // så vi samlar medlemmar från alla och tar bort dubbletter.
      let members: FamilyMember[] = [];
      const { data: mine } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", uid);
      const hids = (mine ?? []).map((m) => m.household_id);
      if (hids.length > 0) {
        const { data: mem } = await supabase
          .from("household_members")
          .select("user_id, display_name, color")
          .in("household_id", hids);
        const seen = new Map<string, FamilyMember>();
        for (const m of (mem ?? []) as FamilyMember[]) {
          if (m.user_id !== uid && !seen.has(m.user_id)) seen.set(m.user_id, m);
        }
        members = Array.from(seen.values());
      }

      setState({
        userId: uid,
        children: (kids ?? []) as Child[],
        items: ((rows ?? []) as Omit<ChildItem, "sharedWith">[]).map((r) => ({
          ...r,
          sharedWith: shareMap.get(r.id) ?? [],
        })),
        members,
      });
    } catch (e) {
      setState({ error: e instanceof Error ? e.message : "Kunde inte hämta barn-informationen." });
    } finally {
      setState({ loading: false });
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Realtime: en enda prenumeration delas av alla vyer. */
let channel: ReturnType<typeof supabase.channel> | null = null;
let subscribers = 0;

function subscribeRealtime() {
  subscribers += 1;
  if (channel) return;
  channel = supabase
    .channel("children-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "child_items" }, () => {
      void loadAll();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "child_item_shares" }, () => {
      void loadAll();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "children" }, () => {
      void loadAll();
    })
    .subscribe();
}

function unsubscribeRealtime() {
  subscribers -= 1;
  if (subscribers <= 0 && channel) {
    supabase.removeChannel(channel);
    channel = null;
    subscribers = 0;
  }
}

/** Hämtar den senaste versionen av en aktivitet från molnet. */
async function fetchServerItem(id: string): Promise<ChildItem | null> {
  const { data } = await supabase
    .from("child_items")
    .select(
      "id, child_id, owner_id, kind, title, notes, date, time, completed, remind, repeat, file_path, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { data: shares } = await supabase
    .from("child_item_shares")
    .select("user_id")
    .eq("item_id", id);
  return {
    ...(data as Omit<ChildItem, "sharedWith">),
    sharedWith: (shares ?? []).map((s) => s.user_id),
  };
}

export function useChildren() {
  const [snapshot, setSnapshot] = useState<ChildrenState>(state);

  useEffect(() => {
    listeners.add(setSnapshot);
    setSnapshot(state);
    void loadAll();
    subscribeRealtime();
    return () => {
      listeners.delete(setSnapshot);
      unsubscribeRealtime();
    };
  }, []);

  const load = useCallback(() => loadAll(), []);

  const addChild = async (name: string, color: string, birthdate?: string, note?: string) => {
    const { error: err } = await supabase.from("children").insert({
      name,
      color,
      birthdate: birthdate || null,
      note: note || null,
    });
    if (err) throw err;
    await loadAll();
  };

  const updateChild = async (
    id: string,
    patch: Partial<Pick<Child, "name" | "color" | "birthdate" | "note">>,
  ) => {
    setState((prev) => ({
      children: prev.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
    const { error: err } = await supabase.from("children").update(patch).eq("id", id);
    if (err) {
      await loadAll();
      throw err;
    }
  };

  const deleteChild = async (id: string) => {
    setState((prev) => ({
      children: prev.children.filter((c) => c.id !== id),
      items: prev.items.filter((i) => i.child_id !== id),
    }));
    const { error: err } = await supabase.from("children").delete().eq("id", id);
    if (err) {
      await loadAll();
      throw err;
    }
  };

  const addItem = async (input: {
    childId: string;
    kind: ChildItemKind;
    title: string;
    notes?: string;
    date?: string;
    time?: string;
    remind?: boolean;
    repeat?: "none" | "daily" | "weekdays" | "weekly";
    filePath?: string;
  }) => {
    const { data, error: err } = await supabase
      .from("child_items")
      .insert({
        child_id: input.childId,
        kind: input.kind,
        title: input.title,
        notes: input.notes || null,
        date: input.date || null,
        time: input.time || null,
        remind: input.remind ?? false,
        repeat: input.repeat ?? "none",
        file_path: input.filePath || null,
      })
      .select(
        "id, child_id, owner_id, kind, title, notes, date, time, completed, remind, repeat, file_path, created_at, updated_at",
      )
      .single();
    if (err) throw err;
    const created = { ...(data as Omit<ChildItem, "sharedWith">), sharedWith: [] as string[] };
    setState((prev) => ({ items: [created, ...prev.items] }));
    return created.id;
  };

  const updateItem = async (id: string, patch: ChildItemPatch, opts?: { force?: boolean }) => {
    const current = state.items.find((i) => i.id === id);
    if (!current) return;
    setState((prev) => ({ items: prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

    let q = supabase.from("child_items").update(patch).eq("id", id);
    if (!opts?.force) q = q.eq("updated_at", current.updated_at);
    const { data, error: err } = await q.select("id");

    if (err) {
      await loadAll();
      throw err;
    }
    if (!data || data.length === 0) {
      // Ingen rad matchade vår version → någon annan hann före.
      const theirs = await fetchServerItem(id);
      if (!theirs) {
        // Saken är borttagen av någon annan.
        setState((prev) => ({ items: prev.items.filter((i) => i.id !== id) }));
        throw new Error("Aktiviteten har tagits bort av någon annan.");
      }
      setState({ conflict: { mine: { ...current, ...patch }, theirs, patch, intent: "update" } });
      return;
    }
    await loadAll();
  };

  const toggleItem = async (id: string, completed: boolean) => {
    await updateItem(id, { completed });
  };

  const deleteItem = async (item: ChildItem, opts?: { force?: boolean }) => {
    setState((prev) => ({ items: prev.items.filter((i) => i.id !== item.id) }));

    let q = supabase.from("child_items").delete().eq("id", item.id);
    if (!opts?.force) q = q.eq("updated_at", item.updated_at);
    const { data, error: err } = await q.select("id");

    if (err) {
      await loadAll();
      throw err;
    }
    if (!data || data.length === 0) {
      const theirs = await fetchServerItem(item.id);
      if (!theirs) return; // redan borta – inget att lösa
      setState((prev) => ({ items: [theirs, ...prev.items.filter((i) => i.id !== item.id)] }));
      setState({ conflict: { mine: item, theirs, patch: {}, intent: "delete" } });
      return;
    }
    if (item.file_path) {
      await supabase.storage.from("child-docs").remove([item.file_path]);
    }
  };

  /** Löser en konflikt: behåll mina ändringar eller ta den andras version. */
  const resolveConflict = async (choice: "mine" | "theirs") => {
    const c = state.conflict;
    setState({ conflict: null });
    if (!c) return;
    if (choice === "theirs") {
      await loadAll();
      return;
    }
    if (c.intent === "delete") {
      await deleteItem(c.theirs, { force: true });
    } else {
      await updateItem(c.theirs.id, c.patch, { force: true });
    }
  };

  const dismissConflict = () => setState({ conflict: null });

  /** Sätter exakt vilka som ska se saken. Tom lista = åter privat. */
  const setItemShares = async (itemId: string, userIds: string[]) => {
    setState((prev) => ({
      items: prev.items.map((i) => (i.id === itemId ? { ...i, sharedWith: userIds } : i)),
    }));
    const { error: err } = await supabase.rpc("share_child_item", {
      _item_id: itemId,
      _user_ids: userIds,
    });
    if (err) {
      await loadAll();
      throw err;
    }
  };

  const uploadDoc = async (childId: string, file: File) => {
    const path = `${childId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error: err } = await supabase.storage.from("child-docs").upload(path, file);
    if (err) throw err;
    return path;
  };

  const openDoc = async (path: string) => {
    const { data, error: err } = await supabase.storage
      .from("child-docs")
      .createSignedUrl(path, 60);
    if (err) throw err;
    return data.signedUrl;
  };

  return {
    userId: snapshot.userId,
    children: snapshot.children,
    items: snapshot.items,
    members: snapshot.members,
    loading: snapshot.loading,
    error: snapshot.error,
    conflict: snapshot.conflict,
    resolveConflict,
    dismissConflict,
    reload: load,
    addChild,
    updateChild,
    deleteChild,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    setItemShares,
    uploadDoc,
    openDoc,
  };
}
