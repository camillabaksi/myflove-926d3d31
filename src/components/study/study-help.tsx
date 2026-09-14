import { LifeBuoy, Brain, ListChecks, Sparkles } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import QuickflowCapture from "@/components/quickflow-capture";
import QuickflowList from "@/components/quickflow-list";
import { StudiesSection } from "@/pages/studies";
import { StudyBuddyContent } from "@/pages/flowstudy";

const card = "rounded-3xl border-2 border-border bg-card p-5 shadow-sm";
const sectionTitle = "flex items-center gap-2 font-display text-lg text-ink";

/**
 * All studiehjälp samlad på Studie-sidan: komma igång, bryta ner uppgifter,
 * flashcards/quiz och kurser. Återanvänder befintliga vyer, inget nytt system.
 */
export function StudyHelp() {
  return (
    <section className={card} aria-labelledby="studiehjalp">
      <h2 id="studiehjalp" className="font-display text-lg text-ink">
        Studiehjälp
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Vad behöver du hjälp med?</p>

      <div className="mt-4 space-y-3">
        <CollapsibleSection
          className="rounded-2xl border border-border/70 bg-background p-4"
          headingClassName={sectionTitle}
          defaultCollapsed
          id="studiehjalp-kom-igang"
          title={
            <>
              <LifeBuoy className="h-5 w-5 text-primary" /> Kom igång
            </>
          }
        >
          <p className="mt-1 text-sm text-muted-foreground">
            Töm huvudet först – skriv ner det du bär på, så tar vi en sak i taget. 💙
          </p>
          <div className="mt-3 space-y-3">
            <QuickflowCapture />
            <QuickflowList />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          className="rounded-2xl border border-border/70 bg-background p-4"
          headingClassName={sectionTitle}
          defaultCollapsed
          id="studiehjalp-bryt-ner"
          title={
            <>
              <ListChecks className="h-5 w-5 text-primary" /> Bryt ner uppgift · Mina kurser
            </>
          }
        >
          <div className="mt-3">
            <StudiesSection />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          className="rounded-2xl border border-border/70 bg-background p-4"
          headingClassName={sectionTitle}
          defaultCollapsed
          id="studiehjalp-flashcards"
          title={
            <>
              <Brain className="h-5 w-5 text-primary" /> Flashcards & quiz
            </>
          }
        >
          <div className="mt-3">
            <StudyBuddyContent />
          </div>
        </CollapsibleSection>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden /> Välj bara det du behöver just nu.
      </p>
    </section>
  );
}

export default StudyHelp;
