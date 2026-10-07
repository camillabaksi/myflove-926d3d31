import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

function shared(size: number, strokeWidth: number): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

export function TodayHorizonIcon({ size = 24, strokeWidth = 1.8, ...props }: IconProps) {
  return <svg {...shared(size, strokeWidth)} {...props}><path d="M4 18h16" /><path d="M6.5 15.5h11" /><path d="M8.5 15.5a3.5 3.5 0 0 1 7 0" /><path d="M12 5.5v2" /><path d="m6.7 8.2 1.4 1.4" /><path d="m17.3 8.2-1.4 1.4" /></svg>;
}

export function ThoughtsIcon({ size = 24, strokeWidth = 1.8, ...props }: IconProps) {
  return <svg {...shared(size, strokeWidth)} {...props}><path d="M7.2 5.8c1.3-1.5 4.3-1.9 6-.7 2.2-.4 4.5 1.1 4.7 3.2 1.6 1 2 3.2.7 4.7-.9 1.1-2.2 1.6-3.6 1.5-1.7 1.7-5.2 1.8-7 .2-2 .2-3.9-1.2-4-3.2-1.2-1.3-.8-3.4.7-4.3.5-.8 1.4-1.3 2.5-1.4Z" /><circle cx="6" cy="18" r="1.2" /><circle cx="3.4" cy="20.5" r=".55" /></svg>;
}

/** Två spegelvända, öppna händer som omsluter ett tomt utrymme. */
export function MyPlaceIcon({ size = 24, strokeWidth = 1.8, ...props }: IconProps) {
  return <svg {...shared(size, strokeWidth)} {...props}><path d="M10.6 20C7 18.8 4.4 15.6 4.4 11.6c0-2.6.9-4.9 2.4-6.6" /><path d="M6.8 5c.9.9 1.2 2.2.9 3.4" /><path d="M13.4 20c3.6-1.2 6.2-4.4 6.2-8.4 0-2.6-.9-4.9-2.4-6.6" /><path d="M17.2 5c-.9.9-1.2 2.2-.9 3.4" /></svg>;
}