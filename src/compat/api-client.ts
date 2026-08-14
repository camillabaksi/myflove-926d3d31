// Shim for @workspace/api-client-react — MyFlove hooks backed by Lovable Cloud.
// Household (family) data, the shared shopping list and family calendar events
// are read/written through the browser Supabase client with RLS scoping access
// to members of the same household. Types are loose (any) so downstream pages
// type-check unchanged.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export async function trackEvent(_payload: any): Promise<void> {
  return Promise.resolve();
}

export const getGetMyHouseholdQueryKey = (..._args: any[]): any[] => ["household"];
export const getListShoppingItemsQueryKey = (..._args: any[]): any[] => ["shopping-items"];
export const getListFamilyEventsQueryKey = (..._args: any[]): any[] => ["family-events"];
export const getListMealPlansQueryKey = (..._args: any[]): any[] => ["meal-plans"];

const emptyQuery = (): any => ({
  data: undefined,
  isLoading: false,
  isError: false,
  isFetching: false,
  error: null,
  refetch: async () => ({}),
});

const noopMutation = (..._args: any[]): any => ({
  mutate: (_: any, opts?: any) => opts?.onSuccess?.(),
  mutateAsync: async (_: any) => ({}),
  isPending: false,
  isError: false,
  reset: () => {},
});

// ---------------------------------------------------------------- household

export type HouseholdMember = { id: string; displayName: string; color: string };
export type Household = {
  id: string;
  name: string;
  inviteCode: string;
  members: HouseholdMember[];
};

async function fetchMyHousehold(): Promise<Household | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data: memberships, error: mErr } = await db
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .limit(1);
  if (mErr) throw mErr;
  const householdId = memberships?.[0]?.household_id as string | undefined;
  if (!householdId) return null;

  const { data: h, error: hErr } = await db
    .from("households")
    .select("id, name, invite_code")
    .eq("id", householdId)
    .single();
  if (hErr) throw hErr;

  const { data: members, error: memErr } = await db
    .from("household_members")
    .select("user_id, display_name, color")
    .eq("household_id", householdId);
  if (memErr) throw memErr;

  return {
    id: h.id,
    name: h.name,
    inviteCode: h.invite_code,
    members: (members ?? []).map((m: any) => ({
      id: m.user_id,
      displayName: m.display_name,
      color: m.color,
    })),
  };
}

export function useGetMyHousehold(opts?: any): any {
  return useQuery({
    queryKey: opts?.query?.queryKey ?? getGetMyHouseholdQueryKey(),
    queryFn: fetchMyHousehold,
    enabled: opts?.query?.enabled ?? true,
    retry: false,
    staleTime: 30_000,
  });
}

export function useCreateHousehold(_opts?: any): any { return noopMutation(); }
export function useJoinHousehold(_opts?: any): any { return noopMutation(); }
export function useLeaveHousehold(_opts?: any): any { return noopMutation(); }

// --------------------------------------------------------- shopping (shared)

export type ShoppingItem = {
  id: number;
  title: string;
  completed: boolean;
  createdAt?: number;
};

async function requireHouseholdId(): Promise<string> {
  const household = await fetchMyHousehold();
  if (!household) throw new Error("Ingen familj hittades.");
  return household.id;
}

export function useListShoppingItems(opts?: any): any {
  return useQuery({
    queryKey: opts?.query?.queryKey ?? getListShoppingItemsQueryKey(),
    queryFn: async (): Promise<ShoppingItem[]> => {
      const { data, error } = await db
        .from("household_shopping_items")
        .select("id, title, completed, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        completed: r.completed,
        createdAt: new Date(r.created_at).getTime(),
      }));
    },
    enabled: opts?.query?.enabled ?? true,
    retry: false,
  });
}

function useInvalidating(key: any[], opts?: any) {
  const queryClient = useQueryClient();
  return {
    onSuccess: (...args: any[]) => {
      queryClient.invalidateQueries({ queryKey: key });
      opts?.mutation?.onSuccess?.(...args);
    },
    onError: (...args: any[]) => opts?.mutation?.onError?.(...args),
  };
}

export function useAddShoppingItem(opts?: any): any {
  const handlers = useInvalidating(getListShoppingItemsQueryKey(), opts);
  return useMutation({
    mutationFn: async (vars: any) => {
      const householdId = await requireHouseholdId();
      const { error } = await db
        .from("household_shopping_items")
        .insert({ household_id: householdId, title: vars?.data?.title });
      if (error) throw error;
      return {};
    },
    ...handlers,
  });
}

export function useToggleShoppingItem(opts?: any): any {
  const handlers = useInvalidating(getListShoppingItemsQueryKey(), opts);
  return useMutation({
    mutationFn: async (vars: any) => {
      const { data: current, error: readErr } = await db
        .from("household_shopping_items")
        .select("completed")
        .eq("id", vars.id)
        .single();
      if (readErr) throw readErr;
      const { error } = await db
        .from("household_shopping_items")
        .update({ completed: !current.completed })
        .eq("id", vars.id);
      if (error) throw error;
      return {};
    },
    ...handlers,
  });
}

export function useDeleteShoppingItem(opts?: any): any {
  const handlers = useInvalidating(getListShoppingItemsQueryKey(), opts);
  return useMutation({
    mutationFn: async (vars: any) => {
      const { error } = await db
        .from("household_shopping_items")
        .delete()
        .eq("id", vars.id);
      if (error) throw error;
      return {};
    },
    ...handlers,
  });
}

// ------------------------------------------------------- family calendar

export function useListFamilyEvents(opts?: any): any {
  return useQuery({
    queryKey: opts?.query?.queryKey ?? getListFamilyEventsQueryKey(),
    queryFn: async () => {
      const { data, error } = await db
        .from("household_events")
        .select("id, title, date, time, member_id")
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        memberId: e.member_id,
      }));
    },
    enabled: opts?.query?.enabled ?? true,
    retry: false,
  });
}

export function useCreateFamilyEvent(opts?: any): any {
  const handlers = useInvalidating(getListFamilyEventsQueryKey(), opts);
  return useMutation({
    mutationFn: async (vars: any) => {
      const householdId = await requireHouseholdId();
      const { error } = await db.from("household_events").insert({
        household_id: householdId,
        title: vars?.data?.title,
        date: vars?.data?.date,
        time: vars?.data?.time ?? null,
      });
      if (error) throw error;
      return {};
    },
    ...handlers,
  });
}

export function useDeleteFamilyEvent(opts?: any): any {
  const handlers = useInvalidating(getListFamilyEventsQueryKey(), opts);
  return useMutation({
    mutationFn: async (vars: any) => {
      const { error } = await db.from("household_events").delete().eq("id", vars.id);
      if (error) throw error;
      return {};
    },
    ...handlers,
  });
}

export function useListMealPlans(_opts?: any): any {
  return { ...emptyQuery(), data: [] as any[] };
}
export function useUpsertMealPlanSlot(_opts?: any): any { return noopMutation(); }

import { getAnalyticsSummaryFn } from "@/lib/analytics.functions";

export function useGetAnalyticsSummary(_opts?: any): any {
  return useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => getAnalyticsSummaryFn(),
    retry: false,
    staleTime: 60_000,
  });
}

import { getSlTripFn, getSlNearbyStopFn } from "@/lib/sl.functions";

export async function getSlTrip(args: { from: string; to: string }): Promise<any> {
  return getSlTripFn({ data: args });
}
export async function getSlNearbyStop(args: { lat: number; lon: number }): Promise<any> {
  return getSlNearbyStopFn({ data: args });
}
export function useGetSlTrip(args: { from: string; to: string }, opts?: any): any {
  const enabled = opts?.query?.enabled ?? Boolean(args.from && args.to);
  return useQuery({
    queryKey: opts?.query?.queryKey ?? ["sl-trip", args],
    queryFn: () => getSlTripFn({ data: args }),
    enabled,
    retry: opts?.query?.retry ?? false,
  });
}
