import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, ShieldCheck, HelpCircle } from "lucide-react";
import {
  getUserAnalyticsFn,
  setSessionInternalFn,
  type UserAnalytics,
} from "@/lib/analytics-audit.functions";
import { getAnalyticsSessionId } from "@/lib/analytics";
import CollapsibleSection from "@/components/collapsible-section";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLang } from "@/hooks/use-language";

function fmt(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

export default function UserAnalytics() {
  const { t } = useLang();
  const qc = useQueryClient();
  const [externalOnly, setExternalOnly] = useState(true);
  const load = useServerFn(getUserAnalyticsFn);
  const mark = useServerFn(setSessionInternalFn);

  const { data, isLoading, isError } = useQuery<UserAnalytics>({
    queryKey: ["user-analytics"],
    queryFn: () => load({ data: { days: 400 } }) as Promise<UserAnalytics>,
    retry: false,
  });

  const toggle = useMutation({
    mutationFn: (vars: { sessionId: string; isInternal: boolean }) => mark({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-analytics"] }),
  });

  const myId = typeof window !== "undefined" ? getAnalyticsSessionId() : "";
  const rows = (data?.sessions ?? []).filter((s) => (externalOnly ? s.isInternal !== true : true));
  const shownEvents = rows.reduce((sum, s) => sum + s.events, 0);

  return (
    <CollapsibleSection
      title={t("Analys per användare")}
      headingClassName="text-lg font-semibold"
      className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
      description={t(
        "Händelser per webbläsare, med möjlighet att räkna bort dina egna och andra interna test.",
      )}
    >
      {isLoading && <p className="text-muted-foreground">{t("Laddar…")}</p>}
      {isError && <p className="text-destructive">{t("Kunde inte hämta granskningen.")}</p>}

      {data && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
            <div>
              <p className="text-sm font-medium">{t("Endast externa användare")}</p>
              <p className="text-xs text-muted-foreground">
                {t("Döljer allt som är märkt som grundare, admin, demo eller test.")}
              </p>
            </div>
            <Switch checked={externalOnly} onCheckedChange={setExternalOnly} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t("Händelser totalt"), value: data.totals.events },
              { label: t("Varav interna"), value: data.totals.internalEvents },
              { label: t("Varav externa"), value: data.totals.externalEvents },
              { label: t("Okänd härkomst"), value: data.totals.unknownEvents },
              { label: t("Webbläsare totalt"), value: data.totals.sessions },
              { label: t("Interna webbläsare"), value: data.totals.internalSessions },
              { label: t("Externa webbläsare"), value: data.totals.externalSessions },
              { label: t("Registrerade konton"), value: data.registeredUsers },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border border-border bg-card p-4 space-y-1"
              >
                <p className="text-xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggle.mutate({ sessionId: myId, isInternal: true })}
              disabled={!myId || toggle.isPending}
            >
              <ShieldCheck size={16} className="mr-2" />
              {t("Markera den här webbläsaren som intern")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t("Visar nu")}: {rows.length} {t("webbläsare")} · {shownEvents} {t("händelser")}
            </span>
          </div>

          <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
            {rows.slice(0, 100).map((s) => (
              <div
                key={s.sessionId}
                className="flex items-center justify-between gap-3 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {s.email ?? (
                      <span className="text-muted-foreground">
                        {t("Okänd besökare")} · {s.sessionId.slice(0, 8)}
                      </span>
                    )}
                    {s.sessionId === myId && (
                      <span className="ml-2 text-xs text-primary">{t("den här webbläsaren")}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.events} {t("händelser")} · {s.activeDays} {t("aktiva dagar")} · {t("senast")}{" "}
                    {fmt(s.lastSeen)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.isAdmin && (
                    <span className="text-[10px] rounded-full bg-primary/15 text-primary px-2 py-0.5">
                      {t("admin")}
                    </span>
                  )}
                  {s.isDemo && (
                    <span className="text-[10px] rounded-full bg-accent/20 px-2 py-0.5">
                      {t("demo")}
                    </span>
                  )}
                  {s.isInternal === null && (
                    <HelpCircle
                      size={14}
                      className="text-muted-foreground"
                      aria-label={t("okänd")}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={toggle.isPending}
                    onClick={() =>
                      toggle.mutate({ sessionId: s.sessionId, isInternal: s.isInternal !== true })
                    }
                  >
                    {s.isInternal === true ? t("Gör extern") : t("Märk intern")}
                  </Button>
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">{t("Inget att visa.")}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Users size={14} className="mt-0.5 shrink-0" />
            {t(
              "Historiska händelser saknar kontokoppling — de visas som okänd härkomst tills du märker dem. Ingen befintlig händelse ändras eller raderas.",
            )}
          </p>
        </div>
      )}
    </CollapsibleSection>
  );
}
