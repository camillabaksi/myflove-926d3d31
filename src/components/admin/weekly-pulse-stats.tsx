import { useState } from "react";
import { useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";
import { getWeeklyPulseStatsFn } from "@/lib/weekly-pulse.functions";
import { PULSE_QUESTIONS, pulseMedian } from "@/lib/weekly-pulse";

export default function WeeklyPulseStats() {
  const { t } = useLang();
  const { user } = useUser();
  const [selectedWeek, setSelectedWeek] = useState("");
  const query = useQuery({
    queryKey: ["weekly-pulse-stats", user?.id],
    queryFn: () => getWeeklyPulseStatsFn(),
    enabled: !!user,
    retry: false,
  });
  const weeks = query.data;
  const selected = weeks?.find((row) => row.week_start === selectedWeek) ?? weeks?.[0];
  const median = (values: number[]) => pulseMedian(values)?.toLocaleString("sv-SE") ?? "—";
  return (
    <section
      aria-label={t("Upplevd nytta")}
      className="min-w-0 space-y-4 rounded-3xl border border-border bg-card p-4 sm:p-6"
    >
      <header>
        <h2 className="text-lg font-semibold">{t("Blir vardagen lättare?")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "Användarnas frivilliga veckopuls. Tre separata frågor, skala 1–5. Här visas sammanställningar utan namn.",
          )}
        </p>
      </header>
      {query.isPending && (
        <p role="status" className="text-sm">
          {t("Laddar veckopulsens svar…")}
        </p>
      )}
      {query.isError && (
        <div className="space-y-2">
          <p role="alert" className="text-sm">
            {t(
              "Veckopulsens statistik kunde inte hämtas. Resultaten är okända tills hämtningen lyckas.",
            )}
          </p>
          <Button
            variant="outline"
            className="min-h-11 whitespace-normal"
            onClick={() => {
              void query.refetch();
            }}
          >
            {t("Försök igen")}
          </Button>
        </div>
      )}
      {selected && !query.isError && (
        <>
          <label className="block text-sm font-medium">
            {t("Vecka, måndag–söndag i svensk tid")}
            <select
              className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-border bg-card p-2"
              value={selected.week_start}
              onChange={(event) => setSelectedWeek(event.target.value)}
            >
              {weeks?.map((row, index) => (
                <option key={row.week_start} value={row.week_start}>
                  {row.week_start}
                  {index === 0 ? ` · ${t("pågående vecka")}` : ""}
                </option>
              ))}
            </select>
          </label>
          <p className="w-full min-w-0 rounded-2xl bg-secondary px-3 py-2 text-sm font-medium">
            {selected.answered} {t("svar av")} {selected.opened} {t("startade veckopulser")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(
              "Ett konto räknas en gång per vecka. Start betyder att användaren valt Svara. Antal som bara har sett frågan mäts inte; detta är ingen svarsfrekvens bland alla inbjudna. Admin- och demokonton är borträknade.",
            )}
          </p>
          {selected.answered === 0 && (
            <p className="text-sm">
              {t(
                "Inga inskickade svar för den här veckan ännu. Det betyder inte att appen saknar nytta.",
              )}
            </p>
          )}
          <div className="space-y-4">
            {PULSE_QUESTIONS.map((question) => {
              const distribution = selected[`${question.key}_counts`];
              return (
                <div
                  key={question.key}
                  className="min-w-0 space-y-2 rounded-2xl border border-border p-3"
                >
                  <h3 className="text-sm font-semibold">{t(question.label)}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("Median")}: {median(distribution)} · {selected.answered} {t("svar")}
                  </p>
                  <dl className="grid grid-cols-5 gap-1 text-center text-sm">
                    {distribution.map((count, index) => (
                      <div key={index} className="rounded-lg bg-secondary/50 py-2">
                        <dt>{index + 1}</dt>
                        <dd className="font-semibold">
                          {count}
                          <span className="sr-only"> {t("svar")}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {question.key === "burden" && (
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "Här betyder högre svar att appen känts mer belastande. Frågan slås aldrig ihop med de andra till ett nyttopoäng.",
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "Svarsskalan är 1 = Instämmer inte alls, 5 = Instämmer helt. Siffrorna under varje svarsalternativ visar antal svar.",
            )}
          </p>
          <details className="rounded-2xl border border-border p-3">
            <summary className="min-h-11 cursor-pointer text-sm font-medium">
              {t("Utveckling under åtta veckor")}
            </summary>
            <ul className="mt-2 space-y-3">
              {weeks?.map((row) => (
                <li
                  key={row.week_start}
                  className="min-w-0 space-y-2 border-t border-border pt-3 text-sm"
                >
                  <p className="font-medium">
                    {row.week_start} · {row.answered} {t("svar av")} {row.opened} {t("startade")}
                  </p>
                  <dl className="grid gap-2 sm:grid-cols-3">
                    {PULSE_QUESTIONS.map((question) => (
                      <div key={question.key}>
                        <dt className="text-xs text-muted-foreground">{t(question.short)}</dt>
                        <dd>
                          {t("Median")}: {median(row[`${question.key}_counts`])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
      <p className="text-sm text-muted-foreground">
        {t(
          "Veckopulsen har en egen period: den pågående veckan och sju tidigare veckor. Olika personer kan svara olika veckor. Förändrade medianer är inte en före-/efterjämförelse inom samma deltagare och visar inte att appen orsakat en förbättring. Uteblivna svar är inte negativa svar.",
        )}
      </p>
    </section>
  );
}
