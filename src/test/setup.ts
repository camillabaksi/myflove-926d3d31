import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/** Mobilbredd (iPhone 12/13) för alla Flow-tester. */
export const MOBILE_WIDTH = 390;
export const MOBILE_HEIGHT = 844;

Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: MOBILE_WIDTH,
});
Object.defineProperty(window, "innerHeight", {
  writable: true,
  configurable: true,
  value: MOBILE_HEIGHT,
});

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: /max-width:\s*(4[0-9]{2}|[5-7][0-9]{2})px/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
}

afterEach(() => cleanup());
