import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

export interface StudyCard {
  id: string;
  front: string;
  back: string;
  topic?: string;
  /** Leitner-låda 1–5. Högre låda = längre mellan repetitionerna. */
  box: number;
  dueAt: number;
  correct: number;
  wrong: number;
}

export interface StudyQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  topic?: string;
  /** Adaptiv vikt – frågor du haft fel på kommer tillbaka oftare. */
  box: number;
  dueAt: number;
  correct: number;
  wrong: number;
}

export interface QuizAttempt {
  at: number;
  total: number;
  correct: number;
  wrongTopics: string[];
}

export interface StudySetRecord {
  id: string;
  title: string;
  courseId?: string;
  summary?: string;
  topics: string[];
  /** Provdatum (YYYY-MM-DD) om materialet hör till ett prov. */
  examDate?: string;
  cards: StudyCard[];
  quiz: StudyQuizQuestion[];
  attempts: QuizAttempt[];
  createdAt: number;
}

const DAY = 86400000;
/** Intervall i dagar per Leitner-låda. */
export const BOX_INTERVALS = [0, 0, 1, 2, 4, 7];

const newId = () => Math.random().toString(36).slice(2, 11);

export function nextSchedule(box: number, wasCorrect: boolean) {
  const nextBox = wasCorrect ? Math.min(5, box + 1) : 1;
  const days = BOX_INTERVALS[nextBox] ?? 1;
  return { box: nextBox, dueAt: Date.now() + days * DAY };
}

export function daysUntil(date?: string) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(date + "T00:00:00").getTime() - today.getTime()) / DAY);
}

export type ExamPhase = {
  key: "long" | "flashcards" | "firstquiz" | "repeat" | "light" | "today" | "past";
  label: string;
  advice: string;
};

/** Flows plugg-plan utifrån hur många dagar som är kvar till provet. */
export function examPhase(days: number | null): ExamPhase | null {
  if (days === null) return null;
  if (days < 0) return { key: "past", label: "Provet är avklarat", advice: "Fint jobbat. Materialet finns kvar om du vill repetera." };
  if (days === 0) return { key: "today", label: "Idag är provet", advice: "Ingen ny inlärning idag. Läs igenom dina sammanfattningar och andas." };
  if (days === 1) return { key: "light", label: "1 dag kvar", advice: "Kort repetition – 10–15 minuter av det du haft fel på. Inte fyra timmars panikplugg." };
  if (days <= 3) return { key: "repeat", label: `${days} dagar kvar`, advice: "Repetera frågorna du svarat fel på. Kvalitet före mängd." };
  if (days <= 7) return { key: "firstquiz", label: `${days} dagar kvar`, advice: "Dags för första quizet – då vet du vad du redan kan." };
  if (days <= 14) return { key: "flashcards", label: `${days} dagar kvar`, advice: "Börja med flashcards, några minuter om dagen räcker." };
  return { key: "long", label: `${days} dagar kvar`, advice: "God tid. Lägg upp materialet nu och ta en liten runda flashcards i veckan." };
}

export function useFlowStudy() {
  const [sets, setSets] = useCloudSyncedStorage<StudySetRecord[]>("myflove-flowstudy", []);

  const addSet = useCallback(
    (input: {
      title: string;
      courseId?: string;
      examDate?: string;
      summary?: string;
      topics?: string[];
      cards: Array<{ front: string; back: string; topic?: string }>;
      quiz: Array<{ question: string; options: string[]; correctIndex: number; explanation?: string; topic?: string }>;
    }) => {
      const now = Date.now();
      const record: StudySetRecord = {
        id: newId(),
        title: input.title,
        courseId: input.courseId,
        examDate: input.examDate,
        summary: input.summary,
        topics: input.topics ?? [],
        createdAt: now,
        attempts: [],
        cards: input.cards.map((c) => ({
          id: newId(),
          front: c.front,
          back: c.back,
          topic: c.topic,
          box: 1,
          dueAt: now,
          correct: 0,
          wrong: 0,
        })),
        quiz: input.quiz.map((q) => ({
          id: newId(),
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: q.topic,
          box: 1,
          dueAt: now,
          correct: 0,
          wrong: 0,
        })),
      };
      setSets((prev) => [record, ...prev]);
      return record;
    },
    [setSets],
  );

  const deleteSet = useCallback((id: string) => setSets((prev) => prev.filter((s) => s.id !== id)), [setSets]);

  /** Fyller på ett befintligt set med fler kort och frågor. */
  const appendToSet = useCallback(
    (
      id: string,
      input: {
        topics?: string[];
        cards: Array<{ front: string; back: string; topic?: string }>;
        quiz: Array<{ question: string; options: string[]; correctIndex: number; explanation?: string; topic?: string }>;
      },
    ) => {
      const now = Date.now();
      setSets((prev) =>
        prev.map((s) =>
          s.id !== id
            ? s
            : {
                ...s,
                topics: Array.from(new Set([...s.topics, ...(input.topics ?? [])])).slice(0, 20),
                cards: [
                  ...s.cards,
                  ...input.cards.map((c) => ({
                    id: newId(),
                    front: c.front,
                    back: c.back,
                    topic: c.topic,
                    box: 1,
                    dueAt: now,
                    correct: 0,
                    wrong: 0,
                  })),
                ],
                quiz: [
                  ...s.quiz,
                  ...input.quiz.map((q) => ({
                    id: newId(),
                    question: q.question,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    explanation: q.explanation,
                    topic: q.topic,
                    box: 1,
                    dueAt: now,
                    correct: 0,
                    wrong: 0,
                  })),
                ],
              },
        ),
      );
    },
    [setSets],
  );

  const setExamDate = useCallback(
    (id: string, examDate?: string) =>
      setSets((prev) => prev.map((s) => (s.id === id ? { ...s, examDate } : s))),
    [setSets],
  );

  const gradeCard = useCallback(
    (setId: string, cardId: string, knewIt: boolean) =>
      setSets((prev) =>
        prev.map((s) =>
          s.id !== setId
            ? s
            : {
                ...s,
                cards: s.cards.map((c) =>
                  c.id !== cardId
                    ? c
                    : {
                        ...c,
                        ...nextSchedule(c.box, knewIt),
                        correct: c.correct + (knewIt ? 1 : 0),
                        wrong: c.wrong + (knewIt ? 0 : 1),
                      },
                ),
              },
        ),
      ),
    [setSets],
  );

  const gradeQuestion = useCallback(
    (setId: string, questionId: string, wasCorrect: boolean) =>
      setSets((prev) =>
        prev.map((s) =>
          s.id !== setId
            ? s
            : {
                ...s,
                quiz: s.quiz.map((q) =>
                  q.id !== questionId
                    ? q
                    : {
                        ...q,
                        ...nextSchedule(q.box, wasCorrect),
                        correct: q.correct + (wasCorrect ? 1 : 0),
                        wrong: q.wrong + (wasCorrect ? 0 : 1),
                      },
                ),
              },
        ),
      ),
    [setSets],
  );

  const recordAttempt = useCallback(
    (setId: string, attempt: QuizAttempt) =>
      setSets((prev) =>
        prev.map((s) => (s.id === setId ? { ...s, attempts: [attempt, ...s.attempts].slice(0, 20) } : s)),
      ),
    [setSets],
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const dueCards = sets.reduce((n, s) => n + s.cards.filter((c) => c.dueAt <= now).length, 0);
    const dueQuestions = sets.reduce((n, s) => n + s.quiz.filter((q) => q.dueAt <= now).length, 0);
    return { dueCards, dueQuestions };
  }, [sets]);

  return { sets, addSet, deleteSet, setExamDate, gradeCard, gradeQuestion, recordAttempt, stats };
}

/** Sorterar så att svaga och förfallna kort kommer först – enkelt adaptivt urval. */
export function adaptiveOrder<T extends { box: number; dueAt: number; wrong: number }>(items: T[]) {
  const now = Date.now();
  return [...items].sort((a, b) => {
    const aDue = a.dueAt <= now ? 0 : 1;
    const bDue = b.dueAt <= now ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    if (a.box !== b.box) return a.box - b.box;
    return b.wrong - a.wrong;
  });
}
