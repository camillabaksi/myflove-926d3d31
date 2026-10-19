import { Link } from "@tanstack/react-router";
import { BookOpen, Scale } from "lucide-react";
import "./notebook.css";
export const bookSections = [
  {
    path: "/tankar/dagbok",
    kind: "diary",
    label: "Dagbok",
    caption: "En plats för det som är ditt",
    icon: BookOpen,
  },
  {
    path: "/tankar/beslut",
    kind: "decision",
    label: "För & emot",
    caption: "Sortera tankar inför ett beslut",
    icon: Scale,
  },
] as const;
export function BookEntrances() {
  return (
    <section className="notebook" aria-labelledby="book-entrances-title">
      <div className="book-header">
        <div>
          <h2 id="book-entrances-title">Mina tankar</h2>
          <p className="book-muted">Skriv av dig eller sortera ett beslut. Du behöver inte bli klar idag.</p>
        </div>
      </div>
      <div className="book-entrances">
        {bookSections.map((s) => (
          <Link key={s.kind} to={s.path} className="book-entrance">
            <s.icon size={26} aria-hidden />
            <div>
              <strong>{s.label}</strong>
              <span>{s.caption}</span>
            </div>
          </Link>
        ))}
      </div>
      <Link to="/anteckningar" className="book-source">
        Anteckningar & idébank →
      </Link>
    </section>
  );
}
export function BookNavigation({ kind }: { kind: string }) {
  return (
    <nav aria-label="Reflektionsboken" className="book-tabs">
      <Link to="/quickflow" className="book-tab-home">Tankar & Fånga</Link>
      {bookSections.map((s) => (
        <Link key={s.kind} to={s.path} aria-current={kind === s.kind ? "page" : undefined}>
          <s.icon size={18} aria-hidden />
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
