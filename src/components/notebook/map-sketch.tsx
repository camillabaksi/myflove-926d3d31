import type { SVGProps } from "react";

/** Fixed pen strokes keep the map calm and deterministic while it is edited. */
const strokes = {
  move: [
    "M12.2 3.3C11.6 8.9 12.5 15.1 11.8 20.8M3.2 12.3C8.4 11.6 15.4 12.6 20.7 11.8",
    "m8.7 6.7 3.5-3.4 3.2 3.7M8.4 17.3l3.4 3.5 3.6-3.4M6.7 8.8l-3.5 3.5 3.5 3.1M17.2 8.4l3.5 3.4-3.3 3.6",
  ],
  more: [
    "M5.7 11c-1.8-.4-2 2.6-.3 2.6 1.7.1 1.9-2.2.3-2.6ZM12.1 10.6c-1.8.1-1.6 2.9.1 2.8 1.6-.2 1.5-2.7-.1-2.8ZM18.6 10.9c-1.8-.3-2 2.6-.3 2.6 1.7.2 2-2.4.3-2.6Z",
  ],
  plus: ["M12.4 4c-.8 5.1.2 10.8-.5 16M4.2 12.4c5.2-.8 10.4.2 15.7-.6"],
  list: [
    "M8.4 5.8c4-.4 7.2.3 11.4-.2M8.7 12.2c3.7-.5 7.3.3 10.8-.2M8.5 18.4c4.2-.3 7.2.2 11.1-.3",
    "m3.9 5.7.7.2M4 12l.6.2m-.8 6.1.8-.1",
  ],
  network: [
    "m6.5 7.9 9.4-2.1M6.3 9.4l5.3 7.2m5.8-9.2-3.9 9.1",
    "M4.9 5.7c-3-.1-3.1 4.5-.2 4.5 3.2.1 3.4-4.2.2-4.5ZM18.1 3.2c-3.2-.2-3.3 4.6-.2 4.6 3.2.1 3.4-4.4.2-4.6ZM12.6 16.5c-3.1-.2-3.3 4.5-.3 4.6 3.2.2 3.4-4.5.3-4.6Z",
  ],
  "zoom-in": [
    "M9.9 3.1c-8.4-.6-9.5 12.8-1 13.8 9.5 1.1 10.4-13.2 1-13.8Zm4.9 12.2c1.8 1.9 4 3.6 5.7 5.3",
    "m6.1 10 7.5-.2M10 6.2l-.3 7.4",
  ],
  "zoom-out": [
    "M9.9 3.1c-8.4-.6-9.5 12.8-1 13.8 9.5 1.1 10.4-13.2 1-13.8Zm4.9 12.2c1.8 1.9 4 3.6 5.7 5.3",
    "M6.1 10c2.5-.5 5 .3 7.5-.2",
  ],
  reset: ["M3.4 8.6 3.2 4l5.1-.4M15.6 3.4l4.9.1.2 5M20.8 15.6l-.3 5-4.9.2M8.5 20.8l-5.1-.3-.1-5"],
  left: ["M20.2 12c-5.1.5-10.8-.4-16 .2m6.3-6.5-6.3 6.5 6 5.7"],
  right: ["M3.8 12c5.1-.5 10.8.4 16-.2m-6.3 6.5 6.3-6.5-6-5.7"],
  up: ["M12 20.2c.5-5.1-.4-10.8.2-16m-6.5 6.3 6.5-6.3 5.7 6"],
  down: ["M12 3.8c-.5 5.1.4 10.8-.2 16m6.5-6.3-6.5 6.3-5.7-6"],
  trash: [
    "M4 6.9c5.2-.5 10.7.2 16-.3M9.1 6.7l.3-3.1 5.3.1.4 2.9M6.2 7l.7 13 10.4.3.6-13.5M10 10.5l.2 6.6m3.9-6.5-.2 6.5",
  ],
} satisfies Record<string, string[]>;
export type MapSketchSymbol = keyof typeof strokes;

export function MapSketchIcon({
  name,
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & { name: MapSketchSymbol }) {
  return (
    <svg
      {...props}
      className={`book-sketch-icon ${className}`}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {strokes[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function MapSketchBubble() {
  return (
    <svg
      className="book-bubble-outline"
      viewBox="0 0 240 160"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="book-bubble-fill"
        d="M121 4C181 1 233 32 235 76C241 119 187 155 123 157C60 160 6 132 4 84C1 38 52 5 121 4Z"
      />
      <path
        className="book-bubble-retrace"
        d="M118 6C62 3 4 40 6 85C5 127 60 158 124 155C184 158 238 119 233 75C234 35 181 0 124 5"
      />
    </svg>
  );
}
