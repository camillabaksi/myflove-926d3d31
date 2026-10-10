import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Insikters sidmetadata", () => {
  it("använder Paceable och bevarar sökväg, demo och indexeringsinställning", () => {
    const route = readFileSync("src/routes/_app.insight.tsx", "utf8");
    expect(route).toContain('createFileRoute("/_app/insight")');
    expect(route).toContain('{ title: "Insikter · Paceable" }');
    expect(route).toContain('property: "og:title", content: "Insikter · Paceable"');
    expect(route).toContain('name: "description"');
    expect(route).toContain('property: "og:description"');
    expect(route).toContain('property: "og:type", content: "website"');
    expect(route).toContain('name: "twitter:card", content: "summary"');
    expect(route).toContain('name: "robots", content: "noindex, nofollow"');
    expect(route).toContain('search["demo"] === "1"');
    expect(route).not.toContain("MyFlove");
  });
});