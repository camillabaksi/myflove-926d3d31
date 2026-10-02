import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Plus, ThumbsUp, Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Status = "new" | "reviewing" | "planned" | "done" | "ignored";

interface FrictionItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  impact: number;
  frequency: number;
  mental_load: number;
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
  new: "bg-primary/10 text-primary",
  reviewing: "bg-accent/30 text-ink",
  planned: "bg-secondary text-ink",
  done: "bg-success/15 text-ink",
  ignored: "bg-muted text-muted-foreground",
};

// Blueprint 2.0 §6.1
type Priority = { label: string; className: string };
function priorityFor(total: number): Priority {
  if (total >= 13)
    return {
      label: "Kritisk",
      className: "bg-destructive/15 text-destructive border-destructive/30",
    };
  if (total >= 10)
    return { label: "Hög", className: "bg-orange-100 text-orange-800 border-orange-200" };
  if (total >= 6)
    return { label: "Medel", className: "bg-amber-100 text-amber-800 border-amber-200" };
  return { label: "Låg", className: "bg-secondary text-muted-foreground border-border" };
}

const SCALE_LABELS: Record<number, string> = {
  1: "mycket lite",
  2: "lite",
  3: "medel",
  4: "mycket",
  5: "väldigt mycket",
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
  const [frequency, setFrequency] = useState(3);
  const [mentalLoad, setMentalLoad] = useState(3);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setUserId(uid);
      const { data, error: rpcErr } = await supabase.rpc("get_friction_board");
      if (rpcErr) throw rpcErr;
      const rows = (data ?? []) as Array<{
        id: string;
        title: string;
        description: string | null;
        category: string;
        impact: number;
        frequency: number;
        mental_load: number;
        status: Status;
        created_at: string;
        updated_at: string;
        is_mine: boolean;
        vote_count: number;
        has_voted: boolean;
      }>;
      setItems(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          impact: r.impact,
          frequency: r.frequency,
          mental_load: r.mental_load,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
          reporter_id: r.is_mine && uid ? uid : "",
        })) as FrictionItem[],
      );
      const flatVotes: Vote[] = [];
      for (const r of rows) {
        for (let i = 0; i < r.vote_count; i++) {
          flatVotes.push({
            item_id: r.id,
            user_id: r.has_voted && i === 0 && uid ? uid : `anon-${r.id}-${i}`,
          });
        }
      }
      setVotes(flatVotes);
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
      .map((it) => {
        const total = (it.impact ?? 3) + (it.frequency ?? 3) + (it.mental_load ?? 3);
        const voteBonus = voteCounts.get(it.id) ?? 0;
        return {
          item: it,
          votes: voteBonus,
          total,
          priority: priorityFor(total),
          // Total (3–15) styr huvudsorteringen; röster används som tie-breaker.
          score: total * 10 + voteBonus,
        };
      })
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
        frequency,
        mental_load: mentalLoad,
        reporter_id: userId,
      } as never);
      if (insErr) throw insErr;
      setTitle("");
      setDescription("");
      setCategory("ui");
      setImpact(3);
      setFrequency(3);
      setMentalLoad(3);
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
      <MyFlovePageGrid area="flow">
        <MyFloveWide>
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl mb-2 flex items-center gap-2">
                <Flame className="text-primary" /> Feedback & förslag
              </h1>
              <p className="text-muted-foreground">
                Säg till om något skaver – varje liten notis gör appen bättre.
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-2xl p-3 text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div>
              <Button onClick={() => setShowForm((s) => !s)} className="rounded-full">
                <Plus size={16} className="mr-1" /> {showForm ? "Stäng" : "Lämna feedback"}
              </Button>
            </div>

            <MyFloveBlock
              title="Så räknas poängen"
              subtitle="Påverkan, frekvens och mental belastning"
              icon={Flame}
              tone="lavender"
              defaultCollapsed
              collapseId="feedback::poang"
            >
              <p className="text-sm text-muted-foreground">
                Varje friktion bedöms på tre skalor – <strong>påverkan</strong>,{" "}
                <strong>frekvens</strong> och <strong>mental belastning</strong> (1–5 vardera) – som
                ger en totalpoäng 3–15. Röster används som tiebreaker.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full border bg-destructive/15 text-destructive border-destructive/30">
                  Kritisk 13–15
                </span>
                <span className="px-2 py-1 rounded-full border bg-orange-100 text-orange-800 border-orange-200">
                  Hög 10–12
                </span>
                <span className="px-2 py-1 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                  Medel 6–9
                </span>
                <span className="px-2 py-1 rounded-full border bg-secondary text-muted-foreground border-border">
                  Låg 3–5
                </span>
              </div>
            </MyFloveBlock>

            <Dialog open={showForm} onOpenChange={(open) => setShowForm(open)}>
              <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Lämna feedback</DialogTitle>
                </DialogHeader>
              <form
                onSubmit={submit}
                className="space-y-4 pt-2"
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      {
                        label: "Påverkan",
                        hint: "Hur stort är problemet?",
                        value: impact,
                        setter: setImpact,
                      },
                      {
                        label: "Frekvens",
                        hint: "Hur ofta händer det?",
                        value: frequency,
                        setter: setFrequency,
                      },
                      {
                        label: "Mental belastning",
                        hint: "Hur mycket stjäl det energi?",
                        value: mentalLoad,
                        setter: setMentalLoad,
                      },
                    ] as const
                  ).map((axis) => (
                    <div key={axis.label}>
                      <label className="text-sm font-medium block mb-1">{axis.label} (1–5)</label>
                      <select
                        value={axis.value}
                        onChange={(e) => axis.setter(Number(e.target.value))}
                        className="w-full rounded-2xl border border-border bg-background p-3 text-sm"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} – {SCALE_LABELS[n]}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-muted-foreground mt-1">{axis.hint}</p>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2">
                  Totalpoäng blir{" "}
                  <strong className="text-foreground">{impact + frequency + mentalLoad}</strong> –{" "}
                  {priorityFor(impact + frequency + mentalLoad).label} prioritet.
                </div>
                <Button type="submit" disabled={saving || !title.trim()} className="rounded-full">
                  {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : null} Spara
                </Button>
              </form>
              </DialogContent>
            </Dialog>

            {loading ? (
              <p className="text-muted-foreground text-sm">Laddar…</p>
            ) : ranked.length === 0 ? (
              <div className="bg-card border border-border rounded-3xl p-8 text-center text-muted-foreground text-sm">
                Inget friktion loggat än. Lägg till första punkten ovan.
              </div>
            ) : (
              <div className="space-y-3">
                {ranked.map(({ item, votes: v, total, priority }) => {
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
                              className={`text-xs px-2 py-0.5 rounded-full border ${priority.className}`}
                            >
                              {priority.label} · {total} p
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}
                            >
                              {STATUS_LABELS[item.status]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {CATEGORIES.find((c) => c.value === item.category)?.label ??
                                item.category}
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
                          Påverkan {item.impact} · frekvens {item.frequency ?? 3} · mental{" "}
                          {item.mental_load ?? 3} · röster {v}
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
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
