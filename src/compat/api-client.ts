// Shim for @workspace/api-client-react — MyFlow backend hooks stubbed with
// localStorage-backed no-ops so the app runs on the client only for now.
// Household/family/shared shopping/meal-planner/analytics/Trafiklab features
// degrade gracefully (empty data, no-op mutations).

import { useCallback, useEffect, useState } from "react";

// --- Analytics ---
export async function trackEvent(_payload: {
  sessionId: string;
  section: string;
  action: string;
}): Promise<void> {
  return Promise.resolve();
}

// --- Query key helpers ---
export const getGetMyHouseholdQueryKey = () => ["household"];
export const getListShoppingItemsQueryKey = () => ["shopping-items"];
export const getListFamilyEventsQueryKey = () => ["family-events"];
export const getListMealPlansQueryKey = () => ["meal-plans"];

// --- Household ---
type QueryShim<T> = {
  data: T;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: (...args: unknown[]) => Promise<unknown>;
};
type MutationShim = {
  mutate: (...args: unknown[]) => void;
  mutateAsync: (...args: unknown[]) => Promise<unknown>;
  isPending: boolean;
};
function queryShim<T>(data: T): QueryShim<T> {
  return { data, isLoading: false, isFetching: false, isError: false, error: null, refetch: async () => ({}) };
}
function mutationShim(): MutationShim {
  return { mutate: () => {}, mutateAsync: async () => ({}), isPending: false };
}

export function useGetMyHousehold(..._args: unknown[]) {
  return queryShim<null | { id: string; name: string; joinCode: string; members: any[] }>(null);
}
export function useCreateHousehold(..._args: unknown[]) {
  return mutationShim();
}
export function useJoinHousehold(..._args: unknown[]) {
  return mutationShim();
}
export function useLeaveHousehold(..._args: unknown[]) {
  return mutationShim();
}

// --- Shared shopping ---
export type ShoppingItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};
export function useListShoppingItems(..._args: unknown[]) {
  return queryShim([] as ShoppingItem[]);
}
export function useAddShoppingItem(..._args: unknown[]) {
  return mutationShim();
}
export function useToggleShoppingItem(..._args: unknown[]) {
  return mutationShim();
}
export function useDeleteShoppingItem(..._args: unknown[]) {
  return mutationShim();
}

// --- Family events ---
export function useListFamilyEvents(..._args: unknown[]) {
  return queryShim([] as any[]);
}
export function useCreateFamilyEvent(..._args: unknown[]) {
  return mutationShim();
}
export function useDeleteFamilyEvent(..._args: unknown[]) {
  return mutationShim();
}

// --- Meal planner ---
export function useListMealPlans(..._args: unknown[]) {
  return queryShim([] as any[]);
}
export function useUpsertMealPlanSlot(..._args: unknown[]) {
  return mutationShim();
}

// --- Analytics summary ---
export function useGetAnalyticsSummary(..._args: unknown[]) {
  return queryShim(null as any);
}

// --- Trafiklab / SL trip ---
export async function getSlTrip(_args: { from: string; to: string }): Promise<any> {
  return { trips: [] };
}
export async function getSlNearbyStop(_args: { lat: number; lon: number }): Promise<any> {
  return { stops: [] };
}
export function useGetSlTrip(..._args: unknown[]) {
  return queryShim(null as any);
}

// Placeholder to silence unused-var lint
export const __shimVersion = 1;
export { useCallback as _uc, useEffect as _ue, useState as _us };
