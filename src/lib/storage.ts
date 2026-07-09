import { useCallback, useEffect, useRef, useState } from 'react';

const LOCAL_STORAGE_EVENT = 'myflow-local-storage';

function readStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);
  const [storedValue, setStoredValue] = useState<T>(() => readStoredValue(key, initialValueRef.current));

  useEffect(() => {
    const syncValue = (event?: StorageEvent | Event) => {
      if (event instanceof StorageEvent && event.key !== key) return;
      if (event instanceof CustomEvent && event.detail?.key !== key) return;
      setStoredValue(readStoredValue(key, initialValueRef.current));
    };

    syncValue();
    window.addEventListener('storage', syncValue);
    window.addEventListener(LOCAL_STORAGE_EVENT, syncValue);

    return () => {
      window.removeEventListener('storage', syncValue);
      window.removeEventListener(LOCAL_STORAGE_EVENT, syncValue);
    };
  }, [key]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prev) => {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(prev) : value;
        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_EVENT, { detail: { key } }));
        }
        return valueToStore;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue] as const;
}
