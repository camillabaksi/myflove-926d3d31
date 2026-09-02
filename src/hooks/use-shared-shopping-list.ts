import { useEffect, useState } from "react";

import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyHousehold,
  useListShoppingItems,
  useAddShoppingItem,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  getGetMyHouseholdQueryKey,
  getListShoppingItemsQueryKey,
  type ShoppingItem as SharedShoppingItem,
} from "@workspace/api-client-react";
import { useShoppingList as useLocalShoppingList } from "./use-data";

// Provides a single shopping-list interface backed by the shared household
// list when the signed-in user belongs to a family, falling back to the
// device-local list otherwise. This keeps the shopping page, the dashboard
// shortcut, and proximity alerts consistent about where items live.
const MODE_KEY = "myflove.shoppingListMode";
export type ShoppingListMode = "shared" | "personal";

function readMode(): ShoppingListMode {
  if (typeof window === "undefined") return "shared";
  return window.localStorage.getItem(MODE_KEY) === "personal" ? "personal" : "shared";
}

export function useSharedShoppingList() {
  const { isSignedIn } = useUser();
  const [mode, setModeState] = useState<ShoppingListMode>("shared");

  useEffect(() => {
    setModeState(readMode());
    const onChange = () => setModeState(readMode());
    window.addEventListener("myflove-shopping-mode", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("myflove-shopping-mode", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setMode = (next: ShoppingListMode) => {
    window.localStorage.setItem(MODE_KEY, next);
    window.dispatchEvent(new Event("myflove-shopping-mode"));
  };
  const queryClient = useQueryClient();

  const { data: household, isLoading: isHouseholdLoading } = useGetMyHousehold({
    query: { queryKey: getGetMyHouseholdQueryKey(), enabled: !!isSignedIn },
  });

  const canShare = !!household?.id;
  const hasHousehold = canShare && mode === "shared";

  const { data: sharedItems = [], isLoading: isItemsLoading } = useListShoppingItems({
    query: { queryKey: getListShoppingItemsQueryKey(), enabled: hasHousehold },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListShoppingItemsQueryKey() });

  const addMutation = useAddShoppingItem({ mutation: { onSuccess: invalidate } });
  const toggleMutation = useToggleShoppingItem({ mutation: { onSuccess: invalidate } });
  const deleteMutation = useDeleteShoppingItem({ mutation: { onSuccess: invalidate } });

  const local = useLocalShoppingList();

  if (hasHousehold) {
    const toListItem = (i: SharedShoppingItem) => ({
      id: String(i.id),
      title: i.title,
      completed: i.completed,
    });
    const active = sharedItems.filter((i) => !i.completed).map(toListItem);
    const completed = sharedItems.filter((i) => i.completed).map(toListItem);
    return {
      isShared: true as const,
      canShare,
      mode,
      setMode,
      isLoading: isHouseholdLoading || isItemsLoading,
      activeItems: active,
      completedItems: completed,
      addItem: (title: string) => addMutation.mutate({ data: { title } }),
      toggleItem: (id: string) => toggleMutation.mutate({ id: Number(id) }),
      deleteItem: (id: string) => deleteMutation.mutate({ id: Number(id) }),
    };
  }

  return {
    isShared: false as const,
    canShare,
    mode: canShare ? mode : ("personal" as ShoppingListMode),
    setMode,
    isLoading: isHouseholdLoading,
    activeItems: local.activeItems,
    completedItems: local.completedItems,
    addItem: local.addItem,
    toggleItem: local.toggleItem,
    deleteItem: local.deleteItem,
  };
}

export type { SharedShoppingItem };
