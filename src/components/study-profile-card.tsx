import { useState } from "react";
import { GraduationCap, Check, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import HelpHint from "@/components/help-hint";
import { useStudyProfile } from "@/hooks/use-study-profile";
import {
  ALL_LEVELS,
  ALL_STUDY_MODES,
  ALL_STUDY_PACES,
  LEVEL_META,
  MODE_META,
  PACE_META,
  STUDY_HELP_SUGGESTIONS,
  STUDY_PREFERENCE_SUGGESTIONS,
  SUBJECT_SUGGESTIONS,
  hasStudyProfile,
  studyProfileSummary,
  type StudyLevel,
  type StudyMode,
  type StudyPace,
} from "@/lib/study-profile";

const card = "rounded-3xl border border-border bg-card p-5 shadow-sm";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      }`}
    >
      {active && <Check size={13} className="mr-1 inline" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Min studieprofil – frivillig kontext som gör Flows studiestöd mer personligt. */
export default function StudyProfileCard() {
  const { profile, update, toggleIn, clear } = useStudyProfile();
  const filled = hasStudyProfile(profile);
  const [open, setOpen] = useState(!filled);
  const [customSubject, setCustomSubject] = useState("");
  const [customHelp, setCustomHelp] = useState("");
  const [customPref, setCustomPref] = useState("");

  const subjectOptions = Array.from(new Set([...SUBJECT_SUGGESTIONS, ...profile.subjects]));
  const helpOptions = Array.from(new Set([...STUDY_HELP_SUGGESTIONS, ...profile.helpWith]));
  const prefOptions = Array.from(
    new Set([...STUDY_PREFERENCE_SUGGESTIONS, ...profile.preferences]),
  );

  const addCustom = (
    field: "subjects" | "helpWith" | "preferences",
    value: string,
    reset: () => void,
  ) => {
    const v = value.trim();
    if (!v) return;
    if (!profile[field].includes(v)) toggleIn(field, v);
    reset();
  };

  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-primary" aria-hidden="true" />
          <h2 className="font-display text-lg text-ink">Min studieprofil</h2>
          <HelpHint label="Min studieprofil">
            Berätta kort hur dina studier ser ut. Flow använder det som kontext när den föreslår
            quiz, flashcards, sammanfattningar och studieplaner – aldrig som fasta regler. Allt är
            frivilligt och går att ändra eller ta bort.
          </HelpHint>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? (
            <>
              <X size={14} className="mr-1" aria-hidden="true" />
              Stäng
            </>
          ) : (
            <>
              <Pencil size={14} className="mr-1" aria-hidden="true" />
              Ändra
            </>
          )}
        </Button>
      </div>

      {!open && (
        <p className="mt-2 text-sm text-muted-foreground">
          {filled
            ? studyProfileSummary(profile)
            : "Inget ifyllt än. Lägg till lite kontext så blir Flows studiestöd mer personligt."}
        </p>
      )}

      {!open && filled && !profile.enabled && (
        <p className="mt-1 text-xs text-muted-foreground">
          Pausad – Flow använder den inte just nu.
        </p>
      )}

      {open && (
        <div className="mt-4 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Ålder (frivilligt)</span>
              <Input
                value={profile.age}
                onChange={(e) => update({ age: e.target.value })}
                inputMode="numeric"
                placeholder="T.ex. 16"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Klass eller årskurs</span>
              <Input
                value={profile.grade}
                onChange={(e) => update({ grade: e.target.value })}
                placeholder="T.ex. åk 2"
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Utbildningsnivå</p>
            <div className="flex flex-wrap gap-2">
              {ALL_LEVELS.map((l: StudyLevel) => (
                <Chip
                  key={l}
                  active={profile.level === l}
                  onClick={() => update({ level: profile.level === l ? "" : l })}
                >
                  {LEVEL_META[l]}
                </Chip>
              ))}
            </div>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Program, linje eller inriktning</span>
            <Input
              value={profile.program}
              onChange={(e) => update({ program: e.target.value })}
              placeholder="T.ex. Naturbruksprogrammet, djurvård"
            />
          </label>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Kurser och ämnen – välj flera eller skriv egna
            </p>
            <div className="flex flex-wrap gap-2">
              {subjectOptions.map((s) => (
                <Chip
                  key={s}
                  active={profile.subjects.includes(s)}
                  onClick={() => toggleIn("subjects", s)}
                >
                  {s}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom("subjects", customSubject, () => setCustomSubject(""));
                  }
                }}
                placeholder="Egen kurs eller ämne"
              />
              <Button
                variant="secondary"
                onClick={() => addCustom("subjects", customSubject, () => setCustomSubject(""))}
              >
                <Plus size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Studietakt</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STUDY_PACES.map((p: StudyPace) => (
                  <Chip
                    key={p}
                    active={profile.pace === p}
                    onClick={() => update({ pace: profile.pace === p ? "" : p })}
                  >
                    {PACE_META[p]}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Distans eller på plats</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STUDY_MODES.map((m: StudyMode) => (
                  <Chip
                    key={m}
                    active={profile.mode === m}
                    onClick={() => update({ mode: profile.mode === m ? "" : m })}
                  >
                    {MODE_META[m]}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Vad vill du främst ha hjälp med i studierna?
            </p>
            <div className="flex flex-wrap gap-2">
              {helpOptions.map((h) => (
                <Chip
                  key={h}
                  active={profile.helpWith.includes(h)}
                  onClick={() => toggleIn("helpWith", h)}
                >
                  {h}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customHelp}
                onChange={(e) => setCustomHelp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom("helpWith", customHelp, () => setCustomHelp(""));
                  }
                }}
                placeholder="Något eget"
              />
              <Button
                variant="secondary"
                onClick={() => addCustom("helpWith", customHelp, () => setCustomHelp(""))}
              >
                <Plus size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Hur lär du dig bäst?</p>
            <div className="flex flex-wrap gap-2">
              {prefOptions.map((pr) => (
                <Chip
                  key={pr}
                  active={profile.preferences.includes(pr)}
                  onClick={() => toggleIn("preferences", pr)}
                >
                  {pr}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customPref}
                onChange={(e) => setCustomPref(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom("preferences", customPref, () => setCustomPref(""));
                  }
                }}
                placeholder="Eget sätt att lära dig"
              />
              <Button
                variant="secondary"
                onClick={() => addCustom("preferences", customPref, () => setCustomPref(""))}
              >
                <Plus size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Något mer Flow bör veta? (frivilligt)</span>
            <Textarea
              value={profile.note}
              onChange={(e) => update({ note: e.target.value })}
              placeholder="T.ex. jag tappar tråden i långa instruktioner"
              rows={2}
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Chip active={profile.enabled} onClick={() => update({ enabled: !profile.enabled })}>
              {profile.enabled ? "Flow använder profilen" : "Pausad"}
            </Chip>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clear();
                  toast.success("Studieprofilen är borttagen");
                }}
              >
                <Trash2 size={14} className="mr-1" aria-hidden="true" />
                Ta bort
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setOpen(false);
                  toast.success("Sparat – Flow tar hänsyn till det här");
                }}
              >
                Klar
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Flow utgår från det du skrivit, men antar aldrig att alla på samma program lär sig
            likadant. Förslagen vägs alltid mot din energi och resten av livspusslet.
          </p>
        </div>
      )}
    </section>
  );
}
