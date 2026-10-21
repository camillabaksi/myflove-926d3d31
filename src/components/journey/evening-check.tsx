import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, Heart, Leaf, Moon, Sparkles, X } from "lucide-react";
import { useLang } from "@/hooks/use-language";
import { useEveningCheck } from "@/hooks/use-evening-check";
import { useDayJourney } from "@/hooks/use-day-journey";
import { useDayWindow } from "@/hooks/use-day-window";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { isSameDay } from "@/lib/energy-flow";
import { EVENING_ANSWERS, eveningReply, type EveningAnswer } from "@/lib/day-journey";
import { buildEveningInsight } from "@/lib/evening-insight";
import { track } from "@/lib/analytics";
import { useCollapsible } from "@/lib/collapse-store";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** Optional evening ritual. Only an explicitly chosen existing evening answer is persisted.
 * All other steps are presentation-only and may be skipped without saving anything.
 */
export default function EveningCheck() {
  const { t } = useLang();
  const { evening, eveningHistory, logEvening } = useEveningCheck();
  const { input } = useDayJourney();
  const { todayEdges, setEvening } = useDayWindow();
  const { entries } = useEnergyFlow();
  const [eveningEnergy, setEveningEnergy] = useState<number | null>(null);
  const todayEnergy = useMemo(() => entries.filter(entry => isSameDay(entry.occurredAt)), [entries]);
  const gives = todayEnergy.filter(entry => entry.direction === "gives" || entry.direction === "both").length;
  const drains = todayEnergy.filter(entry => entry.direction === "drains" || entry.direction === "both").length;
  const { collapsed, toggle } = useCollapsible("home-evening-check");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<EveningAnswer | null>(null);
  const [reflection, setReflection] = useState("");
  const insight = useMemo(() => buildEveningInsight(eveningHistory, evening), [eveningHistory, evening]);
  const screens = 6;

  function start() { setStep(0); setAnswer(evening?.answer ?? null); setEveningEnergy(todayEdges.evening ?? null); setReflection(""); setOpen(true); }
  function next() {
    if (step === 1 && answer && answer !== evening?.answer) {
      logEvening(answer, { ork10: input.ork10, battery: input.batteryNow, planned: input.planned, done: input.done, openThoughts: input.openThoughts });
      track("evening_check_completed", { source: "kvallsstund", method: answer });
    }
    if (step === 2 && eveningEnergy !== null && eveningEnergy !== todayEdges.evening) setEvening(eveningEnergy);
    setStep(current => Math.min(screens - 1, current + 1));
  }

  return <>
    <section aria-label={t("Hur blev dagen?")} data-testid="home-evening-check" className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <button type="button" onClick={toggle} aria-expanded={!collapsed} className="flex w-full items-center gap-2 text-left">
        <h2 className="min-w-0 flex-1 text-base font-semibold text-ink"><span aria-hidden>🌙</span> {t("Hur blev dagen?")}</h2>
        <ChevronDown size={18} className={cn("text-muted-foreground transition-transform", collapsed && "-rotate-90")} />
      </button>
      {!collapsed && <>
        <p className="mt-2 text-sm text-muted-foreground">{evening ? t(eveningReply(evening.answer)) : "En liten stund för dig. Allt är frivilligt."}</p>
        <button type="button" onClick={start} className="mt-3 min-h-11 w-full rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground">{evening ? "Öppna min kvällsstund" : "Ja, börja kvällsstunden"}</button>
        {(insight.todayLine || insight.patternLine) && <div className="mt-3 rounded-2xl bg-muted/50 p-3 text-sm text-muted-foreground">{insight.todayLine && <p>{t(insight.todayLine)}</p>}{insight.patternLine && <p className="mt-1">{t(insight.patternLine)}</p>}</div>}
      </>}
    </section>
    <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) setReflection(""); }}>
      <DialogContent className="pace-evening-ritual !fixed !inset-0 !left-0 !top-0 !h-[100dvh] !w-screen !max-h-none !max-w-none !translate-x-0 !translate-y-0 overflow-y-auto border-0 bg-[#FAF7F4] p-0 text-[#512654] sm:!inset-auto sm:!left-1/2 sm:!top-1/2 sm:!h-[min(92dvh,820px)] sm:!w-full sm:!max-w-md sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:rounded-[2rem] [&>button]:hidden">
        <div className={cn("relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[#F7E9E3] via-[#FAF7F4] to-[#F0E7F2] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:min-h-full sm:rounded-[1.8rem] sm:p-7", step === 0 && "pace-evening-intro", step === 5 && "pace-evening-outro")}>
          <div className="relative z-10 flex items-center justify-between gap-2">
            <button type="button" onClick={() => step ? setStep(step - 1) : setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/60" aria-label={step ? "Föregående" : "Stäng"}>{step ? <ChevronLeft size={20}/> : <X size={19}/>}</button>
            <span className="text-xs text-[#6D566C]">Kvällsstund · {step + 1} av {screens}</span>
            <button type="button" onClick={() => { setReflection(""); setOpen(false); }} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/60" aria-label="Stäng kvällsstunden"><X size={19}/></button>
          </div>
          <div className="relative z-10 mt-3 flex gap-1.5" aria-label={`Steg ${step + 1} av ${screens}`}>{Array.from({ length: screens }, (_, index) => <span key={index} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", index <= step ? "bg-[#A585A8]" : "bg-[#E7DDE3]")}/>)}</div>
          <div key={step} className="relative z-10 flex-1 animate-in fade-in slide-in-from-right-2 duration-300 motion-reduce:animate-none">
            {step === 0 && <div className="space-y-6 pt-12 text-center">
              <Moon className="mx-auto text-[#A786A4]" size={36} strokeWidth={1.3}/>
              <DialogTitle className="font-handwritten text-5xl font-normal leading-tight">En stund för dig</DialogTitle>
              <DialogDescription className="mx-auto max-w-xs text-base leading-relaxed text-[#FFF2EE]">Dagen går mot sitt slut. Vill du ta en liten stund för att landa?</DialogDescription>
              <div className="mx-auto max-w-xs space-y-3 rounded-3xl bg-white/70 p-5 text-left text-sm shadow-sm"><p className="flex gap-3"><Leaf size={18}/> Reflektera över din dag</p><p className="flex gap-3"><Sparkles size={18}/> Se det som också fick plats</p><p className="flex gap-3"><Heart size={18}/> Allt du gjorde räknas, även det osynliga</p></div>
            </div>}
            {step === 1 && <div className="space-y-6 pt-10 text-center">
              <DialogTitle className="font-handwritten text-4xl font-normal">Hur känns det efter idag?</DialogTitle>
              <DialogDescription className="text-sm text-[#6D566C]">Det finns inget rätt eller fel. Du behöver inte välja något.</DialogDescription>
              <div className="grid grid-cols-2 gap-3">{EVENING_ANSWERS.map(option => <button key={option.id} type="button" aria-pressed={answer === option.id} onClick={() => setAnswer(option.id)} className={cn("pace-evening-mood min-h-28 rounded-[40%_52%_45%_49%] border p-4 text-sm transition-all duration-300", answer === option.id ? "border-[#A585A8] shadow-md ring-2 ring-[#A585A8]/25" : "border-transparent", option.id === "lattare" ? "bg-[#DDE9DC]" : option.id === "tyngre" ? "bg-[#E7D8E4]" : "bg-[#F4DED1]")}><span className="mb-2 block text-2xl">{option.emoji}</span>{t(option.label)}</button>)}<button type="button" onClick={() => setAnswer(null)} aria-pressed={answer === null} className="pace-evening-mood col-span-2 mx-auto min-h-24 w-36 rounded-[45%_50%_45%_48%] bg-[#EDE6E0] p-4 text-sm">☁️<span className="mt-2 block">Vet inte / hoppa över</span></button></div>
            </div>}
            {step === 2 && <div className="space-y-6 pt-10 text-center">
              <DialogTitle className="font-handwritten text-4xl font-normal">Hur är din energi nu?</DialogTitle>
              <DialogDescription className="text-sm text-[#6D566C]">{todayEdges.morning != null ? `I morse registrerade du ${todayEdges.morning} av 10. Hur känns det nu?` : "Du behöver inte ha registrerat morgonenergi. Välj bara om du vill."}</DialogDescription>
              <div className="rounded-3xl bg-white/70 p-5">
                <label htmlFor="evening-ritual-energy" className="mb-4 block text-sm font-medium">{eveningEnergy === null ? "Inte valt" : `${eveningEnergy} av 10`}</label>
                <input id="evening-ritual-energy" type="range" min="1" max="10" step="1" value={eveningEnergy ?? 5} onChange={event => setEveningEnergy(Number(event.target.value))} className="w-full accent-[#9873A0]" />
                <div className="mt-2 flex justify-between text-xs text-[#6D566C]"><span>Låg energi</span><span>Hög energi</span></div>
                <button type="button" className="mt-5 min-h-11 text-sm underline underline-offset-4" onClick={() => setEveningEnergy(null)}>Jag vill inte registrera</button>
              </div>
              <div className="rounded-3xl bg-white/60 p-4 text-left text-sm"><p className="mb-2 font-medium">Det du redan registrerat idag</p><p className="text-[#6D566C]">{gives > 0 ? `${gives} aktiviteter som gav energi` : "Inga aktiviteter som gav energi registrerade"}</p><p className="mt-1 text-[#6D566C]">{drains > 0 ? `${drains} aktiviteter som tog energi` : "Inga aktiviteter som tog energi registrerade"}</p></div>
            </div>}
            {step === 3 && <div className="space-y-5 pt-8">
              <DialogTitle className="font-handwritten text-center text-4xl font-normal">Så här såg din dag ut</DialogTitle>
              <div className="rounded-3xl bg-white/75 p-5 shadow-sm"><p className="text-sm font-medium">Din dag i korthet</p><p className="mt-3 text-sm text-[#6D566C]">{input.planned > 0 ? `${input.done} av ${input.planned} planerade aktiviteter markerades klara.` : "Inga planerade aktiviteter att sammanfatta just nu."}</p><p className="mt-3 text-sm text-[#6D566C]">{input.ork10 != null ? `Registrerad ork: ${input.ork10} av 10.` : "Ingen ork registrerad – vi gissar inte hur du mådde."}</p><p className="mt-3 text-sm text-[#6D566C]">{todayEdges.morning != null && todayEdges.evening != null ? `Morgon: ${todayEdges.morning}/10 · Kväll: ${todayEdges.evening}/10` : "Ingen komplett morgon- och kvällsmätning ännu – vi visar ingen påhittad kurva."}</p><p className="mt-3 text-sm text-[#6D566C]">{gives} registrerade energigivare · {drains} energitagare</p>{todayEdges.morning != null && todayEdges.evening != null && <div className="mt-4 rounded-2xl bg-[#F7F0F5] p-3"><p className="mb-2 text-xs text-[#6D566C]">Morgon och kväll · registrerad energi</p><svg viewBox="0 0 280 110" className="w-full" role="img" aria-label={`Morgon ${todayEdges.morning} av 10, kväll ${todayEdges.evening} av 10`}><line x1="25" y1="87" x2="255" y2="87" stroke="#DDCCD9" /><line x1="25" y1="12" x2="25" y2="87" stroke="#DDCCD9" /><path d={`M25 ${87 - todayEdges.morning * 7} L255 ${87 - todayEdges.evening * 7}`} stroke="#9A7BA9" strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="25" cy={87 - todayEdges.morning * 7} r="5" fill="#9A7BA9" /><circle cx="255" cy={87 - todayEdges.evening * 7} r="5" fill="#9A7BA9" /><text x="25" y="105" fontSize="11" textAnchor="start" fill="#6D566C">Morgon</text><text x="255" y="105" fontSize="11" textAnchor="end" fill="#6D566C">Kväll</text></svg><p className="text-xs text-[#6D566C]">Linjen förbinder två registreringar – den visar inte hur energin varierade däremellan.</p></div>}</div>
              <div className="rounded-3xl bg-[#F4E0D6]/70 p-4 text-center font-handwritten text-2xl">Allt som tog energi syns inte i kalendern.</div>
            </div>}
            {step === 4 && <div className="space-y-5 pt-8">
              <DialogTitle className="font-handwritten text-center text-4xl font-normal">Vad vill du ta med dig från idag?</DialogTitle>
              <DialogDescription className="text-center text-sm text-[#6D566C]">En tanke, känsla eller något du är stolt över. Du kan också hoppa över.</DialogDescription>
              <label htmlFor="evening-ritual-reflection" className="sr-only">Frivillig reflektion</label>
              <textarea id="evening-ritual-reflection" value={reflection} onChange={event => setReflection(event.target.value)} maxLength={500} placeholder="Skriv här, bara om du vill…" className="min-h-36 w-full resize-y rounded-3xl border border-[#E8DEE5] bg-white/75 p-5 text-sm text-[#512654] placeholder:text-[#A2939E] focus-visible:outline-2 focus-visible:outline-[#9873A0]" />
              <p className="text-xs text-[#806F7C]">Texten används bara i denna öppna kvällsstund och sparas inte ännu. Stäng för att rensa den.</p>
              <div className="rounded-3xl bg-[#F4E0D6]/75 p-5"><p className="font-handwritten text-2xl">Dagens styrka</p><p className="mt-2 text-sm">Vad visade du idag, även om det var svårt?</p></div>
              <div className="flex flex-wrap gap-2">{["Jag tog en paus", "Jag var snäll mot mig själv", "Jag kämpade vidare"].map(value => <button key={value} type="button" onClick={() => setReflection(value)} className="min-h-11 rounded-full bg-white/70 px-4 py-2 text-sm">{value}</button>)}</div>
            </div>}
            {step === 5 && <div className="space-y-6 pt-12 text-center">
              <Moon className="mx-auto text-[#B58DA5]" size={34} strokeWidth={1.2}/>
              <DialogTitle className="font-handwritten text-5xl font-normal">Tack för idag ♡</DialogTitle>
              <DialogDescription className="text-base text-[#6D566C]">Du dök upp, och det räcker långt.</DialogDescription>
              <div className="rounded-3xl bg-white/75 p-5 text-left shadow-sm"><p className="font-medium">Din dag i korthet</p><p className="mt-2 text-sm text-[#6D566C]">{input.planned > 0 ? `${input.done} av ${input.planned} planerade aktiviteter klara.` : "Dagen fick vara som den var."}</p>{answer && <p className="mt-2 text-sm text-[#6D566C]">Din incheckning: {t(EVENING_ANSWERS.find(item => item.id === answer)?.label ?? "")}</p>}</div>
              <p className="font-handwritten text-2xl">Du har gjort mer än det som syns. Det räknas också.</p>
            </div>}
          </div>
          <div className="relative z-10 mt-auto space-y-3 pt-8">
            <button type="button" onClick={() => step === screens - 1 ? (setReflection(""), setOpen(false)) : next()} className="min-h-12 w-full rounded-full bg-[#70466E] px-5 py-3 font-medium text-white">{step === screens - 1 ? "Stäng min kvällsstund" : step === 0 ? "Börja" : "Nästa"}</button>
            {step > 0 && step < screens - 1 && <button type="button" onClick={() => { if (step === 1) setAnswer(null); if (step === 2) setEveningEnergy(null); setStep(current => Math.min(screens - 1, current + 1)); }} className="min-h-11 w-full text-sm text-[#6D566C]">Hoppa över</button>}
            <p className="text-center text-xs text-[#806F7C]">Helt frivilligt. Du kan avsluta när som helst.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
