import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSharedShoppingList } from "./use-shared-shopping-list";

const mocks = vi.hoisted(() => ({
  household: true,
  addConfirmed: vi.fn(async (_vars: { data: { title: string } }) => ({ ok: true })),
  addUnconfirmed: vi.fn(),
  addPersonal: vi.fn(),
}));

vi.mock("@clerk/react", () => ({ useUser: () => ({ isSignedIn: true }) }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@workspace/api-client-react", () => ({
  useGetMyHousehold: () => ({
    data: mocks.household ? { id: "household-1" } : null,
    isLoading: false,
  }),
  useListShoppingItems: () => ({ data: [], isLoading: false }),
  useAddShoppingItem: () => ({
    mutate: mocks.addUnconfirmed,
    mutateAsync: mocks.addConfirmed,
  }),
  useToggleShoppingItem: () => ({ mutate: vi.fn() }),
  useDeleteShoppingItem: () => ({ mutate: vi.fn() }),
  getGetMyHouseholdQueryKey: () => ["household"],
  getListShoppingItemsQueryKey: () => ["shopping-items"],
}));
vi.mock("./use-data", () => ({
  useShoppingList: () => ({
    addItem: mocks.addPersonal,
    activeItems: [],
    completedItems: [],
  }),
}));

beforeEach(() => {
  mocks.household = true;
  mocks.addConfirmed.mockReset().mockResolvedValue({ ok: true });
  mocks.addUnconfirmed.mockClear();
  mocks.addPersonal.mockClear();
  window.localStorage.removeItem("myflove.shoppingListMode");
});

describe("Pace shopping action acknowledgement", () => {
  it("waits for a confirmed shared-household insert instead of fire-and-forget mutation", async () => {
    const { result } = renderHook(() => useSharedShoppingList());
    expect(result.current.isShared).toBe(true);
    await act(async () => {
      await result.current.addItemConfirmed("Mjölk", "pace-action-1-item-0");
    });
    expect(mocks.addConfirmed).toHaveBeenCalledWith({ data: { title: "Mjölk" } });
    expect(mocks.addUnconfirmed).not.toHaveBeenCalled();
  });

  it("surfaces a failed shared insert so Pace does not record a false success receipt", async () => {
    mocks.addConfirmed.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useSharedShoppingList());
    await expect(result.current.addItemConfirmed("Mjölk", "pace-action-1-item-0"))
      .rejects.toThrow("Network error");
    expect(mocks.addUnconfirmed).not.toHaveBeenCalled();
  });

  it("passes source identity to the existing personal shopping store", async () => {
    mocks.household = false;
    const { result } = renderHook(() => useSharedShoppingList());
    expect(result.current.isShared).toBe(false);
    await act(async () => {
      await result.current.addItemConfirmed("Mjölk", "pace-action-1-item-0");
    });
    expect(mocks.addPersonal).toHaveBeenCalledWith("Mjölk", "pace-action-1-item-0");
    expect(mocks.addConfirmed).not.toHaveBeenCalled();
  });
});
