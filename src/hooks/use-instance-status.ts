import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  completeInstance,
  instanceKey,
  recordMap,
  upsertRecord,
  type InstanceRecord,
} from "@/lib/activity-history";

export const ACTIVITY_HISTORY_KEY = "myflove-activity-history";

/**
 * Genomförandestatus PER FÖREKOMST för återkommande aktiviteter.
 *
 * En återkommande aktivitet ("Lämna barnen på förskolan", vardagar) är EN post
 * med en repetitionsregel. Varje dag den inträffar är en egen förekomst med
 * egen status – att bocka av måndagens förekomst får aldrig ta bort tisdagens.
 *
 * Statusen sparas i samma instansjournal som historiken använder, så tidigare
 * genomföranden finns kvar även om rutinen senare ändras.
 */
export function useInstanceStatus() {
  const [records, setRecords] = useCloudSyncedStorage<InstanceRecord[]>(ACTIVITY_HISTORY_KEY, []);

  const byKey = useMemo(() => recordMap(records ?? []), [records]);

  const isInstanceDone = useCallback(
    (sourceId: string, date: string) =>
      byKey.get(instanceKey(sourceId, date))?.status === "genomford",
    [byKey],
  );

  const setInstanceDone = useCallback(
    (sourceId: string, date: string, done: boolean) => {
      setRecords((prev) =>
        done
          ? completeInstance(prev ?? [], sourceId, date)
          : upsertRecord(prev ?? [], sourceId, date, {
              status: "planerad",
              completedAt: undefined,
              actualDate: undefined,
            }),
      );
    },
    [setRecords],
  );

  return { isInstanceDone, setInstanceDone };
}
