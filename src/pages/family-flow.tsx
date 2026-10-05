import { useState } from "react";
import { Link } from "wouter";
import { HeartPulse, Lock } from "lucide-react";

import Layout from "@/components/layout";
import CollapsibleSection from "@/components/collapsible-section";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import ChildProfiles, { ChildProfileDetail } from "@/components/family/child-profiles";
import FamilyLoadCard from "@/components/family/family-load-card";
import DailyFlowList from "@/components/day/daily-flow-list";
import FamilyDayPerspectives from "@/components/day/family-day-perspectives";
import FamilySituation from "@/components/family/family-situation";
import SituationLogOverview from "@/components/family/situation-log-overview";
import type { SituationLogEntry } from "@/components/family/situation-log";
import VisualChildSchedule from "@/components/family/visual-child-schedule";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import RecoveryLibrary from "@/components/recovery/recovery-library";
import RecoveryGapCard from "@/components/recovery/recovery-gap-card";
import { useChildren, CHILD_COLORS } from "@/hooks/use-children";
import { useChildEvents } from "@/hooks/use-child-events";
import { ActivityPictogram } from "@/components/family/activity-pictogram";
import { pictogramForActivity } from "@/lib/child-visual-schedule";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";

/**
 * Family Flow – samma resa som resten av MyFlove, fast för familjen.
 * Fånga → förstå kapacitet → anpassa → nästa rimliga steg → göra → återhämta.
 */
export default function FamilyFlowPage() {
  const { t } = useLang();
  const {
    userId,
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
    isChildAccount,
    members,
    setChildAccount,
  } = useChildren();
  const [showSituation, setShowSituation] = useState(false);
  // Situationen (och dess logg) delas mellan flödet och översikten på sidan.
  const [situationLog, setSituationLog] = useCloudSyncedStorage<SituationLogEntry[]>(
    "myflove-situation-log",
    [],
  );
  const [scheduleChildId, setScheduleChildId] = useState<string | null>(null);
  const [profileChildId, setProfileChildId] = useState<string | null>(null);
  const [helpChildId, setHelpChildId] = useState<string | null>(null);
  const todayEvents = useChildEvents();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = todayEvents.filter((event) => !event.completed && Number(event.time.slice(0, 2)) * 60 + Number(event.time.slice(3, 5)) >= nowMinutes);
  const scheduleChild = children.find((child) => child.id === scheduleChildId) ?? null;
  const profileChild = children.find((child) => child.id === profileChildId) ?? null;
  const helpChild = children.find((child) => child.id === helpChildId) ?? null;

  if (helpChild) {
    return <Layout><MyFlovePageGrid area="hem"><MyFloveWide>
      <div className="mx-auto max-w-2xl space-y-5">
        <Button variant="ghost" type="button" onClick={() => setHelpChildId(null)} className="rounded-2xl">← {t("Barn")}</Button>
        <header className="flex min-w-0 items-center gap-3"><span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">{helpChild.avatar || "💜"}</span><div className="min-w-0"><p className="truncate font-display text-xl font-bold text-ink">{helpChild.name}</p><h1 className="text-sm text-muted-foreground">{t("Vad behöver ni hjälp med just nu?")}</h1></div></header>
        <FamilySituation key={helpChild.id} selectedChildId={helpChild.id} childrenList={[{ id: helpChild.id, name: helpChild.name, helps: helpChild.helps }]} onSaveHelp={(id, helps) => updateChild(id, { helps })} log={(situationLog ?? []).filter((entry) => entry.childId === helpChild.id || (!entry.childId && entry.who === helpChild.name))} onChangeLog={(update) => setSituationLog((prev) => update(prev ?? []))} />
      </div>
    </MyFloveWide></MyFlovePageGrid></Layout>;
  }

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

  if (profileChild) {
    return <Layout><MyFlovePageGrid area="hem"><MyFloveWide>
      <ChildProfileDetail child={profileChild} canEdit={profileChild.owner_id === userId} members={members} onLinkAccount={setChildAccount} onBack={() => setProfileChildId(null)} onSchedule={() => setScheduleChildId(profileChild.id)} onHelp={() => setHelpChildId(profileChild.id)} onUpdate={async (id, d) => updateChild(id, { name: d.name, helps: d.helps, avatar: d.avatar })} onDelete={deleteChild} />
    </MyFloveWide></MyFlovePageGrid></Layout>;
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

            {isChildAccount && <Link href="/kalender" className="flex min-h-14 items-center justify-between rounded-2xl border border-border bg-card px-4 font-semibold text-ink shadow-soft"><span>{t("Min kalender")}</span><span aria-hidden>›</span></Link>}
            {!isChildAccount && <section aria-label={t("Barnen")} className="space-y-3">
              <h2 className="font-display text-lg font-bold text-ink">{t("Barnen")}</h2>
              {children.length === 0 && !loading && <p className="text-sm text-muted-foreground">{t("Inga barn tillagda än. Du kan använda Familj ändå.")}</p>}
              {loading ? <p className="text-sm text-muted-foreground">{t("Laddar...")}</p> : <ChildProfiles
                childrenList={children}
                userId={userId}
                onAdd={async (d) => addChild(d.name, CHILD_COLORS[0]!, undefined, undefined, { helps: d.helps, avatar: d.avatar })}
                onUpdate={async (id, d) => updateChild(id, { name: d.name, helps: d.helps, avatar: d.avatar })}
                onDelete={async (id) => deleteChild(id)}
                onSchedule={(child) => setScheduleChildId(child.id)}
                onHelp={(child) => setHelpChildId(child.id)}
                onSelect={(child) => setProfileChildId(child.id)}
              />}
            </section>}

            <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" aria-label={t("Barnens nästa steg")}>
              <h2 className="font-display text-base font-bold text-ink">{t("Vad händer nu och sen?")}</h2>
              {upcoming.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t("Inga fler tider inlagda idag.")}</p> : (
                <div className="mt-3 space-y-2">{upcoming.slice(0, 2).map((event, index) => (
                  <div key={`${event.childId}-${event.time}-${event.title}-${index}`} className="flex items-center gap-3 rounded-2xl bg-secondary/30 p-2">
                    <ActivityPictogram id={pictogramForActivity(event.title, "calendar")} tone="lavender" className="h-10 w-10 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-primary">{index === 0 ? t("Härnäst") : t("Sedan")} · {event.time} · {event.childName}</span><span className="block truncate text-sm font-medium text-ink">{event.title}</span></span>
                  </div>
                ))}</div>
              )}
              {!isChildAccount && <Button variant="link" className="mt-2 px-0" asChild><Link href="/barn">{t("Visa barnens dagar")}</Link></Button>}
            </section>

            {!isChildAccount && <><section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
              <h2 className="text-base font-semibold text-ink">{t("Vad behöver fungera idag?")}</h2>
              <div className="flex flex-wrap gap-2">
                 <Button
                  type="button"
                  onClick={() => setShowSituation((v) => !v)}
                  className="press min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  {t("Hjälp mig med en situation")}
                 </Button>
              </div>

              {showSituation && (
                <FamilySituation
                  className="pt-1"
                  childrenList={children.map((c) => ({ id: c.id, name: c.name, helps: c.helps }))}
                  onSaveHelp={(id, helps) => updateChild(id, { helps })}
                  log={situationLog ?? []}
                  onChangeLog={(update) => setSituationLog((prev) => update(prev ?? []))}
                />
              )}
            </section>

            <CollapsibleSection id="family-situation-history" title={t("Tidigare situationer")} defaultCollapsed className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" headingClassName="text-base font-semibold text-ink"><SituationLogOverview
              entries={situationLog ?? []}
              onDelete={(id) =>
                setSituationLog((prev) => (prev ?? []).filter((e) => e.id !== id))
              }
            /></CollapsibleSection></>}


            {children.length > 0 && (
               <CollapsibleSection
                id="Dagen för hela familjen"
                title={t("Dagen för hela familjen")}
                 defaultCollapsed
                className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5"
              >
                <FamilyDayPerspectives myDay={<DailyFlowList />} defaultPerspective="familj" />
              </CollapsibleSection>
            )}

             <CollapsibleSection id="family-load" title={t("Familjens belastning")} defaultCollapsed className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" headingClassName="text-base font-semibold text-ink"><FamilyLoadCard /></CollapsibleSection>

             <CollapsibleSection id="family-recovery-gap" title={t("Hitta utrymme för vila")} defaultCollapsed className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" headingClassName="text-base font-semibold text-ink"><RecoveryGapCard title={t("Du kan inte ändra dagen. Men vi kan göra den lite snällare.")} /></CollapsibleSection>

            {children.length > 0 && (
               <CollapsibleSection id="Barnens återhämtning" title={t("Återhämtning · sparade övningar")} defaultCollapsed className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" headingClassName="text-base font-semibold text-ink">
                <RecoveryLibrary initialCategory="barn" />
              </CollapsibleSection>
            )}

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
