/** Private, append-only revisions: concurrent branches survive ordinary id-list sync. */
export const NOTEBOOK_KEY = "myflove-notebook-revisions-v1";
export type BookKind = "diary" | "decision" | "reflection" | "map" | "point" | "node" | "edge";
export type Column = "pros" | "cons" | "uncertain";
export interface NotebookContent {
  title: string;
  text: string;
  date: string;
  bookId?: string;
  column?: Column;
  important?: boolean;
  starred?: boolean;
  crossed?: boolean;
  order?: number;
  x?: number;
  y?: number;
  from?: string;
  to?: string;
  question?: string;
  source?: { entryId: string; quote: string };
  uncertain?: boolean;
  deleted?: boolean;
}
export interface BookRevision {
  id: string;
  entityId: string;
  kind: BookKind;
  parents: string[];
  createdAt: number;
  content: NotebookContent;
}
export interface BookEntity {
  id: string;
  kind: BookKind;
  content: NotebookContent;
  heads: BookRevision[];
  revisions: BookRevision[];
}
export function localBookDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function projectNotebook(revisions: BookRevision[]): BookEntity[] {
  const groups = new Map<string, BookRevision[]>();
  for (const r of revisions) {
    if (
      !r ||
      typeof r.id !== "string" ||
      typeof r.entityId !== "string" ||
      !Array.isArray(r.parents) ||
      !r.content
    )
      continue;
    const group = groups.get(r.entityId) ?? [];
    group.push(r);
    groups.set(r.entityId, group);
  }
  return [...groups]
    .flatMap(([id, rows]) => {
      const parents = new Set(rows.flatMap((r) => r.parents));
      const heads = rows
        .filter((r) => !parents.has(r.id))
        .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
      const latest = heads[0];
      if (!latest) return [];
      return [{ id, kind: latest.kind, content: latest.content, heads, revisions: rows }];
    })
    .sort((a, b) => (b.heads[0]?.createdAt ?? 0) - (a.heads[0]?.createdAt ?? 0));
}
export function makeRevision(
  entityId: string,
  kind: BookKind,
  content: NotebookContent,
  parents: string[] = [],
): BookRevision {
  return {
    id: crypto.randomUUID(),
    entityId,
    kind,
    parents: [...parents],
    content: structuredClone(content),
    createdAt: Date.now(),
  };
}
export function appendRevision(rows: BookRevision[], revision: BookRevision): BookRevision[] {
  return rows.some((r) => r.id === revision.id) ? rows : [...rows, revision];
}
export function linkedContent(quote: string, entryId: string, bookId: string): NotebookContent {
  return { title: "", text: quote, date: localBookDate(), bookId, source: { entryId, quote } };
}
export function movePoint(
  content: NotebookContent,
  column: Column,
  order: number,
): NotebookContent {
  return { ...content, column, order };
}
