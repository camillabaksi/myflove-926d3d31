import { useEffect, useRef, useState } from "react";
import { Baby, Check, Flower2, Languages, Pencil, Plus, Trash2, User } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useChildren, CHILD_COLORS, type Child } from "@/hooks/use-children";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/hooks/use-language";
import { LANGUAGES } from "@/lib/i18n";
import { LifeProfileSections } from "@/pages/life-profile";

/**
 * Min profil – det lilla användaren behöver berätta:
 * vad de heter och vilka barn de vill se i appen.
 * Samma namn driver hälsningen på Hem och rubriken på Mitt batteri.
 */
export default function ProfilePage() {
  const { toast } = useToast();
  const { name, setName } = useUserProfile();
  const { lang, setLang, t } = useLang();
  const [nameDraft, setNameDraft] = useState(name);
  const [savedName, setSavedName] = useState(false);

  const { userId, children, addChild, updateChild, deleteChild } = useChildren();
  const myChildren = children.filter((c) => c.owner_id === userId);

  const [newChildName, setNewChildName] = useState("");
  const [newChildColor, setNewChildColor] = useState(CHILD_COLORS[0]);
  const [addingChild, setAddingChild] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childDraft, setChildDraft] = useState("");

  // Autospara – det användaren skriver ska aldrig kunna gå förlorat
  // bara för att man lämnar sidan utan att trycka Spara.
  const lastSaved = useRef(name);
  useEffect(() => {
    if (nameDraft.trim() === lastSaved.current.trim()) return;
    const id = window.setTimeout(() => {
      lastSaved.current = nameDraft;
      setName(nameDraft);
      setSavedName(true);
      window.setTimeout(() => setSavedName(false), 1500);
    }, 700);
    return () => window.clearTimeout(id);
  }, [nameDraft, setName]);

  const saveName = () => {
    lastSaved.current = nameDraft;
    setName(nameDraft);
    setSavedName(true);
    toast({
      title: "Sparat!",
      description: nameDraft.trim()
        ? `Vi hälsar på dig som ${nameDraft.trim()}.`
        : "Vi kallar dig bara du.",
    });
    setTimeout(() => setSavedName(false), 1500);
  };

  const addChildHandler = async () => {
    const trimmed = newChildName.trim();
    if (!trimmed || addingChild) return;
    setAddingChild(true);
    try {
      await addChild(trimmed, newChildColor);
      setNewChildName("");
      toast({ title: "Tillagt!", description: `${trimmed} finns nu i appen.` });
    } catch {
      toast({ title: "Hoppsan", description: "Det gick inte att spara. Försök igen." });
    } finally {
      setAddingChild(false);
    }
  };

  const startEditChild = (child: Child) => {
    setEditingChildId(child.id);
    setChildDraft(child.name);
  };

  const saveChildName = async (child: Child) => {
    const trimmed = childDraft.trim();
    setEditingChildId(null);
    if (!trimmed || trimmed === child.name) return;
    try {
      await updateChild(child.id, { name: trimmed });
    } catch {
      toast({ title: "Hoppsan", description: "Namnet kunde inte sparas." });
    }
  };

  return (
    <Layout>
      <MyFlovePageGrid area="halsa" className="gap-5">
        <MyFloveWide>
          <MyFloveHeader
            area="halsa"
            title="Min profil"
            emojiKey="wellness"
            description="Allt om dig på ett ställe – ditt namn, dina barn och din livsprofil."
          />
        </MyFloveWide>

        {/* Namn – driver "Hej [namn]!" på Hem och på Mitt batteri */}
        <MyFloveWide className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Vad ska jag kalla dig?</h2>
              <p className="text-xs text-muted-foreground">
                Används i “Hej {name || "…"}!” på startsidan och på ditt batteri.
                {savedName ? " Sparat ✓" : " Sparas automatiskt."}
              </p>
            </div>
          </div>
          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
          >
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Ditt namn"
              maxLength={40}
              className="rounded-2xl"
              onBlur={() => saveName()}
              data-testid="profile-name-input"
            />
            <Button type="submit" className="rounded-2xl" data-testid="profile-name-save">
              {savedName ? <Check size={16} /> : "Spara"}
            </Button>
          </form>
        </MyFloveWide>

        {/* Barn – valfritt, driver barnvyn och kalendern */}
        <MyFloveWide className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Baby size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Mina barn</h2>
              <p className="text-xs text-muted-foreground">
                Valfritt – lägg till barnens namn så får de en egen plats i appen.
              </p>
            </div>
          </div>

          {myChildren.length > 0 && (
            <ul className="mt-3 space-y-2" data-testid="profile-children-list">
              {myChildren.map((child) => (
                <li
                  key={child.id}
                  className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/60 px-3 py-2"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: child.color }}
                    aria-hidden
                  />
                  {editingChildId === child.id ? (
                    <form
                      className="flex flex-1 items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void saveChildName(child);
                      }}
                    >
                      <Input
                        autoFocus
                        value={childDraft}
                        onChange={(e) => setChildDraft(e.target.value)}
                        maxLength={40}
                        className="h-8 rounded-xl"
                      />
                      <Button type="submit" size="sm" variant="ghost" aria-label="Spara namn">
                        <Check size={16} />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-ink">{child.name}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Byt namn på ${child.name}`}
                        onClick={() => startEditChild(child)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Ta bort ${child.name}`}
                        onClick={() => {
                          void deleteChild(child.id).then(() =>
                            toast({
                              title: "Borttaget",
                              description: `${child.name} är borttagen.`,
                            }),
                          );
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void addChildHandler();
            }}
          >
            <div className="flex items-center gap-2">
              <Input
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="Barnets namn"
                maxLength={40}
                className="rounded-2xl"
                data-testid="profile-child-input"
              />
              <Button
                type="submit"
                className="rounded-2xl"
                disabled={!newChildName.trim() || addingChild}
                data-testid="profile-child-add"
              >
                <Plus size={16} className="mr-1" /> Lägg till
              </Button>
            </div>
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Färg">
              {CHILD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={newChildColor === color}
                  aria-label={`Färg ${color}`}
                  onClick={() => setNewChildColor(color)}
                  className={`h-6 w-6 rounded-full border-2 transition ${
                    newChildColor === color ? "border-ink scale-110" : "border-transparent"
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </form>
        </MyFloveWide>

        {/* Språk – svenska eller engelska, byts direkt */}
        <MyFloveWide className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Languages size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">{t("Språk")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("Appens språk – texterna byts direkt.")}
              </p>
            </div>
          </div>
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t("Välj språk för appen")}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={lang === l.value}
                onClick={() => setLang(l.value)}
                data-testid={`profile-lang-${l.value}`}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                  lang === l.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-background/60 text-ink hover:bg-muted/40"
                }`}
              >
                <span aria-hidden>{l.flag}</span> {l.label}
                {lang === l.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </MyFloveWide>

        {/* Menscykel – helt frivillig, avstängd tills användaren svarar ja */}
        <MyFloveWide className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Flower2 size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">
                {t("Vill du använda menscykel i MyFlove?")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("Helt frivilligt. Väljer du Nej visas ingenting om menscykel och Flow tar inte hänsyn till det.")}
              </p>
            </div>
          </div>
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t("Vill du använda menscykel i MyFlove?")}
          >
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                role="radio"
                aria-checked={cycle.answered && cycle.enabled === v}
                onClick={() => setCycleEnabled(v)}
                data-testid={`profile-cycle-${v ? "yes" : "no"}`}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                  cycle.answered && cycle.enabled === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-background/60 text-ink hover:bg-muted/40"
                }`}
              >
                {v ? t("Ja") : t("Nej")}
                {cycle.answered && cycle.enabled === v && <Check size={14} />}
              </button>
            ))}
          </div>
          {cycle.enabled && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("Du hittar menscykeln under Mitt batteri.")}
            </p>
          )}
        </MyFloveWide>

        {/* Livsprofilen bor nu här – en enda profil, inga dubbla vägar */}
        <MyFloveWide className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
          <LifeProfileSections />
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
