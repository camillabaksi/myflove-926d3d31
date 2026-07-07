import Layout from "@/components/layout";
import { useMoods, useTasks, useFocus, useMedications } from "@/hooks/use-data";
import { useLocalStorage } from "@/lib/storage";
import { getAchievements } from "@/lib/achievements";
import { Lock } from "lucide-react";

export default function Achievements() {
  const { moods } = useMoods();
  const { completedTasks } = useTasks();
  const { completedFocusCount } = useFocus();
  const { log } = useMedications();
  const [pomodoroTotalSessions] = useLocalStorage<number>("myflow-pomodoro-total-sessions", 0);

  const achievements = getAchievements({
    moods,
    completedTasks,
    pomodoroTotalSessions,
    completedFocusCount,
    medicationLogCount: log.length,
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Belöningar</h1>
          <p className="text-muted-foreground">
            {unlockedCount} av {achievements.length} upplåsta — varje litet steg räknas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`flex items-center gap-4 p-5 rounded-2xl border shadow-sm transition-all ${
                achievement.unlocked
                  ? "bg-card border-primary/30"
                  : "bg-secondary/30 border-border opacity-60"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-2xl ${
                  achievement.unlocked ? "bg-primary/10" : "bg-secondary"
                }`}
              >
                {achievement.unlocked ? achievement.emoji : <Lock size={22} className="text-muted-foreground" />}
              </div>
              <div>
                <p className="font-medium">{achievement.title}</p>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
