import type { PictogramId, VisualActivityCategory, VisualActivityTone } from "@/lib/child-visual-schedule";

export interface ChildScheduleTemplateItem {
  title: string;
  time: string | null;
  pictogram: PictogramId;
  category: VisualActivityCategory;
  tone: VisualActivityTone;
}

export interface ChildScheduleTemplate {
  id: string;
  name: string;
  items: ChildScheduleTemplateItem[];
  createdAt: string;
}
