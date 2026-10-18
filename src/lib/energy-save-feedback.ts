import { getDataOwner } from "@/lib/account-scope";
import { dayOf } from "@/lib/day";
import type { EnergyFactorEntry, EnergyDirection } from "@/lib/energy-flow";

export const ENERGY_FEEDBACK_CLEAR_EVENT = "myflove:energy-feedback-clear";
export const ENERGY_SAVED_EVENT = "myflove:energy-saved";
export interface EnergySavedDetail {
  owner: string;
  title?: string;
  factorId?: string;
  direction: EnergyDirection;
  date: string | null;
  /** Completed activities already adjust the canonical capacity automatically. */
  automaticallyApplied: boolean;
}

/** Confirmed observations only. This UI signal never writes capacity or a second factor. */
export function announceSavedEnergy(entry: EnergyFactorEntry, activityDate?: string) {
  const owner = getDataOwner();
  if (!owner || typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<EnergySavedDetail>(ENERGY_SAVED_EVENT, {
      detail: {
        owner,
        title: entry.title,
        factorId: entry.id,
        direction: entry.direction,
        date: activityDate ?? dayOf(entry.occurredAt),
        automaticallyApplied: entry.kind === "planerat" && entry.note === "Genomförd aktivitet" && (entry.direction === "gives" || entry.direction === "drains"),
      },
    }),
  );
}
