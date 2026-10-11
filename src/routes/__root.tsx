import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useLayoutEffect, type ReactNode } from "react";

import { initCacheBusting } from "@/lib/cache-busting";
import { trackPageView } from "@/lib/analytics";
import { useAnalyticsClaim } from "@/hooks/use-analytics-claim";
import { RootErrorBoundary } from "@/components/root-error-boundary";

import brandLight from "@/assets/paceable-brand/paceable-horizontal-light.png.asset.json";
import appCss from "../styles.css?url";
import appTypographyCss from "../app-typography.css?url";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "Paceable — Ditt liv, i din takt." },
      {
        name: "description",
        content:
          "Paceable är ett mjukt dashboard för vardagen: fokus, uppgifter, humör, ekonomi och mer — allt på ett ställe.",
      },
      { name: "author", content: "Paceable" },
      { property: "og:title", content: "Paceable — Ditt liv, i din takt." },
      {
        property: "og:description",
        content: "Ett mjukt dashboard för din vardag — fokus, humör, uppgifter, ekonomi och mer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#F8F6F1" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Paceable" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "vibekollen-verifiering", content: "vk-52413b42f16be1ff3bcba37c" },
      { name: "google-site-verification", content: "no4-nUlVosHpU1GzHhDN73UtQH7v3b8E4k-qs1mNVgM" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: appTypographyCss },
      { rel: "icon", href: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { rel: "icon", href: "/favicon-light.png", type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: light)" },
      { rel: "icon", href: "/favicon-dark.png", type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: dark)" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://myflove.lovable.app/#organization",
              name: "Paceable",
              url: "https://myflove.lovable.app/",
              logo: `https://myflove.lovable.app${brandLight.url}`,
              description:
                "Paceable är ett lugnt dashboard för vardagen – kalender, uppgifter, humör, ekonomi, familj och studier på ett ställe.",
            },
            {
              "@type": "WebSite",
              "@id": "https://myflove.lovable.app/#website",
              name: "Paceable",
              url: "https://myflove.lovable.app/",
              inLanguage: "sv-SE",
              publisher: { "@id": "https://myflove.lovable.app/#organization" },
              description:
                "Ett mjukt dashboard för din vardag — fokus, humör, uppgifter, ekonomi och mer.",
            },
          ],
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body>
        <RootErrorBoundary>{children}</RootErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const appTypography = useRouterState({
    select: (s) => s.matches.some((match) => match.routeId === "/_app") ||
      ["/sign-in", "/sign-up", "/designsystem"].includes(s.location.pathname),
  });
  // Portalled dialogs/menus share the same type as their page. Public marketing
  // keeps its own typography; this flag never changes a saved preference.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (appTypography) root.dataset.paceableTypography = "true";
    else delete root.dataset.paceableTypography;
    return () => { delete root.dataset.paceableTypography; };
  }, [appTypography]);
  useEffect(() => {
    initCacheBusting();
    void import("@/lib/native-backup").then((m) => m.initNativeBackup());
  }, []);
  // Kopplar enhetens anonyma id till kontot en gång, så interna test kan filtreras bort.
  useAnalyticsClaim();
  // Besöksanalys: logga varje sidvisning anonymt (sektion "page").
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div data-paceable-typography={appTypography ? "true" : undefined} className="pace-type-scope contents">
          <Outlet />
          <Toaster />
          <Sonner />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
