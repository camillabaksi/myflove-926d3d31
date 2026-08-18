import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { EMPTY_WORK_PROFILE, type WorkProfile } from "@/lib/work-profile";

const KEY = "myflove-work-profile";

/** Min jobbprofil – frivillig, går alltid att ändra eller ta bort. */
export function useWorkProfile() {
  const [profile, setProfile] = useCloudSyncedStorage<WorkProfile>(KEY, EMPTY_WORK_PROFILE);

  const update = useCallback(
    (patch: Partial<WorkProfile>) => setProfile((prev) => ({ ...EMPTY_WORK_PROFILE, ...prev, ...patch })),
    [setProfile],
  );

  const toggleIn = useCallback(
    (field: "responsibilities" | "helpWith", value: string) =>
      setProfile((prev) => {
        const base = { ...EMPTY_WORK_PROFILE, ...prev };
        const list = base[field];
        return {
          ...base,
          [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
        };
      }),
    [setProfile],
  );

  const clear = useCallback(() => setProfile({ ...EMPTY_WORK_PROFILE }), [setProfile]);

  return { profile: { ...EMPTY_WORK_PROFILE, ...profile }, update, toggleIn, clear };
}
