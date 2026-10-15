import { useState } from "react";
import { ArrowUp, ArrowDown, Star, Strikethrough, Flag, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="book-small-tools">
        <Button
          variant="ghost"
          size="icon"
          title="Viktig"
          aria-label="Markera viktig"
          aria-pressed={!!draft.important}
          onClick={() => update({ important: !draft.important })}
        >
          <Flag aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Stjärna"
          aria-label="Stjärnmarkera"
          aria-pressed={!!draft.starred}
          onClick={() => update({ starred: !draft.starred })}
        >
          <Star aria-hidden fill={draft.starred ? "currentColor" : "none"} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Stryk över"
          aria-label="Stryk över"
          aria-pressed={!!draft.crossed}
          onClick={() => update({ crossed: !draft.crossed })}
        >
          <Strikethrough aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Flytta upp"
          aria-label="Flytta upp"
          disabled={siblingIds[0] === entity.id}
          onClick={() => move(-1)}
        >
          <ArrowUp aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Flytta ner"
          aria-label="Flytta ner"
          disabled={siblingIds.at(-1) === entity.id}
          onClick={() => move(1)}
        >
          <ArrowDown aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Ta bort punkt"
          aria-label="Ta bort punkt"
          onClick={() => {
            update({ deleted: true });
            flush();
          }}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
      <label className="sr-only" htmlFor={`column-${entity.id}`}>
        Flytta till
      </label>
      <select
        id={`column-${entity.id}`}
        className="book-move-select"
        value={draft.column ?? "pros"}
        onChange={(e) => {
          update({ column: e.target.value as Column, order: Date.now() });
          flush();
        }}
      >
        {columns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <SourceLink entity={entity} store={store} />
      {entity.heads.length > 1 && <BookHistory entity={entity} store={store} />}
    </article>
  );
}
export function DecisionEditor({ entity, store }: { entity: BookEntity; store: NotebookStore }) {
  const { draft, update, reset } = useBookDraft(entity, store);
  const [focus, setFocus] = useState<Column | "all">("all");
  const [help, setHelp] = useState(false);
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
    <>
      <label className="book-label" htmlFor="decision-title">
        Vad funderar du på?
      </label>
      <input
        id="decision-title"
        className="book-field"
        placeholder="Ett beslut, stort eller litet…"
        value={draft.title}
        onChange={(e) => update({ title: e.target.value })}
      />
      <div className="book-tools mt-4">
        <Button
          variant="outline"
          aria-pressed={!!draft.uncertain}
          onClick={() => update({ uncertain: !draft.uncertain })}
        >
          Osäkert än
        </Button>
        <Button
          variant="outline"
          aria-expanded={help}
          aria-controls="decision-perspectives"
          onClick={() => setHelp((v) => !v)}
        >
          Hjälp mig sortera tankarna
        </Button>
      </div>
      {help && (
        <div id="decision-perspectives" className="book-question">
          <p>Vad känns viktigt för dig just nu?</p>
          <p>Vad vet du, och vad skulle du vilja få veta?</p>
          <p>Finns det något du vill låta vara öppet ett tag?</p>
        </div>
      )}
      <label className="book-label" htmlFor="decision-focus">
        Visa spalter
      </label>
      <select
        id="decision-focus"
        className="book-field"
        value={focus}
        onChange={(e) => setFocus(e.target.value as Column | "all")}
      >
        <option value="all">Alla spalter</option>
        {visibleColumns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label} – fokusläge
          </option>
        ))}
      </select>
      <div className="book-columns book-sheet">
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
                  Ny punkt
                </Button>
              </section>
            );
          })}
      </div>
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
      <BookHistory entity={entity} store={store} onRestore={reset} />
    </>
  );
}
