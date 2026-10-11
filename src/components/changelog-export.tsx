import { useState } from "react";
import { FileText, FileType, Download } from "lucide-react";
import {
  CHANGELOG_INTRO,
  CHANGELOG_SECTIONS,
  CHANGELOG_TITLE,
  CHANGELOG_UPDATED,
} from "@/lib/changelog";

type Format = "docx" | "pdf";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportDocx() {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LevelFormat } =
    await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(CHANGELOG_TITLE)],
    }),
    new Paragraph({ children: [new TextRun(CHANGELOG_INTRO)] }),
  ];

  for (const section of CHANGELOG_SECTIONS) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(section.title)],
      }),
    );
    for (const item of section.items) {
      children.push(
        new Paragraph({
          numbering: { reference: "changelog-bullets", level: 0 },
          children: [new TextRun(item)],
        }),
      );
    }
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Senast uppdaterad: ${CHANGELOG_UPDATED}`, italics: true, size: 20 }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 24 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 34, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "changelog-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, "Paceable-Changelog.docx");
}

async function exportPdf() {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const maxWidth = width - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > height - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(CHANGELOG_TITLE, margin, y);
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const line of doc.splitTextToSize(CHANGELOG_INTRO, maxWidth)) {
    ensureSpace(16);
    doc.text(line, margin, y);
    y += 16;
  }
  y += 8;

  for (const section of CHANGELOG_SECTIONS) {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    y += 12;
    doc.text(section.title, margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    for (const item of section.items) {
      const lines: string[] = doc.splitTextToSize(item, maxWidth - 16);
      ensureSpace(lines.length * 15);
      doc.text("•", margin, y);
      lines.forEach((line, i) => {
        doc.text(line, margin + 16, y + i * 15);
      });
      y += lines.length * 15 + 2;
    }
  }

  ensureSpace(30);
  y += 18;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text(`Senast uppdaterad: ${CHANGELOG_UPDATED}`, margin, y);

  downloadBlob(doc.output("blob"), "Paceable-Changelog.pdf");
}

export default function ChangelogExport() {
  const [format, setFormat] = useState<Format>("docx");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setBusy(true);
    setError(null);
    try {
      if (format === "docx") await exportDocx();
      else await exportPdf();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const total = CHANGELOG_SECTIONS.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <div>
          <h2 className="font-serif font-semibold text-lg">Exportera changelog</h2>
          <p className="text-sm text-muted-foreground">
            {CHANGELOG_SECTIONS.length} avsnitt · {total} punkter · senast uppdaterad{" "}
            {CHANGELOG_UPDATED}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Välj format</legend>
          <div className="flex flex-wrap gap-2">
            <FormatBtn
              active={format === "docx"}
              onClick={() => setFormat("docx")}
              icon={<FileText size={16} />}
              label="Word (.docx)"
            />
            <FormatBtn
              active={format === "pdf"}
              onClick={() => setFormat("pdf")}
              icon={<FileType size={16} />}
              label="PDF (.pdf)"
            />
          </div>
        </fieldset>

        <button
          onClick={handleExport}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          <Download size={16} />
          {busy ? "Skapar fil…" : `Ladda ner ${format === "docx" ? "Word" : "PDF"}`}
        </button>

        {error && <p className="text-sm text-destructive">Kunde inte skapa filen: {error}</p>}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground">Innehåll</h3>
        {CHANGELOG_SECTIONS.map((s) => (
          <div key={s.title}>
            <p className="font-medium">{s.title}</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {s.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormatBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
