import { useEffect } from "react";

import { reportLovableError } from "@/lib/lovable-error-reporting";
import { purgeCaches } from "@/lib/cache-busting";

/**
 * Lugn fallback i stället för vit skärm när något oväntat kastas under
 * rendering. Fångar även värden som inte är Error (t.ex. `undefined`),
 * rapporterar dem och låter användaren ladda om utan gamla cachade bundles.
 */
export function AppError({ error }: { error?: unknown }) {
  useEffect(() => {
    reportLovableError(error ?? new Error("Okänt renderingsfel (inget felobjekt)"), {
      source: "router_default_error_component",
    });
  }, [error]);

  const reload = async () => {
    await purgeCaches();
    window.location.reload();
  };

  return (
    <main className="grid min-h-[60dvh] place-items-center px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card p-6 text-center shadow-soft">
        <h1 className="font-display text-lg font-bold text-ink">Något gick fel just här</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inget av det du sparat har försvunnit. Ladda om så försöker vi igen.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void reload()}
            className="press min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Ladda om
          </button>
          <a
            href="/hem"
            className="press min-h-11 rounded-full border border-border px-5 text-sm font-medium text-ink"
          >
            Till Hem
          </a>
        </div>
      </div>
    </main>
  );
}

export default AppError;
