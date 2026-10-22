import { createFileRoute } from "@tanstack/react-router";
import PlanningPage from "@/pages/planning";
import type { PlanningPeriod } from "@/lib/planning";

export const Route = createFileRoute("/_app/planera")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { audience: "me" | "children"; period: PlanningPeriod; supports?: "1" } => ({
    audience: search.audience === "children" ? "children" : "me",
    period: search.period === "tomorrow" || search.period === "week" ? search.period : "today",
    // A navigation hint, not permission to add anything to the plan.
    supports: search.supports === "1" ? "1" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Planera din dag och vecka – Paceable" },
      { name: "description", content: "Planera din egen dag eller barnens schema och granska aktiviteterna innan du sparar." },
      { property: "og:title", content: "Planera din dag och vecka – Paceable" },
      { property: "og:description", content: "Planera din egen dag eller barnens schema och granska aktiviteterna innan du sparar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PlanningPage,
});
