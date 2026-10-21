import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, Heart, Leaf, Moon, Sparkles, X } from "lucide-react";
import { useLang } from "@/hooks/use-language";
import { useEveningCheck } from "@/hooks/use-evening-check";
import { useDayJourney } from "@/hooks/use-day-journey";
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
  const { collapsed, toggle } = useCollapsible("home-evening-check");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<EveningAnswer | null>(null);
  const insight = useMemo(() => buildEveningInsight(eveningHistory, evening), [eveningHistory, evening]);
  const screens = 4;

  function start() { setStep(0); setAnswer(evening?.answer ?? null); setOpen(true); }
  function next() {
    if (step === 1 && answer && answer !== evening?.answer) {
      logEvening(answer, { ork10: input.ork10, battery: input.batteryNow, planned: input.planned, done: input.done, openThoughts: input.openThoughts });
      track("evening_check_completed", { source: "kvallsstund", method: answer });
    }
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto border-0 bg-[#FAF7F4] p-0 text-[#512654] sm:rounded-[2rem] [&>button]:hidden">
        <div className="relative min-h-[min(75dvh,630px)] overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-[#F7E9E3] via-[#FAF7F4] to-[#F0E7F2] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => step ? setStep(step - 1) : setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/60" aria-label={step ? "Föregående" : "Stäng"}>{step ? <ChevronLeft size={20}/> : <X size={19}/>}</button>
            <span className="text-xs text-[#6D566C]">Kvällsstund · {step + 1} av {screens}</span>
            <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/60" aria-label="Stäng kvällsstunden"><X size={19}/></button>
          </div>
          <div className="mt-3 flex gap-1.5" aria-label={`Steg ${step + 1} av ${screens}`}>{Array.from({ length: screens }, (_, index) => <span key={index} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", index <= step ? "bg-[#A585A8]" : "bg-[#E7DDE3]")}/>)}</div>
          <div key={step} className="animate-in fade-in slide-in-from-right-2 duration-300 motion-reduce:animate-none">
            {step === 0 && <div className="space-y-6 pt-12 text-center">
              <Moon className="mx-auto text-[#A786A4]" size={36} strokeWidth={1.3}/>
              <DialogTitle className="font-handwritten text-5xl font-normal leading-tight">En stund för dig</DialogTitle>
              <DialogDescription className="mx-auto max-w-xs text-base leading-relaxed text-[#6D566C]">Dagen går mot sitt slut. Vill du ta en liten stund för att landa?</DialogDescription>
              <div className="mx-auto max-w-xs space-y-3 rounded-3xl bg-white/70 p-5 text-left text-sm shadow-sm"><p className="flex gap-3"><Leaf size={18}/> Reflektera över din dag</p><p className="flex gap-3"><Sparkles size={18}/> Se det som också fick plats</p><p className="flex gap-3"><Heart size={18}/> Allt du gjorde räknas, även det osynliga</p></div>
            </div>}
            {step === 1 && <div className="space-y-6 pt-10 text-center">
              <DialogTitle className="font-handwritten text-4xl font-normal">Hur känns det efter idag?</DialogTitle>
              <DialogDescription className="text-sm text-[#6D566C]">Det finns inget rätt eller fel. Du behöver inte välja något.</DialogDescription>
              <div className="grid grid-cols-2 gap-3">{EVENING_ANSWERS.map(option => <button key={option.id} type="button" aria-pressed={answer === option.id} onClick={() => setAnswer(option.id)} className={cn("min-h-28 rounded-[2rem] border p-4 text-sm transition-all duration-300", answer === option.id ? "border-[#A585A8] bg-[#E5D4E5] shadow-md" : "border-transparent bg-white/65")}><span className="mb-2 block text-2xl">{option.emoji}</span>{t(option.label)}</button>)}<button type="button" onClick={() => setAnswer(null)} aria-pressed={answer === null} className="min-h-28 rounded-[2rem] bg-[#EDE6E0] p-4 text-sm">☁️<span className="mt-2 block">Vet inte / hoppa över</span></button></div>
            </div>}
            {step === 2 && <div className="space-y-5 pt-8">
              <DialogTitle className="font-handwritten text-center text-4xl font-normal">Så här såg din dag ut</DialogTitle>
              <div className="rounded-3xl bg-white/75 p-5 shadow-sm"><p className="text-sm font-medium">Din dag i korthet</p><p className="mt-3 text-sm text-[#6D566C]">{input.planned > 0 ? `${input.done} av ${input.planned} planerade aktiviteter markerades klara.` : "Inga planerade aktiviteter att sammanfatta just nu."}</p><p className="mt-3 text-sm text-[#6D566C]">{input.ork10 != null ? `Registrerad ork: ${input.ork10} av 10.` : "Ingen ork registrerad – vi gissar inte hur du mådde."}</p><p className="mt-3 text-sm text-[#6D566C]">Din energikurva visas när det finns verkliga mätningar från dagen.</p></div>
              <div className="rounded-3xl bg-[#F4E0D6]/70 p-4 text-center font-handwritten text-2xl">Allt som tog energi syns inte i kalendern.</div>
            </div>}
            {step === 3 && <div className="space-y-6 pt-12 text-center">
              <Moon className="mx-auto text-[#B58DA5]" size={34} strokeWidth={1.2}/>
              <DialogTitle className="font-handwritten text-5xl font-normal">Tack för idag ♡</DialogTitle>
              <DialogDescription className="text-base text-[#6D566C]">Du dök upp, och det räcker långt.</DialogDescription>
              <div className="rounded-3xl bg-white/75 p-5 text-left shadow-sm"><p className="font-medium">Din dag i korthet</p><p className="mt-2 text-sm text-[#6D566C]">{input.planned > 0 ? `${input.done} av ${input.planned} planerade aktiviteter klara.` : "Dagen fick vara som den var."}</p>{answer && <p className="mt-2 text-sm text-[#6D566C]">Din incheckning: {t(EVENING_ANSWERS.find(item => item.id === answer)?.label ?? "")}</p>}</div>
              <p className="font-handwritten text-2xl">Du har gjort mer än det som syns. Det räknas också.</p>
            </div>}
          </div>
          <div className="mt-10 space-y-3">
            <button type="button" onClick={() => step === screens - 1 ? setOpen(false) : next()} className="min-h-12 w-full rounded-full bg-[#70466E] px-5 py-3 font-medium text-white">{step === screens - 1 ? "Stäng min kvällsstund" : step === 0 ? "Börja" : "Nästa"}</button>
            {step > 0 && step < screens - 1 && <button type="button" onClick={() => { if (step === 1) setAnswer(null); setStep(current => Math.min(screens - 1, current + 1)); }} className="min-h-11 w-full text-sm text-[#6D566C]">Hoppa över</button>}
            <p className="text-center text-xs text-[#806F7C]">Helt frivilligt. Du kan avsluta när som helst.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
