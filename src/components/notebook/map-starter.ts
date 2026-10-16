import type { NotebookStore } from "@/hooks/use-notebook";
import { localBookDate } from "@/lib/notebook";

/** Called only by an explicit new-map or starter-template action. */
export function createMapStarter(
  store: Pick<NotebookStore, "create">,
  bookId: string,
  date = localBookDate(),
) {
  const bubbles = [
    { title: "Börja här", x: 240, y: 240 },
    { title: "En tanke", x: 40, y: 40 },
    { title: "En annan tanke", x: 440, y: 40 },
    { title: "En tanke till", x: 240, y: 440 },
  ];
  const ids: string[] = [];
  for (const [order, bubble] of bubbles.entries()) {
    const id = store.create("node", { ...bubble, text: "", date, bookId, order });
    // Account ownership is checked by the existing store for every write.
    if (!id) return ids;
    ids.push(id);
  }
  for (const to of ids.slice(1)) {
    if (!store.create("edge", { title: "", text: "", date, bookId, from: ids[0], to })) break;
  }
  return ids;
}
