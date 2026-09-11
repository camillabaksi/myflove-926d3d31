import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Link } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { supabase } from "@/integrations/supabase/client";
import { isDemoUser } from "@/lib/demo-account";
import { Lock, Download, ArrowLeft, FileText, Film, BookOpen, Sparkles } from "lucide-react";

/** Investerarkontot (demokontot) har egen inloggning och får se pitchmaterialet. */
function useIsInvestor() {
  const [isInvestor, setIsInvestor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setIsInvestor(isDemoUser(data.user));
      setLoading(false);
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void check());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isInvestor, loading };
}

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
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isInvestor, loading: investorLoading } = useIsInvestor();
  const loading = adminLoading || investorLoading;
  const hasAccess = isAdmin || isInvestor;

  if (loading) {
    return (
      <Layout>
        <p className="text-muted-foreground">Laddar…</p>
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <Lock size={40} className="mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-serif font-bold">Endast för grundare och investerare</h1>
          <p className="text-muted-foreground">
            Logga in med grundar- eller investerarkontot för att se pitchmaterialet.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to={isAdmin ? "/admin" : "/hem"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> {isAdmin ? "Tillbaka till admin" : "Tillbaka till hem"}
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
              Version 4.2 · Din dag, i din takt
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Version 4.2 visar appen som den ser ut nu: en guidad dagsresa i tre steg – Hur mår du?,
            Vad händer? och Behöver du planera om? – på en lugn startsida med vita kort och ett
            andningsljus som pulserar 4 sekunder in, 5 ut och 1 sekunds vila. Batteriet mäts mot
            faktiskt genomförda aktiviteter och faktisk tid, kvällschecken jämför förväntad och
            faktisk energi, och alla block kan fällas ihop eller döljas i enkelt läge.
          </p>

          <video
            controls
            playsInline
            preload="metadata"
            poster="/pitch/myflove-pitch-4.2-poster.jpg"
            className="w-full rounded-xl bg-black aspect-video"
            src="/pitch/myflove-pitch-4.2.mp4"
          />
          <figure className="space-y-1">
            <img
              src="/pitch/myflove-pitch-4.2-journey-thumb.jpg"
              alt="Scenen om dagsresan i pitchvideon version 4.2 med tre steg"
              loading="lazy"
              className="w-full rounded-xl border border-border"
            />
            <figcaption className="text-xs text-muted-foreground">
              Dagsresan i videon – Hur mår du?, Vad händer? och Behöver du planera om?
            </figcaption>
          </figure>
          <figure className="space-y-1">
            <img
              src="/pitch/myflove-pitch-4.2-load-thumb.jpg"
              alt="Belastningskartan i pitchvideon version 4.2 med dagar, veckor och månader"
              loading="lazy"
              className="w-full rounded-xl border border-border"
            />
            <figcaption className="text-xs text-muted-foreground">
              Belastningskartan – batteriet jämfört med faktisk tid per dag, vecka och månad
            </figcaption>
          </figure>
          <div className="flex flex-wrap gap-2">
            <a
              href="/pitch/myflove-pitch-4.2.mp4"
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
              <FileText size={18} className="text-primary" /> 3-minuters investerarpitch (engelska)
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              Connect Öst · 10 sep 2026
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tolv slides på engelska, byggda för exakt tre minuter: problem, insikt, lösning,
            produkt, differentiering, marknad, traction, affärsmodell, team, kapital och avslut.
            Talarmanus finns som anteckningar i PowerPoint-filen.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="/pitch/MyFlove_Investor_Pitch_3min_EN.pptx"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download size={16} /> Ladda ner PowerPoint
            </a>
            <a
              href="/pitch/MyFlove_Investor_Pitch_3min_EN.pdf"
              download
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Download size={16} /> Ladda ner PDF
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <FileText size={18} className="text-primary" /> Pitchdeck
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              Version 4.2 · Guidad dagsresa & lugnt gränssnitt
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Pitchdecket (4.2) beskriver appen som den är utformad nu: den guidade dagsresan i tre
            steg, det lugna gränssnittet med andningsljus, enkelt läge och hopfällbara block,
            batteriet mätt mot faktisk belastning och tid, belastningskartan i Insikter och
            kvällschecken – tillsammans med validering, affärsmodell, differentiering,
            go-to-market, kapital och roadmap.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <figure className="space-y-1">
              <img
                src="/pitch/MyFlove_Pitchdeck_4.2-thumb.jpg"
                alt="Titelsidan i MyFlove Pitchdeck 4.2 med Flow-karaktären"
                loading="lazy"
                className="w-full rounded-xl border border-border"
              />
              <figcaption className="text-xs text-muted-foreground">Titelsidan med Flow</figcaption>
            </figure>
            <figure className="space-y-1">
              <img
                src="/pitch/MyFlove_Pitchdeck_4.2-journey-thumb.jpg"
                alt="Sliden om den guidade dagsresan i MyFlove Pitchdeck 4.2"
                loading="lazy"
                className="w-full rounded-xl border border-border"
              />
              <figcaption className="text-xs text-muted-foreground">
                Din dag, i din takt – tre steg på startsidan
              </figcaption>
            </figure>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/pitch/MyFlove_Pitchdeck_4.2.pptx"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download size={16} /> Ladda ner PowerPoint (4.2)
            </a>
            <a
              href="/pitch/MyFlove_Pitchdeck_4.2.pdf"
              download
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Download size={16} /> Ladda ner PDF (4.2)
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
