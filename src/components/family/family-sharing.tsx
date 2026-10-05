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
  const { userId, children, items, loading, setItemShares, setItemShareFamily, setItemShareNotify } = useChildren();
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
  const isShared = (i: ChildItem) => i.share_family === true || i.sharedWith.length > 0;
  const visible = onlyShared ? mine.filter(isShared) : mine;
  /** Familjemedlemmar som är kopplade som ett barns eget konto (till dina barnprofiler). */
  const childAccounts = useMemo(
    () => new Set(children.filter((c) => c.owner_id === userId && c.account_user_id).map((c) => c.account_user_id as string)),
    [children, userId],
  );

  const setFamily = async (item: ChildItem, on: boolean) => {
    try {
      await setItemShareFamily(item.id, on);
    } catch {
      toast({ description: "Kunde inte spara delningen just nu.", variant: "destructive" });
    }
  };

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
              Delat ({mine.filter(isShared).length})
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
                  {item.share_family ? (
                    <>
                      <Users size={14} /> Hela familjen
                    </>
                  ) : item.sharedWith.length === 0 ? (
                    <>
                      <Lock size={14} /> Bara du
                    </>
                  ) : (
                    <>
                      <Users size={14} /> Delad med {item.sharedWith.map(memberName).join(", ")}
                    </>
                  )}
                </button>

                {open === item.id && (others.length > 0 || item.share_family) && (
                  <div className="space-y-2">
                    <div role="radiogroup" aria-label={`Vem ser ${item.title}`} className="flex gap-1">
                      {([
                        { v: true, t: "Hela familjen" },
                        { v: false, t: "Utvalda personer" },
                      ] as const).map((o) => (
                        <button
                          key={o.t}
                          type="button"
                          role="radio"
                          aria-checked={(item.share_family === true) === o.v}
                          onClick={() => void setFamily(item, o.v)}
                          className={`flex-1 rounded-full px-2 py-1.5 text-xs font-medium ${
                            (item.share_family === true) === o.v
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-card text-muted-foreground"
                          }`}
                        >
                          {o.t}
                        </button>
                      ))}
                    </div>
                    {item.share_family ? (
                      <p className="text-xs text-muted-foreground">
                        Alla i familjen ser detta, även de som går med senare. Barns egna konton ser
                        bara själva saken, aldrig dina anteckningar eller barnprofilen.
                      </p>
                    ) : (<>
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
                              {childAccounts.has(m.user_id) && (
                                <span className="text-[11px] opacity-80">· barnets konto</span>
                              )}
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
                    </>)}
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
