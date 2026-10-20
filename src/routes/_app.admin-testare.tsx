import { createFileRoute } from "@tanstack/react-router";
import AdminTesterApplications from "@/pages/admin-testare";

export const Route = createFileRoute("/_app/admin-testare")({
  head: () => ({
    meta: [
      { title: "Testanmälningar – Paceable" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminTesterApplications,
});
