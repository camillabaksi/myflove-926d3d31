import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Download,
  FileText,
  Loader2,
  Lock,
  Trash2,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  INVESTOR_CATEGORIES,
  INVESTOR_CATEGORY_LABELS,
  createInvestorUploadUrlFn,
  deleteInvestorDocFn,
  getInvestorDocUrlFn,
  listInvestorDocsFn,
  type InvestorCategory,
} from "@/lib/investor.functions";

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

type SortKey = "newest" | "oldest" | "name" | "category" | "size";

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

/** Privat sektion: allt material hämtas via adminskyddade serverfunktioner. */
export default function InvestorDocs() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<InvestorCategory>("pitchdeck");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["investor-docs"],
    queryFn: () => listInvestorDocsFn(),
    retry: false,
  });

  const [sort, setSort] = useState<SortKey>("newest");
  const sorted = [...(data ?? [])].sort((a, b) => {
    const ta = a.updated_at ? Date.parse(a.updated_at) : 0;
    const tb = b.updated_at ? Date.parse(b.updated_at) : 0;
    switch (sort) {
      case "oldest":
        return ta - tb;
      case "name":
        return a.name.localeCompare(b.name, "sv");
      case "category":
        return a.category.localeCompare(b.category) || tb - ta;
      case "size":
        return (b.size ?? 0) - (a.size ?? 0);
      default:
        return tb - ta;
    }
  });

  const open = useMutation({
    mutationFn: async (path: string) => {
      const { url } = await getInvestorDocUrlFn({ data: { path } });
      return url;
    },
    onSuccess: (url) => {
      // Anchor-klick är mer pålitligt än window.open efter ett await (popup-blockare).
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (path: string) => deleteInvestorDocFn({ data: { path } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investor-docs"] }),
    onError: (e: Error) => setError(e.message),
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^\w ()+.-]/gu, "_");
        const { path, token } = await createInvestorUploadUrlFn({
          data: { category, fileName: safeName },
        });
        const { error: upErr } = await supabase.storage
          .from("investor-docs")
          .uploadToSignedUrl(path, token, file);
        if (upErr) throw new Error(upErr.message);
      }
      await qc.invalidateQueries({ queryKey: ["investor-docs"] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <Briefcase size={18} className="text-primary" /> Pitch &amp; Investor
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Lock size={12} /> Privat – endast admin
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Materialet ligger i privat lagring och öppnas med tillfälliga länkar (5 minuter). Inget av
          detta syns för vanliga användare, testare eller besökare.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as InvestorCategory)}
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm sm:flex-none"
          >
            {INVESTOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {INVESTOR_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Lägg till dokument
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>
        {error && <p className="text-sm text-destructive break-words">{error}</p>}
      </div>

      {isLoading && <p className="text-muted-foreground">Laddar material…</p>}
      {isError && <p className="text-sm text-destructive">Kunde inte hämta materialet.</p>}

      {data && data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Inget material uppladdat än. Välj typ ovan och lägg till dina filer.
        </p>
      )}

      {data && data.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="investor-sort" className="text-sm text-muted-foreground">
            Sortera:
          </label>
          <select
            id="investor-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="newest">Nyast först</option>
            <option value="oldest">Äldst först</option>
            <option value="name">Namn A–Ö</option>
            <option value="category">Typ</option>
            <option value="size">Störst först</option>
          </select>
          <span className="text-xs text-muted-foreground">{data.length} filer</span>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((doc) => (
          <div
            key={doc.path}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <FileText size={18} className="shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-muted-foreground">
                {INVESTOR_CATEGORY_LABELS[doc.category]}
                {doc.updated_at ? ` · ${formatDate(doc.updated_at)}` : ""}
                {doc.size ? ` · ${formatSize(doc.size)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => open.mutate(doc.path)}
              disabled={open.isPending}
              className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
            >
              <Download size={14} /> Öppna
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Ta bort "${doc.name}"?`)) remove.mutate(doc.path);
              }}
              disabled={remove.isPending}
              className="inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
