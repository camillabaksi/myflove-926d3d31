import type { IllustrationKey } from "@/lib/exercise-library";

/**
 * Enkla, mjuka figurer i samma pastellstil för hela biblioteket.
 * Ritade som SVG så att de är lätta, skarpa på mobil och alltid konsekventa.
 */
export default function ExerciseIllustration({
  variant,
  className,
}: {
  variant: IllustrationKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 90"
      role="img"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`grad-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(272 70% 92%)" />
          <stop offset="100%" stopColor="hsl(330 80% 94%)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="90" rx="18" fill={`url(#grad-${variant})`} />
      <g
        fill="none"
        stroke="hsl(272 45% 42%)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {shape(variant)}
      </g>
    </svg>
  );
}

function head(cx: number, cy: number) {
  return <circle cx={cx} cy={cy} r="6.5" fill="hsl(272 45% 42%)" stroke="none" />;
}

function shape(variant: IllustrationKey) {
  switch (variant) {
    case "bridge":
      return (
        <>
          {head(24, 62)}
          <path d="M32 62 L52 44 L72 62 L92 62" />
          <path d="M72 62 L74 74" />
          <path d="M52 44 L58 62" />
        </>
      );
    case "hinge":
      return (
        <>
          {head(44, 24)}
          <path d="M50 30 L72 46 L72 72" />
          <path d="M72 46 L58 58" />
          <path d="M52 58 L64 58" />
        </>
      );
    case "squat":
      return (
        <>
          {head(52, 22)}
          <path d="M52 30 L52 50 L38 62 L38 74" />
          <path d="M52 50 L68 58 L68 74" />
          <path d="M52 36 L66 40" />
        </>
      );
    case "calf":
      return (
        <>
          {head(56, 20)}
          <path d="M56 28 L56 56 L50 72" />
          <path d="M56 56 L64 72" />
          <path d="M40 72 L80 72" />
        </>
      );
    case "quadruped":
      return (
        <>
          {head(34, 42)}
          <path d="M40 44 L82 44" />
          <path d="M46 44 L46 70" />
          <path d="M78 44 L78 70" />
          <path d="M82 44 L96 36" />
        </>
      );
    case "row":
      return (
        <>
          {head(46, 26)}
          <path d="M50 34 L50 60 L44 74" />
          <path d="M50 60 L62 74" />
          <path d="M50 40 L70 44 L70 56" />
        </>
      );
    case "press":
      return (
        <>
          {head(38, 60)}
          <path d="M44 60 L86 60" />
          <path d="M56 60 L56 40" />
          <path d="M48 40 L64 40" />
        </>
      );
    case "curl":
      return (
        <>
          {head(56, 20)}
          <path d="M56 28 L56 60 L50 74" />
          <path d="M56 60 L64 74" />
          <path d="M56 38 L44 46 L52 34" />
        </>
      );
    case "carry":
      return (
        <>
          {head(52, 20)}
          <path d="M52 28 L52 58 L44 74" />
          <path d="M52 58 L62 74" />
          <path d="M52 36 L70 36 L70 50" />
          <rect x="64" y="50" width="12" height="10" rx="3" fill="hsl(272 45% 42%)" stroke="none" />
        </>
      );
    case "band":
      return (
        <>
          {head(56, 20)}
          <path d="M56 28 L56 52" />
          <path d="M56 52 L40 74" />
          <path d="M56 52 L76 74" />
          <path d="M42 66 Q58 58 74 66" stroke="hsl(330 60% 58%)" />
        </>
      );
    case "step":
      return (
        <>
          {head(44, 20)}
          <path d="M44 28 L44 52 L60 62" />
          <path d="M44 52 L36 74" />
          <path d="M56 62 L86 62 L86 74 L56 74 Z" fill="hsl(272 40% 88%)" />
        </>
      );
    case "lunge":
      return (
        <>
          {head(52, 20)}
          <path d="M52 28 L52 52" />
          <path d="M52 52 L38 74" />
          <path d="M52 52 L74 64 L74 74" />
        </>
      );
    case "core":
      return (
        <>
          {head(28, 60)}
          <path d="M34 60 L76 60" />
          <path d="M60 60 L72 44" />
          <path d="M60 60 L74 70" />
        </>
      );
    case "stretch":
      return (
        <>
          {head(56, 22)}
          <path d="M56 30 L56 56" />
          <path d="M56 36 Q74 34 78 48" />
          <path d="M56 56 L44 74" />
          <path d="M56 56 L70 74" />
        </>
      );
    case "breath":
      return (
        <>
          {head(60, 40)}
          <circle cx="60" cy="40" r="20" stroke="hsl(330 60% 66%)" />
          <circle cx="60" cy="40" r="30" stroke="hsl(330 55% 78%)" />
        </>
      );
    case "plank":
      return (
        <>
          {head(26, 52)}
          <path d="M32 54 L92 64" />
          <path d="M34 54 L34 68 L46 68" />
          <path d="M92 64 L96 74" />
        </>
      );
    case "sideplank":
      return (
        <>
          {head(30, 34)}
          <path d="M36 38 L90 68" />
          <path d="M34 40 L34 68 L46 68" />
          <path d="M60 52 L60 30" />
        </>
      );
    case "pushup":
      return (
        <>
          {head(28, 44)}
          <path d="M34 46 L86 62" />
          <path d="M44 50 L44 70" />
          <path d="M86 62 L92 74" />
          <path d="M82 62 L104 62 L104 74" fill="hsl(272 40% 88%)" />
        </>
      );
    case "swing":
      return (
        <>
          {head(46, 24)}
          <path d="M50 30 L66 48 L66 72" />
          <path d="M66 48 L84 34" />
          <circle cx="88" cy="30" r="7" fill="hsl(330 60% 62%)" stroke="none" />
          <path d="M52 62 Q68 50 84 40" stroke="hsl(330 55% 74%)" strokeDasharray="4 5" />
        </>
      );
    case "jump":
      return (
        <>
          {head(60, 20)}
          <path d="M60 28 L60 52" />
          <path d="M60 52 L44 74" />
          <path d="M60 52 L76 74" />
          <path d="M60 34 L40 26" />
          <path d="M60 34 L80 26" />
        </>
      );
    case "overhead":
      return (
        <>
          {head(60, 34)}
          <path d="M60 42 L60 62 L50 76" />
          <path d="M60 62 L70 76" />
          <path d="M60 46 L46 26" />
          <path d="M60 46 L74 26" />
        </>
      );
    case "twist":
      return (
        <>
          {head(56, 20)}
          <path d="M56 28 L56 54 L46 74" />
          <path d="M56 54 L68 74" />
          <path d="M40 38 Q56 30 74 40" stroke="hsl(330 60% 58%)" />
        </>
      );
    case "childpose":
      return (
        <>
          {head(88, 56)}
          <path d="M28 62 L82 56" />
          <path d="M78 56 L84 70 L62 70" />
          <path d="M28 62 L40 66" />
        </>
      );
    case "hamstring":
      return (
        <>
          {head(38, 32)}
          <path d="M44 38 L58 56" />
          <path d="M58 56 L92 62" />
          <path d="M58 56 L50 74" />
          <path d="M44 40 L84 58" />
        </>
      );
    case "neck":
      return (
        <>
          {head(52, 24)}
          <path d="M56 32 L58 56" />
          <path d="M40 40 L76 40" />
          <path d="M44 30 Q52 18 62 22" stroke="hsl(330 60% 58%)" />
        </>
      );
    case "march":

    default:
      return (
        <>
          {head(56, 20)}
          <path d="M56 28 L56 52" />
          <path d="M56 52 L44 74" />
          <path d="M56 52 L70 60 L70 74" />
          <path d="M56 36 L42 44" />
          <path d="M56 36 L70 30" />
        </>
      );
  }
}
