import type { SpaceCategory } from "@/lib/day-space";
import { supabase } from "@/integrations/supabase/client";
import { isActiveOwner } from "@/lib/account-scope";

export interface SpaceDraft { text: string; categories: SpaceCategory[]; parents: string[] }
const drafts = new Map<string, SpaceDraft>();
export function readSpaceDraft(owner: string, date: string): SpaceDraft | undefined {
  return isActiveOwner(owner) ? drafts.get(`${owner}:${date}`) : undefined;
}
export function writeSpaceDraft(owner: string, date: string, draft: SpaceDraft): void {
  if (isActiveOwner(owner)) drafts.set(`${owner}:${date}`, structuredClone(draft));
}
export function clearSpaceDraft(owner: string, date: string): void { drafts.delete(`${owner}:${date}`); }
export function clearSpaceDrafts(): void { drafts.clear(); }
let sessionOwner: string | null = null;
supabase.auth.onAuthStateChange((event, session) => {
  const next = session?.user.id ?? null;
  if (event === "SIGNED_OUT" || (sessionOwner && sessionOwner !== next)) clearSpaceDrafts();
  sessionOwner = next;
});
if (typeof window !== "undefined") window.addEventListener("beforeunload", event => {
  if (drafts.size) { event.preventDefault(); event.returnValue = ""; }
});