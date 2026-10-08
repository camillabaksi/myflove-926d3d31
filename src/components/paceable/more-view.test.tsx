import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode, MouseEventHandler } from "react";
import MoreView, { getMoreItems, MORE_GROUPS, MORE_FAMILY, MORE_INSIGHTS, MORE_LEGACY, MORE_FEATURED_HREFS, type MoreItem } from "./more-view";
import { User } from "lucide-react";

vi.mock("wouter", () => ({ Link: ({ children, href, ...props }: { children: ReactNode; href: string; className?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) => <a href={href} {...props}>{children}</a> }));

describe("Mer navigation presentation", () => {
  const item = (href: string, essential = false): MoreItem => ({ href, label: href, hint: "Test", icon: User, essential });
  it("covers every existing navigation destination", () => {
    const existing = ["/hem", "/idag", "/halsa", "/mitt-batteri", "/energifloede", "/aterhamtning", "/stop-paus", "/traning", "/daglig-rutin", "/quickflow", "/anteckningar", "/assistant", "/kalender", "/paminnelser", "/tasks", "/flowscore", "/pomodoro", "/shopping", "/matlista", "/stadning", "/finances", "/relationer", "/familjeflow", "/familj", "/barn", "/historik", "/statistik", "/beloningar", "/insight", "/flowplan", "/flow", "/friktionsindex", "/studyflow", "/jobb", "/admin", "/admin-statistik", "/installningar"];
    const covered = [...MORE_FEATURED_HREFS, ...MORE_FAMILY, ...MORE_INSIGHTS, ...MORE_LEGACY, ...MORE_GROUPS.flatMap((group) => [...group.hrefs])];
    expect(new Set(covered)).toEqual(new Set(existing));
  });
  it("keeps only supplied account-authorized destinations", () => {
    expect(getMoreItems([item("/tasks")], ["/tasks", "/admin", "/studyflow"], false).map((entry) => entry.href)).toEqual(["/tasks"]);
  });
  it("preserves essential filtering without mutating source items", () => {
    const items = [item("/flow", true), item("/flowplan")];
    expect(getMoreItems(items, ["/flow", "/flowplan"], true)).toEqual([items[0]]);
    expect(getMoreItems(items, ["/flow", "/flowplan"], false)).toEqual(items);
    expect(items).toHaveLength(2);
  });
  it("keeps older Home in the separate legacy group", () => {
    expect(MORE_LEGACY).toContain("/hem");
    expect(MORE_GROUPS.flatMap((group) => [...group.hrefs])).not.toContain("/hem");
  });

  const allItems = () => [...new Set([...MORE_FEATURED_HREFS, ...MORE_FAMILY, ...MORE_INSIGHTS, ...MORE_LEGACY, ...MORE_GROUPS.flatMap((group) => [...group.hrefs])])].map((href) => item(href, href !== "/flowplan"));
  const show = (items: MoreItem[], simpleMode = false) => render(<MoreView items={items} simpleMode={simpleMode} enlarged={false} onClose={vi.fn()} onNavigate={vi.fn()} t={(text) => text} />);

  it("adds four collapsible sections in order while keeping all existing entry points", () => {
    const { container } = show(allItems());
    const headings = [...container.querySelectorAll(".pace-more-section > h2")].map((heading) => heading.textContent);
    expect(headings).toEqual(["MIN VARDAG", "HÄLSA & VÄLMÅENDE", "FAMILJ & RELATIONER", "ÖVERBLICK & INSIKTER", "FLER VERKTYG"]);
    expect(screen.getByRole("link", { name: /Min profil/ })).toHaveAttribute("href", "/profil");
    expect(screen.getByRole("link", { name: /Uppgifter/ })).toHaveAttribute("href", "/tasks");
    fireEvent.click(screen.getByRole("button", { name: /Fler funktioner/ }));
    const tools = container.querySelector("#pace-more-group-tools");
    expect(tools).not.toBeNull();
    if (!tools) return;
    for (const group of MORE_GROUPS.slice(0, 4)) {
      const toggle = screen.getByRole("button", { name: new RegExp(group.title) });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(within(screen.getByRole("region", { name: group.title })).queryByRole("link")).toBeNull();
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      const direct = screen.getByRole("region", { name: group.title });
      const nested = within(tools as HTMLElement).getByRole("heading", { name: group.title }).parentElement;
      expect(nested).not.toBeNull();
      if (!nested) continue;
      for (const section of [direct, nested]) {
        const links = within(section).getAllByRole("link");
        const hrefs = links.map((link) => link.getAttribute("href"));
        expect(hrefs).toEqual([...group.hrefs]);
        expect(new Set(hrefs).size).toBe(hrefs.length);
      }
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    }
    expect(within(tools as HTMLElement).getByRole("heading", { name: "Konto och app" })).toBeInTheDocument();
    expect(within(tools as HTMLElement).getByRole("heading", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Äldre funktioner/ })).toBeInTheDocument();
  });

  it("applies identical authorization and simple-mode filtering in both locations", () => {
    const allowed = allItems().filter((entry) => !["/assistant", "/admin", "/admin-statistik"].includes(entry.href));
    const { container } = show(allowed, true);
    fireEvent.click(screen.getByRole("button", { name: /Fler funktioner/ }));
    fireEvent.click(screen.getByRole("button", { name: /Flow och samtal/ }));
    fireEvent.click(screen.getByRole("button", { name: /Min dag/ }));
    for (const href of ["/assistant", "/flowplan", "/admin", "/admin-statistik"]) {
      expect(container.querySelectorAll(`a[href="${href}"]`)).toHaveLength(0);
    }
    expect(container.querySelectorAll('a[href="/flow"]')).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Flow och samtal/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Min dag/ })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Sök i appen" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "/flowplan" } });
    expect(screen.getByRole("link", { name: /flowplan/ })).toHaveAttribute("href", "/flowplan");
    expect(container.querySelectorAll('a[href="/assistant"]')).toHaveLength(0);
  });

  it("omits empty direct sections without removing the existing tools menu", () => {
    show([item("/installningar")]);
    for (const group of MORE_GROUPS.slice(0, 4)) expect(screen.queryByRole("region", { name: group.title })).toBeNull();
    expect(screen.getByRole("button", { name: /Fler funktioner/ })).toBeInTheDocument();
  });
});