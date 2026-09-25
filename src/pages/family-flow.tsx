import { useState } from "react";
import { Link } from "wouter";
import { HeartPulse, Lock } from "lucide-react";

import Layout from "@/components/layout";
import CollapsibleSection from "@/components/collapsible-section";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import ChildProfiles from "@/components/family/child-profiles";
import FamilyLoadCard from "@/components/family/family-load-card";
import DailyFlowList from "@/components/day/daily-flow-list";
import FamilyDayPerspectives from "@/components/day/family-day-perspectives";
import FamilySituation from "@/components/family/family-situation";
import VisualChildSchedule from "@/components/family/visual-child-schedule";
import RecoveryGapCard from "@/components/recovery/recovery-gap-card";
import { useChildren, CHILD_COLORS } from "@/hooks/use-children";
import { useLang } from "@/hooks/use-language";

/**
 * Family Flow – samma resa som resten av MyFlove, fast för familjen.
 * Fånga → förstå kapacitet → anpassa → nästa rimliga steg → göra → återhämta.
 */
export default function FamilyFlowPage() {
  const { t } = useLang();
  const {
    children,
    items,
    loading,
    addChild,
    updateChild,
    deleteChild,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    uploadDoc,
    copyDoc,
    openDoc,
  } = useChildren();
  const [showSituation, setShowSituation] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const [scheduleChildId, setScheduleChildId] = useState<string | null>(null);
  const scheduleChild = children.find((child) => child.id === scheduleChildId) ?? null;

  if (scheduleChild) {
    return (
      <Layout>
        <MyFlovePageGrid area="hem">
          <MyFloveWide>
            <VisualChildSchedule child={scheduleChild} children={children} items={items} onClose={() => setScheduleChildId(null)} addItem={addItem} updateItem={updateItem} toggleItem={toggleItem} deleteItem={deleteItem} uploadDoc={uploadDoc} copyDoc={copyDoc} openDoc={openDoc} />
          </MyFloveWide>
        </MyFlovePageGrid>
      </Layout>
    );
  }

  return (
    <Layout>
      <MyFlovePageGrid area="hem">
        <MyFloveWide>
          <div className="space-y-6">
            <header>
              <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink sm:text-3xl">
                <HeartPulse size={24} aria-hidden /> {t("Familj")}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {t("Få vardagen att fungera för hela familjen.")}
              </p>
            </header>

            <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
              <h2 className="text-base font-semibold text-ink">{t("Vad behöver fungera idag?")}</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowSituation((v) => !v)}
                  className="press min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  {t("Hjälp mig med en situation")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChildren((v) => !v)}
                  className="press min-h-11 rounded-full border border-border bg-card px-4 text-sm font-medium text-ink"
                >
                  {t("Lägg till barn")}
                </button>
              </div>

              {showSituation && (
                <FamilySituation
                  className="pt-1"
                  childrenList={children.map((c) => ({ id: c.id, name: c.name, helps: c.helps }))}
                />
              )}
            </section>

            {children.length > 0 && (
              <CollapsibleSection
                id="Dagen för hela familjen"
                title={t("Dagen för hela familjen")}
                className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5"
              >
                <FamilyDayPerspectives myDay={<DailyFlowList />} defaultPerspective="familj" />
              </CollapsibleSection>
            )}

            <FamilyLoadCard />

            <RecoveryGapCard title={t("Du kan inte ändra dagen. Men vi kan göra den lite snällare.")} />

            <CollapsibleSection id="Barnen" title={t("Barnen")} className="space-y-3">
              {children.length === 0 && !showChildren && !loading && (
                <p className="text-sm text-muted-foreground">
                  {t("Inga barn tillagda än. Du kan använda Familj ändå.")}
                </p>
              )}
              {loading ? (
                <p className="text-sm text-muted-foreground">{t("Laddar...")}</p>
              ) : (
                <ChildProfiles
                  childrenList={children}
                  startAdding={showChildren}
                  onAdd={async (d) =>
                    addChild(d.name, CHILD_COLORS[0]!, undefined, undefined, {
                      helps: d.helps,
                      avatar: d.avatar,
                    })
                  }
                  onUpdate={async (id, d) =>
                    updateChild(id, { name: d.name, helps: d.helps, avatar: d.avatar })
                  }
                  onDelete={async (id) => deleteChild(id)}
                  onSchedule={(child) => setScheduleChildId(child.id)}
                />
              )}
            </CollapsibleSection>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock size={12} aria-hidden />
              {t("Barninformation är privat och delas inte med någon annan.")}
            </p>

            <p className="text-sm text-muted-foreground">
              <Link href="/barn" className="underline underline-offset-2 hover:text-foreground">
                {t("Barnens scheman och dokument")}
              </Link>
              {" · "}
              <Link href="/familj" className="underline underline-offset-2 hover:text-foreground">
                {t("Dela listor och kalender")}
              </Link>
            </p>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
