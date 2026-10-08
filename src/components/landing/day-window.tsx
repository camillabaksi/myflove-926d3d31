import { BrandLogo } from "@/components/paceable/brand-logo";
import { useState } from "react";
import { BatteryMedium, CalendarDays, Check, Heart, House, Leaf, ListTodo, Smile, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const DEMO_TASKS = [
  { name: "Drick vatten", time: "08:00" },
  { name: "Ta medicin", time: "09:00" },
  { name: "Korta promenaden", time: "10:00" },
  { name: "Jobba 25 min", time: "11:00" },
  { name: "Lunch", time: "12:00" },
];

/** En fristående, illustrativ förhandsvisning — läser eller ändrar aldrig användardata. */
export function DayWindow() {
  const [done, setDone] = useState<number[]>([0, 1]);

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-border/80 bg-landing-surface shadow-lifted" aria-label="Illustrativ förhandsvisning av Paceable">
      <div className="flex h-11 items-center justify-between border-b border-border/60 bg-landing-sand px-4 sm:h-9">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-landing-red sm:size-2" />
          <span className="size-2.5 rounded-full bg-landing-yellow sm:size-2" />
          <span className="size-2.5 rounded-full bg-landing-green sm:size-2" />
        </div>
        <span className="text-xs font-medium text-muted-foreground sm:text-[10px]">En glimt av Paceable</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[112px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border/60 bg-landing-sand/60 p-3 sm:block">
          <BrandLogo compact lightSurface className="w-full" />
          <div className="mt-8 space-y-1 text-[10px] font-medium text-muted-foreground">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-2 py-2 text-primary"><House className="size-3" aria-hidden="true" /> Översikt</div>
            <div className="flex items-center gap-2 px-2 py-2"><CalendarDays className="size-3" aria-hidden="true" /> Min dag</div>
            <div className="flex items-center gap-2 px-2 py-2"><ListTodo className="size-3" aria-hidden="true" /> Uppgifter</div>
          </div>
          <div className="mt-16 flex items-center gap-1.5 rounded-lg bg-secondary/60 p-2 text-[10px] text-primary"><Leaf className="size-3" aria-hidden="true" /> Du gör det bra</div>
        </aside>
        <div className="min-w-0 p-4 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-primary sm:hidden">Paceable</span>
            <span className="ml-auto text-xs font-medium text-muted-foreground sm:text-[10px]">Din dag, i din takt</span>
          </div>
          <div className="mt-5 sm:mt-3">
            <h2 className="flex items-center gap-1 font-display text-2xl font-extrabold leading-tight sm:text-xl">Hej! <Heart aria-label="lila hjärta" className="size-5 fill-primary text-primary sm:size-4" /></h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground sm:mt-0.5 sm:text-[11px] sm:leading-4">En ny dag, och du gör ditt bästa. Det räcker.</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-4">
            <div className="min-w-0 rounded-3xl border border-border/70 bg-card p-3 shadow-soft sm:rounded-xl">
              <div className="flex items-start justify-between gap-1"><h3 className="text-[12px] font-bold leading-4 sm:text-[11px]">Din energi idag</h3><BatteryMedium aria-hidden="true" className="size-3.5 shrink-0 text-primary" /></div>
              <div className="mt-5 flex items-center gap-1.5 sm:mt-4">
                <div className="flex min-w-0 flex-1 gap-0.5" role="img" aria-label="Illustrativt batteri, 60 procent">
                  {[0, 1, 2, 3, 4].map((segment) => <span key={segment} className={`h-5 min-w-0 flex-1 rounded-[3px] sm:h-4 ${segment < 3 ? "bg-primary" : "bg-secondary"}`} />)}
                </div>
                <strong className="text-sm sm:text-xs">60%</strong>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground sm:mt-3 sm:text-[10px]">Helt okej idag <Heart className="inline size-2.5 fill-primary text-primary" aria-hidden="true" /></p>
            </div>
            <div className="min-w-0 rounded-3xl border border-border/70 bg-card p-3 shadow-soft sm:rounded-xl">
              <h3 className="text-[12px] font-bold leading-4 sm:text-[11px]">Hur mår du idag?</h3>
              <div className="mt-5 flex justify-between gap-0.5 text-muted-foreground sm:mt-3" aria-label="Illustrativa humör-ikoner">
                {[0, 1, 2, 3].map((face) => (
                  <span key={face} className={`grid size-6 place-items-center rounded-full sm:size-7 ${face === 2 ? "bg-primary text-primary-foreground" : "bg-secondary/70"}`}>
                    <Smile aria-hidden="true" className="size-4 sm:size-3.5" />
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground sm:mt-3 sm:text-[10px]">Ganska bra <Heart className="inline size-2.5 fill-primary text-primary" aria-hidden="true" /></p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 min-[520px]:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] sm:mt-2 sm:gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
            <div className="min-w-0 rounded-3xl border border-border/70 bg-card p-4 shadow-soft sm:rounded-xl sm:p-3">
              <h3 className="text-sm font-bold sm:text-[11px]">Dagens uppgifter</h3>
              <ul className="mt-3 space-y-2 sm:mt-2 sm:space-y-1.5">
                {DEMO_TASKS.map((task, index) => (
                  <li key={task.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-[12px] sm:gap-1.5 sm:text-[10px]">
                    <Checkbox
                      checked={done.includes(index)}
                      onCheckedChange={(checked) => setDone((current) => checked ? [...current, index] : current.filter((item) => item !== index))}
                      aria-label={`Markera ${task.name} i förhandsvisningen`}
                      className="size-4 rounded-full sm:size-3.5"
                    />
                    <span className="min-w-0 truncate">{task.name}</span>
                    <time className="text-[11px] text-muted-foreground sm:text-[9px]">{task.time}</time>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex min-w-0 flex-col justify-between rounded-3xl bg-secondary/60 p-4 text-sm leading-6 sm:rounded-xl sm:p-3 sm:text-[11px] sm:leading-5">
              <p>En lugnare vardag är också en produktiv vardag. <Heart className="inline size-3 fill-primary text-primary" aria-label="lila hjärta" /></p>
              <div className="mt-3 flex items-end justify-between gap-1 text-primary">
                <span className="text-xs leading-5 sm:text-[9px] sm:leading-4">Du klarar mer<br />än du tror.</span>
                <Sparkles aria-hidden="true" className="size-5 shrink-0" />
              </div>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground sm:mt-2 sm:text-[9px]"><Check className="size-3 text-primary" aria-hidden="true" /> Exempelvy – inga uppgifter sparas här</p>
        </div>
      </div>
    </div>
  );
}