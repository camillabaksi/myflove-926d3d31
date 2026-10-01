import { Fragment } from "react";

const URL_RE = /(https?:\/\/[^\s<>"')]+)/g;

function linkLabel(url: string): string {
  if (/zoom\.us/i.test(url)) return "🔗 Anslut till Zoom-mötet";
  if (/teams\.(microsoft|live)\.com/i.test(url)) return "🔗 Anslut till Teams-mötet";
  if (/meet\.google\.com/i.test(url)) return "🔗 Anslut till Google Meet";
  return url;
}

/** Visar fri text där webblänkar blir klickbara (möteslänkar får en tydlig etikett). */
export function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="break-all font-medium text-primary underline underline-offset-2"
          >
            {linkLabel(part)}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
