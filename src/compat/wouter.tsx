import { Link as TSLink, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode, AnchorHTMLAttributes, MouseEvent } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
};

export function Link({ href, children, onClick, ...rest }: LinkProps) {
  // Use TanStack Link where possible; fall back to <a> for unknown routes.
  return (
    <TSLink to={href as string} onClick={onClick} {...rest}>
      {children}
    </TSLink>
  );
}

export function useLocation(): [string, (to: string) => void] {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const setLocation = (to: string) => {
    navigate({ to: to as string });
  };
  return [pathname, setLocation];
}

export function Redirect({ to }: { to: string }) {
  const navigate = useNavigate();
  if (typeof window !== "undefined") {
    setTimeout(() => navigate({ to: to as string }), 0);
  }
  return null;
}

// Minimal Route/Switch/Router stubs (unused because we use TanStack routing).
export function Router({ children }: { children: ReactNode; base?: string }) {
  return <>{children}</>;
}
export function Switch({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function Route({ children }: { path?: string; children?: ReactNode }) {
  return <>{children}</>;
}
