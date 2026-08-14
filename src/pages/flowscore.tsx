import Layout from "@/components/layout";
import { Link } from "wouter";
import { Gauge, Zap, Briefcase, GraduationCap } from "lucide-react";
import { FlowScoreCard } from "@/components/flow-score-card";
import { useFlowScore } from "@/hooks/use-flowscore";
import CollapsibleSection from "@/components/collapsible-section";

export default function FlowScorePage() {
  const { flow, energy, mood, minutesLeft } = useFlowScore();

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
            <Gauge className="h-7 w-7 text-primary" /> FlowScore™
          </h1>
          <p className="mt-1 text-muted-foreground">
            Vad är rimligt för dig just nu? Ingen prestation – bara en realistisk bild av dagen.
          </p>
        </header>

        <FlowScoreCard flow={flow} minutesLeft={minutesLeft} />

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Energi</p>
            <p className="mt-1 font-display text-xl text-ink">{energy ? `${energy}/5` : "–"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mående</p>
            <p className="mt-1 font-display text-xl text-ink">{mood ? `${mood}/5` : "–"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tid kvar</p>
            <p className="mt-1 font-display text-xl text-ink">{minutesLeft} min</p>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <CollapsibleSection
            title={<span className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Använd din FlowScore</span>}
            id="Använd din FlowScore"
            headingClassName="font-display text-lg"
            description="Planerna i jobb och studier anpassas automatiskt efter den här nivån."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/workflow"
                className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink transition hover:bg-muted"
              >
                <Briefcase className="h-4 w-4 text-primary" /> WorkFlow
              </Link>
              <Link
                href="/studyflow"
                className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink transition hover:bg-muted"
              >
                <GraduationCap className="h-4 w-4 text-primary" /> StudyFlow
              </Link>
            </div>
          </CollapsibleSection>
        </section>
      </div>
    </Layout>
  );
}
