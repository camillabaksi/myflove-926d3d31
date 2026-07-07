// Shim for @workspace/api-client-react — MyFlow backend hooks stubbed with
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

export function useGetAnalyticsSummary(_opts?: any): any { return emptyQuery(); }

export async function getSlTrip(_args: any): Promise<any> { return { trips: [] }; }
export async function getSlNearbyStop(_args: any): Promise<any> { return { stops: [] }; }
export function useGetSlTrip(..._args: any[]): any {
  return { ...emptyQuery(), data: null };
}
