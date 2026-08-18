import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { EMPTY_STUDY_PROFILE, type StudyProfile } from "@/lib/study-profile";

const KEY = "myflove-study-profile";

/** Min studieprofil – frivillig, går alltid att ändra, pausa eller ta bort. */
export function useStudyProfile() {
  const [profile, setProfile] = useCloudSyncedStorage<StudyProfile>(KEY, EMPTY_STUDY_PROFILE);

  const update = useCallback(
    (patch: Partial<StudyProfile>) =>
      setProfile((prev) => ({ ...EMPTY_STUDY_PROFILE, ...prev, ...patch })),
    [setProfile],
  );

  const toggleIn = useCallback(
    (field: "subjects" | "helpWith" | "preferences", value: string) =>
      setProfile((prev) => {
        const base = { ...EMPTY_STUDY_PROFILE, ...prev };
        const list = base[field];
        return {
          ...base,
          [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
        };
      }),
    [setProfile],
  );

  const clear = useCallback(() => setProfile({ ...EMPTY_STUDY_PROFILE }), [setProfile]);

  return { profile: { ...EMPTY_STUDY_PROFILE, ...profile }, update, toggleIn, clear };
}
