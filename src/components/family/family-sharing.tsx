import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, BellOff, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useChildren, type ChildItem, type FamilyMember } from "@/hooks/use-children";

/**
 * Familjedelning: här väljer du sak för sak vad familjen ska se.
 * Återanvänder befintlig barn-/delningslogik (share_child_item) – inget nytt datasystem.
 */
export default function FamilySharing({ members }: { members: FamilyMember[] }) {
  const { userId, children, items, loading, setItemShares, setItemShareNotify } = useChildren();
  const { toast } = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [onlyShared, setOnlyShared] = useState(false);

  const mine = useMemo(
    () => items.filter((i) => i.owner_id && i.owner_id === userId),
    [items, userId],
  );
  const others = useMemo(
    () => members.filter((m) => m.user_id !== userId),
    [members, userId],
  );
  const visible = onlyShared ? mine.filter((i) => i.sharedWith.length > 0) : mine;

  const childName = (id: string) => children.find((c) => c.id === id)?.name ?? "Familjen";
  const memberName = (id: string) =>
    members.find((m) => m.user_id === id)?.display_name ?? "familjemedlem";

  const save = async (item: ChildItem, next: string[]) => {
    try {
      await setItemShares(item.id, next);
    } catch {
      toast({ description: "Kunde inte spara delningen just nu.", variant: "destructive" });
    }
  };

  const toggle = (item: ChildItem, memberId: string) =>
    save(
      item,
      item.sharedWith.includes(memberId)
        ? item.sharedWith.filter((u) => u !== memberId)
        : [...item.sharedWith, memberId],
    );

  const toggleNotify = async (item: ChildItem, memberId: string) => {
    try {
      await setItemShareNotify(item.id, memberId, !item.shareNotify[memberId]);
    } catch {
      toast({ description: "Kunde inte spara notisvalet just nu.", variant: "destructive" });
    }
  };

  return (
    <section className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-base text-ink">Dela valda saker</h2>
        <p className="text-sm text-muted-foreground">
          Allt är privat tills du väljer annat. Välj sak för sak vem i familjen som ska se den.
        </p>
      </div>

      {others.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Bjud in någon med koden ovan – sedan kan du dela enskilda saker med dem.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Laddar...</p>
      ) : mine.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Du har inget att dela än.{" "}
          <Link to="/barn" className="text-primary underline">
            Lägg till något under Barn
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOnlyShared(false)}
              aria-pressed={!onlyShared}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                onlyShared ? "border-border text-muted-foreground" : "border-primary bg-primary/10 text-primary"
              }`}
            >
              Allt ({mine.length})
            </button>
            <button
              type="button"
              onClick={() => setOnlyShared(true)}
              aria-pressed={onlyShared}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                onlyShared ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              Delat ({mine.filter((i) => i.sharedWith.length > 0).length})
            </button>
          </div>

          <ul className="space-y-2">
            {visible.map((item) => (
              <li key={item.id} className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {childName(item.child_id)}
                    {item.date ? ` · ${item.date}` : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(open === item.id ? null : item.id)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.sharedWith.length === 0 ? (
                    <>
                      <Lock size={14} /> Bara du
                    </>
                  ) : (
                    <>
                      <Users size={14} /> Delad med {item.sharedWith.map(memberName).join(", ")}
                    </>
                  )}
                </button>

                {open === item.id && others.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {others.map((m) => {
                        const on = item.sharedWith.includes(m.user_id);
                        const notify = on && item.shareNotify[m.user_id] === true;
                        return (
                          <div key={m.user_id} className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggle(item, m.user_id)}
                              aria-pressed={on}
                              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                                on
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: m.color }}
                              />
                              {m.display_name}
                            </button>
                            {on && (
                              <button
                                type="button"
                                onClick={() => toggleNotify(item, m.user_id)}
                                aria-pressed={notify}
                                aria-label={`Notiser om ${item.title} till ${m.display_name}`}
                                title={
                                  notify
                                    ? `${m.display_name} får notiser om detta`
                                    : `${m.display_name} ser detta men får inga notiser`
                                }
                                className={`flex items-center justify-center rounded-full border h-8 w-8 ${
                                  notify
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground"
                                }`}
                              >
                                {notify ? <Bell size={14} /> : <BellOff size={14} />}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {item.sharedWith.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Klockan bredvid ett namn styr om den personen får notiser om saken. Från
                        början är notiser av – du väljer själv vilka som ska få dem.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-2xl"
                        onClick={() => save(item, others.map((m) => m.user_id))}
                      >
                        Dela med hela familjen
                      </Button>
                      {item.sharedWith.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 rounded-2xl"
                          onClick={() => save(item, [])}
                        >
                          Sluta dela
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
