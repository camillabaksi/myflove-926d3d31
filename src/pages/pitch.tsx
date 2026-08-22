import Layout from "@/components/layout";
import { Link } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Lock, Download, ArrowLeft, FileText, Film } from "lucide-react";

export default function PitchPage() {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <Layout>
        <p className="text-muted-foreground">Laddar…</p>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <Lock size={40} className="mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-serif font-bold">Endast för grundaren</h1>
          <p className="text-muted-foreground">Denna sida kräver admin-behörighet.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Tillbaka till admin
        </Link>

        <header className="space-y-1">
          <h1 className="text-3xl font-serif font-bold">Pitchmaterial</h1>
          <p className="text-muted-foreground">
            Spela upp pitchvideon och ladda ner pitchdecken.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <Film size={18} className="text-primary" /> Pitchvideo
          </h2>
          <video
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-xl bg-black aspect-video"
            src="/pitch/myflove-pitch-2026.mp4"
          />
          <a
            href="/pitch/myflove-pitch-2026.mp4"
            download
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Download size={16} /> Ladda ner videon (MP4)
          </a>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <FileText size={18} className="text-primary" /> Pitchdeck
          </h2>
          <p className="text-sm text-muted-foreground">
            Senaste decket (3.2) i PowerPoint-format, samt en PDF-version för snabb visning.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="/pitch/MyFlove_Pitchdeck_3.2.pptx"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download size={16} /> Ladda ner PowerPoint (3.2)
            </a>
            <a
              href="/pitch/MyFlove_Pitchdeck_3.0.pdf"
              download
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Download size={16} /> Ladda ner PDF (3.0)
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <BookOpen size={18} className="text-primary" /> Living Blueprint
          </h2>
          <p className="text-sm text-muted-foreground">
            Ladda ner blueprinten som Word (DOCX) eller PDF – en knapp per version.
          </p>
          <ul className="space-y-2">
            {BLUEPRINT_VERSIONS.map((v) => (
              <li
                key={v.version}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
              >
                <div>
                  <p className="font-medium">Version {v.version}</p>
                  <p className="text-xs text-muted-foreground">{v.label}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/blueprint/MyFlove_Living_Blueprint_${v.version}.docx`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Download size={14} /> DOCX
                  </a>
                  <a
                    href={`/blueprint/MyFlove_Living_Blueprint_${v.version}.pdf`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    <Download size={14} /> PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
}
