import CollapsibleSection from "@/components/collapsible-section";
import { useState } from "react";
import { Check, Plus, Sparkles, User } from "lucide-react";
import HelpHint from "@/components/help-hint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLifeProfile } from "@/hooks/use-life-profile";
import { useSituation } from "@/hooks/use-situation";
import { ALL_SITUATIONS, SITUATION_META, isActive, type SituationId } from "@/lib/situation";
import {
  DIFFICULTY_OPTIONS,
  ENERGY_GIVES_OPTIONS,
  ENERGY_TAKES_OPTIONS,
  FLOW_PREFERENCE_OPTIONS,
  HELP_OPTIONS,
  STRENGTH_OPTIONS,
  lifeProfileCompletion,
  type LifeFollowups,
  type ListField,
} from "@/lib/life-profile";

const card = "rounded-3xl border-2 border-border bg-card p-5 shadow-sm";

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
      aria-pressed={active}
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

/** En chip-lista med möjlighet att lägga till eget. */
function ChipField({
  title,
  hint,
  options,
  selected,
  onToggle,
}: {
  title: string;
  hint?: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [custom, setCustom] = useState("");
  const all = Array.from(new Set([...options, ...selected]));

  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    if (!selected.includes(v)) onToggle(v);
    setCustom("");
  };

  return (
    <section className={card}>
      <CollapsibleSection
        title={title}
        headingClassName="font-display text-lg text-ink"
        {...(hint ? { description: hint } : {})}
        className="space-y-3"
      >
        <div className="flex flex-wrap gap-2">
          {all.map((o) => (
            <Chip key={o} active={selected.includes(o)} onClick={() => onToggle(o)}>
              {o}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Annat – skriv eget"
          />
          <Button type="button" variant="secondary" onClick={addCustom}>
            <Plus size={14} className="mr-1" aria-hidden="true" />
            Lägg till
          </Button>
        </div>
      </CollapsibleSection>
    </section>
  );
}

/** 👤 Min livsprofil – sektioner som lever inuti Min profil (/profil). */
export function LifeProfileSections() {
  const { profile, update, setFollowup, toggleIn } = useLifeProfile();
  const { situation, toggle, setNote } = useSituation();

  const on = (id: SituationId) => isActive(situation, id);
  const percent = lifeProfileCompletion(profile, situation);

  const chip = (field: ListField, value: string) => toggleIn(field, value);

  const text = (label: string, field: keyof LifeFollowups, placeholder: string, rows = 2) => (
    <label key={field} className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Textarea
        value={String(profile.followups[field] ?? "")}
        onChange={(e) => setFollowup(field, e.target.value)}
        rows={rows}
        placeholder={placeholder}
      />
    </label>
  );

  const worksBoth = on("jobb") && on("studier");

  const followupBlocks: React.ReactNode[] = [];
  if (on("jobb") || on("praktik")) {
    followupBlocks.push(
      <div key="work" className="space-y-3">
        <h3 className="font-medium text-ink">💼 Om ditt arbete</h3>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Roll eller uppgift</span>
          <Input
            value={profile.followups.role}
            onChange={(e) => setFollowup("role", e.target.value)}
            placeholder="T.ex. socialpedagog"
          />
        </label>
        {text("Arbetstider", "workHours", "T.ex. 08–16, ibland kvällspass")}
        {text("Hur flexibel är dagen?", "workFlex", "T.ex. flextid, kan jobba hemifrån ibland")}
        {text("Resväg", "commute", "T.ex. 40 min buss")}
        {text("Arbetsbelastning eller arbetsmiljö (frivilligt)", "workLoad", "T.ex. många möten")}
      </div>,
    );
  }
  if (on("studier")) {
    followupBlocks.push(
      <div key="study" className="space-y-3">
        <h3 className="font-medium text-ink">📚 Om dina studier</h3>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Nivå eller årskurs</span>
          <Input
            value={profile.followups.studyLevel}
            onChange={(e) => setFollowup("studyLevel", e.target.value)}
            placeholder="T.ex. gymnasium åk 2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Program eller inriktning</span>
          <Input
            value={profile.followups.studyProgram}
            onChange={(e) => setFollowup("studyProgram", e.target.value)}
            placeholder="T.ex. naturbruk, djurvård"
          />
        </label>
        {text("Studietider och schema", "studyHours", "T.ex. lektioner mån–tors, distans fredag")}
        {text("Deadlines just nu", "studyDeadlines", "T.ex. inlämning varannan vecka")}
        {text("Studietakt", "studyPace", "T.ex. heltid, distans")}
      </div>,
    );
  }
  if (on("foraldraledig") || on("hemma")) {
    followupBlocks.push(
      <div key="family" className="space-y-3">
        <h3 className="font-medium text-ink">🏠 Vardagslogistik</h3>
        {text(
          "Vad återkommer i din vardag?",
          "familyLogistics",
          "T.ex. hämtning 16, middag, kvällsrutin",
          3,
        )}
      </div>,
    );
  }
  if (on("arbetssokande") || on("mellan-arbeten")) {
    followupBlocks.push(
      <div key="jobsearch" className="space-y-3">
        <h3 className="font-medium text-ink">🔎 Jobbsökandet</h3>
        {text(
          "Hur ser jobbsökandet ut? (frivilligt)",
          "jobSearch",
          "T.ex. några ansökningar i veckan, möte med AF varje månad",
          3,
        )}
      </div>,
    );
  }
  if (on("frilans")) {
    followupBlocks.push(
      <div key="self" className="space-y-3">
        <h3 className="font-medium text-ink">🧑‍💻 Eget företag</h3>
        {text(
          "Hur ser arbetsdagen och administrationen ut?",
          "selfEmployed",
          "T.ex. fakturor i slutet av månaden, kunduppdrag varierar",
          3,
        )}
      </div>,
    );
  }
  if (on("sjukskriven")) {
    followupBlocks.push(
      <div key="sick" className="space-y-3">
        <h3 className="font-medium text-ink">🌿 Vad vill du ha hjälp med?</h3>
        <p className="text-sm text-muted-foreground">
          Du behöver inte berätta något om hälsa eller diagnos. Skriv bara vad du vill att Pace
          hjälper dig med i vardagen just nu.
        </p>
        {text("Vardagen just nu (frivilligt)", "sickLeaveHelp", "T.ex. en sak per dag räcker", 3)}
      </div>,
    );
  }
  if (on("praktik")) {
    followupBlocks.push(
      <div key="internship" className="space-y-3">
        <h3 className="font-medium text-ink">🎓 Praktik / arbetsträning</h3>
        {text("Schema, resväg och belastning", "internship", "T.ex. tre förmiddagar i veckan", 3)}
      </div>,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-xl text-ink">
          <User size={22} className="text-primary" aria-hidden="true" /> Min livsprofil
          <HelpHint label="Min livsprofil">
            Allt är frivilligt. Profilen är kontext till Pace – aldrig regler och aldrig diagnoser.
            Du kan ändra eller ta bort vad som helst när du vill.
          </HelpHint>
        </h2>
        <p className="text-sm text-muted-foreground">
          Berätta lite om din vardag, dina styrkor och vad du vill ha hjälp med. Pace använder det
          för att göra sina förslag mer personliga. Du kan använda appen även om profilen är tom.
        </p>
      </div>

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Profil klar</span>
          <span className="font-display text-lg text-ink">{percent} %</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profile.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
          <span className="text-muted-foreground">
            Låt Pace använda min livsprofil (stäng av utan att radera)
          </span>
        </label>
      </section>

      {/* 1. Min livssituation */}
      <section className={card}>
        <h2 className="font-display text-lg text-ink">Vad beskriver din vardag just nu?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Du kan välja flera – livssituationer kombineras ofta. Pausar du en försvinner ingenting.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_SITUATIONS.map((id) => (
            <Chip key={id} active={on(id)} onClick={() => toggle(id)}>
              {SITUATION_META[id].emoji} {SITUATION_META[id].label}
            </Chip>
          ))}
          <Chip
            active={worksBoth}
            onClick={() => {
              if (worksBoth) {
                toggle("jobb");
                toggle("studier");
              } else {
                if (!on("jobb")) toggle("jobb");
                if (!on("studier")) toggle("studier");
              }
            }}
          >
            💼📚 Arbetar och studerar
          </Chip>
        </div>

        {on("annat") && (
          <label className="mt-4 block space-y-1 text-sm">
            <span className="text-muted-foreground">Beskriv din situation</span>
            <Textarea
              value={situation.entries.annat?.note ?? ""}
              onChange={(e) => setNote("annat", e.target.value)}
              rows={2}
              placeholder="T.ex. tar hand om en anhörig just nu"
            />
          </label>
        )}
      </section>

      {/* 2. Anpassade följdfrågor */}
      {followupBlocks.length > 0 && (
        <section className={card}>
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Sparkles size={16} className="text-primary" aria-hidden="true" />
            Lite mer om din vardag
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bara frågor som passar det du valt. Hoppa över det du inte vill svara på.
          </p>
          <div className="mt-4 space-y-6">{followupBlocks}</div>
        </section>
      )}

      {/* 3–7 */}
      <ChipField
        title="Mina styrkor"
        hint="Vad är du bra på? Pace kan luta sig mot dina styrkor."
        options={STRENGTH_OPTIONS}
        selected={profile.strengths}
        onToggle={(v) => chip("strengths", v)}
      />
      <ChipField
        title="Mina svårigheter"
        hint="Vad brukar bli svårt? Ingen diagnos, bara det du känner igen."
        options={DIFFICULTY_OPTIONS}
        selected={profile.difficulties}
        onToggle={(v) => chip("difficulties", v)}
      />
      <ChipField
        title="Det här vill jag ha hjälp med"
        hint="Det här väger Pace tyngst när förslagen formuleras."
        options={HELP_OPTIONS}
        selected={profile.helpWith}
        onToggle={(v) => chip("helpWith", v)}
      />
      <ChipField
        title="Det här ger mig energi"
        hint="Komplement till din energilogg – inte en ersättning."
        options={ENERGY_GIVES_OPTIONS}
        selected={profile.energyGives}
        onToggle={(v) => chip("energyGives", v)}
      />
      <ChipField
        title="Det här tar energi"
        options={ENERGY_TAKES_OPTIONS}
        selected={profile.energyTakes}
        onToggle={(v) => chip("energyTakes", v)}
      />
      <ChipField
        title="Hur vill jag att Pace hjälper mig?"
        hint="Så här vill du att Pace pratar med dig och föreslår saker."
        options={FLOW_PREFERENCE_OPTIONS}
        selected={profile.flowPreferences}
        onToggle={(v) => chip("flowPreferences", v)}
      />

      <section className={card}>
        <h2 className="font-display text-lg text-ink">Något mer Pace bör veta?</h2>
        <Textarea
          className="mt-3"
          value={profile.note}
          onChange={(e) => update({ note: e.target.value })}
          rows={3}
          placeholder="Skriv fritt – helt frivilligt"
        />
      </section>

      <p className="text-xs text-muted-foreground">
        Din livsprofil sparas automatiskt och används som kontext av Pace. Allt om dig samlas här i
        Min profil.
      </p>
    </div>
  );
}
