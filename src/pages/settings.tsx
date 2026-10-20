import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Show, useClerk } from "@clerk/react";
import {
  Accessibility,
  Check,
  Compass,
  Languages,
  LayoutGrid,
  LogOut,
  Settings,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";

import Layout from "@/components/layout";
import { PaceBlock as MyFloveBlock, PaceButton as Button } from "@/components/paceable/design-system";
import { PacePageHeader } from "@/components/paceable/page-header";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import PwaInstallButton from "@/components/pwa-install-button";
import { track } from "@/lib/analytics";
import { useLang } from "@/hooks/use-language";
import { LANGUAGES } from "@/lib/i18n";
import { clearTranslationCache } from "@/lib/auto-translate";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  isAlarmSoundEnabled,
  playAlarmPreview,
  setAlarmSoundEnabled,
  subscribeAlarmPref,
} from "@/lib/push-notifications";
import {
  isWorkoutSoundEnabled,
  setWorkoutSoundEnabled,
  subscribeWorkoutSound,
} from "@/lib/workout-voice";

type SettingsLinkProps = {
  href: string;
  icon: typeof Settings;
  label: string;
  hint: string;
};

function SettingsLink({ href, icon: Icon, label, hint }: SettingsLinkProps) {
  return (
    <Link
      href={href}
      className="pace-card-surface flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 text-left transition-colors hover:bg-card"
    >
      <Icon className="size-5 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs leading-snug text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}

export default function SettingsPage() {
  const { signOut } = useClerk();
  const { lang, setLang } = useLang();
  const [alarmEnabled, setAlarmEnabledState] = useState(() => isAlarmSoundEnabled());
  const [simpleModeChosen, setSimpleModeChosen] = useCloudSyncedStorage<boolean>(
    "myflove-simple-mode-chosen",
    false,
  );
  const [simpleModeRaw, setSimpleModeRaw] = useCloudSyncedStorage<boolean>(
    "myflove-simple-mode",
    false,
  );

  const [workoutSound, setWorkoutSoundState] = useState(() => isWorkoutSoundEnabled());

  useEffect(() => subscribeAlarmPref(setAlarmEnabledState), []);
  useEffect(() => subscribeWorkoutSound(setWorkoutSoundState), []);

  const toggleWorkoutSound = () => {
    const next = !workoutSound;
    setWorkoutSoundEnabled(next);
    setWorkoutSoundState(next);
  };

  const simpleMode = simpleModeChosen && simpleModeRaw;
  const toggleSimpleMode = () => {
    setSimpleModeChosen(true);
    setSimpleModeRaw(!simpleMode);
  };

  const toggleAlarm = () => {
    const next = !alarmEnabled;
    setAlarmSoundEnabled(next);
    setAlarmEnabledState(next);
    if (next) playAlarmPreview();
  };

  const replayIntro = () => {
    try {
      window.localStorage.removeItem("myflove-intro-seen");
    } catch {
      // Appen fungerar även när webbläsaren inte tillåter lokal lagring.
    }
    window.location.href = "/idag";
  };

  return (
    <Layout>
      <MyFlovePageGrid className="pace-ds pace-compact-page pace-ds pace-account-forms gap-5">
        <MyFloveWide>
          <PacePageHeader icon={Settings} title="Inställningar" description="Anpassa Paceable, konto och appens inställningar." />
        </MyFloveWide>

        <MyFloveBlock title="Profil och konto" subtitle="Dina uppgifter och ditt konto" icon={User} tone="lavender" surface="lavender">
          <SettingsLink href="/profil" icon={User} label="Min profil" hint="Namn, barn och din livsprofil" />
          <SettingsLink href="/anpassa" icon={Accessibility} label="Anpassa Paceable" hint="Utseende, tydlighet, integritet och konto" />
          <Show when="signed-in">
            <Button
              variant="outline"
              className="min-h-11 w-full justify-start gap-3 rounded-xl"
              onClick={() => {
                track("logout");
                void signOut();
              }}
            >
              <LogOut className="size-5" /> Logga ut
            </Button>
          </Show>
        </MyFloveBlock>

        <MyFloveBlock
          defaultCollapsed
          title="Språk"
          subtitle="Hela appen på svenska eller engelska"
          icon={Languages}
          tone="lavender"
          surface="lavender"
        >
          <div className="pace-form-language-options grid grid-cols-2 gap-2" data-no-translate>
            {LANGUAGES.map((l) => (
              <Button
                key={l.value}
                variant={lang === l.value ? "default" : "outline"}
                aria-pressed={lang === l.value}
                className="min-h-11 justify-start gap-2 rounded-xl py-3"
                onClick={() => {
                  if (l.value === lang) return;
                  if (l.value === "sv") clearTranslationCache();
                  setLang(l.value);
                }}
              >
                <span aria-hidden>{l.flag}</span>
                <span className="text-sm font-semibold">{l.label}</span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            I engelskt läge översätts hela appen. Första gången en ny skärm visas kan några ord
            dröja en sekund innan de byter språk.
          </p>
        </MyFloveBlock>

        <MyFloveBlock defaultCollapsed title="Anpassning" subtitle="Vad som visas och hur Pace hjälper" icon={LayoutGrid} tone="mint" surface="mint">
          <SettingsLink href="/flow-installningar" icon={Sparkles} label="Pace-inställningar" hint="Hjälpnivå, tider och prioriteringar" />
          <Button variant="outline" className="h-auto w-full justify-start gap-3 rounded-2xl py-3 text-left" onClick={toggleSimpleMode}>
            {simpleMode ? <Check className="size-5 shrink-0" /> : <LayoutGrid className="size-5 shrink-0" />}
            <span>
              <span className="block text-sm font-semibold">{simpleMode ? "Visar bara det viktigaste" : "Visar allt i Mer"}</span>
              <span className="block text-xs font-normal text-muted-foreground">Bestäm hur många områden som syns i Mer</span>
            </span>
          </Button>
          <div className="pace-card-surface rounded-2xl border border-border/60 bg-card/70 p-3">
            <p className="text-sm font-semibold text-ink">Din bottenmeny</p>
            <p className="mt-1 text-xs text-muted-foreground">Idag, Kalender, Fånga, Min plats och Mer ligger fast för alla.</p>
          </div>
        </MyFloveBlock>

        <MyFloveBlock defaultCollapsed title="Appen" subtitle="Introduktion, installation och ljud" icon={Settings} tone="sky" surface="sky">
          <SettingsLink href="/oversikt" icon={Compass} label="Så funkar Paceable" hint="En enkel sammanfattning av appen" />
          <Button variant="outline" className="h-auto w-full justify-start gap-3 rounded-2xl py-3" onClick={replayIntro}>
            <Sparkles className="size-5 shrink-0" /> Visa introduktionen igen
          </Button>
          <PwaInstallButton row />
          <Button variant="outline" className="h-auto w-full justify-start gap-3 rounded-2xl py-3" onClick={toggleAlarm}>
            {alarmEnabled ? <Volume2 className="size-5 shrink-0" /> : <VolumeX className="size-5 shrink-0" />}
            Alarmljud: {alarmEnabled ? "på" : "av"}
          </Button>
          <Button
            variant="outline"
            className="h-auto w-full justify-start gap-3 rounded-2xl py-3 text-left"
            onClick={toggleWorkoutSound}
          >
            {workoutSound ? <Volume2 className="size-5 shrink-0" /> : <VolumeX className="size-5 shrink-0" />}
            <span>
              <span className="block text-sm font-semibold">
                Ljud i träningspass: {workoutSound ? "på" : "av"}
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                Pling och röst för "Byt sida", "Nästa övning" och "Vila"
              </span>
            </span>
          </Button>
        </MyFloveBlock>
      </MyFlovePageGrid>
    </Layout>
  );
}
