import { useEffect, useRef, useState } from "react";
import {
  Move,
  Plus,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  ZoomIn,
  ZoomOut,
  Scan,
  List,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookDraft, type NotebookStore } from "@/hooks/use-notebook";
import { localBookDate, type BookEntity } from "@/lib/notebook";
import { BookHistory, SourceLink } from "./book-editor";
function MapNode({
  entity,
  store,
  zoom,
  list,
}: {
  entity: BookEntity;
  store: NotebookStore;
  zoom: number;
  list: boolean;
}) {
  const { draft, update, flush } = useBookDraft(entity, store);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const move = (dx: number, dy: number) =>
    update({
      x: Math.max(0, Math.min(850, (draft.x ?? 80) + dx)),
      y: Math.max(0, Math.min(600, (draft.y ?? 80) + dy)),
    });
  return (
    <article
      className={list ? "book-question" : "book-bubble"}
      style={list ? undefined : { left: draft.x ?? 80, top: draft.y ?? 80 }}
    >
      {!list && (
        <Button
          variant="ghost"
          size="icon"
          className="book-drag"
          title="Flytta tanke"
          aria-label="Flytta tanke"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, left: draft.x ?? 80, top: draft.y ?? 80 };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d)
              update({
                x: Math.max(0, Math.min(850, d.left + (e.clientX - d.x) / zoom)),
                y: Math.max(0, Math.min(600, d.top + (e.clientY - d.y) / zoom)),
              });
          }}
          onPointerUp={() => {
            drag.current = null;
            flush();
          }}
          onPointerCancel={() => {
            drag.current = null;
            flush();
          }}
        >
          <Move aria-hidden />
        </Button>
      )}
      <label className="book-label" htmlFor={`node-${entity.id}`}>
        Tanke
      </label>
      <textarea
        id={`node-${entity.id}`}
        className="book-field"
        value={draft.text}
        placeholder="En tanke…"
        onChange={(e) => update({ text: e.target.value })}
      />
      <div className="book-small-tools">
        {[
          { icon: ArrowLeft, dx: -30, dy: 0, label: "Flytta vänster" },
          { icon: ArrowRight, dx: 30, dy: 0, label: "Flytta höger" },
          { icon: ArrowUp, dx: 0, dy: -30, label: "Flytta uppåt" },
          { icon: ArrowDown, dx: 0, dy: 30, label: "Flytta nedåt" },
        ].map((d) => (
          <Button
            key={d.label}
            variant="ghost"
            size="icon"
            aria-label={d.label}
            title={d.label}
            onClick={() => move(d.dx, d.dy)}
          >
            <d.icon aria-hidden />
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ta bort tanke"
          title="Ta bort tanke"
          onClick={() => {
            update({ deleted: true });
            flush();
          }}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
      <SourceLink entity={entity} store={store} />
      {entity.heads.length > 1 && <BookHistory entity={entity} store={store} />}
    </article>
  );
}
export function MapEditor({ entity, store }: { entity: BookEntity; store: NotebookStore }) {
  const { draft, update, reset } = useBookDraft(entity, store);
  const [list, setList] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (parseFloat(getComputedStyle(document.documentElement).fontSize) >= 24) setList(true);
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);
  const nodes = store.entities.filter(
    (e) => e.kind === "node" && e.content.bookId === entity.id && !e.content.deleted,
  );
  const edges = store.entities.filter(
    (e) =>
      e.kind === "edge" &&
      e.content.bookId === entity.id &&
      !e.content.deleted &&
      nodes.some((n) => n.id === e.content.from) &&
      nodes.some((n) => n.id === e.content.to),
  );
  const connect = () => {
    if (
      !from ||
      !to ||
      from === to ||
      edges.some(
        (e) =>
          (e.content.from === from && e.content.to === to) ||
          (e.content.from === to && e.content.to === from),
      )
    )
      return;
    store.create("edge", {
      title: "",
      text: "",
      date: localBookDate(),
      bookId: entity.id,
      from,
      to,
    });
    setFrom("");
    setTo("");
  };
  return (
    <>
      <label className="book-label" htmlFor="map-title">
        Kartans rubrik
      </label>
      <input
        id="map-title"
        className="book-field"
        value={draft.title}
        placeholder="Vad vill du utforska?"
        onChange={(e) => update({ title: e.target.value })}
      />
      <div className="book-tools mt-4">
        <Button
          onClick={() =>
            store.create("node", {
              title: "",
              text: "",
              date: localBookDate(),
              bookId: entity.id,
              x: 60 + (nodes.length % 3) * 280,
              y: 60 + (Math.floor(nodes.length / 3) % 3) * 230,
            })
          }
        >
          <Plus aria-hidden />
          Ny tanke
        </Button>
        <Button variant="outline" aria-pressed={list} onClick={() => setList((v) => !v)}>
          {list ? <Network aria-hidden /> : <List aria-hidden />}
          {list ? "Kartvy" : "Listvy"}
        </Button>
        {!list && (
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Zooma ut"
              title="Zooma ut"
              disabled={zoom <= 0.5}
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            >
              <ZoomOut aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Zooma in"
              title="Zooma in"
              disabled={zoom >= 1.5}
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.25))}
            >
              <ZoomIn aria-hidden />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setZoom(1);
                viewport.current?.scrollTo({ left: 0, top: 0 });
              }}
            >
              <Scan aria-hidden />
              Till början
            </Button>
          </>
        )}
      </div>
      {list ? (
        <div aria-label="Tankar i listvy">
          {nodes.map((n) => (
            <MapNode key={n.id} entity={n} store={store} zoom={zoom} list />
          ))}
        </div>
      ) : (
        <div
          ref={viewport}
          className="book-map-viewport"
          tabIndex={0}
          role="region"
          aria-label="Tankekarta, rullningsbar"
        >
          <div style={{ width: 1100 * zoom, height: 800 * zoom }}>
            <div
              className="book-map"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            >
              <svg aria-hidden>
                {edges.map((e) => {
                  const a = nodes.find((n) => n.id === e.content.from);
                  const b = nodes.find((n) => n.id === e.content.to);
                  if (!a || !b) return null;
                  return (
                    <line
                      key={e.id}
                      x1={(a.content.x ?? 80) + 120}
                      y1={(a.content.y ?? 80) + 100}
                      x2={(b.content.x ?? 80) + 120}
                      y2={(b.content.y ?? 80) + 100}
                    />
                  );
                })}
              </svg>
              {nodes.map((n) => (
                <MapNode key={n.id} entity={n} store={store} zoom={zoom} list={false} />
              ))}
            </div>
          </div>
        </div>
      )}
      <section className="book-question">
        <h2>Kopplingar</h2>
        <label className="book-label" htmlFor="link-from">
          Från tanke
        </label>
        <select
          id="link-from"
          className="book-field"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        >
          <option value="">Välj tanke</option>
          {nodes.map((n, i) => (
            <option key={n.id} value={n.id}>
              {n.content.text || `Tanke ${i + 1}`}
            </option>
          ))}
        </select>
        <label className="book-label" htmlFor="link-to">
          Till tanke
        </label>
        <select
          id="link-to"
          className="book-field"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        >
          <option value="">Välj tanke</option>
          {nodes
            .filter((n) => n.id !== from)
            .map((n, i) => (
              <option key={n.id} value={n.id}>
                {n.content.text || `Tanke ${i + 1}`}
              </option>
            ))}
        </select>
        <Button className="mt-3" disabled={!from || !to || from === to} onClick={connect}>
          Koppla ihop
        </Button>
        {edges.map((e) => (
          <div className="book-tools mt-3" key={e.id}>
            <p className="min-w-0 flex-1">
              {nodes.find((n) => n.id === e.content.from)?.content.text || "Tanke"} ↔{" "}
              {nodes.find((n) => n.id === e.content.to)?.content.text || "Tanke"}
            </p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ta bort koppling"
              title="Ta bort koppling"
              onClick={() =>
                store.save(
                  e.id,
                  e.kind,
                  { ...e.content, deleted: true },
                  e.heads.map((h) => h.id),
                )
              }
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        ))}
      </section>
      <p className="book-status" role="status">
        {store.status}
      </p>
      <BookHistory entity={entity} store={store} onRestore={reset} />
    </>
  );
}
