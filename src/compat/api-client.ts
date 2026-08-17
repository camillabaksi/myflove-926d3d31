// Shim for @workspace/api-client-react — MyFlove backend hooks backed by
// Lovable Cloud (Supabase) tables and TanStack server functions.
// Keeps the original hook names/shapes so pages don't need to change.

import { useQuery, useMutation, type UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAnalyticsEventFn, getAnalyticsSummaryFn } from "@/lib/analytics.functions";
import { getSlTripFn, getSlNearbyStopFn } from "@/lib/sl.functions";

// --- Analytics ---
export async function trackEvent(payload: {
  sessionId: string;
  section: string;
  action: string;
}): Promise<void> {
  try {
    await logAnalyticsEventFn({ data: payload });
  } catch {
    // Analytics must never disrupt the user experience.
  }
}

// --- Query key helpers ---
export const getGetMyHouseholdQueryKey = () => ["household"];
export const getListShoppingItemsQueryKey = () => ["shopping-items"];
export const getListFamilyEventsQueryKey = () => ["family-events"];
export const getListMealPlansQueryKey = () => ["meal-plans"];

type Opts<T> = { query?: Partial<UseQueryOptions<T>> & { queryKey?: unknown[]; enabled?: boolean } };
type MutOpts = {
  mutation?: {
    onSuccess?: (data: unknown) => void;
    onError?: (error: unknown) => void;
  };
};

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// --- Household ---
export type HouseholdMember = { id: string; displayName: string; color: string };
export type Household = { id: string; name: string; joinCode: string; members: HouseholdMember[] };

async function fetchMyHousehold(): Promise<Household | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const { data: memberships, error: mErr } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1);
  if (mErr) throw mErr;
  const hid = memberships?.[0]?.household_id;
  if (!hid) return null;

  const [{ data: h, error: hErr }, { data: members, error: memErr }] = await Promise.all([
    supabase.from("households").select("id, name, invite_code").eq("id", hid).maybeSingle(),
    supabase.from("household_members").select("user_id, display_name, color").eq("household_id", hid),
  ]);
  if (hErr) throw hErr;
  if (memErr) throw memErr;
  if (!h) return null;

  return {
    id: h.id,
    name: h.name,
    joinCode: h.invite_code,
    members: (members ?? []).map((m) => ({
      id: m.user_id,
      displayName: m.display_name,
      color: m.color,
    })),
  };
}

export function useGetMyHousehold(opts?: Opts<Household | null>) {
  return useQuery<Household | null>({
    queryKey: (opts?.query?.queryKey as unknown[]) ?? getGetMyHouseholdQueryKey(),
    queryFn: fetchMyHousehold,
    enabled: opts?.query?.enabled ?? true,
    staleTime: 60_000,
  });
}

export function useCreateHousehold(opts?: MutOpts) {
  return useMutation({
    mutationFn: async (vars: { data: { name: string; displayName: string; color: string } }) => {
      const { data, error } = await supabase.rpc("create_household", {
        _name: vars.data.name,
        _display_name: vars.data.displayName,
        _color: vars.data.color,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: opts?.mutation?.onSuccess,
    onError: opts?.mutation?.onError,
  });
}

export function useJoinHousehold(opts?: MutOpts) {
  return useMutation({
    mutationFn: async (vars: { data: { code: string; displayName: string; color: string } }) => {
      const { data, error } = await supabase.rpc("join_household_by_code", {
        _code: vars.data.code.toUpperCase(),
        _display_name: vars.data.displayName,
        _color: vars.data.color,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: opts?.mutation?.onSuccess,
    onError: opts?.mutation?.onError,
  });
}

export function useLeaveHousehold(opts?: MutOpts) {
  return useMutation({
    mutationFn: async () => {
      const userId = await currentUserId();
      if (!userId) throw new Error("not signed in");
      const { error } = await supabase.from("household_members").delete().eq("user_id", userId);
      if (error) throw error;
      return { ok: true };
    },
    onSuccess: opts?.mutation?.onSuccess,
    onError: opts?.mutation?.onError,
  });
}

// --- Shared shopping ---
export type ShoppingItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

export function useListShoppingItems(opts?: Opts<ShoppingItem[]>) {
  return useQuery<ShoppingItem[]>({
    queryKey: (opts?.query?.queryKey as unknown[]) ?? getListShoppingItemsQueryKey(),
    queryFn: async () => {
      const household = await fetchMyHousehold();
      if (!household) return [];
      const { data, error } = await supabase
        .from("household_shopping_items")
        .select("id, title, completed, created_at")
        .eq("household_id", household.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((i) => ({
        id: String(i.id),
        title: i.title,
        completed: i.completed,
        createdAt: new Date(i.created_at).getTime(),
      }));
    },
    enabled: opts?.query?.enabled ?? true,
  });
}

export function useAddShoppingItem(opts?: MutOpts) {
  return useMutation({
    mutationFn: async (vars: { data: { title: string } }) => {
      const [userId, household] = await Promise.all([currentUserId(), fetchMyHousehold()]);
      if (!userId || !household) throw new Error("ingen familj");
      const { error } = await supabase.from("household_shopping_items").insert({
        household_id: household.id,
        title: vars.data.title,
        created_by: userId,
      });
      if (error) throw error;
      return { ok: true };
    },
    onSuccess: opts?.mutation?.onSuccess,
    onError: opts?.mutation?.onError,
  });
}

export function useToggleShoppingItem(opts?: MutOpts) {
  return useMutation({
    mutationFn: async (vars: { id: number | string }) => {
      const { data: current, error: readErr } = await supabase
        .from("household_shopping_items")
        .select("completed")
        .eq("id", Number(vars.id))
        .maybeSingle();
      if (readErr) throw readErr;
      const { error } = await supabase
        .from("household_shopping_items")
        .update({ completed: !current?.completed })
        .eq("id", Number(vars.id));
      if (error) throw error;
      return { ok: true };
    },
    onSuccess: opts?.mutation?.onSuccess,
    onError: opts?.mutation?.onError,
  });
}

export function useDeleteShoppingItem(opts?: MutOpts) {
  return useMutation({
    mutationFn: async (vars: { id: number | string }) => {
      const { error } = await supabase
        .from("household_shopping_items")
        .delete()
        .eq("id", Number(vars.id));
      if (error) throw error;
      return { ok: true };
    },
    onSuccess: opts?.mutation?.onSuccess,
    onError: opts?.mutation?.onError,
  });
}

// --- Family events ---
export type FamilyEvent = {
  id: number;
  title: string;
  date: string;
  time: string | null;
  memberId: string;
};

export function useListFamilyEvents(opts?: Opts<FamilyEvent[]>) {
  return useQuery<FamilyEvent[]>({
    queryKey: (opts?.query?.queryKey as unknown[]) ?? getListFamilyEventsQueryKey(),
    queryFn: async () => {
      const household = await fetchMyHousehold();
      if (!household) return [];
      const { data, error } = await supabase
        .from("household_events")
        .select("id, title, date, time, member_id")
        .eq("household_id", household.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        memberId: e.member_id,
      }));
    },
    enabled: opts?.query?.enabled ?? true,
  });
}

export function useCreateFamilyEvent(opts?: MutOpts) {
  return useMutation({
    mutationFn: async (vars: { data: { title: string; date: string; time?: string | null } }) => {
      const [userId, household] = await Promise.all([currentUserId(), fetchMyHousehold()]);
      if (!userId || !household) throw new Error("ingen familj");
      const { error } = await supabase.from("household_events").insert({
        household_id: household.id,
        title: vars.data.title,
        date: vars.data.date,
        time: vars.data.time ?? null,
        member_id: userId,
      });
      if (error) throw error;
      return { ok: true };
    },
    onSuccess: opts?.mutation?.onSuccess,
    onError: opts?.mutation?.onError,
  });
}

export function useDeleteFamilyEvent(opts?: MutOpts) {
  return useMutation({
    mutationFn: async (vars: { id: number | string }) => {
      const { error } = await supabase.from("household_events").delete().eq("id", Number(vars.id));
      if (error) throw error;
      return { ok: true };
    },
    onSuccess: opts?.mutation?.onSuccess,
    onError: opts?.mutation?.onError,
  });
}

// --- Meal planner (device-local elsewhere; no shared table yet) ---
export function useListMealPlans(opts?: Opts<unknown[]>) {
  return useQuery<unknown[]>({
    queryKey: (opts?.query?.queryKey as unknown[]) ?? getListMealPlansQueryKey(),
    queryFn: async () => [],
    enabled: opts?.query?.enabled ?? true,
  });
}
export function useUpsertMealPlanSlot(opts?: MutOpts) {
  return useMutation({
    mutationFn: async () => ({ ok: true }),
    onSuccess: opts?.mutation?.onSuccess,
    onError: opts?.mutation?.onError,
  });
}

// --- Analytics summary (admin only, enforced server-side) ---
export function useGetAnalyticsSummary(opts?: Opts<AnalyticsSummary>) {
  return useQuery<AnalyticsSummary>({
    queryKey: (opts?.query?.queryKey as unknown[]) ?? ["analytics-summary"],
    queryFn: () => getAnalyticsSummaryFn() as Promise<AnalyticsSummary>,

    enabled: opts?.query?.enabled ?? true,
    retry: false,
  });
}

// --- Trafiklab / SL trip ---
export async function getSlTrip(args: { from: string; to: string }) {
  return getSlTripFn({ data: args });
}
export async function getSlNearbyStop(args: { lat: number; lon: number }) {
  return getSlNearbyStopFn({ data: args });
}
export function useGetSlTrip(
  args: { from: string; to: string },
  opts?: Opts<Awaited<ReturnType<typeof getSlTrip>>>,
) {
  return useQuery({
    queryKey: (opts?.query?.queryKey as unknown[]) ?? ["sl-trip", args],
    queryFn: () => getSlTrip(args),
    enabled: opts?.query?.enabled ?? (!!args.from && !!args.to),
    retry: opts?.query?.retry ?? false,
  });
}
