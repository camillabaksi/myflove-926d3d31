/**
 * Minimal IndexedDB-attrapp för tester. jsdom saknar IndexedDB, och
 * secure-local.ts sparar sin krypteringsnyckel där. Attrappen stödjer
 * exakt det som används: open, createObjectStore, get och put.
 */
type Listener = (() => void) | null;

const stores = new Map<string, Map<string, unknown>>();

/** Styr attrappen: långsam öppning eller helt blockerad IndexedDB. */
export const mockOptions = { delayMs: 0, fail: false };

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
        error: unknown;
        onupgradeneeded: Listener;
        onsuccess: Listener;
        onerror: Listener;
      } = { error: null, onupgradeneeded: null, onsuccess: null, onerror: null };

      const db = {
        close: () => undefined,
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
          // Transaktionen blir klar när dess förfrågningar hunnit köras.
          later(() => later(() => tx.oncomplete?.()));
          return {
            ...tx,
            objectStore: () => ({
              get: (id: string) => makeRequest(() => map.get(id)),
              put: (value: unknown, id: string) => {
                map.set(id, value);
                return makeRequest(() => undefined);
              },
              add: (value: unknown, id: string) => {
                if (!map.has(id)) map.set(id, value);
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
      const finish = () => {
        if (mockOptions.fail) {
          req.error = new Error("blocked");
          req.onerror?.();
          return;
        }
        req.onupgradeneeded?.();
        req.onsuccess?.();
      };
      if (mockOptions.delayMs > 0) setTimeout(finish, mockOptions.delayMs);
      else later(finish);
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
  mockOptions.delayMs = 0;
  mockOptions.fail = false;
}
