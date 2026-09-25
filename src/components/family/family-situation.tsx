import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { FlowMascot } from "@/components/flow-mascot";
import NextStepCard from "@/components/journey/next-step-card";
import { useLang } from "@/hooks/use-language";
import { useTasks } from "@/hooks/use-data";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { planFamilySituation, type FamilySubject } from "@/lib/family-flow";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export interface SituationChild {
  id: string;
  name: string;
  helps: string[];
}

/**
 * "Vad behöver fungera?" → "Vem gäller det?" → "Vad brukar hjälpa?"
 *
 * Använder befintlig kapacitetslogik (FlowScore/Mitt batteri), befintliga
 * uppgifter och befintligt Nästa rimliga steg. Inget nytt aktivitetsregister.
 */
export default function FamilySituation({
  childrenList,
  className,
}: {
  childrenList: SituationChild[];
  className?: string;
}) {
  const { t } = useLang();
  const { addTask } = useTasks();
  const capacity = useCapacityMode();
  // Kapacitetsläget (användarens val) är källan – inte FlowScore.
  const flow = { score: capacity.percent, capacityMinutes: capacity.minutes, suggestedTasks: capacity.suggestedTasks };
  const [draft, setDraft] = useState("");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState<FamilySubject>("jag");
  const [childId, setChildId] = useState<string | null>(null);
  const [adjust, setAdjust] = useState<"mindre" | "större" | null>(null);
  const [accepted, setAccepted] = useState(false);

  const child = childrenList.find((c) => c.id === childId) ?? null;
  const score = typeof flow?.score === "number" ? flow.score : null;
  const capacityMinutes = typeof flow?.capacityMinutes === "number" ? flow.capacityMinutes : null;

  const plan = useMemo(
    () =>
      text.trim()
        ? planFamilySituation({
            text,
            subject,
            childName: child?.name ?? null,
            helps: subject === "barn" ? (child?.helps ?? []) : [],
            score,
            capacityMinutes,
            adjust,
          })
        : null,
    [text, subject, child, score, capacityMinutes, adjust],
  );

  const chip = (active: boolean) =>
    cn(
      "press min-h-11 rounded-full border px-4 text-sm font-medium",
      active
        ? "border-primary bg-primary/10 text-ink"
        : "border-border bg-card text-muted-foreground",
    );

  const accept = () => {
    if (!plan || accepted) return;
    addTask(plan.taskTitle, todayISO(), { note: plan.steps.join(" ") });
    setAccepted(true);
    track("flow_suggestion_accepted", { source: "family-flow" });
    toast.success(t("Den ligger i din dag nu. 💙"));
  };

  return (
    <div className={cn("space-y-3", className)} data-testid="family-situation">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAccepted(false);
          setAdjust(null);
          setText(draft.trim());
          if (draft.trim()) track("flow_suggestion_shown", { source: "family-flow" });
        }}
        className="space-y-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={t("T.ex. Vi ska gå om 20 minuter och barnet vill inte klä på sig")}
          aria-label={t("Vad behöver fungera?")}
          className="w-full rounded-2xl border border-border bg-card p-3 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSubject("jag");
              setChildId(null);
            }}
            className={chip(subject === "jag")}
          >
            💜 {t("Jag")}
          </button>
          {childrenList.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSubject("barn");
                setChildId(c.id);
              }}
              className={chip(subject === "barn" && childId === c.id)}
            >
              {c.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSubject("familjen");
              setChildId(null);
            }}
            className={chip(subject === "familjen")}
          >
            👨‍👩‍👧 {t("Familjen")}
          </button>
        </div>

        <button
          type="submit"
          disabled={!draft.trim()}
          className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Sparkles size={15} aria-hidden /> {t("Fråga Flow")}
        </button>
      </form>

      {plan && (
        <section
          aria-label={t("Flows förslag")}
          className="rounded-3xl border border-border/60 bg-lavender/25 p-4 shadow-soft"
        >
          <div className="flex items-start gap-3">
            <FlowMascot size="xs" mood="calm" className="mt-0.5 hidden shrink-0 sm:block" alt="" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">💜 {t(plan.headline)}</p>
              {plan.timingLine && <p className="mt-1 text-sm text-ink">{plan.timingLine}</p>}
              {plan.helpLine && <p className="mt-0.5 text-sm text-ink">{plan.helpLine}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {t(plan.capacityLine)}
                {plan.usedFallback && ` · ${t("utifrån hur dagen ser ut")}`}
              </p>

              <ol className="mt-3 space-y-1 text-sm text-ink">
                {plan.steps.map((s, i) => (
                  <li key={s}>
                    {i + 1}. {s}
                  </li>
                ))}
              </ol>

              {plan.capacityNote && (
                <p className="mt-2 text-xs text-muted-foreground">{t(plan.capacityNote)}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={accept}
                  disabled={accepted}
                  className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {t("Visa nästa steg")} <ArrowRight size={15} aria-hidden />
                </button>
                {plan.canShrink && (
                  <button
                    type="button"
                    onClick={() => setAdjust("mindre")}
                    className="press inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-ink"
                  >
                    {t("Ändra")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    track("flow_suggestion_rejected", { source: "family-flow" });
                    setText("");
                    setDraft("");
                    setAccepted(false);
                  }}
                  className="press inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted-foreground underline-offset-2 hover:underline"
                >
                  {t("Senare")}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {accepted && <NextStepCard />}
    </div>
  );
}
