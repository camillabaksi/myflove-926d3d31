import { useEffect, useState } from "react";
import { FlowMascot } from "@/components/flow-mascot";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { ExpandableBlock } from "@/components/myflove/expandable-block";

import { useHomeLayout, type HomeBlockId } from "@/lib/home-layout";
import RoutinesMedicationToday from "@/components/routines-medication-today";

import { Link } from "wouter";
import Layout from "@/components/layout";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useUserProfile } from "@/hooks/use-user-profile";
import { getGreeting } from "@/lib/greeting";
import { useTasks } from "@/hooks/use-data";

import { AreaOnboarding } from "@/components/area-onboarding";
import PwaInstallCard from "@/components/pwa-install-card";
import { AreaSwitcher } from "@/components/area-switcher";
import { AREA_META, useActiveArea } from "@/lib/life-areas";
import IntroTour from "@/components/intro-tour";
import FlowOnboarding from "@/components/flow-onboarding";
import {
  SlidersHorizontal,
  Compass,
  CalendarDays,
  Brain,
  BatteryMedium,
  HeartPulse,
  Pill,
  type LucideIcon,
} from "lucide-react";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { homeContextLine } from "@/lib/flow-tone";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useFlowSettings } from "@/hooks/use-flow-settings";
import type { AreaId } from "@/lib/areas";
import type { MyFloveTone } from "@/components/myflove";

/**
 * Hem = "Vad vill jag göra just nu?"
 *
 * Fyra primära widgets – inget annat konkurrerar visuellt med dem. Varje
 * widget är en ren genväg in i en befintlig funktion (ingen ny datamodell):
 * Kalender, QuickFlow (hjärnans inkorg), Mitt batteri och Logga energi &
 * mående. Sekundärt innehåll (rutiner/medicin, områdesväljare) ligger under.
 */
interface HomeWidget {
  id: string;
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  area: AreaId;
  tone: MyFloveTone;
  surface: MyFloveTone;
}

const HOME_WIDGETS: HomeWidget[] = [
  {
    id: "kalender",
    href: "/kalender",
    icon: CalendarDays,
    title: "Kalender",
    subtitle: "Se och lägg till",
    area: "kalender",
    tone: "sky",
    surface: "sky",
  },
  {
    id: "quickflow",
    href: "/quickflow",
    icon: Brain,
    title: "QuickFlow",
    subtitle: "Få ur dig det som snurrar",
    area: "flow",
    tone: "lavender",
    surface: "lavender",
  },
  {
    id: "batteri",
    href: "/mitt-batteri",
    icon: BatteryMedium,
    title: "Mitt batteri",
    subtitle: "Din energi just nu",
    area: "aterhamtning",
    tone: "sun",
    surface: "sun",
  },
  {
    id: "logga",
    href: "/mitt-batteri",
    icon: HeartPulse,
    title: "Logga energi & mående",
    subtitle: "Hur är det just nu?",
    area: "halsa",
    tone: "mint",
    surface: "mint",
  },
];

export default function Home() {
  const { name, setName, lastVisit } = useUserProfile();
  const greeting = getGreeting({ name, lastVisit });
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const { activeArea } = useActiveArea();
  const { reading } = useEnergyBattery();
  const { energyValue } = useQuickCheckin();
  const { tasks, activeTasks } = useTasks();
  const { settings: flowSettings } = useFlowSettings();
  const todayIso = todayISO();

  /* Hem säger olika saker beroende på dagen – samma kort, levande innehåll. */
  const completedToday = tasks.filter(
    (t) =>
      t.completed &&
      t.completedAt != null &&
      new Date(t.completedAt).toISOString().slice(0, 10) === todayIso,
  ).length;
  const remainingToday = activeTasks.filter((t) => !t.dueDate || t.dueDate === todayIso).length;
  const contextLine = homeContextLine({
    hour: new Date().getHours(),
    battery: Math.round(reading.now),
    completedToday,
    remainingToday,
    nextTitle: null,
    checkedIn: energyValue != null,
  });

  useEffect(() => {
    track("home_viewed");
  }, []);

  const { visible } = useHomeLayout();
  const shows = (id: HomeBlockId) => visible.includes(id);
  const pos = (id: HomeBlockId) => ({ order: visible.indexOf(id) + 10 });

  const hour = new Date().getHours();
  const heroGradient =
    hour < 10
      ? "linear-gradient(135deg, hsl(var(--sky) / 0.75) 0%, hsl(var(--cream)) 55%, hsl(var(--lavender) / 0.85) 100%)"
      : hour < 17
        ? "linear-gradient(135deg, hsl(var(--lavender) / 0.9) 0%, hsl(var(--cream)) 58%, hsl(var(--mint) / 0.7) 100%)"
        : hour < 22
          ? "linear-gradient(135deg, hsl(var(--blush) / 0.8) 0%, hsl(var(--cream)) 55%, hsl(var(--lavender) / 0.85) 100%)"
          : "linear-gradient(135deg, hsl(var(--lavender) / 0.7) 0%, hsl(var(--card)) 70%)";

  return (
    <Layout>
      <IntroTour />
      <FlowOnboarding />

      <MyFlovePageGrid className="gap-5 xl:grid-cols-6">
        {/* Hero: välkommen, namn, kort undertext */}
        <MyFloveWide
          className="relative overflow-hidden rounded-3xl border border-border/60 p-6 shadow-lifted pop-in sm:pr-36"
          style={{ background: heroGradient }}
        >
          <div className="pointer-events-none absolute -top-20 -right-16 h-40 w-40 rounded-full bg-blush opacity-60 blur-md" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-mint opacity-50 blur-[2px]" />
          <div
            className="pointer-events-none absolute right-4 top-1 select-none sm:right-8"
            aria-hidden
          >
            <FlowMascot
              size="md"
              imgClassName="sm:h-36 sm:w-36"
              mood="calm"
              className="flow-alive"
              alt=""
            />
          </div>

          <div className="relative space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-ink pr-14">{greeting.title}</h1>
            <p className="text-muted-foreground animate-fade-in">{contextLine}</p>
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setName(nameDraft);
                  setEditingName(false);
                }}
                className="flex flex-wrap items-center gap-2 pt-1"
              >
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Vad ska jag kalla dig?"
                  className="rounded-full bg-background/80 border border-border px-3 py-1 text-sm min-w-0"
                  maxLength={32}
                />
                <button type="submit" className="text-xs font-medium text-primary hover:underline">
                  Spara
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(name);
                    setEditingName(false);
                  }}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Avbryt
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(name);
                  setEditingName(true);
                }}
                className="text-xs text-muted-foreground/80 hover:text-foreground underline underline-offset-2"
              >
                {name ? "Byt namn" : "Vad ska jag kalla dig?"}
              </button>
            )}
          </div>
        </MyFloveWide>

        {/* De fyra primära widgetarna – balanserad 2x2, hela kortet klickbart. */}
        <MyFloveWide style={{ order: 1 }} className="min-w-0">
          <div
            className="grid grid-cols-2 gap-3 sm:gap-4"
            data-testid="home-widgets"
            aria-label="Vad vill du göra just nu?"
          >
            {HOME_WIDGETS.map((w) => (
              <ExpandableBlock
                key={w.id}
                title={w.title}
                titleText={w.title}
                subtitle={w.subtitle}
                status={w.id === "batteri" ? `${Math.round(reading.now)}%` : undefined}
                icon={w.icon}
                tone={w.tone}
                surface={w.surface}
                area={w.area}
                href={w.href}
                onNavigate={() => track("home_widget_opened", { source: w.id })}
                data-testid={`home-widget-${w.id}`}
              />
            ))}
          </div>
        </MyFloveWide>

        {/* Flow – en liten notering, konkurrerar inte med widgetarna. */}
        {flowSettings.enabled && flowSettings.learning && (
          <div style={{ order: 2 }} data-testid="home-flow-note" className="min-w-0 xl:col-span-6">
            <ExpandableBlock
              title="Flow lär känna dig"
              titleText="Flow lär känna dig"
              area="flow"
              visual={<FlowMascot size="xs" mood="calm" bump className="flow-alive" alt="" />}
              subtitle="Små mönster Flow lagt märke till"
              status="Insikter"
              tone="lavender"
              surface="lavender"
              href="/insight"
              onNavigate={() => track("flow_learning_opened", { source: "hem" })}
            />
          </div>
        )}

        {/* Dagens medicin – samma data och samma avbockning som i Rutiner & medicin */}
        {shows("medicin") && (
          <section
            className="min-w-0 xl:col-span-3"
            style={pos("medicin")}
            aria-label="Rutiner och medicin"
          >
            <ExpandableBlock
              title="Rutiner & medicin"
              titleText="Rutiner och medicin"
              area="halsa"
              icon={Pill}
              subtitle="Dagens rutiner och doser"
              status="Idag"
              tone="blush"
              surface="blush"
            >
              <RoutinesMedicationToday />
            </ExpandableBlock>
          </section>
        )}

        {/* Områdesväljare – litet, längst ner */}
        {shows("omrade") && (
          <MyFloveWide style={pos("omrade")} className="space-y-2 pt-2">
            <AreaSwitcher size="sm" />
            <p className="text-xs text-muted-foreground">
              {activeArea === "alla"
                ? "MyFlove ser hela din dag – oavsett vilket rum sakerna hör till."
                : `Du är i ${AREA_META[activeArea].label.toLowerCase()}rummet. Resten väntar tills du vill se det.`}
            </p>
          </MyFloveWide>
        )}

        <MyFloveWide style={{ order: 98 }} className="space-y-3 pt-2">
          <AreaOnboarding />
        </MyFloveWide>

        {/* Liten, diskret notering längst ner – konkurrerar inte med widgetarna. */}
        <MyFloveWide style={{ order: 98.5 }} data-testid="home-install-note" className="pt-1">
          <PwaInstallCard compact />
        </MyFloveWide>

        <MyFloveWide
          style={{ order: 99 }}
          className="flex flex-wrap items-center justify-center gap-4 pb-2 text-center"
        >
          <Link
            href="/oversikt"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            <Compass size={13} /> Så funkar MyFlove
          </Link>
          <Link
            href="/anpassa-hem"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            <SlidersHorizontal size={13} /> Anpassa hemskärmen
          </Link>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
