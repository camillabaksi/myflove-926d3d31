import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useBookDraft, type NotebookStore } from "@/hooks/use-notebook";
import { localBookDate, type BookEntity } from "@/lib/notebook";
import { BookHistory, SourceLink } from "./book-editor";
import { MapSketchBubble, MapSketchIcon } from "./map-sketch";
import { createMapStarter } from "./map-starter";
function MapNode({
  entity,
  store,
  zoom,
  list,
  number,
  bounds,
  onOpen,
}: {
  entity: BookEntity;
  store: NotebookStore;
  zoom: number;
  list: boolean;
  number: number;
  bounds: { x: number; y: number };
  onOpen: (id: string) => void;
}) {
  const { draft, update, flush } = useBookDraft(entity, store);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const move = (dx: number, dy: number) =>
    update({
      x: Math.max(0, Math.min(bounds.x, (draft.x ?? 80) + dx)),
      y: Math.max(0, Math.min(bounds.y, (draft.y ?? 80) + dy)),
    });
  return (
    <article
      className={list ? "book-question" : "book-bubble"}
      style={list ? undefined : { left: draft.x ?? 80, top: draft.y ?? 80 }}
      data-node-id={entity.id}
      data-overview={!list && zoom < 0.75}
      data-start={draft.title === "Börja här"}
    >
      {!list && <MapSketchBubble />}
      {!list && zoom < 0.75 ? (
        <button
          type="button"
          className="book-map-open"
          aria-label={`Öppna ${draft.title || `tanke ${number}`}${entity.heads.length > 1 ? ", två versioner" : ""}`}
          onClick={() => onOpen(entity.id)}
        >
          <span>
            {entity.heads.length > 1
              ? "Två versioner"
              : draft.text || draft.title || `Tanke ${number}`}
          </span>
        </button>
      ) : (
        <>
          <div className="book-node-tools">
            {!list && (
              <Button
                variant="ghost"
                size="icon"
                className="book-drag"
                title="Dra för att flytta"
                aria-label={`Flytta ${draft.title || `tanke ${number}`}`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drag.current = {
                    x: e.clientX,
                    y: e.clientY,
                    left: draft.x ?? 80,
                    top: draft.y ?? 80,
                  };
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (d)
                    update({
                      x: Math.max(0, Math.min(bounds.x, d.left + (e.clientX - d.x) / zoom)),
                      y: Math.max(0, Math.min(bounds.y, d.top + (e.clientY - d.y) / zoom)),
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
                onLostPointerCapture={() => {
                  drag.current = null;
                  flush();
                }}
              >
                <MapSketchIcon name="move" />
              </Button>
            )}
            <label className="book-label" htmlFor={`node-${entity.id}`}>
              {draft.title || `Tanke ${number}`}
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Alternativ för ${draft.title || `tanke ${number}`}`}
                >
                  <MapSketchIcon name="more" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="notebook book-map-menu"
                align="end"
                collisionPadding={12}
              >
                {[
                  { icon: "left" as const, dx: -30, dy: 0, label: "Flytta vänster" },
                  { icon: "right" as const, dx: 30, dy: 0, label: "Flytta höger" },
                  { icon: "up" as const, dx: 0, dy: -30, label: "Flytta uppåt" },
                  { icon: "down" as const, dx: 0, dy: 30, label: "Flytta nedåt" },
                ].map((d) => (
                  <DropdownMenuItem
                    key={d.label}
                    onSelect={() => {
                      move(d.dx, d.dy);
                      flush();
                    }}
                  >
                    <MapSketchIcon name={d.icon} />
                    {d.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onSelect={() => {
                    update({ deleted: true });
                    flush();
                  }}
                >
                  <MapSketchIcon name="trash" />
                  Ta bort tanke
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <textarea
            id={`node-${entity.id}`}
            className="book-field"
            value={draft.text}
            placeholder="En tanke…"
            onChange={(e) => update({ text: e.target.value })}
            onBlur={flush}
          />
          <SourceLink entity={entity} store={store} />
          {entity.heads.length > 1 && <BookHistory entity={entity} store={store} />}
        </>
      )}
    </article>
  );
}
export function MapEditor({ entity, store }: { entity: BookEntity; store: NotebookStore }) {
  const { draft, update, reset } = useBookDraft(entity, store);
  const [list, setList] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [newNode, setNewNode] = useState<string | null>(null);
  const [nodeWidth, setNodeWidth] = useState(240);
  const [frameRequested, setFrameRequested] = useState(true);
  const viewport = useRef<HTMLDivElement>(null);
  const fitMap = useCallback(() => {
    const element = viewport.current;
    if (!element) return;
    const bubbles = [...element.querySelectorAll<HTMLElement>("[data-node-id]")];
    if (!bubbles.length || element.clientWidth <= 32 || element.clientHeight <= 32) {
      setZoom(1);
      element.scrollTo({ left: 0, top: 0 });
      return;
    }
    const left = Math.min(...bubbles.map((bubble) => bubble.offsetLeft));
    const top = Math.min(...bubbles.map((bubble) => bubble.offsetTop));
    const right = Math.max(...bubbles.map((bubble) => bubble.offsetLeft + bubble.offsetWidth));
    const bottom = Math.max(...bubbles.map((bubble) => bubble.offsetTop + bubble.offsetHeight));
    const next = Math.max(
      0.3,
      Math.min(
        1,
        (element.clientWidth - 32) / (right - left),
        (element.clientHeight - 32) / (bottom - top),
      ),
    );
    setZoom(next);
    requestAnimationFrame(() => {
      if (viewport.current === element)
        element.scrollTo({
          left: Math.max(0, left * next - 16),
          top: Math.max(0, top * next - 16),
        });
    });
  }, []);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (parseFloat(getComputedStyle(document.documentElement).fontSize) >= 24) setList(true);
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setNodeWidth(Math.max(180, Math.min(240, element.clientWidth - 32)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [list]);
  const nodes = store.entities
    .filter((e) => e.kind === "node" && e.content.bookId === entity.id && !e.content.deleted)
    .sort(
      (a, b) =>
        (a.content.order ?? Number.MAX_SAFE_INTEGER) -
          (b.content.order ?? Number.MAX_SAFE_INTEGER) ||
        Math.min(...a.revisions.map((r) => r.createdAt)) -
          Math.min(...b.revisions.map((r) => r.createdAt)) ||
        a.id.localeCompare(b.id),
    );
  const mapHeight = Math.max(
    800,
    Math.ceil((nodes.length + 1) / 3) * 230 + 40,
    ...nodes.map((n) => (n.content.y ?? 80) + 230),
  );
  const bounds = { x: 1100 - nodeWidth - 16, y: mapHeight - 200 };
  const edges = store.entities.filter(
    (e) =>
      e.kind === "edge" &&
      e.content.bookId === entity.id &&
      !e.content.deleted &&
      nodes.some((n) => n.id === e.content.from) &&
      nodes.some((n) => n.id === e.content.to),
  );
  useEffect(() => {
    if (!frameRequested || list) return;
    const frame = requestAnimationFrame(() => {
      fitMap();
      setFrameRequested(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [frameRequested, list, nodeWidth, nodes.length, fitMap]);
  const openNode = (id: string) => {
    setFrameRequested(false);
    setZoom(1);
    setNewNode(id);
  };
  useEffect(() => {
    if (!newNode) return;
    const node = document.getElementById(`node-${newNode}`);
    if (!node) return;
    (node.closest("[data-node-id]") ?? node).scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
    node.focus({ preventScroll: true });
    setNewNode(null);
  }, [newNode, store.entities, list]);
  const addNode = () => {
    // Reuse a free space after deletion and avoid covering thoughts moved by hand.
    let slot = 0;
    let position = { x: 16, y: 24 };
    while (
      nodes.some(
        (node) =>
          position.x < (node.content.x ?? 80) + nodeWidth &&
          position.x + nodeWidth > (node.content.x ?? 80) &&
          position.y < (node.content.y ?? 80) + 180 &&
          position.y + 180 > (node.content.y ?? 80),
      )
    ) {
      slot += 1;
      position = { x: 16 + (slot % 3) * (nodeWidth + 32), y: 24 + Math.floor(slot / 3) * 230 };
    }
    const id = store.create("node", {
      title: "",
      text: "",
      date: localBookDate(),
      bookId: entity.id,
      ...position,
    });
    if (id) openNode(id);
  };
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
    <div
      className="book-map-editor"
      style={
        {
          "--book-node-width": `${nodeWidth}px`,
          "--book-overview-type": `${1 / zoom}rem`,
        } as CSSProperties
      }
    >
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
      <div className="book-tools book-map-tools">
        <Button onClick={addNode}>
          <MapSketchIcon name="plus" />
          Ny tanke
        </Button>
        <Button variant="outline" aria-pressed={list} onClick={() => setList((v) => !v)}>
          {list ? <MapSketchIcon name="network" /> : <MapSketchIcon name="list" />}
          {list ? "Kartvy" : "Listvy"}
        </Button>
      </div>
      {nodes.length === 0 && (
        <div className="book-map-hint">
          <p>
            Vill du ha något att börja med? En mittpunkt och tre tomma bubblor kan hjälpa tankarna i
            gång.
          </p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => {
              createMapStarter(store, entity.id, draft.date);
              setFrameRequested(true);
            }}
          >
            Använd startmallen
          </Button>
        </div>
      )}
      {!list && nodes.length > 0 && zoom < 0.75 && (
        <p className="book-map-hint">
          Tryck på en bubbla för att skriva. Alla bubblor går att flytta eller ta bort.
        </p>
      )}
      {list ? (
        <div aria-label="Tankar i listvy">
          {nodes.map((n, i) => (
            <MapNode
              key={n.id}
              entity={n}
              store={store}
              zoom={zoom}
              list
              number={i + 1}
              bounds={bounds}
              onOpen={openNode}
            />
          ))}
        </div>
      ) : (
        <>
          <div
            ref={viewport}
            className="book-map-viewport"
            tabIndex={0}
            role="region"
            aria-label="Tankekarta, rullningsbar"
            onPointerDownCapture={() => setFrameRequested(false)}
            onKeyDownCapture={() => setFrameRequested(false)}
          >
            <div style={{ width: 1100 * zoom, height: mapHeight * zoom }}>
              <div
                className="book-map"
                style={{
                  height: mapHeight,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                <svg aria-hidden>
                  {edges.map((e) => {
                    const a = nodes.find((n) => n.id === e.content.from);
                    const b = nodes.find((n) => n.id === e.content.to);
                    if (!a || !b) return null;
                    return (
                      <line
                        key={e.id}
                        x1={(a.content.x ?? 80) + nodeWidth / 2}
                        y1={(a.content.y ?? 80) + 80}
                        x2={(b.content.x ?? 80) + nodeWidth / 2}
                        y2={(b.content.y ?? 80) + 80}
                      />
                    );
                  })}
                </svg>
                {nodes.map((n, i) => (
                  <MapNode
                    key={n.id}
                    entity={n}
                    store={store}
                    zoom={zoom}
                    list={false}
                    number={i + 1}
                    bounds={bounds}
                    onOpen={openNode}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="book-map-zoom" aria-label="Kartans förstoring">
            <Button
              variant="outline"
              size="icon"
              aria-label="Zooma ut"
              title="Zooma ut"
              disabled={zoom <= 0.5}
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            >
              <MapSketchIcon name="zoom-out" />
            </Button>
            <output aria-label="Zoomnivå">{Math.round(zoom * 100)} %</output>
            <Button
              variant="outline"
              size="icon"
              aria-label="Zooma in"
              title="Zooma in"
              disabled={zoom >= 1.5}
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.25))}
            >
              <MapSketchIcon name="zoom-in" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Visa översikt"
              title="Visa översikt"
              onClick={fitMap}
            >
              <MapSketchIcon name="reset" />
            </Button>
          </div>
        </>
      )}
      <details className="book-question book-map-links">
        <summary>Koppla tankar{edges.length > 0 ? ` · ${edges.length} kopplingar` : ""}</summary>
        {nodes.length < 2 && (
          <p className="book-muted">Lägg till minst två tankar för att koppla ihop dem.</p>
        )}
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
              {n.content.text || n.content.title || `Tanke ${i + 1}`}
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
            .map((n) => (
              <option key={n.id} value={n.id}>
                {n.content.text || n.content.title || `Tanke ${nodes.indexOf(n) + 1}`}
              </option>
            ))}
        </select>
        <Button className="mt-3" disabled={!from || !to || from === to} onClick={connect}>
          Koppla ihop
        </Button>
        {edges.map((e) => (
          <div className="book-tools mt-3" key={e.id}>
            <p className="min-w-0 flex-1">
              {nodes.find((n) => n.id === e.content.from)?.content.text ||
                nodes.find((n) => n.id === e.content.from)?.content.title ||
                "Tanke"}{" "}
              ↔{" "}
              {nodes.find((n) => n.id === e.content.to)?.content.text ||
                nodes.find((n) => n.id === e.content.to)?.content.title ||
                "Tanke"}
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
              <MapSketchIcon name="trash" />
            </Button>
          </div>
        ))}
      </details>
      <p className="book-status" role="status">
        {store.status}
      </p>
      <BookHistory entity={entity} store={store} onRestore={reset} />
    </div>
  );
}
