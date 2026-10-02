import { useCloudSyncedStorage } from "@/lib/cloud-storage";

export type FlowTheme = "lavendel" | "rosen" | "kvall";
export type FlowMotion = "mjuk" | "still";
export interface FlowAppearance {
  theme: FlowTheme;
  motion: FlowMotion;
}
export interface FlowMemory {
  id: string;
  text: string;
}

export const FLOW_THEMES: { id: FlowTheme; name: string; description: string }[] = [
  { id: "lavendel", name: "Lavendel", description: "Ljust och stilla" },
  { id: "rosen", name: "Rosa skymning", description: "Mjukt och varmt" },
  { id: "kvall", name: "Lugn kväll", description: "Dämpad belysning" },
];

export const DEFAULT_FLOW_APPEARANCE: FlowAppearance = { theme: "lavendel", motion: "mjuk" };

/** Samma kontobundna lagring och synk som MyFloves övriga användarval. */
export function useMyFlowAppearance() {
  return useCloudSyncedStorage<FlowAppearance>("myflove-flow-appearance", DEFAULT_FLOW_APPEARANCE);
}

/** Endast aktivt valda minnen, inga härledda eller förifyllda fakta. */
export function useMyFlowMemories() {
  return useCloudSyncedStorage<FlowMemory[]>("myflove-flow-memories", []);
}