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
    <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-landing-surface shadow-lifted" aria-label="Illustrativ förhandsvisning av MyFlove">
      <div className="flex h-9 items-center justify-between border-b border-border/60 bg-landing-sand px-4">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-landing-red" />
          <span className="size-2 rounded-full bg-landing-yellow" />
          <span className="size-2 rounded-full bg-landing-green" />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">En glimt av MyFlove</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[112px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border/60 bg-landing-sand/60 p-3 sm:block">
          <div className="flex items-center gap-1 text-xs font-extrabold text-foreground"><Heart aria-hidden="true" className="size-4 fill-primary text-primary" /> MyFlove</div>
          <div className="mt-8 space-y-1 text-[10px] font-medium text-muted-foreground">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-2 py-2 text-primary"><House className="size-3" aria-hidden="true" /> Översikt</div>
            <div className="flex items-center gap-2 px-2 py-2"><CalendarDays className="size-3" aria-hidden="true" /> Min dag</div>
            <div className="flex items-center gap-2 px-2 py-2"><ListTodo className="size-3" aria-hidden="true" /> Uppgifter</div>
          </div>
          <div className="mt-16 flex items-center gap-1.5 rounded-lg bg-secondary/60 p-2 text-[10px] text-primary"><Leaf className="size-3" aria-hidden="true" /> Du gör det bra</div>
        </aside>
        <div className="min-w-0 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-primary sm:hidden">MyFlove</span>
            <span className="ml-auto text-[10px] font-medium text-muted-foreground">Din dag, i din takt</span>
          </div>
          <div className="mt-3">
            <h2 className="font-display text-lg font-extrabold leading-tight sm:text-xl">Hej! <span aria-hidden="true">💜</span></h2>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">En ny dag, och du gör ditt bästa. Det räcker.</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="min-w-0 rounded-xl border border-border/70 bg-card p-2.5 shadow-soft sm:p-3">
              <div className="flex items-start justify-between gap-1"><h3 className="text-[11px] font-bold leading-4">Din energi idag</h3><BatteryMedium aria-hidden="true" className="size-3.5 shrink-0 text-primary" /></div>
              <div className="mt-4 flex items-center gap-1.5">
                <div className="flex min-w-0 flex-1 gap-0.5" role="img" aria-label="Illustrativt batteri, 60 procent">
                  {[0, 1, 2, 3, 4].map((segment) => <span key={segment} className={`h-4 min-w-0 flex-1 rounded-[3px] ${segment < 3 ? "bg-primary" : "bg-secondary"}`} />)}
                </div>
                <strong className="text-xs">60%</strong>
              </div>
              <p className="mt-3 text-[9px] text-muted-foreground sm:text-[10px]">Helt okej idag <span aria-hidden="true">♥</span></p>
            </div>
            <div className="min-w-0 rounded-xl border border-border/70 bg-card p-2.5 shadow-soft sm:p-3">
              <h3 className="text-[11px] font-bold leading-4">Hur mår du idag?</h3>
              <div className="mt-3 flex justify-between gap-0.5 text-muted-foreground" aria-label="Illustrativa humör-ikoner">
                {[0, 1, 2, 3].map((face) => (
                  <span key={face} className={`grid size-6 place-items-center rounded-full sm:size-7 ${face === 2 ? "bg-primary text-primary-foreground" : "bg-secondary/70"}`}>
                    <Smile aria-hidden="true" className="size-3.5" />
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[9px] text-muted-foreground sm:text-[10px]">Ganska bra <span aria-hidden="true">♥</span></p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 min-[520px]:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
            <div className="min-w-0 rounded-xl border border-border/70 bg-card p-2.5 shadow-soft sm:p-3">
              <h3 className="text-[11px] font-bold">Dagens uppgifter</h3>
              <ul className="mt-2 space-y-1.5">
                {DEMO_TASKS.map((task, index) => (
                  <li key={task.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 text-[10px]">
                    <Checkbox
                      checked={done.includes(index)}
                      onCheckedChange={(checked) => setDone((current) => checked ? [...current, index] : current.filter((item) => item !== index))}
                      aria-label={`Markera ${task.name} i förhandsvisningen`}
                      className="size-3.5 rounded-full"
                    />
                    <span className="min-w-0 truncate">{task.name}</span>
                    <time className="text-[9px] text-muted-foreground">{task.time}</time>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex min-w-0 flex-col justify-between rounded-xl bg-secondary/60 p-3 text-[11px] leading-5">
              <p>En lugnare vardag är också en produktiv vardag. <span aria-hidden="true">💜</span></p>
              <div className="mt-3 flex items-end justify-between gap-1 text-primary">
                <span className="text-[9px] leading-4">Du klarar mer<br />än du tror.</span>
                <Sparkles aria-hidden="true" className="size-5 shrink-0" />
              </div>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground"><Check className="size-3 text-primary" aria-hidden="true" /> Exempelvy – inga uppgifter sparas här</p>
        </div>
      </div>
    </div>
  );
}