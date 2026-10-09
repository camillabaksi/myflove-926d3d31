import { useState } from "react";
import { BrandLogo } from "./brand-logo";
import { PacePage, PaceHeading, PaceSection, PaceCard, PaceField, PaceInput, PaceTextarea, PaceChoiceGroup, PaceChoice, PaceActions, PaceButton, PaceHelp, PaceSwitch, PaceDialogContent, PaceStatus, PaceSelectTrigger, PaceSelectContent } from "./design-system";
import { Dialog, DialogTrigger, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";

/** Isolated examples only. Never imports account stores, analytics or mutations. */
export default function DesignSystemReference() {
  const [dark, setDark] = useState(false);
  const [still, setStill] = useState(false);
  const [draft, setDraft] = useState("");
  const [choice, setChoice] = useState("Hemma");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return <div className={dark ? "dark" : undefined}>
    <PacePage className={still ? "pace-ds-still" : undefined}>
      <header className="pace-ds-reference-header"><BrandLogo compact className="w-48" /><div className="pace-ds-actions"><PaceButton variant="outline" onClick={() => setDark(!dark)}>{dark ? "Ljust läge" : "Mörkt läge"}</PaceButton><PaceButton variant="outline" aria-pressed={still} onClick={() => setStill(!still)}>Stilla läge</PaceButton></div></header>
      <PaceHeading editorial>Din vardag, i din takt.</PaceHeading>
      <p className="pace-ds-help">Paceables designsystem · Fristående exempel, inget sparas på ditt konto.</p>
      <PaceSection title="Ett steg i taget">
        <div className="pace-ds-reference-grid">
          <PaceCard><PaceHeading level={3}>En lugn morgon</PaceHeading><p>Frukost och en stund utan krav.</p><PaceButton variant="outline">Visa planen</PaceButton></PaceCard>
          <PaceCard><PaceHeading level={3}>Det som behöver plats</PaceHeading><p>Långa namn och meningar får brytas utan att något försvinner.</p><PaceStatus state="empty">Inget planerat här ännu.</PaceStatus></PaceCard>
        </div>
      </PaceSection>
      <PaceSection title="Få ner en tanke">
        <form className="pace-ds-card pace-ds-field" onSubmit={(event) => { event.preventDefault(); if (!draft.trim()) { setError("Skriv ett namn innan du fortsätter."); setSaved(false); return; } setError(""); setSaved(true); }} noValidate>
          <PaceField label="Vad vill du kalla planen?" required help="Du kan ändra namnet senare." error={error}><PaceInput value={draft} onChange={(event) => { setDraft(event.target.value); setSaved(false); }} /></PaceField>
          <PaceField label="Några ord för dig själv" help="Valfritt."><PaceTextarea placeholder="Vad vill du komma ihåg?" /></PaceField>
          <PaceChoiceGroup label="Var passar det bäst?">{["Hemma", "På väg", "En plats med ett längre beskrivande namn"].map((name) => <PaceChoice key={name} type="button" selected={choice === name} onClick={() => setChoice(name)}>{name}</PaceChoice>)}</PaceChoiceGroup>
          <Select defaultValue="later"><PaceField label="När?"><PaceSelectTrigger><SelectValue /></PaceSelectTrigger></PaceField><PaceSelectContent className={dark ? "dark" : undefined}><SelectItem value="later">Senare, när det finns utrymme</SelectItem><SelectItem value="today">I dag</SelectItem></PaceSelectContent></Select>
          <PaceSwitch label="Visa en påminnelse i exemplet" help="Inställningen gäller bara denna sida." />
          <PaceActions><PaceHelp type="button" onClick={() => setError("Detta är ett exempel; inget skickas eller sparas på ditt konto.")}>Varför?</PaceHelp><PaceButton type="submit">Spara exempel</PaceButton></PaceActions>
          {saved && <PaceStatus state="saved">Exemplet är klart; inget har sparats på ditt konto.</PaceStatus>}
        </form>
      </PaceSection>
      <PaceSection title="Tillstånd och dialog">
        <PaceStatus state="loading">Hämtar innehåll…</PaceStatus><PaceStatus state="saving">Sparar…</PaceStatus><PaceStatus state="error">Det gick inte att spara. Dina val finns kvar.</PaceStatus>
        <PaceActions><PaceButton disabled>Inte tillgängligt</PaceButton><PaceButton variant="destructive">Ta bort exempel</PaceButton>
          <Dialog><DialogTrigger asChild><PaceButton variant="outline">Öppna dialog</PaceButton></DialogTrigger>
            <PaceDialogContent className={dark ? `dark${still ? " pace-ds-still" : ""}` : still ? "pace-ds-still" : undefined}>
              <DialogTitle>En stund för dig</DialogTitle><DialogDescription>Exemplet visar en dialog med samma lugna yta och tydliga val.</DialogDescription>
              <PaceField label="En egen anteckning"><PaceTextarea defaultValue="Ett osparat exempel" /></PaceField><PaceActions><DialogClose asChild><PaceButton variant="outline">Avbryt</PaceButton></DialogClose><DialogClose asChild><PaceButton>Klart</PaceButton></DialogClose></PaceActions>
            </PaceDialogContent>
          </Dialog>
        </PaceActions>
      </PaceSection>
    </PacePage>
  </div>;
}