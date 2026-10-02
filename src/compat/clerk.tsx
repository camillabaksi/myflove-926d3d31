// Shim for @clerk/react — bridges the MyFlow codebase to Supabase auth.
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { clearLocalUserData } from "@/lib/local-data";
import { setDemoSession } from "@/lib/demo-account";
import { bindAccount, parkActiveData } from "@/lib/account-scope";
import { ACCOUNT_BOUND_EVENT } from "@/lib/cloud-storage";

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

/**
 * Knyter enhetens lokala data till den inloggade användaren innan något
 * visas eller synkas. Byttes kontot laddas sidan om så att inga minnescacher
 * eller prenumerationer från förra kontot lever kvar. Returnerar false då.
 */
function bindSession(session: Session | null, initial: boolean): boolean {
  const uid = session?.user?.id;
  if (!uid) return true;
  const result = bindAccount(uid, { adoptUnowned: initial });
  if (result === "switched") {
    window.location.reload();
    return false;
  }
  window.dispatchEvent(new CustomEvent(ACCOUNT_BOUND_EVENT));
  return true;
}

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    if (!bindSession(data.session, true)) return;
    state = { session: data.session, user: data.session?.user ?? null, loading: false };
    notify();
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      // Sessionen tog slut utan vår egen utloggning (utgången token, annan
      // flik): parkera kontots data så att nästa person inte ser den.
      parkActiveData();
    } else if (!bindSession(session, event === "INITIAL_SESSION")) {
      return;
    }
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
      setDemoSession(false);
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
