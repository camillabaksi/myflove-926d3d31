import { useLocalStorage } from "@/lib/storage";

/** Alla block som går att välja bort på hemskärmen. */
export const HOME_SECTIONS: { id: string; label: string; hint: string }[] = [
  { id: "dailyflow", label: "Daily Flow", hint: "Dagens incheckning och nästa steg" },
  { id: "today", label: "Dagens viktigaste", hint: "Det närmaste i tid idag" },
  { id: "shortcuts", label: "Genvägar", hint: "Dina fyra egna knappar" },
  { id: "help", label: "Hjälp mig", hint: "Stora hjälpknappen" },
  { id: "suggestions", label: "Förslag just nu", hint: "Små tips utifrån dag och väder" },
  { id: "quickflow", label: "Quickflow", hint: "Finns alltid som flytande knapp" },
  { id: "weather", label: "Väder", hint: "Vädret där du är" },
  { id: "week", label: "Veckan i flow", hint: "Överblick över veckan" },
  { id: "streak", label: "Din svit", hint: "Dagar i rad" },
  { id: "bills", label: "Kommande räkningar", hint: "Visas bara om du har några" },
  { id: "medication", label: "Medicinpåminnelse", hint: "Visas bara om du har någon" },
  { id: "reset", label: "Flow Reset", hint: "Kvällsavslut efter kl 17" },
  { id: "push", label: "Påminnelser & tyst läge", hint: "Inställningar för notiser" },
];

/**
 * Lugnare start: bara det som hjälper dig vidare just nu.
 * Resten finns kvar och kan slås på i "Anpassa hemskärmen".
 */
export const DEFAULT_HIDDEN_SECTIONS = ["quickflow", "streak", "week", "push", "weather"];

export function useHiddenHomeSections() {
  const [hidden, setHidden] = useLocalStorage<string[]>(
    "myflove-home-hidden-sections",
    DEFAULT_HIDDEN_SECTIONS,
  );

  const isHidden = (id: string) => hidden.includes(id);
  const toggle = (id: string) =>
    setHidden(hidden.includes(id) ? hidden.filter((s) => s !== id) : [...hidden, id]);
  const showAll = () => setHidden([]);
  const reset = () => setHidden(DEFAULT_HIDDEN_SECTIONS);

  return { hidden, isHidden, toggle, showAll, reset };
}
