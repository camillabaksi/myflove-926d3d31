import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, ShieldCheck, HelpCircle, Download, FileText } from "lucide-react";
import {
  getUserAnalyticsFn,
  setSessionInternalFn,
  type UserAnalytics,
  type SessionRow,
} from "@/lib/analytics-audit.functions";
import { getAnalyticsSessionId } from "@/lib/analytics";
import CollapsibleSection from "@/components/collapsible-section";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLang } from "@/hooks/use-language";

function fmt(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function label(s: SessionRow): string {
  if (s.isInternal === true) return "intern";
  if (s.isInternal === false) return "extern";
  return "okänd";
}

function toCsv(data: UserAnalytics, rows: SessionRow[]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines: string[] = [];
  lines.push(`"MyFlove – analys per användare"`);
  lines.push(
    `"Händelser totalt",${data.totals.events},"Interna",${data.totals.internalEvents},"Externa",${data.totals.externalEvents},"Okända",${data.totals.unknownEvents}`,
  );
  lines.push(
    `"Webbläsare totalt",${data.totals.sessions},"Interna",${data.totals.internalSessions},"Externa",${data.totals.externalSessions},"Registrerade konton",${data.registeredUsers}`,
  );
  lines.push("");
  lines.push(
    `"Webbläsar-ID","E-post","Typ","Händelser","Aktiva dagar","Först sedd","Senast sedd","Admin","Demo"`,
  );
  for (const s of rows) {
    lines.push(
      [
        esc(s.sessionId),
        esc(s.email ?? ""),
        esc(label(s)),
        s.events,
        s.activeDays,
        esc(fmt(s.firstSeen)),
        esc(fmt(s.lastSeen)),
        esc(s.isAdmin ? "ja" : "nej"),
        esc(s.isDemo ? "ja" : "nej"),
      ].join(","),
    );
  }
  return `\uFEFF${lines.join("\n")}`;
}

async function toPdf(data: UserAnalytics, rows: SessionRow[]): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  doc.setFontSize(18);
  doc.text("MyFlove - analys per anvandare", margin, y);
  y += 24;
  doc.setFontSize(11);
  doc.text(
    `Handelser: ${data.totals.events}  ·  interna: ${data.totals.internalEvents}  ·  externa: ${data.totals.externalEvents}  ·  okanda: ${data.totals.unknownEvents}`,
    margin,
    y,
  );
  y += 16;
  doc.text(
    `Webblasare: ${data.totals.sessions}  ·  registrerade konton: ${data.registeredUsers}`,
    margin,
    y,
  );
  y += 26;

  const xs = [0, 170, 230, 290, 360, 450];
  const line = (cells: Array<string | number>, bold = false) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    cells.forEach((c, i) => doc.text(String(c), margin + xs[i], y));
    y += 15;
  };

  doc.setFontSize(10);
  line(["Anvandare / ID", "Typ", "Hand.", "Dagar", "Senast"], true);
  for (const s of rows) {
    line([
      (s.email ?? s.sessionId).slice(0, 28),
      label(s),
      s.events,
      s.activeDays,
      fmt(s.lastSeen),
    ]);
  }
  return doc.output("blob");
}

type SortKey = "newest" | "oldest" | "most" | "fewest";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "newest", label: "Nyast aktiv först" },
  { key: "oldest", label: "Äldst först (först sedda)" },
  { key: "most", label: "Flest händelser" },
  { key: "fewest", label: "Färst händelser" },
];

export default function UserAnalytics() {
  const { t } = useLang();
  const qc = useQueryClient();
  const [externalOnly, setExternalOnly] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
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
  const rows = [...(data?.sessions ?? [])]
    .filter((s) => (externalOnly ? s.isInternal !== true : true))
    .sort((a, b) => {
      if (sortKey === "newest") return b.lastSeen.localeCompare(a.lastSeen);
      if (sortKey === "oldest") return a.firstSeen.localeCompare(b.firstSeen);
      if (sortKey === "most") return b.events - a.events;
      return a.events - b.events;
    });
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
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                saveBlob(
                  new Blob([toCsv(data, rows)], { type: "text/csv;charset=utf-8" }),
                  `myflove-analys-${new Date().toISOString().slice(0, 10)}.csv`,
                )
              }
            >
              <Download size={16} className="mr-2" />
              {t("Ladda ner CSV")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () =>
                saveBlob(
                  await toPdf(data, rows),
                  `myflove-analys-${new Date().toISOString().slice(0, 10)}.pdf`,
                )
              }
            >
              <FileText size={16} className="mr-2" />
              {t("Ladda ner PDF")}
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
