import { useState } from "react";
import { Link } from "wouter";
import { CalendarDays, Clock, ExternalLink, Leaf, ListFilter, UserRound } from "lucide-react";
import { PaceableStones } from "@/components/paceable/paceable-stones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLang } from "@/hooks/use-language";
import type { DayPace } from "@/lib/day-pace";
import { isFamilyEntry } from "@/lib/visual-calendar";

const LABEL = { gentle: "Varsamt", steady: "Jämnt", open: "Utrymme" } as const;

function paceMessage(pace: DayPace): string {
  if (pace.reason === "unknown-capacity") return pace.load.segments >= 3 ? "Idag ser ganska full ut. Checka in för att se hur dagen passar din kapacitet." : "Checka in för att se hur dagen passar din kapacitet.";
  if (pace.reason === "unknown-load") return "Belastningen är inte uppskattad ännu.";
  if (pace.reason === "demanding") return "Det är ganska mycket som kräver din uppmärksamhet idag.";
  if (pace.reason === "limited-capacity") return "Ta dagen varsamt. Planen får ändras om du behöver.";
  if (pace.reason === "tight") return "Det är tätt mellan flera saker med kända tider.";
  if (pace.reason === "room") return "Det finns lite luft i dagen. Du behöver inte använda den.";
  if (pace.reason === "future") return pace.load.segments >= 3 ? "Dagen ser ganska full ut." : "Det här är vad som är planerat.";
  return pace.load.unknown > 0 ? "Dagen ser ganska jämn ut, men allt är inte uppskattat." : "Idag ser ganska jämn ut. Ta dagen som den kommer.";
}

function flowMessage(pace: DayPace): string {
  if (pace.level === "open") return "Du behöver inte använda allt utrymme.";
  if (pace.level === "gentle") return "En sak i taget räcker.";
  if (pace.reason === "unknown-capacity" || pace.reason === "unknown-load") return "Vi börjar där du är idag.";
  return "Planen får ändras.";
}

export function TodayPace({ pace }: { pace: DayPace }) {
  const { t } = useLang();
  const [lighterOpen, setLighterOpen] = useState(false);
  const canReview = pace.level === "gentle" && pace.adjustable.length > 0;
  const fixed = pace.planningEntries.filter(entry => entry.time);
  const presence = pace.planningEntries.filter(entry => isFamilyEntry(entry) && entry.requiresParent);
  return <>
    <section className="space-y-4 rounded-3xl bg-sage/35 p-5" aria-labelledby="today-pace-title" data-testid="today-pace">
      <div>
        <p id="today-pace-title" className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><Leaf size={14} className="text-primary" aria-hidden />{t("Dagens Pace")}</p>
        {pace.level && <h2 className="mt-1 font-display text-2xl font-bold text-ink">{t(LABEL[pace.level])}</h2>}
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t(paceMessage(pace))}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("Planerad belastning")}: {t(pace.load.label)}{pace.load.unknown > 0 ? ` · ${pace.load.unknown} ${t("utan energiuppskattning")}` : ""}</p>
      </div>
      {canReview && <Button variant="outline" className="min-h-11 rounded-2xl bg-card/70" onClick={() => setLighterOpen(true)}><ListFilter size={16} />{t("Gör dagen lättare")}</Button>}
      {pace.level === "gentle" && !canReview && <p className="text-xs text-muted-foreground">{t("Det här kan vara en krävande dag även om inget går att flytta.")}</p>}
      <p className="text-sm text-ink" data-testid="today-flow-support">{t(flowMessage(pace))}</p>
    </section>
    <Dialog open={lighterOpen} onOpenChange={setLighterOpen}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl">
        <DialogHeader><DialogTitle>{t("Gör dagen lättare")}</DialogTitle><DialogDescription>{t("Inget ändras förrän du själv väljer. Här är det som faktiskt finns i planen.")}</DialogDescription></DialogHeader>
        <div className="space-y-4">
          {fixed.length > 0 && <section><h3 className="flex items-center gap-2 text-sm font-semibold"><Clock size={16} />{t("Tider i planen")}</h3><ul className="mt-2 space-y-2">{fixed.map(entry => <li key={entry.id} className="rounded-2xl bg-secondary/40 p-3 text-sm"><span className="font-semibold tabular-nums">{entry.time}</span> · {entry.title}{entry.endTime ? ` – ${entry.endTime}` : ` · ${t("sluttid saknas")}`}</li>)}</ul></section>}
          {presence.length > 0 && <section><h3 className="flex items-center gap-2 text-sm font-semibold"><UserRound size={16} />{t("Behöver mig")}</h3><ul className="mt-2 space-y-2">{presence.map(entry => <li key={entry.id} className="rounded-2xl bg-secondary/40 p-3 text-sm">{entry.time ? `${entry.time} · ` : ""}{entry.title}</li>)}</ul></section>}
          <section><h3 className="flex items-center gap-2 text-sm font-semibold"><Leaf size={16} />{t("Kan granskas")}</h3><ul className="mt-2 space-y-2">{pace.adjustable.map(entry => <li key={entry.id} className="rounded-2xl bg-secondary/40 p-3 text-sm">{entry.title}<span className="mt-1 block text-xs text-muted-foreground">{entry.time ? t("Har en planerad tid") : t("Ingen tid ännu")}</span></li>)}</ul></section>
          {(pace.time.tightTransitions > 0 || pace.time.overlaps > 0) && <p className="rounded-2xl bg-lavender/50 p-3 text-sm">{t("Flera kända tider ligger tätt eller överlappar. Okända längder räknas inte in.")}</p>}
          <Button asChild className="min-h-11 w-full rounded-2xl"><Link href="/kalender"><CalendarDays size={16} />{t("Öppna kalendern och välj själv")}<ExternalLink size={14} /></Link></Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}