import type { ReactNode } from "react";
import { BrandLogo } from "./brand-logo";

/** Shared shell presentation; callers keep navigation and collapse behavior. */
export function AppBrandHeader({ back, actions }: { back?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="pace-shell-brand-header">
      <div className="pace-shell-brand-back">{back}</div>
      <BrandLogo compact className="pace-app-brand" />
      <div className="pace-shell-brand-actions">{actions}</div>
    </div>
  );
}
