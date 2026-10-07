import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import HelpHint from "@/components/help-hint";

import { useCollapsible } from "@/lib/collapse-store";

type CardContextValue = {
  collapsed: boolean;
  toggle: () => void;
  registerTitle: (title: string) => void;
  hasId: boolean;
  collapsible: boolean;
};

const CardContext = React.createContext<CardContextValue | null>(null);

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sätt false för att stänga av hopfällning för just detta kort. */
  collapsible?: boolean;
  /** Eget id om rubriken inte är unik. */
  collapseId?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, collapsible = true, collapseId, children, ...props }, ref) => {
    const [title, setTitle] = React.useState<string | null>(collapseId ?? null);
    const [path, setPath] = React.useState("");

    React.useEffect(() => {
      setPath(window.location.pathname);
    }, []);

    const id = collapsible && title ? `${path}::${title.slice(0, 60)}` : null;
    const { collapsed, toggle } = useCollapsible(id);

    const registerTitle = React.useCallback(
      (next: string) => {
        if (collapseId) return;
        setTitle((prev) => (prev === next ? prev : next));
      },
      [collapseId],
    );

    const value = React.useMemo<CardContextValue>(
      () => ({ collapsed, toggle, registerTitle, hasId: Boolean(id), collapsible }),
      [collapsed, toggle, registerTitle, id, collapsible],
    );

    return (
      <CardContext.Provider value={value}>
        <div
          ref={ref}
          data-collapsed={collapsed ? "true" : undefined}
          className={cn("rounded-3xl border border-border bg-card text-card-foreground shadow-soft", className)}
          {...props}
        >
          {children}
        </div>
      </CardContext.Provider>
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(CardContext);
    const showToggle = Boolean(ctx?.collapsible && ctx?.hasId);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-1.5 p-6",
          showToggle && "relative pr-12",
          showToggle && ctx?.collapsed && "pb-4",
          className,
        )}
        {...props}
      >
        {children}
        {showToggle && (
          <button
            type="button"
            onClick={ctx!.toggle}
            aria-expanded={!ctx!.collapsed}
            aria-label={ctx!.collapsed ? "Visa" : "Minimera"}
            title={ctx!.collapsed ? "Visa" : "Minimera"}
            className="absolute right-3 top-3 grid min-h-11 min-w-11 place-items-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={cn("transition-transform", ctx!.collapsed && "-rotate-90")}
            />
          </button>
        )}
      </div>
    );
  },
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Kort förklaring bakom en i-knapp bredvid rubriken. */
  help?: React.ReactNode;
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, children, help, ...props }, ref) => {
    const ctx = React.useContext(CardContext);
    const innerRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      const text = innerRef.current?.textContent?.trim();
      if (text && ctx?.collapsible) ctx.registerTitle(text);
    });

    return (
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "font-semibold leading-none tracking-tight",
          help && "flex items-center gap-2",
          className,
        )}
        {...props}
      >
        {children}
        {help && <HelpHint>{help}</HelpHint>}
      </div>
    );
  },
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const ctx = React.useContext(CardContext);
    if (ctx?.collapsed) return null;
    return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
  },
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const ctx = React.useContext(CardContext);
    if (ctx?.collapsed) return null;
    return <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />;
  },
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
