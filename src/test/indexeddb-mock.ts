/**
 * Minimal IndexedDB-attrapp för tester. jsdom saknar IndexedDB, och
 * secure-local.ts sparar sin krypteringsnyckel där. Attrappen stödjer
 * exakt det som används: open, createObjectStore, get och put.
 */
type Listener = (() => void) | null;

const stores = new Map<string, Map<string, unknown>>();

function later(fn: () => void) {
  setTimeout(fn, 0);
}

function makeRequest<T>(run: () => T) {
  const req: { result?: T; error: null; onsuccess: Listener; onerror: Listener } = {
    error: null,
    onsuccess: null,
    onerror: null,
  };
  later(() => {
    req.result = run();
    req.onsuccess?.();
  });
  return req;
}

export function installIndexedDbMock(): void {
  const indexedDbMock = {
    open(name: string) {
      const req: {
        result?: unknown;
        error: null;
        onupgradeneeded: Listener;
        onsuccess: Listener;
        onerror: Listener;
      } = { error: null, onupgradeneeded: null, onsuccess: null, onerror: null };

      const db = {
        objectStoreNames: {
          contains: (store: string) => stores.has(`${name}:${store}`),
        },
        createObjectStore: (store: string) => {
          stores.set(`${name}:${store}`, new Map());
        },
        transaction(store: string) {
          const map = stores.get(`${name}:${store}`) ?? new Map();
          stores.set(`${name}:${store}`, map);
          const tx: { oncomplete: Listener; onerror: Listener; error: null } = {
            oncomplete: null,
            onerror: null,
            error: null,
          };
          return {
            ...tx,
            objectStore: () => ({
              get: (id: string) => makeRequest(() => map.get(id)),
              put: (value: unknown, id: string) => {
                map.set(id, value);
                later(() => tx.oncomplete?.());
                return makeRequest(() => undefined);
              },
            }),
            set oncomplete(fn: Listener) {
              tx.oncomplete = fn;
            },
            get oncomplete() {
              return tx.oncomplete;
            },
            set onerror(fn: Listener) {
              tx.onerror = fn;
            },
            get onerror() {
              return tx.onerror;
            },
          };
        },
      };

      req.result = db;
      later(() => {
        req.onupgradeneeded?.();
        req.onsuccess?.();
      });
      return req;
    },
    deleteDatabase(name: string) {
      for (const key of [...stores.keys()]) {
        if (key.startsWith(`${name}:`)) stores.delete(key);
      }
      return makeRequest(() => undefined);
    },
  };

  Object.defineProperty(globalThis, "indexedDB", {
    writable: true,
    configurable: true,
    value: indexedDbMock as unknown as IDBFactory,
  });
}

export function resetIndexedDbMock(): void {
  stores.clear();
}
