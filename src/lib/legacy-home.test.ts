import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Route as HomeRoute } from "@/routes/_app.hem";
import { Route as CustomizeRoute } from "@/routes/_app.anpassa-hem";
import { lastPlace, placeFor } from "@/lib/flow-context";
import { APP_GUIDE } from "@/lib/app-guide";

describe("Pensionerad Hem-sida", () => {
  beforeEach(() => window.sessionStorage.clear());

  it.each([
    { path: "/hem", destination: "/idag", route: HomeRoute },
    { path: "/anpassa-hem", destination: "/installningar", route: CustomizeRoute },
  ])(
    "öppnar $destination via gamla bokmärket $path utan en extra historikpost",
    async ({ path, destination, route }) => {
      const root = createRootRoute();
      const legacy = createRoute({
        getParentRoute: () => root,
        path,
        beforeLoad: () => route.options.beforeLoad?.({} as never),
      });
      const target = createRoute({ getParentRoute: () => root, path: destination });
      const history = createMemoryHistory({ initialEntries: [path] });
      const router = createRouter({ routeTree: root.addChildren([legacy, target]), history });
      await router.load();
      expect(router.state.location.pathname).toBe(destination);
      expect(router.state.matches.at(-1)?.pathname).toBe(destination);
      expect(history.canGoBack()).toBe(false);
    },
  );

  it("använder Idag för nya och tidigare sparade samtalsingångar", () => {
    expect(lastPlace()).toEqual(placeFor("/idag"));
    window.sessionStorage.setItem("myflove-flow-place", "/hem");
    expect(lastPlace()).toEqual(placeFor("/idag"));
    // Läsningen byter sammanhang utan att skriva över användarens sparade värde.
    expect(window.sessionStorage.getItem("myflove-flow-place")).toBe("/hem");
  });

  it("erbjuder Idag och andra funktioner i guiden utan den gamla sidan eller dess inställningar", () => {
    const paths = APP_GUIDE.flatMap((group) => group.entries.map((entry) => entry.href));
    expect(paths).toContain("/idag");
    expect(paths).toContain("/kalender");
    expect(paths).toContain("/mitt-batteri");
    expect(paths).not.toContain("/hem");
    expect(paths).not.toContain("/anpassa-hem");
  });

  it("startar installerade appar på Idag med samma appidentitet", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
    expect(manifest.start_url).toBe("/idag");
    // Utan explicit id var den tidigare startadressen /hem appens identitet.
    expect(manifest.id).toBe("/hem");
  });
});
