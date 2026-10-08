import light from "@/assets/paceable-brand/paceable-horizontal-light.png.asset.json";
import dark from "@/assets/paceable-brand/paceable-horizontal-dark.png.asset.json";
import compactLight from "@/assets/paceable-brand/paceable-compact-light.png.asset.json";
import compactDark from "@/assets/paceable-brand/paceable-compact-dark.png.asset.json";
import { cn } from "@/lib/utils";

/** Approved original pixels only; theme follows the app's existing .dark class. */
export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span data-no-translate data-paceable-brand={compact ? "compact" : "horizontal"} className={cn("block min-w-0", className)}>
      <img src={(compact ? compactLight : light).url} width={compact ? 1287 : 1861} height={compact ? 470 : 695} alt={compact ? "Paceable" : "Paceable — Ditt liv, i din takt."} className="block h-auto w-full dark:hidden" />
      <img src={(compact ? compactDark : dark).url} width={compact ? 1277 : 1861} height={compact ? 465 : 695} alt={compact ? "Paceable" : "Paceable — Ditt liv, i din takt."} className="hidden h-auto w-full dark:block" />
    </span>
  );
}