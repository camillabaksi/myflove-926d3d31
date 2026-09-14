// StudyFlow → kalendern.
// Ren logik: förvandlar schema (föreläsningar), prov och repetitionsbehov
// till konkreta kalenderposter som läggs i lediga tidsluckor.

/** Lektion, rast eller lunch. Saknas värdet är posten en vanlig lektion. */
export type LectureKind = "lecture" | "break" | "lunch";

export interface Lecture {
  id: string;
  title: string;
  courseId?: string;
  /** 0 = måndag … 6 = söndag */
  weekday: number;
  start: string; // HH:MM
  end: string; // HH:MM
  location?: string;
  /** "lecture" (standard), "break" eller "lunch" – hållpunkter, inte uppgifter. */
  kind?: LectureKind;
}

export const LECTURE_KIND_LABEL: Record<LectureKind, string> = {
  lecture: "Lektion",
  break: "Rast",
  lunch: "Lunch",
};

export interface StudyScheduleSettings {
  /** Tidigast på dagen som plugg får läggas, HH:MM */
  dayStart: string;
  /** Senast på dagen som plugg får sluta, HH:MM */
  dayEnd: string;
  /** Längd på ett repetitionspass i minuter */
  sessionMinutes: number;
  /** Hur många dagar framåt vi planerar */
  horizonDays: number;
  /** Påminnelse (minuter före) på det som synkas */
  reminderMinutesBefore: number;
  /** Minsta paus efter en föreläsning innan ett pass får börja */
  bufferMinutes: number;
  /** Lägg själva provet i kalendern (av som standard – kan kännas övermäktigt) */
  includeExams: boolean;
  /** Lägg automatiska repetitionspass i kalendern (av som standard) */
  includeRevisions: boolean;
  /** Minuter före en lektion som Flow påminner. 0 = av. */
  lectureReminderMinutes: number;
}

export const DEFAULT_SCHEDULE_SETTINGS: StudyScheduleSettings = {
  dayStart: "08:00",
  dayEnd: "20:00",
  sessionMinutes: 25,
  horizonDays: 14,
  reminderMinutesBefore: 10,
  bufferMinutes: 15,
  includeExams: false,
  includeRevisions: false,
  lectureReminderMinutes: 30,
};

export const WEEKDAYS = ["Mån", "Tis", "Ons", "Tors", "Fre", "Lör", "Sön"] as const;

export type StudyEntryType = "lecture" | "exam" | "revision";

export interface PlannedEntry {
  syncKey: string;
  type: StudyEntryType;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  minutes: number;
  courseId?: string;
  reminderMinutesBefore?: number;
}

export interface BusySlot {
  date: string;
  start: number; // minuter från midnatt
  end: number;
}

export const SYNC_PREFIX = "studyflow:";

export const toMin = (hhmm: string): number => {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
};

export const fromMin = (min: number): string => {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const isoDate = (d: Date): string => {
  const copy = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
};

/** 0 = måndag … 6 = söndag */
export const weekdayIndex = (d: Date): number => (d.getDay() + 6) % 7;

export function datesAhead(days: number, from = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    out.push(isoDate(d));
  }
  return out;
}

/** Hittar första lediga luckan på en dag som rymmer `minutes`. */
export function findSlot(
  date: string,
  minutes: number,
  busy: BusySlot[],
  settings: StudyScheduleSettings,
  earliest?: number,
): string | null {
  const dayStart = toMin(settings.dayStart);
  const dayEnd = toMin(settings.dayEnd);
  const blocks = busy
    .filter((b) => b.date === date)
    .slice()
    .sort((a, b) => a.start - b.start);

  let cursor = Math.max(dayStart, earliest ?? dayStart);
  for (const b of blocks) {
    if (b.end <= cursor) continue;
    if (b.start - cursor >= minutes) return fromMin(cursor);
    cursor = Math.max(cursor, b.end + settings.bufferMinutes);
  }
  if (dayEnd - cursor >= minutes) return fromMin(cursor);
  return null;
}

/** Hur ofta och hur länge man bör repetera utifrån dagar kvar till provet. */
export function revisionRhythm(daysLeft: number): { everyNthDay: number; minutes: number } | null {
  if (daysLeft < 0) return null;
  if (daysLeft === 0) return { everyNthDay: 1, minutes: 15 };
  if (daysLeft <= 3) return { everyNthDay: 1, minutes: 20 };
  if (daysLeft <= 7) return { everyNthDay: 1, minutes: 25 };
  if (daysLeft <= 14) return { everyNthDay: 2, minutes: 25 };
  return { everyNthDay: 3, minutes: 20 };
}

export interface PlanInput {
  lectures: Lecture[];
  exams: Array<{ id: string; title: string; date: string; time?: string; courseId?: string }>;
  /** Redan bokade tider i kalendern som inte kommer från StudyFlow */
  busy: BusySlot[];
  settings: StudyScheduleSettings;
  now?: Date;
}

/**
 * Bygger hela StudyFlow-kalendern: föreläsningar på sina fasta tider,
 * prov på provdagen och repetitionspass i luckorna som blir kvar.
 */
export function planStudyCalendar(input: PlanInput): PlannedEntry[] {
  const now = input.now ?? new Date();
  const { settings } = input;
  const dates = datesAhead(Math.max(1, settings.horizonDays), now);
  const today = isoDate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const entries: PlannedEntry[] = [];
  const busy: BusySlot[] = [...input.busy];

  // 1. Föreläsningar – fasta tider varje vecka.
  for (const date of dates) {
    const wd = weekdayIndex(new Date(`${date}T12:00:00`));
    for (const lec of input.lectures) {
      if (lec.weekday !== wd) continue;
      const start = toMin(lec.start);
      const end = Math.max(start + 30, toMin(lec.end));
      busy.push({ date, start, end });
      // Rast och lunch är hållpunkter i schemat – de blir aldrig uppgifter.
      if (lec.kind && lec.kind !== "lecture") continue;
      if (date === today && end <= nowMinutes) continue;
      entries.push({
        syncKey: `${SYNC_PREFIX}lecture:${lec.id}:${date}`,
        type: "lecture",
        title: `🎓 ${lec.title}${lec.location ? ` (${lec.location})` : ""}`,
        date,
        time: lec.start,
        minutes: end - start,
        courseId: lec.courseId,
        reminderMinutesBefore: settings.reminderMinutesBefore,
      });
    }
  }

  // 2. Prov – blockerar alltid tiden, men läggs bara i kalendern om du vill.
  for (const exam of input.exams) {
    if (!dates.includes(exam.date)) continue;
    const time = exam.time ?? "09:00";
    const start = toMin(time);
    busy.push({ date: exam.date, start, end: start + 120 });
    if (!settings.includeExams) continue;
    entries.push({
      syncKey: `${SYNC_PREFIX}exam:${exam.id}`,
      type: "exam",
      title: `📝 Prov: ${exam.title}`,
      date: exam.date,
      time,
      minutes: 120,
      courseId: exam.courseId,
      reminderMinutesBefore: 60,
    });
  }

  // 3. Repetitionspass – bara om användaren själv slagit på det.
  for (const exam of settings.includeRevisions ? input.exams : []) {
    for (const date of dates) {
      if (date > exam.date) break;
      const daysLeft = Math.round(
        (new Date(`${exam.date}T00:00:00`).getTime() - new Date(`${date}T00:00:00`).getTime()) /
          86400000,
      );
      const rhythm = revisionRhythm(daysLeft);
      if (!rhythm) continue;
      const dayIndex = dates.indexOf(date);
      if (dayIndex % rhythm.everyNthDay !== 0) continue;

      const minutes =
        daysLeft === 0 ? rhythm.minutes : Math.max(rhythm.minutes, settings.sessionMinutes);
      const earliest = date === today ? nowMinutes + 10 : undefined;
      const slot = findSlot(date, minutes, busy, settings, earliest);
      if (!slot) continue;
      const start = toMin(slot);
      busy.push({ date, start, end: start + minutes });
      entries.push({
        syncKey: `${SYNC_PREFIX}revision:${exam.id}:${date}`,
        type: "revision",
        title:
          daysLeft === 0 ? `🃏 Lugn genomläsning: ${exam.title}` : `🃏 Repetition: ${exam.title}`,
        date,
        time: slot,
        minutes,
        courseId: exam.courseId,
        reminderMinutesBefore: settings.reminderMinutesBefore,
      });
    }
  }

  return entries.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
