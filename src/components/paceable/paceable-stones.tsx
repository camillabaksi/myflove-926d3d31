import { cn } from "@/lib/utils";
import stonesImage from "@/assets/paceable-stones.png";

export function PaceableStones({ className, compact = false, tactile = false }: { className?: string; compact?: boolean; tactile?: boolean }) {
  if (tactile) {
    return (
      <span className={cn("pace-stones relative inline-block", compact ? "h-12 w-24" : "h-20 w-40", className)}>
        <img src={stonesImage} alt="Tre Paceable-stenar" width={1536} height={768} decoding="async" className="pace-stones-img relative h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 180 96"
      role="img"
      aria-label="Tre mjuka Paceable-stenar"
      className={cn("paceable-stones", compact ? "h-12 w-24" : "h-20 w-36", className)}
    >
      <g className="paceable-stone paceable-stone-one">
        <path d="M14 66C12 44 24 24 45 21c18-3 33 10 34 29 1 18-10 29-31 31-19 2-32-2-34-15Z" fill="var(--stone-lavender)" />
        <path d="M24 54c3-14 12-23 25-25" fill="none" stroke="var(--stone-highlight)" strokeWidth="5" strokeLinecap="round" opacity=".55" />
      </g>
      <g className="paceable-stone paceable-stone-two">
        <path d="M66 70c-2-17 8-34 26-39 19-5 36 6 39 24 3 17-6 30-28 34-20 4-35-2-37-19Z" fill="var(--stone-apricot)" />
        <path d="M78 60c3-11 11-19 23-22" fill="none" stroke="var(--stone-highlight)" strokeWidth="5" strokeLinecap="round" opacity=".5" />
      </g>
      <g className="paceable-stone paceable-stone-three">
        <path d="M118 67c0-18 10-33 28-36 17-3 30 9 31 26 1 18-10 29-29 31-18 2-30-4-30-21Z" fill="var(--stone-sage)" />
        <path d="M130 56c3-10 9-17 19-19" fill="none" stroke="var(--stone-highlight)" strokeWidth="5" strokeLinecap="round" opacity=".48" />
      </g>
    </svg>
  );
}