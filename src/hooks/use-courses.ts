import { useCloudSyncedStorage } from "@/lib/cloud-storage";

export interface Course {
  id: string;
  title: string;
  /** Valfri kort beskrivning, t.ex. lärosäte eller termin */
  note?: string;
  /** HSL-ton för färgmarkering i listan */
  color: string;
  createdAt: number;
  archived?: boolean;
}

const COURSE_COLORS = ["35 65% 45%", "7 47% 49%", "138 24% 40%", "194 13% 25%", "265 30% 45%"];

const generateId = () => Math.random().toString(36).slice(2, 11);

export function useCourses() {
  const [courses, setCourses] = useCloudSyncedStorage<Course[]>("myflove-courses", []);

  const addCourse = (title: string, note?: string) => {
    const color = COURSE_COLORS[courses.length % COURSE_COLORS.length] as string;
    const course: Course = {
      id: generateId(),
      title,
      note,
      color,
      createdAt: Date.now(),
    };
    setCourses((prev) => [...prev, course]);
    return course;
  };

  const renameCourse = (id: string, title: string) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const archiveCourse = (id: string, archived = true) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, archived } : c)));
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const activeCourses = courses.filter((c) => !c.archived);

  return { courses, activeCourses, addCourse, renameCourse, archiveCourse, deleteCourse };
}
