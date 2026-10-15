import { useCallback, useEffect, useRef, useState } from "react";
import {
  useCloudSyncedStorage,
  hasUnsyncedCloudData,
  syncKeyNow,
  useCloudSyncStatus,
} from "@/lib/cloud-storage";
import { getDataOwner, isActiveOwner } from "@/lib/account-scope";
import {
  getSecureStatus,
  hasUnpersistedSecureWrites,
  SECURE_STATUS_EVENT,
} from "@/lib/secure-local";
import {
  appendRevision,
  makeRevision,
  NOTEBOOK_KEY,
  projectNotebook,
  type BookKind,
  type BookRevision,
  type NotebookContent,
  type BookEntity,
} from "@/lib/notebook";

export function useNotebook(owner: string) {
  const [revisions, setRevisions] = useCloudSyncedStorage<BookRevision[]>(NOTEBOOK_KEY, []);
  const cloud = useCloudSyncStatus();
  const [statusTick, setStatusTick] = useState(0);
  useEffect(() => {
    const update = () => setStatusTick((t) => t + 1);
    window.addEventListener(SECURE_STATUS_EVENT, update);
    const timer = window.setInterval(update, 1500);
    return () => {
      window.removeEventListener(SECURE_STATUS_EVENT, update);
      clearInterval(timer);
    };
  }, []);
  void statusTick;
  const save = useCallback(
    (entityId: string, kind: BookKind, content: NotebookContent, parents: string[]) => {
      if (!isActiveOwner(owner)) return null;
      const revision = makeRevision(entityId, kind, content, parents);
      setRevisions((rows) => appendRevision(rows, revision));
      return revision;
    },
    [owner, setRevisions],
  );
  const create = useCallback(
    (kind: BookKind, content: NotebookContent) => {
      const id = crypto.randomUUID();
      return save(id, kind, content, []) ? id : null;
    },
    [save],
  );
  const secure = getSecureStatus();
  const status = !isActiveOwner(owner)
    ? "Kontot har ändrats. Öppna boken igen."
    : secure !== "ready" || hasUnpersistedSecureWrites()
      ? "Väntar på krypterad sparning på enheten. Behåll sidan öppen."
      : hasUnsyncedCloudData(NOTEBOOK_KEY)
        ? cloud === "error"
          ? "Sparat på enheten. Synk misslyckades – försöker igen."
          : "Sparat på enheten · väntar på synk"
        : "Synkat med kontot";
  return {
    entities: isActiveOwner(owner) ? projectNotebook(revisions) : [],
    save,
    create,
    status,
    retry: () => syncKeyNow(NOTEBOOK_KEY),
  };
}
export type NotebookStore = ReturnType<typeof useNotebook>;

/** A started draft never adopts an incoming revision. Navigation flushes only to its original owner. */
export function useBookDraft(entity: BookEntity, store: NotebookStore) {
  const [draft, setDraft] = useState(entity.content);
  const draftRef = useRef(entity.content);
  const parents = useRef(entity.heads[0] ? [entity.heads[0].id] : []);
  const dirty = useRef(false);
  const editing = useRef(false);
  const owner = useRef(getDataOwner());
  const saveRef = useRef(store.save);
  saveRef.current = store.save;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (!dirty.current || !isActiveOwner(owner.current)) return;
    const revision = saveRef.current(entity.id, entity.kind, draftRef.current, parents.current);
    if (revision) {
      parents.current = [revision.id];
      dirty.current = false;
    }
  }, [entity.id, entity.kind]);
  const incomingIds = entity.heads.map((r) => r.id).join("|");
  useEffect(() => {
    if (editing.current || dirty.current) return;
    draftRef.current = entity.content;
    parents.current = entity.heads[0] ? [entity.heads[0].id] : [];
    setDraft(entity.content);
  }, [incomingIds]); // intentionally does not replace an active writing session
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const hadDraft = dirty.current;
      flush();
      if (hadDraft || hasUnpersistedSecureWrites()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const onHidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", onHidden);
      flush();
    };
  }, [flush]);
  const update = (patch: Partial<NotebookContent>) => {
    editing.current = true;
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 450);
  };
  return {
    draft,
    update,
    flush,
    reset: (content: NotebookContent) => {
      flush();
      editing.current = false;
      draftRef.current = content;
      setDraft(content);
      parents.current = entity.heads.map((r) => r.id);
      update(content);
      flush();
    },
  };
}
