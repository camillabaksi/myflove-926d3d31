import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import {
  DEFAULT_SCHEDULE_SETTINGS,
  type Lecture,
  type StudyScheduleSettings,
} from "@/lib/study-calendar";

const LECTURES_KEY = "myflove-study-lectures";
const SETTINGS_KEY = "myflove-study-schedule-settings";
const AUTO_KEY = "myflove-study-schedule-auto";
const HOME_KEY = "myflove-study-next-lecture-home";

const newId = () => Math.random().toString(36).slice(2, 11);

export function useStudySchedule() {
  const [lectures, setLectures] = useCloudSyncedStorage<Lecture[]>(LECTURES_KEY, []);
  const [settings, setSettings] = useCloudSyncedStorage<StudyScheduleSettings>(
    SETTINGS_KEY,
    DEFAULT_SCHEDULE_SETTINGS,
  );
  const [autoSync, setAutoSync] = useCloudSyncedStorage<boolean>(AUTO_KEY, true);
  const [showNextLectureOnHome, setShowNextLectureOnHome] = useCloudSyncedStorage<boolean>(
    HOME_KEY,
    false,
  );

  const addLecture = useCallback(
    (input: Omit<Lecture, "id">) => {
      setLectures((prev) => [...prev, { ...input, id: newId() }]);
    },
    [setLectures],
  );

  const updateLecture = useCallback(
    (id: string, patch: Partial<Lecture>) => {
      setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    [setLectures],
  );

  const removeLecture = useCallback(
    (id: string) => setLectures((prev) => prev.filter((l) => l.id !== id)),
    [setLectures],
  );

  const patchSettings = useCallback(
    (patch: Partial<StudyScheduleSettings>) =>
      setSettings((prev) => ({ ...DEFAULT_SCHEDULE_SETTINGS, ...prev, ...patch })),
    [setSettings],
  );

  return {
    lectures,
    addLecture,
    updateLecture,
    removeLecture,
    settings: { ...DEFAULT_SCHEDULE_SETTINGS, ...settings },
    patchSettings,
    autoSync,
    setAutoSync,
    showNextLectureOnHome,
    setShowNextLectureOnHome,
  };
}
