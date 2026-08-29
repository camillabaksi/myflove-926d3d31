import { useCallback, useEffect, useRef } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  EMPTY_FOLLOWUPS,
  EMPTY_LIFE_PROFILE,
  migrateLegacyProfiles,
  type LifeFollowups,
  type LifeProfile,
  type ListField,
} from "@/lib/life-profile";
import { EMPTY_WORK_PROFILE, hasWorkProfile, type WorkProfile } from "@/lib/work-profile";
import { EMPTY_STUDY_PROFILE, hasStudyProfile, type StudyProfile } from "@/lib/study-profile";

const KEY = "myflove-life-profile";
const LEGACY_WORK_KEY = "myflove-work-profile";
const LEGACY_STUDY_KEY = "myflove-study-profile";

/**
 * Min livsprofil – en enda profil. Gamla jobb- och studieprofiler läses bara
 * för att migreras hit en gång; ingen data raderas.
 */
export function useLifeProfile() {
  const [stored, setStored] = useCloudSyncedStorage<LifeProfile>(KEY, EMPTY_LIFE_PROFILE);
  const [legacyWork] = useCloudSyncedStorage<WorkProfile>(LEGACY_WORK_KEY, EMPTY_WORK_PROFILE);
  const [legacyStudy] = useCloudSyncedStorage<StudyProfile>(LEGACY_STUDY_KEY, EMPTY_STUDY_PROFILE);
  const migratedRef = useRef(false);

  const profile: LifeProfile = useMemo(
    () => ({
      ...EMPTY_LIFE_PROFILE,
      ...stored,
      followups: { ...EMPTY_FOLLOWUPS, ...(stored?.followups ?? {}) },
    }),
    [stored],
  );

  // Migrera gammal jobb-/studieprofil en gång, när den faktiskt innehåller något.
  useEffect(() => {
    if (migratedRef.current || profile.migratedAt) return;
    const work = hasWorkProfile(legacyWork) ? legacyWork : null;
    const study = hasStudyProfile(legacyStudy) ? legacyStudy : null;
    if (!work && !study) return;
    const next = migrateLegacyProfiles(profile, work, study);
    if (!next) return;
    migratedRef.current = true;
    setStored(next);
  }, [legacyWork, legacyStudy, profile, setStored]);

  const update = useCallback(
    (patch: Partial<LifeProfile>) =>
      setStored((prev) => ({ ...EMPTY_LIFE_PROFILE, ...prev, ...patch })),
    [setStored],
  );

  const setFollowup = useCallback(
    (field: keyof LifeFollowups, value: string) =>
      setStored((prev) => {
        const base = { ...EMPTY_LIFE_PROFILE, ...prev };
        return {
          ...base,
          followups: { ...EMPTY_FOLLOWUPS, ...base.followups, [field]: value },
        };
      }),
    [setStored],
  );

  const toggleSubject = useCallback(
    (value: string) =>
      setStored((prev) => {
        const base = { ...EMPTY_LIFE_PROFILE, ...prev };
        const f = { ...EMPTY_FOLLOWUPS, ...base.followups };
        const list = f.studySubjects;
        return {
          ...base,
          followups: {
            ...f,
            studySubjects: list.includes(value)
              ? list.filter((v) => v !== value)
              : [...list, value],
          },
        };
      }),
    [setStored],
  );

  const toggleIn = useCallback(
    (field: ListField, value: string) =>
      setStored((prev) => {
        const base = { ...EMPTY_LIFE_PROFILE, ...prev };
        const list = base[field] ?? [];
        return {
          ...base,
          [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
        };
      }),
    [setStored],
  );

  const clear = useCallback(
    () => setStored({ ...EMPTY_LIFE_PROFILE, migratedAt: new Date().toISOString() }),
    [setStored],
  );

  return { profile, update, setFollowup, toggleSubject, toggleIn, clear };
}
