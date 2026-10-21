import { useEffect, useState } from "react";
import { isActiveOwner } from "@/lib/account-scope";
import { hasUnsyncedCloudData, syncKeyNow, useCloudSyncedStorage, useCloudSyncStatus } from "@/lib/cloud-storage";
import { getSecureStatus, hasUnpersistedSecureWrites, SECURE_STATUS_EVENT } from "@/lib/secure-local";
import { appendSpaceRevision, DAY_SPACE_KEY, makeSpaceRevision, spaceHeads, type SpaceCategory, type SpaceRevision } from "@/lib/day-space";

export function useDaySpace(owner: string, date: string) {
  const [rows, setRows] = useCloudSyncedStorage<SpaceRevision[]>(DAY_SPACE_KEY, []);
  const cloud = useCloudSyncStatus();
  const [, tick] = useState(0);
  useEffect(() => {
    const update = () => tick(value => value + 1);
    window.addEventListener(SECURE_STATUS_EVENT, update);
    const timer = window.setInterval(update, 1500);
    return () => { window.removeEventListener(SECURE_STATUS_EVENT, update); window.clearInterval(timer); };
  }, []);
  const active = isActiveOwner(owner);
  const safeRows = active && Array.isArray(rows) ? rows : [];
  const heads = spaceHeads(safeRows, date);
  function save(text: string, categories: SpaceCategory[], parents: string[]) {
    if (!isActiveOwner(owner)) return null;
    const revision = makeSpaceRevision(date, text, categories, parents);
    setRows(previous => isActiveOwner(owner) ? appendSpaceRevision(previous, revision) : previous);
    return revision;
  }
  const pendingSecure = getSecureStatus() !== "ready" || hasUnpersistedSecureWrites();
  const pendingCloud = hasUnsyncedCloudData(DAY_SPACE_KEY);
  const status = !active ? "Kontot har ändrats. Öppna anteckningen igen."
    : pendingSecure ? "Väntar på krypterad sparning. Behåll sidan öppen."
    : pendingCloud ? cloud === "error" ? "Sparat på enheten. Synk misslyckades – försök igen." : "Sparat på enheten · väntar på synk"
    : "Synkat med kontot";
  return { heads, save, status, hasRows: safeRows.some(row => row.date === date), retry: () => syncKeyNow(DAY_SPACE_KEY) };
}