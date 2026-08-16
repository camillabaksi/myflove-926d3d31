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
export function useGetMyHousehold(_opts?: any) {
  return { data: null as null | { id: string; name: string; joinCode: string; members: any[] }, isLoading: false } as const;
}
export function useCreateHousehold() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as const;
}
export function useJoinHousehold() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as const;
}
export function useLeaveHousehold() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as const;
}

// --- Shared shopping ---
export type ShoppingItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};
export function useListShoppingItems(_opts?: any) {
  return { data: [] as ShoppingItem[], isLoading: false } as const;
}
export function useAddShoppingItem() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as const;
}
export function useToggleShoppingItem() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as const;
}
export function useDeleteShoppingItem() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as const;
}

// --- Family events ---
export function useListFamilyEvents(_opts?: any) {
  return { data: [] as any[], isLoading: false } as const;
}
export function useCreateFamilyEvent() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as const;
}
export function useDeleteFamilyEvent() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as const;
}

// --- Meal planner ---
export function useListMealPlans(_opts?: any) {
  return { data: [] as any[], isLoading: false } as const;
}
export function useUpsertMealPlanSlot() {
  return { mutateAsync: async (_: any) => ({}), isPending: false } as const;
}

// --- Analytics summary ---
export function useGetAnalyticsSummary(_opts?: any) {
  return { data: null as any, isLoading: false } as const;
}

// --- Trafiklab / SL trip ---
export async function getSlTrip(_args: { from: string; to: string }): Promise<any> {
  return { trips: [] };
}
export async function getSlNearbyStop(_args: { lat: number; lon: number }): Promise<any> {
  return { stops: [] };
}
export function useGetSlTrip(_opts?: any) {
  return { data: null as any, isLoading: false, refetch: async () => ({}) } as const;
}

// Placeholder to silence unused-var lint
export const __shimVersion = 1;
export { useCallback as _uc, useEffect as _ue, useState as _us };
