// Shim for @clerk/react — bridges the MyFlow codebase to Supabase auth.
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { clearLocalUserData } from "@/lib/local-data";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const listeners = new Set<() => void>();
let state: AuthState = { user: null, session: null, loading: true };

function notify() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    state = { session: data.session, user: data.session?.user ?? null, loading: false };
    notify();
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    state = { session, user: session?.user ?? null, loading: false };
    notify();
  });
}

function useAuthState() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((v) => v + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return state;
}

// Clerk-compatible hooks
export function useUser() {
  const s = useAuthState();
  return {
    isSignedIn: !!s.user,
    isLoaded: !s.loading,
    user: s.user
      ? {
          id: s.user.id,
          firstName: (s.user.user_metadata?.first_name as string) ?? null,
          fullName: (s.user.user_metadata?.full_name as string) ?? s.user.email ?? null,
          primaryEmailAddress: { emailAddress: s.user.email ?? "" },
        }
      : null,
  };
}

export function useClerk() {
  return {
    signOut: async () => {
      // Städa FÖRE utloggningen: så länge sessionen lever kan det som ligger
      // i synkkön skrivas upp och bekräftas. Det som molnet inte bekräftar
      // ligger kvar lokalt och synkas vid nästa inloggning.
      await clearLocalUserData();
      await supabase.auth.signOut();
      if (typeof window !== "undefined") window.location.href = "/sign-in";
    },
    openSignIn: () => {
      if (typeof window !== "undefined") window.location.href = "/sign-in";
    },
    openUserProfile: () => {},
  };
}

export function Show({
  when,
  fallback,
  children,
}: {
  when?: "signed-in" | "signed-out";
  fallback?: ReactNode;
  children?: ReactNode;
}) {
  const s = useAuthState();
  if (s.loading) return null;
  const signedIn = !!s.user;
  const show = when === "signed-out" ? !signedIn : signedIn;
  return <>{show ? children : fallback}</>;
}

// Stubs for SignIn/SignUp — actual auth UI lives at src/routes/sign-in.tsx and sign-up.tsx.
export function SignIn(_props: Record<string, unknown>) {
  return <div className="p-4 text-sm text-muted-foreground">Se /sign-in</div>;
}
export function SignUp(_props: Record<string, unknown>) {
  return <div className="p-4 text-sm text-muted-foreground">Se /sign-up</div>;
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function publishableKeyFromHost(_host: string, key?: string) {
  return key ?? "shim";
}
