import Layout from "@/components/layout";
import { Link } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Lock, Download, ArrowLeft, FileText, Film, BookOpen, Sparkles } from "lucide-react";

const BLUEPRINT_VERSIONS = [
  { version: "4.1", label: "Senaste – enkel start, adaptiv personalisering och energihistorik" },
  { version: "3.7", label: "En enda lugn väg genom vardagen" },
  { version: "3.6", label: "Lugnare helhet, tydligare vägar och levande Flow" },
  { version: "3.5", label: "Levande Flow och Flow-chatten" },
  { version: "3.4", label: "Flow syns i blueprint och pitchdeck" },
  { version: "3.3", label: "Flow i hela appen och Morgonstart i rutiner" },
  { version: "3.2", label: "Omstrukturerad i sex delar" },
  { version: "3.0", label: "Navigation, Min dag och energibatteri" },
  { version: "2.9", label: "Relationer, situation och FlowPlan" },
  { version: "2.8", label: "Quickflow, Energiflöde och designsystem" },
] as const;

export default function PitchPage() {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <Layout>
        <p className="text-muted-foreground">Laddar…</p>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <Lock size={40} className="mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-serif font-bold">Endast för grundaren</h1>
          <p className="text-muted-foreground">Denna sida kräver admin-behörighet.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Tillbaka till admin
        </Link>

        <header className="space-y-1">
          <h1 className="text-3xl font-serif font-bold">Pitchmaterial</h1>
          <p className="text-muted-foreground">Spela upp pitchvideon och ladda ner pitchdecken.</p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <Film size={18} className="text-primary" /> Pitchvideo
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              Version 4.1 · Bär mindre. Gör inte mer.
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Version 4.1 visar den nya kärnan: en enkel och lugn startsida med Quickflow, Batteriet
            och Kalendern – samma neutrala grund för alla. Batteriet är en enkel ork-check-in med
            fyra nivåer, måendet är separat, aktiviteter är datumkorrekta och energihistoriken
            visar vad som ger och tar energi. Personaliseringen växer fram datadrivet och gradvis.
          </p>

          <video
            controls
            playsInline
            preload="metadata"
            poster="/pitch/myflove-pitch-4.1-poster.jpg"
            className="w-full rounded-xl bg-black aspect-video"
            src="/pitch/myflove-pitch-4.1.mp4"
          />
          <figure className="space-y-1">
            <img
              src="/pitch/myflove-pitch-4.1-battery-thumb.jpg"
              alt="Batteriscenen i pitchvideon version 4.1 med fyra ork-nivåer"
              loading="lazy"
              className="w-full rounded-xl border border-border"
            />
            <figcaption className="text-xs text-muted-foreground">
              Batteriet i videon – &quot;Hur mycket ork har du idag?&quot; med fyra enkla nivåer
            </figcaption>
          </figure>
          <figure className="space-y-1">
            <img
              src="/pitch/myflove-pitch-4.1-energy-thumb.jpg"
              alt="Energihistorikscenen i pitchvideon version 4.1 med fyra frivilliga energisvar"
              loading="lazy"
              className="w-full rounded-xl border border-border"
            />
            <figcaption className="text-xs text-muted-foreground">
              Energipåverkan efter genomförd aktivitet – frivilligt svar med ett klick
            </figcaption>
          </figure>
          <div className="flex flex-wrap gap-2">
            <a
              href="/pitch/myflove-pitch-3.7.mp4"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download size={16} /> Ladda ner videon (MP4)
            </a>
            <Link
              to="/flow"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Sparkles size={16} /> Visa Flow live
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <FileText size={18} className="text-primary" /> Pitchdeck
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              Version 4.0 · Investor upgrade
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Pitchdecket (4.0) behåller MyFloves lugna kärna och kompletterar produktberättelsen med
            founder, validering, affärsmodell, differentiering, go-to-market, kapital och roadmap.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <figure className="space-y-1">
              <img
                src="/pitch/MyFlove_Pitchdeck_4.0-thumb.jpg"
                alt="Titelsidan i MyFlove Pitchdeck 4.0 med Flow-karaktären"
                loading="lazy"
                className="w-full rounded-xl border border-border"
              />
              <figcaption className="text-xs text-muted-foreground">Titelsidan med Flow</figcaption>
            </figure>
            <figure className="space-y-1">
              <img
                src="/pitch/MyFlove_Pitchdeck_4.0-thumb.jpg"
                alt="Förhandsbild av MyFlove Pitchdeck 4.0"
                loading="lazy"
                className="w-full rounded-xl border border-border"
              />
              <figcaption className="text-xs text-muted-foreground">
                Investor upgrade: byggt, validering och nästa steg
              </figcaption>
            </figure>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/pitch/MyFlove_Pitchdeck_4.0.pptx"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download size={16} /> Ladda ner PowerPoint (4.0)
            </a>
            <a
              href="/pitch/MyFlove_Pitchdeck_4.0.pdf"
              download
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Download size={16} /> Ladda ner PDF (4.0)
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <BookOpen size={18} className="text-primary" /> Living Blueprint
          </h2>
          <p className="text-sm text-muted-foreground">
            Ladda ner blueprinten som Word (DOCX) eller PDF – en knapp per version.
          </p>
          <ul className="space-y-2">
            {BLUEPRINT_VERSIONS.map((v) => (
              <li
                key={v.version}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
              >
                <div>
                  <p className="font-medium">Version {v.version}</p>
                  <p className="text-xs text-muted-foreground">{v.label}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/blueprint/MyFlove_Living_Blueprint_${v.version}.docx`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Download size={14} /> DOCX
                  </a>
                  <a
                    href={`/blueprint/MyFlove_Living_Blueprint_${v.version}.pdf`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    <Download size={14} /> PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
}
