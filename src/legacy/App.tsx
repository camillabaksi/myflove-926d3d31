import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ClerkProvider, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Shopping from "@/pages/shopping";
import Mood from "@/pages/mood";
import Assistant from "@/pages/assistant";
import Finances from "@/pages/finances";
import Travel from "@/pages/travel";
import CalendarPage from "@/pages/calendar";
import Pomodoro from "@/pages/pomodoro";
import Medication from "@/pages/medication";
import Stats from "@/pages/stats";
import Achievements from "@/pages/achievements";
import Dump from "@/pages/dump";
import AdminStats from "@/pages/admin-stats";
import Family from "@/pages/family";
import MealPlanner from "@/pages/meal-planner";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains. Do not inline the env var, leave
// publishableKey undefined, or replace publishableKeyFromHost with anything else.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set
// in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV — the empty dev value
// is intentional, and any branching breaks the prod proxy.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(80 28% 38%)",
    colorForeground: "hsl(80 25% 18%)",
    colorMutedForeground: "hsl(80 12% 42%)",
    colorDanger: "hsl(6 55% 55%)",
    colorBackground: "hsl(60 30% 96%)",
    colorInput: "hsl(70 18% 80%)",
    colorInputForeground: "hsl(80 25% 18%)",
    colorNeutral: "hsl(70 18% 78%)",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(60,30%,96%)] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[hsl(80,25%,18%)] font-semibold",
    headerSubtitle: "text-[hsl(80,12%,42%)]",
    socialButtonsBlockButtonText: "text-[hsl(80,25%,18%)] font-medium",
    formFieldLabel: "text-[hsl(80,25%,18%)] font-medium",
    footerActionLink: "text-[hsl(80,28%,38%)] font-medium",
    footerActionText: "text-[hsl(80,12%,42%)]",
    dividerText: "text-[hsl(80,12%,42%)]",
    identityPreviewEditButton: "text-[hsl(80,28%,38%)]",
    formFieldSuccessText: "text-[hsl(80,28%,38%)]",
    alertText: "text-[hsl(6,55%,40%)]",
    logoBox: "mb-2",
    logoImage: "h-12 w-12 rounded-xl",
    socialButtonsBlockButton: "border-[hsl(70,18%,78%)]",
    formButtonPrimary: "bg-[hsl(80,28%,38%)] hover:bg-[hsl(80,28%,32%)] text-[hsl(60,40%,97%)]",
    formFieldInput: "bg-[hsl(70,18%,80%)]/30 border-[hsl(70,18%,78%)]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[hsl(70,18%,78%)]",
    alert: "bg-[hsl(6,55%,55%)]/10",
    otpCodeFieldInput: "border-[hsl(70,18%,78%)]",
    formFieldRow: "",
    main: "",
  },
};

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mood" component={Mood} />
      <Route path="/fokus" component={Dashboard} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/shopping" component={Shopping} />
      <Route path="/assistant" component={Assistant} />
      <Route path="/finances" component={Finances} />
      <Route path="/travel" component={Travel} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/pomodoro" component={Pomodoro} />
      <Route path="/medicin" component={Medication} />
      <Route path="/statistik" component={Stats} />
      <Route path="/beloningar" component={Achievements} />
      <Route path="/dump" component={Dump} />
      <Route path="/admin-statistik" component={AdminStats} />
      <Route path="/familj" component={Family} />
      <Route path="/matlista" component={MealPlanner} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Helps the app stay up-to-date when the signed-in user changes by invalidating the QueryClient cache.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Välkommen tillbaka",
            subtitle: "Logga in för att komma åt din familj",
          },
        },
        signUp: {
          start: {
            title: "Skapa ett konto",
            subtitle: "Kom igång med familjekalendern",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
