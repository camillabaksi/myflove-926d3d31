import Layout from "@/components/layout";
import { Link } from "wouter";
import { Gauge, Zap, Briefcase, GraduationCap } from "lucide-react";
import { FlowScoreCard } from "@/components/flow-score-card";
import { useFlowScore } from "@/hooks/use-flowscore";
import { MyFloveEnergyDots } from "@/components/myflove/motion";
import CollapsibleSection from "@/components/collapsible-section";

export default function FlowScorePage() {
  const { flow, energy, mood, minutesLeft } = useFlowScore();

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
            <Gauge className="h-7 w-7 text-primary" /> Dagens balans
          </h1>
          <p className="mt-1 text-muted-foreground">
            Vad är rimligt för dig just nu? Ingen prestation – bara en realistisk bild av dagen.
          </p>
        </header>

        <FlowScoreCard flow={flow} minutesLeft={minutesLeft} />

        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/ma-bra"
            className="rounded-2xl border border-border bg-card p-4 text-center transition hover:bg-muted"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Energi</p>
            <p className="mt-1 font-display text-xl text-ink">
              {energy ? (
                <span className="flex items-center gap-2">
                  {energy}/5 <MyFloveEnergyDots value={energy} />
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Inte loggat än</span>
              )}
            </p>
          </Link>
          <Link
            href="/ma-bra"
            className="rounded-2xl border border-border bg-card p-4 text-center transition hover:bg-muted"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mående</p>
            <p className="mt-1 font-display text-xl text-ink">
              {mood ? (
                `${mood}/5`
              ) : (
                <span className="text-sm text-muted-foreground">Inte loggat än</span>
              )}
            </p>
          </Link>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Kvar av dagen</p>
            <p className="mt-1 font-display text-xl text-ink">
              {Math.floor(minutesLeft / 60)} h {minutesLeft % 60} min
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <CollapsibleSection
            title={
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Använd dagens balans
              </span>
            }
            id="Använd dagens balans"
            help="Din nivå styr hur mycket jobb och studier föreslår. Ändras när du loggar hur du mår."
            headingClassName="font-display text-lg"
            description="Planerna i jobb och studier anpassas automatiskt efter den här nivån."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/workflow"
                className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink transition hover:bg-muted"
              >
                <Briefcase className="h-4 w-4 text-primary" /> Jobb
              </Link>
              <Link
                href="/studyflow"
                className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink transition hover:bg-muted"
              >
                <GraduationCap className="h-4 w-4 text-primary" /> Studier
              </Link>
            </div>
          </CollapsibleSection>
        </section>
      </div>
    </Layout>
  );
}
