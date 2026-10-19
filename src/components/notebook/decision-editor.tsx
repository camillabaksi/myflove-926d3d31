import { useState } from "react";
import { ArrowUp, ArrowDown, Star, Flag, Plus, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useBookDraft, type NotebookStore } from "@/hooks/use-notebook";
import { localBookDate, type BookEntity, type Column } from "@/lib/notebook";
import { BookHistory, SourceLink } from "./book-editor";
export const columns: { id: Column; label: string }[] = [
  { id: "pros", label: "Fördelar" },
  { id: "cons", label: "Nackdelar" },
  { id: "uncertain", label: "Osäkert än" },
];
function DecisionPoint({
  entity,
  store,
  siblingIds,
}: {
  entity: BookEntity;
  store: NotebookStore;
  siblingIds: string[];
}) {
  const { draft, update, flush } = useBookDraft(entity, store);
  const move = (direction: number) => {
    flush();
    const index = siblingIds.indexOf(entity.id);
    const other = store.entities.find((e) => e.id === siblingIds[index + direction]);
    if (!other) return;
    const current = store.entities.find((e) => e.id === entity.id);
    if (!current) return;
    const ownOrder = current.content.order ?? index;
    update({ order: other.content.order ?? index + direction });
    flush();
    store.save(
      other.id,
      other.kind,
      { ...other.content, order: ownOrder },
      other.heads.map((h) => h.id),
    );
  };
  return (
    <article className="book-point" data-crossed={draft.crossed} data-important={draft.important}>
      <label className="sr-only" htmlFor={`point-${entity.id}`}>
        Punkt {siblingIds.indexOf(entity.id) + 1}
      </label>
      <textarea
        id={`point-${entity.id}`}
        className="book-hand"
        rows={1}
        value={draft.text}
        placeholder="Skriv här…"
        onChange={(e) => update({ text: e.target.value })}
      />
      <div className="book-point-marks">
        {draft.important && <span role="img" aria-label="Viktig"><Flag aria-hidden /></span>}
        {draft.starred && <span role="img" aria-label="Stjärnmarkerad"><Star aria-hidden /></span>}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="book-point-menu" variant="ghost" size="icon" title="Fler alternativ" aria-label="Fler alternativ">
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="notebook book-decision-menu" align="end" collisionPadding={12}>
          <DropdownMenuLabel>Fler alternativ</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={!!draft.important} onCheckedChange={() => update({ important: !draft.important })}>
            Markera som viktig
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={!!draft.starred} onCheckedChange={() => update({ starred: !draft.starred })}>
            Stjärnmarkera
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={!!draft.crossed} onCheckedChange={() => update({ crossed: !draft.crossed })}>
            Stryk över
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {columns.filter((c) => c.id !== (draft.column ?? "pros")).map((c) => (
            <DropdownMenuItem key={c.id} onSelect={() => {
              update({ column: c.id, order: Date.now() });
              flush();
            }}>Flytta till {c.label}</DropdownMenuItem>
          ))}
          <DropdownMenuItem disabled={siblingIds[0] === entity.id} onSelect={() => move(-1)}>
            <ArrowUp aria-hidden />Flytta upp
          </DropdownMenuItem>
          <DropdownMenuItem disabled={siblingIds.at(-1) === entity.id} onSelect={() => move(1)}>
            <ArrowDown aria-hidden />Flytta ner
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => { update({ deleted: true }); flush(); }}>
            <Trash2 aria-hidden />Ta bort punkt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SourceLink entity={entity} store={store} />
      {entity.heads.length > 1 && <BookHistory entity={entity} store={store} />}
    </article>
  );
}
export function DecisionEditor({ entity, store }: { entity: BookEntity; store: NotebookStore }) {
  const { draft, update, reset } = useBookDraft(entity, store);
  const [focus, setFocus] = useState<Column | "all">("all");
  const [help, setHelp] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedDiaryIds, setSelectedDiaryIds] = useState<string[]>([]);
  const [importColumn, setImportColumn] = useState<Column>("pros");
  const diaryEntries = store.entities.filter((e) => e.kind === "diary" && !e.content.deleted && !!e.content.text?.trim());
  const importDiary = () => {
    for (const id of selectedDiaryIds) {
      const source = diaryEntries.find((e) => e.id === id);
      if (!source) continue;
      store.create("point", {
        title: "", text: source.content.text.trim(), date: localBookDate(),
        bookId: entity.id, column: importColumn, order: Date.now(), sourceId: source.id,
      });
    }
    setSelectedDiaryIds([]);
    setImportOpen(false);
  };
  const points = store.entities.filter(
    (e) => e.kind === "point" && e.content.bookId === entity.id && !e.content.deleted,
  );
  const visibleColumns = columns.filter(
    (c) =>
      c.id !== "uncertain" ||
      draft.uncertain ||
      points.some((p) => p.content.column === "uncertain"),
  );
  return (
    <div className="book-decision">
      <label className="sr-only" htmlFor="decision-title">Vad funderar du på?</label>
      <textarea
        id="decision-title"
        className="book-decision-title"
        rows={1}
        placeholder="Vad funderar du på?"
        value={draft.title}
        onChange={(e) => update({ title: e.target.value })}
      />
      <div className="book-decision-options">
        <Button variant="ghost" aria-pressed={!!draft.uncertain} onClick={() => update({ uncertain: !draft.uncertain })}>
          {draft.uncertain ? "Dölj osäkra tankar" : "Lägg till osäkra tankar"}
        </Button>
        <label className="sr-only" htmlFor="decision-focus">Visa spalter</label>
        <select id="decision-focus" className="book-decision-focus" value={focus} onChange={(e) => setFocus(e.target.value as Column | "all")}>
          <option value="all">Visa båda sidorna</option>
          {visibleColumns.map((c) => <option key={c.id} value={c.id}>{c.label} – fokusläge</option>)}
        </select>
      </div>
      <div className="book-columns book-sheet" data-focused={focus !== "all"}>
        {visibleColumns
          .filter((c) => focus === "all" || focus === c.id)
          .map((c) => {
            const siblings = points
              .filter((p) => (p.content.column ?? "pros") === c.id)
              .sort(
                (a, b) =>
                  (a.content.order ?? 0) - (b.content.order ?? 0) || a.id.localeCompare(b.id),
              );
            return (
              <section className="book-column" data-column={c.id} key={c.id} aria-label={c.label}>
                <h2>{c.label}</h2>
                {siblings.map((p) => (
                  <DecisionPoint
                    key={p.id}
                    entity={p}
                    store={store}
                    siblingIds={siblings.map((s) => s.id)}
                  />
                ))}
                <Button
                  className="book-add-line"
                  variant="ghost"
                  onClick={() =>
                    store.create("point", {
                      title: "",
                      text: "",
                      date: localBookDate(),
                      bookId: entity.id,
                      column: c.id,
                      order: Date.now(),
                    })
                  }
                >
                  <Plus aria-hidden />
                  Lägg till…
                </Button>
              </section>
            );
          })}
      </div>
      <div className="book-decision-import">
        <Button variant="outline" onClick={() => setImportOpen((open) => !open)} aria-expanded={importOpen} aria-controls="decision-diary-import">
          Lägg till från dagboken
        </Button>
        {importOpen && (
          <section id="decision-diary-import" className="book-import-panel" aria-label="Välj dagbokstankar">
            <p className="book-muted">Välj en eller flera texter. Originalen ligger kvar i dagboken.</p>
            {diaryEntries.length === 0 ? <p>Inga dagboksinlägg att välja ännu.</p> : (
              <>
                <div className="book-import-list">
                  {diaryEntries.map((entry) => (
                    <label className="book-import-choice" key={entry.id}>
                      <input type="checkbox" checked={selectedDiaryIds.includes(entry.id)} onChange={(event) => setSelectedDiaryIds((ids) => event.target.checked ? [...ids, entry.id] : ids.filter((id) => id !== entry.id))} />
                      <span><strong>{entry.content.title || "Dagbokstanke"}</strong><span className="book-import-preview">{entry.content.text}</span></span>
                    </label>
                  ))}
                </div>
                <label className="book-label" htmlFor="decision-import-column">Lägg till under</label>
                <select id="decision-import-column" className="book-field" value={importColumn} onChange={(event) => setImportColumn(event.target.value as Column)}>
                  <option value="pros">För</option><option value="cons">Emot</option><option value="uncertain">Osäkert / behöver tänka mer</option>
                </select>
                <Button disabled={selectedDiaryIds.length === 0} onClick={importDiary}>Lägg till valda texter</Button>
              </>
            )}
          </section>
        )}
      </div>
      <Button className="book-decision-help" variant="outline" aria-expanded={help} aria-controls="decision-perspectives" onClick={() => setHelp((v) => !v)}>
        Hjälp mig sortera tankarna
      </Button>
      {help && (
        <div id="decision-perspectives" className="book-question">
          <p>Vad känns viktigt för dig just nu?</p>
          <p>Vad vet du, och vad skulle du vilja få veta?</p>
          <p>Finns det något du vill låta vara öppet ett tag?</p>
        </div>
      )}
      <label className="book-label" htmlFor="decision-note">
        En egen eftertanke, om du vill
      </label>
      <textarea
        id="decision-note"
        className="book-field book-writing"
        value={draft.text}
        onChange={(e) => update({ text: e.target.value })}
      />
      <p className="book-status" role="status">
        {store.status}
      </p>
      <div className="book-decision-history"><BookHistory entity={entity} store={store} onRestore={reset} /></div>
    </div>
  );
}
