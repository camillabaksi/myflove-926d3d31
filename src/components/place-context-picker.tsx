import { useState } from "react";
import { Check, LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaceContext } from "@/hooks/use-place-context";
import { PLACE_CONTEXTS, type SavedPlaceContext } from "@/lib/place-context";

export function PlaceContextPicker() {
  const {
    place, autoEnabled, savedPlaces, status, setPlace, setAutoEnabled, saveCurrentPlace, refreshPlace,
  } = usePlaceContext(true);
  const [saving, setSaving] = useState(false);
  const selectedPlace = PLACE_CONTEXTS.find((item) => item.id === place);
  const saveable = place && place !== "annat";
  const hasSavedPlaces = Object.keys(savedPlaces).length > 0;

  const saveHere = async () => {
    if (!saveable) return;
    setSaving(true);
    await saveCurrentPlace(place as SavedPlaceContext);
    setSaving(false);
  };

  const statusMessage = status === "checking"
    ? "Kollar plats…"
    : status === "matched"
      ? "Platsen har uppdaterats."
      : status === "no-match"
        ? "Ingen sparad plats i närheten. Du kan välja manuellt."
        : status === "error"
          ? "Kunde inte läsa platsen. Välj manuellt eller kontrollera behörigheten."
          : hasSavedPlaces
            ? "Platsmatchning sker när Planera öppnas."
            : "Spara en plats för att kunna känna igen den automatiskt.";

  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-4" aria-labelledby="place-context-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="place-context-title" className="text-sm font-semibold text-ink">Var är du just nu?</h2>
        {place ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={14} aria-hidden />
            {status === "matched" ? "Känner igen:" : "Valt:"} {selectedPlace?.label}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Alla platser</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Välj plats">
        {PLACE_CONTEXTS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={place === item.id ? "secondary" : "outline"}
            aria-pressed={place === item.id}
            className="min-h-11 rounded-2xl px-2 text-sm"
            onClick={() => setPlace(item.id)}
          >
            <span aria-hidden>{item.emoji}</span> {item.label}
            {place === item.id && <Check size={14} aria-hidden />}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {saveable && (
          <Button type="button" size="sm" variant="ghost" disabled={saving || status === "checking"} onClick={saveHere} className="min-h-10 rounded-full px-3 text-xs">
            <MapPin size={14} aria-hidden />
            {saving ? "Sparar plats…" : "Spara den här platsen som " + selectedPlace?.label}
          </Button>
        )}
        {hasSavedPlaces && (
          <Button type="button" size="sm" variant="ghost" disabled={status === "checking"} onClick={() => void refreshPlace()} className="min-h-10 rounded-full px-3 text-xs">
            <LocateFixed size={14} aria-hidden /> Hitta plats
          </Button>
        )}
      </div>

      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={autoEnabled}
          onChange={(event) => setAutoEnabled(event.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <span>Föreslå plats automatiskt när Planera öppnas</span>
      </label>
      <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{statusMessage}</p>
      <p className="mt-1 text-xs text-muted-foreground">Sparade platser stannar på den här enheten.</p>
    </section>
  );
}
