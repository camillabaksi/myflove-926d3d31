import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Plus, ThumbsUp, Loader2, AlertTriangle } from "lucide-react";

type Status = "new" | "reviewing" | "planned" | "done" | "ignored";

interface FrictionItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  impact: number;
  status: Status;
  reporter_id: string;
  created_at: string;
}

interface Vote {
  item_id: string;
  user_id: string;
}

const CATEGORIES = [
  { value: "feedback", label: "Feedback – vad du tycker om appen" },
  { value: "suggestion", label: "Förslag – ny funktion eller idé" },
  { value: "ui", label: "UI/UX – förvirrande eller trögt" },
  { value: "bug", label: "Bugg – något går sönder" },
  { value: "missing", label: "Saknad funktion" },
  { value: "performance", label: "Långsamt" },
  { value: "other", label: "Annat" },
];

const STATUS_LABELS: Record<Status, string> = {
  new: "Ny",
  reviewing: "Under översyn",
  planned: "Planerad",
  done: "Löst",
  ignored: "Ignorerad",
};

const STATUS_COLORS: Record<Status, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  planned: "bg-purple-100 text-purple-800",
  done: "bg-green-100 text-green-800",
  ignored: "bg-gray-100 text-gray-600",
};

export default function FrictionIndexPage() {
  const [items, setItems] = useState<FrictionItem[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ui");
  const [impact, setImpact] = useState(3);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData.user?.id ?? null);
      const [itemsRes, votesRes] = await Promise.all([
        supabase.from("friction_items").select("*").order("created_at", { ascending: false }),
        supabase.from("friction_votes").select("item_id,user_id"),
      ]);
      if (itemsRes.error) throw itemsRes.error;
      if (votesRes.error) throw votesRes.error;
      setItems((itemsRes.data ?? []) as FrictionItem[]);
      setVotes((votesRes.data ?? []) as Vote[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte hämta friktionsindex");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const voteCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of votes) m.set(v.item_id, (m.get(v.item_id) ?? 0) + 1);
    return m;
  }, [votes]);

  const myVotes = useMemo(() => {
    const s = new Set<string>();
    if (!userId) return s;
    for (const v of votes) if (v.user_id === userId) s.add(v.item_id);
    return s;
  }, [votes, userId]);

  const ranked = useMemo(() => {
    return [...items]
      .map((it) => ({
        item: it,
        votes: voteCounts.get(it.id) ?? 0,
        score: it.impact * ((voteCounts.get(it.id) ?? 0) + 1),
      }))
      .sort((a, b) => {
        if (a.item.status === "done" && b.item.status !== "done") return 1;
        if (b.item.status === "done" && a.item.status !== "done") return -1;
        return b.score - a.score;
      });
  }, [items, voteCounts]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { error: insErr } = await supabase.from("friction_items").insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        impact,
        reporter_id: userId,
      });
      if (insErr) throw insErr;
      setTitle("");
      setDescription("");
      setCategory("ui");
      setImpact(3);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte spara");
    } finally {
      setSaving(false);
    }
  };

  const toggleVote = async (itemId: string) => {
    if (!userId) return;
    const hasVoted = myVotes.has(itemId);
    if (hasVoted) {
      setVotes((v) => v.filter((x) => !(x.item_id === itemId && x.user_id === userId)));
      const { error: delErr } = await supabase
        .from("friction_votes")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", userId);
      if (delErr) await load();
    } else {
      setVotes((v) => [...v, { item_id: itemId, user_id: userId }]);
      const { error: insErr } = await supabase
        .from("friction_votes")
        .insert({ item_id: itemId, user_id: userId });
      if (insErr) await load();
    }
  };

  const updateStatus = async (itemId: string, status: Status) => {
    const { error: updErr } = await supabase
      .from("friction_items")
      .update({ status })
      .eq("id", itemId);
    if (updErr) {
      setError(updErr.message);
    } else {
      setItems((list) => list.map((i) => (i.id === itemId ? { ...i, status } : i)));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Flame className="text-primary" /> Feedback & förslag
          </h1>
          <p className="text-muted-foreground">
            Lämna feedback, förslag eller rapportera saker som skaver. Rösta upp det som stör
            eller behövs mest – högst poäng (påverkan × röster) hamnar överst.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-2xl p-3 text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={() => setShowForm((s) => !s)} className="rounded-full">
            <Plus size={16} className="mr-1" /> {showForm ? "Stäng" : "Lämna feedback"}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={submit}
            className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm"
          >
            <div>
              <label className="text-sm font-medium block mb-1">Vad skaver?</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={140}
                placeholder="T.ex. Svårt att hitta knappen för att lägga till mående"
                className="w-full rounded-2xl border border-border bg-background p-3 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Beskriv gärna mer</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="När händer det? Vad förväntade du dig?"
                className="w-full rounded-2xl border border-border bg-background p-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Påverkan (1–5)</label>
                <select
                  value={impact}
                  onChange={(e) => setImpact(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "– litet" : n === 5 ? "– stort" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={saving || !title.trim()} className="rounded-full">
              {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : null} Spara
            </Button>
          </form>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm">Laddar…</p>
        ) : ranked.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-8 text-center text-muted-foreground text-sm">
            Inget friktion loggat än. Lägg till första punkten ovan.
          </div>
        ) : (
          <div className="space-y-3">
            {ranked.map(({ item, votes: v, score }) => {
              const mine = myVotes.has(item.id);
              const isReporter = userId === item.reporter_id;
              return (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-3xl p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                        </span>
                      </div>
                      <h3 className="font-medium">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleVote(item.id)}
                        className={`flex flex-col items-center px-3 py-2 rounded-2xl border transition-colors ${
                          mine
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:bg-secondary"
                        }`}
                        aria-label={mine ? "Ta bort röst" : "Rösta upp"}
                      >
                        <ThumbsUp size={16} />
                        <span className="text-xs font-medium mt-0.5">{v}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                    <span>
                      Poäng <strong className="text-foreground">{score}</strong> · påverkan {item.impact} · röster {v}
                    </span>
                    {isReporter ? (
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value as Status)}
                        className="rounded-full bg-background border border-border px-2 py-1 text-xs"
                      >
                        {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
