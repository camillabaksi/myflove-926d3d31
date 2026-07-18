// Shim for @workspace/api-client-react — MyFlove backend hooks stubbed with
// safe no-ops so the frontend runs without the original API server. Types
// are intentionally loose (any) so downstream pages type-check.

/* eslint-disable @typescript-eslint/no-explicit-any */

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

export function useGetMyHousehold(_opts?: any): any { return emptyQuery(); }
export function useCreateHousehold(_opts?: any): any { return noopMutation(); }
export function useJoinHousehold(_opts?: any): any { return noopMutation(); }
export function useLeaveHousehold(_opts?: any): any { return noopMutation(); }

export type ShoppingItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};
export function useListShoppingItems(_opts?: any): any {
  return { ...emptyQuery(), data: [] as ShoppingItem[] };
}
export function useAddShoppingItem(_opts?: any): any { return noopMutation(); }
export function useToggleShoppingItem(_opts?: any): any { return noopMutation(); }
export function useDeleteShoppingItem(_opts?: any): any { return noopMutation(); }

export function useListFamilyEvents(_opts?: any): any {
  return { ...emptyQuery(), data: [] as any[] };
}
export function useCreateFamilyEvent(_opts?: any): any { return noopMutation(); }
export function useDeleteFamilyEvent(_opts?: any): any { return noopMutation(); }

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

import { useQuery } from "@tanstack/react-query";
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
