import { useCloudSyncedStorage } from "@/lib/cloud-storage";

export interface WorkProject {
  id: string;
  title: string;
  /** Valfri kort beskrivning, t.ex. kund eller team */
  note?: string;
  /** HSL-ton för färgmarkering i listan */
  color: string;
  createdAt: number;
  archived?: boolean;
}

const PROJECT_COLORS = ["194 13% 25%", "138 24% 40%", "35 65% 45%", "7 47% 49%", "218 30% 40%"];

const generateId = () => Math.random().toString(36).slice(2, 11);

export function useProjects() {
  const [projects, setProjects] = useCloudSyncedStorage<WorkProject[]>("myflove-work-projects", []);

  const addProject = (title: string, note?: string) => {
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length] as string;
    const project: WorkProject = {
      id: generateId(),
      title,
      note,
      color,
      createdAt: Date.now(),
    };
    setProjects((prev) => [...prev, project]);
    return project;
  };

  const renameProject = (id: string, title: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
  };

  const archiveProject = (id: string, archived = true) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived } : p)));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const activeProjects = projects.filter((p) => !p.archived);

  return { projects, activeProjects, addProject, renameProject, archiveProject, deleteProject };
}
