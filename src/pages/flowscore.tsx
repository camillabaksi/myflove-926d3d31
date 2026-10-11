import Layout from "@/components/layout";
import { Link } from "wouter";
import { Gauge, Zap, Briefcase, GraduationCap } from "lucide-react";
import { FlowScoreCard } from "@/components/flow-score-card";
import {
  MyFloveBlock,
  MyFloveStat,
  MyFlovePageGrid,
  MyFloveWide,
} from "@/components/myflove/block";
import { useFlowScore } from "@/hooks/use-flowscore";
import { MyFloveEnergyDots } from "@/components/myflove/motion";

export default function FlowScorePage() {
  const { flow, energy, mood, minutesLeft } = useFlowScore();

  return (
    <Layout>
      <MyFlovePageGrid>
        <MyFloveWide>
          <header>
            <h1 className="pace-app-title font-display text-2xl font-bold text-ink sm:text-3xl flex items-center gap-2">
              <Gauge className="h-7 w-7 text-primary" /> Dagens balans
            </h1>
            <p className="mt-1 text-muted-foreground">
              Dagens balans visar hur väl dagens krav matchar din energi och kapacitet just nu. Det
              är ingen prestation och inget betyg – bara en realistisk bild av vad som är rimligt.
            </p>
          </header>
        </MyFloveWide>

        <MyFloveWide span="wide">
          <MyFloveBlock
            title="Dagens balans"
            subtitle="En ögonblicksbild av vad som är rimligt idag"
            icon={Gauge}
            tone="lavender"
            surface="lavender"
          >
            <FlowScoreCard flow={flow} minutesLeft={minutesLeft} />
          </MyFloveBlock>
        </MyFloveWide>

        <Link href="/mitt-batteri" className="min-w-0">
          <MyFloveStat
            label="Energi"
            value={
              energy ? (
                <span className="flex items-center gap-2">
                  {energy}/5 <MyFloveEnergyDots value={energy} />
                </span>
              ) : (
                "–"
              )
            }
            hint="Öppna Mitt batteri för att logga"
            tone="sun"
          />
        </Link>
        <Link href="/mitt-batteri" className="min-w-0">
          <MyFloveStat
            label="Mående"
            value={mood ? `${mood}/5` : "–"}
            hint="Senaste registrerade värde"
            tone="blush"
          />
        </Link>
        <MyFloveStat
          label="Kvar av dagen"
          value={`${Math.floor(minutesLeft / 60)} h ${minutesLeft % 60} min`}
          hint="Tiden som återstår"
          tone="sky"
        />

        <MyFloveBlock
          title={
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Använd dagens balans
            </span>
          }
          subtitle="Planerna i jobb och studier anpassas efter nivån"
          icon={Zap}
          tone="lavender"
          collapsible
          collapseId="flowscore::anvand-balans"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/jobb"
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
        </MyFloveBlock>
      </MyFlovePageGrid>
    </Layout>
  );
}
