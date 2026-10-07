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

/** Ett öppet, organiskt eget utrymme med en liten öppning snett upptill. */
export function MyPlaceIcon({ size = 24, strokeWidth = 1.8, ...props }: IconProps) {
  return <svg {...shared(size, strokeWidth)} {...props}><path d="M11.8 4.3C8.1 3.7 4.7 6.1 4.1 10.1c-.7 4.5 1.5 8.4 5.7 9.2 4.5.9 8.8-1.2 9.7-5.2.7-3.1-.7-6.4-3.9-8.3" /></svg>;
}