import { PacePageHeader } from "@/components/paceable/page-header";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveCelebration } from "@/components/myflove/motion";
import { useMoods, useTasks, useFocus, useMedications } from "@/hooks/use-data";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { getAchievements } from "@/lib/achievements";
import { Award, Lock } from "lucide-react";

export default function Achievements() {
  const { moods } = useMoods();
  const { completedTasks } = useTasks();
  const { completedFocusCount } = useFocus();
  const { log } = useMedications();
  const [pomodoroTotalSessions] = useCloudSyncedStorage<number>(
    "myflow-pomodoro-total-sessions",
    0,
  );

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
      <MyFlovePageGrid area="aterhamtning" className="pace-ds pace-compact-page">
        <MyFloveWide>
          <div className="space-y-8 pace-compact-stack">
            <div>
<PacePageHeader icon={Award} title="Belöningar" description={`${unlockedCount} av ${achievements.length} upplåsta — varje litet steg räknas.`} />
              <div className="mt-3">
                {unlockedCount > 0 && (
                  <MyFloveCelebration
                    level={unlockedCount >= 6 ? 3 : unlockedCount >= 3 ? 2 : 1}
                    message="Du har samlat på dig fler små steg än du tror."
                  />
                )}
              </div>
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
                    {achievement.unlocked ? (
                      achievement.emoji
                    ) : (
                      <Lock size={22} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
