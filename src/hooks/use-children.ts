import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Barn-delen: allt är privat för den som lagt in det, men varje sak kan
// delas med en eller flera familjemedlemmar.

export interface Child {
  id: string;
  owner_id: string;
  name: string;
  birthdate: string | null;
  color: string;
  note: string | null;
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
  file_path: string | null;
  created_at: string;
  /** Vilka användare denna sak är delad med (bara ägaren ser hela listan) */
  sharedWith: string[];
}

export interface FamilyMember {
  user_id: string;
  display_name: string;
  color: string;
}

export const CHILD_COLORS = ["#c17a56", "#8a9a5b", "#e8c547", "#6b8e9e", "#a06cd5", "#d16d6d"];

export function useChildren() {
  const [userId, setUserId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [items, setItems] = useState<ChildItem[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setChildren([]);
        setItems([]);
        setMembers([]);
        return;
      }

      const [{ data: kids, error: kidsErr }, { data: rows, error: rowsErr }, { data: shares }] =
        await Promise.all([
          supabase.from("children").select("id, owner_id, name, birthdate, color, note").order("created_at"),
          supabase
            .from("child_items")
            .select("id, child_id, owner_id, kind, title, notes, date, time, completed, remind, file_path, created_at")
            .order("created_at", { ascending: false }),
          supabase.from("child_item_shares").select("item_id, user_id"),
        ]);
      if (kidsErr) throw kidsErr;
      if (rowsErr) throw rowsErr;

      const shareMap = new Map<string, string[]>();
      for (const s of shares ?? []) {
        shareMap.set(s.item_id, [...(shareMap.get(s.item_id) ?? []), s.user_id]);
      }

      setChildren((kids ?? []) as Child[]);
      setItems(
        ((rows ?? []) as Omit<ChildItem, "sharedWith">[]).map((r) => ({
          ...r,
          sharedWith: shareMap.get(r.id) ?? [],
        })),
      );

      // Familjemedlemmar att dela med (om användaren är med i en familj)
      const { data: mine } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", uid)
        .limit(1);
      const hid = mine?.[0]?.household_id;
      if (hid) {
        const { data: mem } = await supabase
          .from("household_members")
          .select("user_id, display_name, color")
          .eq("household_id", hid);
        setMembers((mem ?? []).filter((m) => m.user_id !== uid) as FamilyMember[]);
      } else {
        setMembers([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte hämta barn-informationen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addChild = async (name: string, color: string, birthdate?: string, note?: string) => {
    const { error: err } = await supabase.from("children").insert({
      name,
      color,
      birthdate: birthdate || null,
      note: note || null,
    });
    if (err) throw err;
    await load();
  };

  const updateChild = async (id: string, patch: Partial<Pick<Child, "name" | "color" | "birthdate" | "note">>) => {
    const { error: err } = await supabase.from("children").update(patch).eq("id", id);
    if (err) throw err;
    await load();
  };

  const deleteChild = async (id: string) => {
    const { error: err } = await supabase.from("children").delete().eq("id", id);
    if (err) throw err;
    await load();
  };

  const addItem = async (input: {
    childId: string;
    kind: ChildItemKind;
    title: string;
    notes?: string;
    date?: string;
    time?: string;
    remind?: boolean;
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
        file_path: input.filePath || null,
      })
      .select("id")
      .single();
    if (err) throw err;
    await load();
    return data.id as string;
  };

  const toggleItem = async (id: string, completed: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed } : i)));
    const { error: err } = await supabase.from("child_items").update({ completed }).eq("id", id);
    if (err) throw err;
  };

  const deleteItem = async (item: ChildItem) => {
    if (item.file_path) {
      await supabase.storage.from("child-docs").remove([item.file_path]);
    }
    const { error: err } = await supabase.from("child_items").delete().eq("id", item.id);
    if (err) throw err;
    await load();
  };

  /** Sätter exakt vilka som ska se saken. Tom lista = åter privat. */
  const setItemShares = async (itemId: string, userIds: string[]) => {
    const { error: err } = await supabase.rpc("share_child_item", {
      _item_id: itemId,
      _user_ids: userIds,
    });
    if (err) throw err;
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, sharedWith: userIds } : i)));
  };

  const uploadDoc = async (childId: string, file: File) => {
    const path = `${childId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error: err } = await supabase.storage.from("child-docs").upload(path, file);
    if (err) throw err;
    return path;
  };

  const openDoc = async (path: string) => {
    const { data, error: err } = await supabase.storage.from("child-docs").createSignedUrl(path, 60);
    if (err) throw err;
    return data.signedUrl;
  };

  return {
    userId,
    children,
    items,
    members,
    loading,
    error,
    reload: load,
    addChild,
    updateChild,
    deleteChild,
    addItem,
    toggleItem,
    deleteItem,
    setItemShares,
    uploadDoc,
    openDoc,
  };
}
