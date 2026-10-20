import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useBookDraft, type NotebookStore } from "@/hooks/use-notebook";
import { linkedContent, type BookEntity } from "@/lib/notebook";
import { BookOpen, History, Copy, Trash2, RotateCcw } from "lucide-react";

export function BookHistory({
  entity,
  store,
  onRestore,
}: {
  entity: BookEntity;
  store: NotebookStore;
  onRestore?: (content: BookEntity["content"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("");
  const [resolveText, setResolveText] = useState("");
  const conflict = entity.heads.length > 1;
  const resolve = () => {
    const selected = entity.heads.find((r) => r.id === choice);
    if (!selected) return;
    const content = { ...selected.content, text: resolveText };
    if (onRestore) onRestore(content);
    else
      store.save(
        entity.id,
        entity.kind,
        content,
        entity.heads.map((r) => r.id),
      );
    setChoice("");
  };
  return (
    <>
      {conflict && (
        <section className="book-conflict" aria-label="Samtidiga versioner">
          <h3>Två versioner finns kvar</h3>
          <p>Välj en version eller samla texten själv. Inget har tagits bort.</p>
          {entity.heads.map((r, i) => (
            <div key={r.id} className="book-question">
              <p>
                <strong>
                  Version {i + 1}: {r.content.title || "Utan rubrik"}
                </strong>
              </p>
              <p className="whitespace-pre-wrap">{r.content.text}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setChoice(r.id);
                  setResolveText(r.content.text);
                }}
              >
                Utgå från version {i + 1}
              </Button>
            </div>
          ))}
          {choice && (
            <>
              <label className="book-label" htmlFor={`resolve-${entity.id}`}>
                Text att behålla
              </label>
              <textarea
                id={`resolve-${entity.id}`}
                className="book-field"
                value={resolveText}
                onChange={(e) => setResolveText(e.target.value)}
              />
              <Button onClick={resolve}>Bekräfta denna version</Button>
            </>
          )}
        </section>
      )}
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`history-${entity.id}`}
      >
        <History aria-hidden />
        Tidigare versioner
      </Button>
      {open && (
        <div id={`history-${entity.id}`}>
          {[...entity.revisions]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((r, i) => (
              <div className="book-question" key={r.id}>
                <p className="book-muted">
                  Version {entity.revisions.length - i} ·{" "}
                  {new Date(r.createdAt).toLocaleString("sv-SE")}
                </p>
                <p className="whitespace-pre-wrap">
                  {r.content.title}
                  <br />
                  {r.content.text || (r.content.deleted ? "Lagt i papperskorgen" : "Tom text")}
                </p>
                <Button
                  variant="outline"
                  disabled={conflict}
                  onClick={() => {
                    if (onRestore) onRestore(r.content);
                    else
                      store.save(
                        entity.id,
                        entity.kind,
                        r.content,
                        entity.heads.map((h) => h.id),
                      );
                  }}
                >
                  <RotateCcw aria-hidden />
                  Återställ version
                </Button>
              </div>
            ))}
        </div>
      )}
    </>
  );
}
export function SourceLink({ entity, store }: { entity: BookEntity; store: NotebookStore }) {
  const source = entity.content.source;
  if (!source) return null;
  const exists = store.entities.some((e) => e.id === source.entryId && !e.content.deleted);
  return (
    <div className="book-source">
      {exists ? (
        <Link to="/tankar/dagbok" search={{ entry: source.entryId }}>
          Från dagboken ↗
        </Link>
      ) : (
        <span>Ursprungsinlägget finns inte längre. Citatet är kvar.</span>
      )}
    </div>
  );
}
export function BookTextEditor({
  entity,
  store,
  diary = false,
}: {
  entity: BookEntity;
  store: NotebookStore;
  diary?: boolean;
}) {
  const { draft, update, flush, reset } = useBookDraft(entity, store);
  const [print, setPrint] = useState(false);
  const [selection, setSelection] = useState("");
  const [destination, setDestination] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const destinations = store.entities.filter(
    (e) => e.kind === "decision" && !e.content.deleted,
  );
  const copy = () => {
    if (!selection.trim()) return;
    // Tankekarta: skapa en ny karta med citatet som första bubbla, med
    // källlänk tillbaka till dagbokssidan. Originalet rörs aldrig.
    if (destination === "map") {
      const mapId = store.create("map", {
        title: newTitle.trim() || "Tankekarta från dagboken",
        text: "",
        date: draft.date,
      });
      if (!mapId) return;
      const nodeId = store.create("node", {
        ...linkedContent(selection, entity.id, mapId),
        bookId: mapId,
        x: 24,
        y: 24,
      });
      if (nodeId) {
        setCopied("map");
        setCopyOpen(false);
      }
      return;
    }
    const existing = destinations.find((e) => e.id === destination);
    const targetKind = "decision" as const;
    const targetId =
      existing?.id ??
      store.create(targetKind, {
        title:
          newTitle.trim() ||
          "För & emot från dagboken",
        text: "",
        date: draft.date,
      });
    if (!targetId) return;
    const content = {
      ...linkedContent(selection, entity.id, targetId),
      column: "pros" as const, order: Date.now(),
    };
    const child = store.create("point", content);
    if (child) {
      setCopied(targetKind);
      setCopyOpen(false);
    }
  };
  const readSelection = () => {
    const el = textRef.current;
    if (el) setSelection(el.value.slice(el.selectionStart, el.selectionEnd));
  };
  return (
    <div className={diary ? "book-diary" : undefined}>
      <div className={`book-tools ${diary ? "book-diary-tools" : ""}`}>
        <Button
          variant={diary ? "ghost" : "outline"}
          aria-pressed={print}
          onClick={() => setPrint((v) => !v)}
        >
          <BookOpen aria-hidden />
          {print ? "Handskriftsstil" : "Vanlig lässtil"}
        </Button>
        {diary && (
          <Button
            variant="ghost"
            disabled={!selection.trim()}
            onClick={() => {
              flush();
              setCopyOpen((v) => !v);
              setCopied("");
            }}
            aria-expanded={copyOpen}
          >
            <Copy aria-hidden />
            Kopiera markerad text
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Lägg inlägget i papperskorgen"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
      {deleteOpen && (
        <div className="book-conflict">
          <p>Lägga inlägget i papperskorgen? Tidigare versioner finns kvar.</p>
          <div className="book-tools">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={() => {
                update({ deleted: true });
                flush();
              }}
            >
              Lägg i papperskorgen
            </Button>
          </div>
        </div>
      )}
      <div className={diary ? "book-diary-sheet" : undefined}>
        <label className={diary ? "sr-only" : "book-label"} htmlFor="book-date">
          Datum
        </label>
        <input
          id="book-date"
          type="date"
          className={`book-field ${diary ? "book-diary-date" : ""}`}
          value={draft.date}
          onChange={(e) => update({ date: e.target.value })}
        />
        <label className={diary ? "sr-only" : "book-label"} htmlFor="book-title">
          Rubrik, om du vill
        </label>
        <input
          id="book-title"
          className={`book-field ${diary ? "book-diary-title" : ""} ${print ? "book-print" : ""}`}
          placeholder="Ge tankarna en rubrik…"
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
        />
        {draft.question && <p className="book-question">{draft.question}</p>}
        <label className={diary ? "sr-only" : "book-label"} htmlFor="book-text">
          {diary ? "Dina ord" : "Din reflektion"}
        </label>
        <textarea
          ref={textRef}
          id="book-text"
          className={`book-field book-writing ${print ? "book-print" : ""}`}
          placeholder="Här får tankarna ta plats…"
          value={draft.text}
          onChange={(e) => update({ text: e.target.value })}
          onSelect={readSelection}
          onKeyUp={readSelection}
          onPointerUp={readSelection}
        />
      </div>
      <p className="book-status" role="status">
        {store.status}
      </p>
      {copyOpen && (
        <section className="book-conflict" aria-label="Kopiera till boken">
          <h3>Kopiera till…</h3>
          <blockquote className="whitespace-pre-wrap">{selection}</blockquote>
          <label className="book-label" htmlFor="copy-destination">
            Destination
          </label>
          <select
            id="copy-destination"
            className="book-field"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Skapa ny</option>
            <option value="map">Tankekarta (ny karta)</option>
            {destinations.map((e) => (
              <option key={e.id} value={e.id}>
                För & emot: {e.content.title || "Utan rubrik"}
              </option>
            ))}
          </select>
          {!destination && (
            <>
              <label className="book-label" htmlFor="copy-title">
                Ny rubrik
              </label>
              <input
                id="copy-title"
                className="book-field"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </>
          )}
          <p className="book-muted">
            Originalet lämnas kvar. En beslutspunkt läggs i Fördelar och kan flyttas.
          </p>
          <div className="book-tools">
            <Button variant="outline" onClick={() => setCopyOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={copy}>Bekräfta kopia</Button>
          </div>
        </section>
      )}
      {copied && (
        <p role="status">
          Kopian finns i{" "}
          <Link to="/tankar/beslut">För & emot →</Link>
          . Originalet är oförändrat.
        </p>
      )}
      <BookHistory entity={entity} store={store} onRestore={reset} />
    </div>
  );
}
