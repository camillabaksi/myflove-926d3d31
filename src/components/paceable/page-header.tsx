import { type ReactNode, useId } from "react";
import type { LucideIcon } from "lucide-react";
import { PacePageTitle } from "./design-system";
import { cn } from "@/lib/utils";

/** Presentation only: callers retain actions, navigation and draft ownership. */
export function PacePageHeader({ title, icon: Icon, description, action, children, titleId, className }: {
  title: ReactNode;
  icon: LucideIcon;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  titleId?: string;
  className?: string;
}) {
  const generatedId = useId();
  const id = titleId ?? generatedId;
  return (
    <header className={cn("pace-ds pace-standard-header", className)} aria-labelledby={id}>
      <div className="pace-standard-header-main">
        <div className="pace-standard-header-title">
          <Icon className="pace-standard-header-icon" aria-hidden="true" />
          <PacePageTitle id={id}>{title}</PacePageTitle>
        </div>
        {description && <p className="pace-standard-header-description">{description}</p>}
      </div>
      {action && <div className="pace-standard-header-action">{action}</div>}
      {children && <div className="pace-standard-header-extra">{children}</div>}
    </header>
  );
}