import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAnalyticsExportFn, type AnalyticsExport } from "@/lib/analytics.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(data: AnalyticsExport): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines: string[] = [];
  lines.push(`"Paceable – anonym appstatistik"`);
  lines.push(`"Period",${esc(data.from)},${esc(data.to)}`);
  lines.push(
    `"Totalt","händelser",${data.totals.events},"besökare",${data.totals.sessions},"dagar",${data.totals.days}`,
  );
  lines.push("");
  lines.push(`"Datum","Besökare","Händelser"`);
  for (const d of data.daily) lines.push([esc(d.date), d.sessions, d.events].join(","));
  lines.push("");
  lines.push(`"Datum","Del av appen","Handling","Händelser","Besökare"`);
  for (const r of data.rows) {
    lines.push([esc(r.date), esc(r.section), esc(r.action), r.events, r.sessions].join(","));
  }
  return `\uFEFF${lines.join("\n")}`;
}

async function toPdf(data: AnalyticsExport): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  doc.setFontSize(18);
  doc.text("Paceable - anonym appstatistik", margin, y);
  y += 22;
  doc.setFontSize(11);
  doc.text(`Period: ${data.from} till ${data.to}`, margin, y);
  y += 16;
  doc.text(
    `Handelser: ${data.totals.events}  ·  Besokare: ${data.totals.sessions}  ·  Dagar med data: ${data.totals.days}`,
    margin,
    y,
  );
  y += 26;

  const pageHeight = doc.internal.pageSize.getHeight();
  const line = (cells: Array<string | number>, xs: number[], bold = false) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    cells.forEach((c, i) => doc.text(String(c), margin + xs[i], y));
    y += 15;
  };

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Per dag", margin, y);
  y += 18;
  doc.setFontSize(10);
  line(["Datum", "Besokare", "Handelser"], [0, 140, 240], true);
  for (const d of data.daily) line([d.date, d.sessions, d.events], [0, 140, 240]);

  y += 16;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  if (y > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }
  doc.text("Per del och handling", margin, y);
  y += 18;
  doc.setFontSize(10);
  line(["Datum", "Del", "Handling", "Antal", "Besokare"], [0, 90, 240, 380, 440], true);
  for (const r of data.rows) {
    line([r.date, r.section, r.action, r.events, r.sessions], [0, 90, 240, 380, 440]);
  }

  doc.setFontSize(8);
  doc.text(
    "Ingen personlig data ingar: endast del av appen, typ av handling och antal.",
    margin,
    pageHeight - 28,
  );
  return doc.output("blob");
}

export default function AnalyticsExport() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);

  async function run(kind: "csv" | "pdf") {
    if (from > to) {
      toast.error("Startdatum måste vara före slutdatum.");
      return;
    }
    setBusy(kind);
    try {
      const data = (await getAnalyticsExportFn({
        data: { from, to },
      })) as AnalyticsExport;
      if (data.totals.events === 0) {
        toast.info("Ingen statistik i det valda intervallet.");
        return;
      }
      const name = `myflove-statistik_${from}_${to}`;
      if (kind === "csv") {
        download(new Blob([toCsv(data)], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
      } else {
        download(await toPdf(data), `${name}.pdf`);
      }
      toast.success("Export klar.");
    } catch {
      toast.error("Kunde inte exportera just nu.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Exportera statistik</h2>
        <p className="text-sm text-muted-foreground">
          Välj datumintervall och ladda ner anonym, sammanslagen statistik för egen analys.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label htmlFor="export-from" className="text-xs">
            Från
          </Label>
          <Input
            id="export-from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="export-to" className="text-xs">
            Till
          </Label>
          <Input
            id="export-to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90].map((d) => (
          <Button
            key={d}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setFrom(isoDaysAgo(d - 1));
              setTo(isoDaysAgo(0));
            }}
          >
            Senaste {d} dagarna
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => run("csv")} disabled={busy !== null}>
          {busy === "csv" ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          Exportera CSV
        </Button>
        <Button type="button" variant="outline" onClick={() => run("pdf")} disabled={busy !== null}>
          {busy === "pdf" ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
          Exportera PDF
        </Button>
      </div>
    </div>
  );
}
