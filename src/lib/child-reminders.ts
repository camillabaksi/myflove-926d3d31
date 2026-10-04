import { useCloudSyncedStorage } from "@/lib/cloud-storage";

export interface ChildReminderSettings {
  /** Notiser för barnens skolschema och aktiviteter */
  enabled: boolean;
  /** Hur många minuter innan hållpunkten notisen kommer */
  minutesBefore: number;
  /** Morgonöversikt över barnens dag */
  morningSummary: boolean;
  /** Klockslag för morgonöversikten, HH:MM */
  morningTime: string;
  /** Familjemedlemmar (user id) vars delade barn/aktiviteter man vill få notiser om. */
  familyFrom: string[];
}

export const CHILD_REMINDER_KEY = "myflove-child-reminders";

export const DEFAULT_CHILD_REMINDERS: ChildReminderSettings = {
  enabled: false,
  minutesBefore: 30,
  morningSummary: false,
  morningTime: "07:00",
  familyFrom: [],
};

export function useChildReminderSettings() {
  const [settings, setSettings] = useCloudSyncedStorage<ChildReminderSettings>(
    CHILD_REMINDER_KEY,
    DEFAULT_CHILD_REMINDERS,
  );
  const merged: ChildReminderSettings = { ...DEFAULT_CHILD_REMINDERS, ...(settings ?? {}) };
  const update = (patch: Partial<ChildReminderSettings>) => setSettings({ ...merged, ...patch });
  return { settings: merged, update };
}
