import { useState } from "react";
import { Briefcase, Check, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import HelpHint from "@/components/help-hint";
import { useWorkProfile } from "@/hooks/use-work-profile";
import {
  ALL_PACES,
  HELP_SUGGESTIONS,
  PACE_META,
  RESPONSIBILITY_SUGGESTIONS,
  hasWorkProfile,
  workProfileSummary,
  type WorkPace,
} from "@/lib/work-profile";

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

/** Min jobbprofil – frivillig kontext som gör Flows jobbförslag mer personliga. */
export default function WorkProfileCard() {
  const { profile, update, toggleIn, clear } = useWorkProfile();
  const filled = hasWorkProfile(profile);
  const [open, setOpen] = useState(!filled);
  const [customResp, setCustomResp] = useState("");
  const [customHelp, setCustomHelp] = useState("");

  const respOptions = Array.from(
    new Set([...RESPONSIBILITY_SUGGESTIONS, ...profile.responsibilities]),
  );
  const helpOptions = Array.from(new Set([...HELP_SUGGESTIONS, ...profile.helpWith]));

  const addCustom = (field: "responsibilities" | "helpWith", value: string, reset: () => void) => {
    const v = value.trim();
    if (!v) return;
    if (!profile[field].includes(v)) toggleIn(field, v);
    reset();
  };

  return (
    <section className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Briefcase size={18} className="text-primary" aria-hidden="true" />
          <h2 className="font-display text-lg text-ink">Min jobbprofil</h2>
          <HelpHint label="Min jobbprofil">
            Berätta kort hur ditt jobb ser ut. Flow använder det som kontext för sina förslag –
            aldrig som regler. Du kan ändra eller ta bort allt när du vill.
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
            ? workProfileSummary(profile)
            : "Inget ifyllt än. Lägg till lite kontext så blir Flows jobbförslag mer personliga."}
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
              <span className="text-muted-foreground">Yrkesroll</span>
              <Input
                value={profile.role}
                onChange={(e) => update({ role: e.target.value })}
                placeholder="T.ex. socialpedagog"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Bransch eller verksamhet</span>
              <Input
                value={profile.industry}
                onChange={(e) => update({ industry: e.target.value })}
                placeholder="T.ex. kommunal skola"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Arbetsplats (frivilligt)</span>
              <Input
                value={profile.workplace}
                onChange={(e) => update({ workplace: e.target.value })}
                placeholder="T.ex. Björkskolan"
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Huvudsakliga ansvarsområden – välj flera eller skriv egna
            </p>
            <div className="flex flex-wrap gap-2">
              {respOptions.map((r) => (
                <Chip
                  key={r}
                  active={profile.responsibilities.includes(r)}
                  onClick={() => toggleIn("responsibilities", r)}
                >
                  {r}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customResp}
                onChange={(e) => setCustomResp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom("responsibilities", customResp, () => setCustomResp(""));
                  }
                }}
                placeholder="Eget ansvarsområde"
              />
              <Button
                variant="secondary"
                onClick={() => addCustom("responsibilities", customResp, () => setCustomResp(""))}
              >
                <Plus size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Arbetstider och arbetssätt</p>
            <div className="flex flex-wrap gap-2">
              {ALL_PACES.map((p: WorkPace) => (
                <Chip
                  key={p}
                  active={profile.pace === p}
                  onClick={() => update({ pace: profile.pace === p ? "" : p })}
                >
                  {PACE_META[p].label}
                </Chip>
              ))}
            </div>
            <Input
              value={profile.hoursNote}
              onChange={(e) => update({ hoursNote: e.target.value })}
              placeholder="T.ex. 08–16, möten oftast förmiddag"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Vad vill du främst ha hjälp med i jobbet?
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

          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Något mer Flow bör veta? (frivilligt)</span>
            <Textarea
              value={profile.note}
              onChange={(e) => update({ note: e.target.value })}
              placeholder="T.ex. jag har svårt att komma igång med dokumentation efter möten"
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
                  toast.success("Jobbprofilen är borttagen");
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
            Flow utgår från det du skrivit, men antar aldrig att alla med samma yrke jobbar
            likadant. Förslagen vägs alltid mot din energi och resten av livspusslet.
          </p>
        </div>
      )}
    </section>
  );
}
