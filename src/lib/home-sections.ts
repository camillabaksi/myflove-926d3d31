import { useEffect } from "react";
import { useLocalStorage } from "@/lib/storage";

/** Alla block som går att välja bort på hemskärmen. */
export const HOME_SECTIONS: { id: string; label: string; hint: string }[] = [
  { id: "livspussel", label: "Livspusslet", hint: "Hur dagens delar hänger ihop" },
  {
    id: "dailyflow",
    label: "Daily Flow – dagens viktigaste",
    hint: "Incheckning, ditt fokus och dagens viktigaste i ett block",
  },
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
  // Engångsmigrering: Daily Flow och Dagens viktigaste är nu ett och samma block.
  const [merged, setMerged] = useLocalStorage<boolean>("myflove-home-merged-dailyflow", false);
  useEffect(() => {
    if (merged) return;
    setMerged(true);
    setHidden(hidden.filter((id) => id !== "dailyflow" && id !== "today"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merged]);

  const isHidden = (id: string) => hidden.includes(id);
  const toggle = (id: string) =>
    setHidden(hidden.includes(id) ? hidden.filter((s) => s !== id) : [...hidden, id]);
  const showAll = () => setHidden([]);
  const reset = () => setHidden(DEFAULT_HIDDEN_SECTIONS);

  return { hidden, isHidden, toggle, showAll, reset };
}


const DEFAULT_ORDER = HOME_SECTIONS.map((s) => s.id);

/**
 * Egen ordning på hemskärmens block. Sparas tills du ändrar den igen.
 * Nya block hamnar sist så att inget försvinner efter en uppdatering.
 */
export function useHomeSectionOrder() {
  const [saved, setSaved] = useLocalStorage<string[]>("myflove-home-section-order", DEFAULT_ORDER);

  const order = [
    ...saved.filter((id) => DEFAULT_ORDER.includes(id)),
    ...DEFAULT_ORDER.filter((id) => !saved.includes(id)),
  ];

  const orderOf = (id: string) => {
    const i = order.indexOf(id);
    return i === -1 ? order.length : i;
  };

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSaved(next);
  };

  const moveId = (id: string, to: number) => move(order.indexOf(id), to);
  const resetOrder = () => setSaved(DEFAULT_ORDER);

  return { order, orderOf, move, moveId, resetOrder };
}
