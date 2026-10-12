import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BrandLogo } from "@/components/paceable/brand-logo";
import { Button } from "@/components/ui/button";
import { LandingTranslateProvider } from "@/components/auto-translate-provider";

const MENU = [
  { to: "/", label: "Hem" },
  { to: "/", hash: "funktioner", label: "Funktioner" },
  { to: "/om-oss", label: "Om oss" },
  { to: "/guide/adhd-planner-for-adults", label: "ADHD-guide" },
] as const;

/** One public shell. The language preference stays separate from account data. */
export function PublicPage({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [lang, setLang] = useState<"sv" | "en">("sv");
  useEffect(() => {
    try {
      setLang(window.localStorage.getItem("myflove-landing-language") === "en" ? "en" : "sv");
    } catch {
      /* Browsing works without local storage. */
    }
  }, []);
  const chooseLang = (next: "sv" | "en") => {
    setLang(next);
    try {
      window.localStorage.setItem("myflove-landing-language", next);
    } catch {
      /* Browsing works without local storage. */
    }
  };
  const menuLinks = MENU.map((item) => {
    const hash = "hash" in item ? item.hash : undefined;
    return (
      <Link
        key={item.label}
        to={item.to}
        hash={hash}
        aria-current={!hash && path === item.to ? "page" : undefined}
        className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
      >
        {item.label}
      </Link>
    );
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-landing-background text-foreground">
      <a
        href="#public-content"
        className="sr-only focus:not-sr-only focus:block focus:px-5 focus:py-3"
      >
        Till innehållet
      </a>
      <header className="relative z-10 bg-landing-background">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-3 sm:px-8 lg:flex-nowrap lg:gap-5 lg:px-12">
          <Link to="/" aria-label="Paceable, startsida" className="shrink-0">
            <BrandLogo compact lightSurface className="w-28 sm:w-40 lg:hidden" />
            <BrandLogo lightSurface className="hidden w-52 lg:block xl:w-64" />
          </Link>
          <nav aria-label="Huvudmeny" className="hidden items-center gap-5 lg:flex">
            {menuLinks}
          </nav>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-3">
            <div
              role="group"
              aria-label="Language / Språk"
              data-no-translate
              className="flex shrink-0 gap-0.5"
            >
              <Button
                variant="ghost"
                size="sm"
                aria-label="Svenska"
                aria-pressed={lang === "sv"}
                onClick={() => chooseLang("sv")}
                className={`min-h-11 px-2 text-xs ${lang === "sv" ? "font-bold text-primary underline underline-offset-4" : "text-muted-foreground"}`}
              >
                SV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="English"
                aria-pressed={lang === "en"}
                onClick={() => chooseLang("en")}
                className={`min-h-11 px-2 text-xs ${lang === "en" ? "font-bold text-primary underline underline-offset-4" : "text-muted-foreground"}`}
              >
                EN
              </Button>
            </div>
            <Button
              asChild
              variant="ghost"
              className="min-h-11 px-2 text-xs font-semibold sm:px-4 sm:text-sm"
            >
              <Link to="/sign-in">Logga in</Link>
            </Button>
            <Button asChild className="min-h-11 rounded-full px-3 shadow-soft sm:px-6">
              <Link to="/sign-up">Kom igång</Link>
            </Button>
          </div>
        </div>
        <nav
          aria-label="Mobil meny"
          className="flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-border/50 px-4 lg:hidden"
        >
          {menuLinks}
        </nav>
      </header>
      <main id="public-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="border-t border-border bg-landing-sand px-5 py-8 text-center text-xs text-muted-foreground">
        <nav aria-label="Mer om Paceable" className="flex flex-wrap justify-center gap-x-5 gap-y-1">
          <Link to="/" className="inline-flex min-h-11 items-center hover:text-primary">
            Hem
          </Link>
          <Link to="/om-oss" className="inline-flex min-h-11 items-center hover:text-primary">
            Om oss
          </Link>
          <Link
            to="/guide/adhd-planner-for-adults"
            className="inline-flex min-h-11 items-center hover:text-primary"
          >
            ADHD-planerare för vuxna
          </Link>
          <Link to="/integritet" className="inline-flex min-h-11 items-center hover:text-primary">
            Integritet
          </Link>
          <Link to="/villkor" className="inline-flex min-h-11 items-center hover:text-primary">
            Villkor
          </Link>
          <Link to="/cookies" className="inline-flex min-h-11 items-center hover:text-primary">
            Cookies
          </Link>
        </nav>
        <p className="mt-5">© {new Date().getFullYear()} Paceable</p>
      </footer>
      <LandingTranslateProvider lang={lang} />
    </div>
  );
}
