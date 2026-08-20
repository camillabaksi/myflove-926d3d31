import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Compass, Check, ChevronDown, ChevronUp } from "lucide-react";
import Layout from "@/components/layout";
import { Textarea } from "@/components/ui/textarea";
import HelpHint from "@/components/help-hint";
import WorkProfileCard from "@/components/work-profile-card";
import StudyProfileCard from "@/components/study-profile-card";
import { useSituation } from "@/hooks/use-situation";
import {
  ALL_SITUATIONS,
  SITUATION_META,
  activeSituations,
  isActive,
  type SituationId,
} from "@/lib/situation";

/** Min situation – det övergripande lagret för hur livet ser ut just nu. */
export default function SituationPage() {
  const { situation, toggle, setNote } = useSituation();
  const [open, setOpen] = useState<SituationId | null>(null);
  const active = activeSituations(situation);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
            <Compass size={26} className="text-primary" aria-hidden="true" /> Min situation
            <HelpHint label="Min situation">
              Berätta hur livet ser ut just nu. Flera situationer kan pågå samtidigt. Det ersätter
              inte livsområdena – det slår på och anpassar de delar av appen du behöver.
            </HelpHint>
          </h1>
          <p className="text-muted-foreground">
            Hur ser ditt liv ut just nu? Du kan välja flera, och ändra när som helst. Pausar du en
            situation försvinner ingenting – den ligger kvar och kan tas tillbaka senare.
          </p>
        </div>

        {active.length > 0 && (
          <p className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
            Aktivt nu:{" "}
            <span className="text-ink">
              {active
                .map((id) => `${SITUATION_META[id].emoji} ${SITUATION_META[id].label}`)
                .join(" · ")}
            </span>
          </p>
        )}

        <div className="space-y-3">
          {ALL_SITUATIONS.map((id) => {
            const meta = SITUATION_META[id];
            const on = isActive(situation, id);
            const entry = situation.entries[id];
            const expanded = open === id;

            return (
              <section
                key={id}
                className={`rounded-3xl border p-4 shadow-sm transition ${
                  on ? "border-primary/40 bg-card" : "border-border bg-card/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="flex flex-1 items-start gap-3 text-left"
                    aria-pressed={on}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${
                        on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      {on ? <Check size={15} /> : meta.emoji}
                    </span>
                    <span>
                      <span className="font-display text-lg text-ink">
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="block text-sm text-muted-foreground">{meta.blurb}</span>
                      {!on && entry?.note?.trim() && (
                        <span className="block text-xs text-muted-foreground">
                          Pausad – det du skrivit finns kvar.
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : id)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                    aria-label={expanded ? "Stäng" : "Öppna"}
                  >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {expanded && (
                  <div className="mt-4 space-y-4 border-t border-border pt-4">
                    <label className="block space-y-1 text-sm">
                      <span className="text-muted-foreground">
                        Vill du berätta något om din situation? (frivilligt)
                      </span>
                      <Textarea
                        value={entry?.note ?? ""}
                        onChange={(e) => setNote(id, e.target.value)}
                        rows={2}
                        placeholder="T.ex. 75 % sjukskriven, upptrappning från september"
                      />
                    </label>

                    {id === "jobb" && (
                      <>
                        <WorkProfileCard />
                        <p className="text-xs text-muted-foreground">
                          Jobbuppgifter, möten och projekt finns kvar i{" "}
                          <Link to="/jobb" className="text-primary underline">
                            livsområdet Jobb
                          </Link>
                          .
                        </p>
                      </>
                    )}

                    {id === "studier" && (
                      <>
                        <StudyProfileCard />
                        <p className="text-xs text-muted-foreground">
                          Studieuppgifter, prov, dokument och flashcards finns kvar i{" "}
                          <Link to="/studyflow" className="text-primary underline">
                            StudyFlow
                          </Link>
                          .
                        </p>
                      </>
                    )}

                    {!on && (
                      <p className="text-xs text-muted-foreground">
                        Situationen är pausad just nu – Flow använder den inte, men allt finns kvar.
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Flow väger din situation mot din dag och din energi. Ingen situation låser
          dig – du kan byta, pausa och ta tillbaka när livet ändrar sig.
        </p>
      </div>
    </Layout>
  );
}
