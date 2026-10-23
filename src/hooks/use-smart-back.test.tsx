import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

/**
 * Tillbaka ska följa appens riktiga historik – och bara falla tillbaka till
 * en överordnad sida när det inte finns någon föregående sida (direktlänk).
 */

const back = vi.fn();
const navigate = vi.fn();
let canGoBack = true;

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    history: { canGoBack: () => canGoBack, length: canGoBack ? 3 : 1, back },
    navigate,
  }),
}));

import { useSmartBack } from "@/hooks/use-smart-back";

describe("useSmartBack", () => {
  it("uses Today as the safe default for a directly opened Insights page", () => {
    canGoBack = false;
    back.mockClear();
    navigate.mockClear();
    const { result } = renderHook(() => useSmartBack());
    act(() => result.current());
    expect(navigate).toHaveBeenCalledWith({ to: "/idag" });
    expect(back).not.toHaveBeenCalled();
  });
  it("går tillbaka i historiken när det finns en föregående sida", () => {
    canGoBack = true;
    back.mockClear();
    navigate.mockClear();
    const { result } = renderHook(() => useSmartBack("/hem"));
    act(() => result.current());
    expect(back).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("faller tillbaka till en rimlig sida vid direktladdning", () => {
    canGoBack = false;
    back.mockClear();
    navigate.mockClear();
    const { result } = renderHook(() => useSmartBack("/hem"));
    act(() => result.current());
    expect(back).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({ to: "/hem" });
  });
});
