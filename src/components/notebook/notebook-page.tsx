import { useState } from "react";
import { useUser } from "@clerk/react";
import { useSearch } from "@tanstack/react-router";
import { Plus, Feather, RotateCcw } from "lucide-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { isActiveOwner } from "@/lib/account-scope";
import { localBookDate, type BookKind } from "@/lib/notebook";
import { useNotebook } from "@/hooks/use-notebook";
import { BookNavigation } from "./book-navigation";
import { BookTextEditor } from "./book-editor";
import { DecisionEditor } from "./decision-editor";
import { MapEditor } from "./map-editor";
const questions = [
  "Vad tar plats i dina tankar just nu?",
  "Vad skulle du vilja ge lite mer utrymme?",
  "Finns det något som får vara oklart en stund?",
  "Vad vill du ta med dig från idag?",
];
const titles = {
  diary: "Dagbok",
  decision: "Beslut",
  reflection: "Reflektioner",
  map: "Tankekarta",
};
type PageKind = keyof typeof titles;
function OwnedNotebook({
  owner,
  kind,
  initialEntry,
}: {
  owner: string;
  kind: PageKind;
  initialEntry?: string;
}) {
  const store = useNotebook(owner);
  const [selected, setSelected] = useState<string | null>(initialEntry ?? null);
  const [trash, setTrash] = useState(false);
  const [help, setHelp] = useState(false);
  const entries = store.entities.filter(
    (e) => e.kind === kind && (trash ? e.content.deleted : !e.content.deleted),
  );
  const current = entries.find((e) => e.id === selected);
  const create = (question?: string) => {
    const id = store.create(kind as BookKind, {
      title: "",
      text: "",
      date: localBookDate(),
      ...(question ? { question } : {}),
    });
    if (id) {
      setSelected(id);
      setTrash(false);
    }
  };
  return (
    <section className="notebook" aria-labelledby="notebook-title">
      <BookNavigation kind={kind} />
      <header className="book-header">
        <div>
          <p className="book-muted">Din reflektionsbok</p>
          <h1 id="notebook-title">{titles[kind]}</h1>
        </div>
        <Button onClick={() => create()}>
          <Plus aria-hidden />
          {kind === "diary"
            ? "Nytt inlägg"
            : kind === "decision"
              ? "Nytt beslut"
              : kind === "map"
                ? "Ny karta"
                : "Fri reflektion"}
        </Button>
      </header>
      {kind === "reflection" && (
        <section aria-label="Frivilliga frågor">
          <p className="book-muted">Du får svara, hoppa över eller bara skriva fritt.</p>
          <div className="book-list mt-3">
            {questions.map((q) => (
              <Button key={q} variant="outline" onClick={() => create(q)}>
                <Feather aria-hidden />
                {q}
              </Button>
            ))}
          </div>
        </section>
      )}
      {kind === "diary" && (
        <>
          <Button
            variant="ghost"
            aria-expanded={help}
            aria-controls="diary-perspectives"
            onClick={() => setHelp((v) => !v)}
          >
            Hjälp mig sortera tankarna
          </Button>
          {help && (
            <div className="book-question" id="diary-perspectives">
              <p>Vad hände? Vad kände du? Vad behöver inte lösas just nu?</p>
            </div>
          )}
        </>
      )}
      <div className="book-tools">
        <Button
          variant="ghost"
          aria-pressed={trash}
          onClick={() => {
            setTrash((v) => !v);
            setSelected(null);
          }}
        >
          {trash ? "Tillbaka till boken" : "Papperskorg"}
        </Button>
      </div>
      <div className="book-workspace">
        <aside className="book-list" aria-label="Sparade sidor">
          {entries.length === 0 ? (
            <p className="book-muted">{trash ? "Papperskorgen är tom." : "Inga sidor ännu."}</p>
          ) : (
            entries.map((e) => (
              <Button
                key={e.id}
                variant="ghost"
                aria-pressed={selected === e.id}
                onClick={() => setSelected(e.id)}
              >
                <span className="min-w-0">
                  <strong className="block">
                    {e.content.title || e.content.question || "Utan rubrik"}
                  </strong>
                  <span className="book-muted">
                    {e.content.date}
                    {e.heads.length > 1 ? " · Två versioner" : ""}
                  </span>
                </span>
              </Button>
            ))
          )}
        </aside>
        <div className="book-page">
          {current ? (
            trash ? (
              <div>
                <h2>{current.content.title || "Utan rubrik"}</h2>
                <p className="whitespace-pre-wrap">{current.content.text}</p>
                <Button
                  onClick={() => {
                    store.save(
                      current.id,
                      current.kind,
                      { ...current.content, deleted: false },
                      current.heads.map((h) => h.id),
                    );
                    setTrash(false);
                  }}
                >
                  <RotateCcw aria-hidden />
                  Återställ sida
                </Button>
              </div>
            ) : kind === "decision" ? (
              <DecisionEditor key={current.id} entity={current} store={store} />
            ) : kind === "map" ? (
              <MapEditor key={current.id} entity={current} store={store} />
            ) : (
              <BookTextEditor
                key={current.id}
                entity={current}
                store={store}
                diary={kind === "diary"}
              />
            )
          ) : (
            <div className="book-empty">
              <Feather size={36} aria-hidden />
              <h2 className="mt-4">En sida för dina tankar</h2>
              <p>Välj en sida eller börja på en ny.</p>
            </div>
          )}
        </div>
      </div>
      <p className="book-status" role="status">
        {store.status}
      </p>
    </section>
  );
}
export default function NotebookPage({ kind }: { kind: PageKind }) {
  const { user, isLoaded } = useUser();
  const search = useSearch({ strict: false }) as { entry?: string };
  return (
    <Layout>
      {isLoaded && user && isActiveOwner(user.id) ? (
        <OwnedNotebook
          key={`${user.id}-${kind}`}
          owner={user.id}
          kind={kind}
          initialEntry={search.entry}
        />
      ) : (
        <section className="notebook">
          <p role="status">Öppnar din privata bok…</p>
        </section>
      )}
    </Layout>
  );
}
