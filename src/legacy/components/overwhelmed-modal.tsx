import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFocus, useTasks, type Task } from "@/hooks/use-data";
import { CheckCircle2, Circle, Moon } from "lucide-react";

interface OverwhelmedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function suggestPriorityTask(tasks: Task[]): Task | null {
  if (tasks.length === 0) return null;
  const withDueDate = tasks.filter(t => t.dueDate).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
  if (withDueDate.length > 0) return withDueDate[0] as Task;
  return [...tasks].sort((a, b) => a.createdAt - b.createdAt)[0] as Task;
}

export default function OverwhelmedModal({ open, onOpenChange }: OverwhelmedModalProps) {
  const { activeTasks, snoozeTask } = useTasks();
  const { setTodayFocus } = useFocus();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const suggested = useMemo(() => suggestPriorityTask(activeTasks), [activeTasks]);

  useEffect(() => {
    if (open) {
      setSelectedId(suggested?.id ?? null);
      setDone(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedTask = activeTasks.find(t => t.id === selectedId) ?? null;

  const handleConfirm = () => {
    if (!selectedTask) return;
    setTodayFocus(selectedTask.title);
    activeTasks
      .filter(t => t.id !== selectedTask.id)
      .forEach(t => snoozeTask(t.id, 2));
    setDone(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        {done ? (
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="text-5xl">🌿</div>
            <h2 className="text-xl font-medium">Ett steg i taget</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ditt fokus idag är satt. Resten av dina uppgifter är undanstoppade i två dagar så du slipper se dem just nu.
            </p>
            <Button onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-6">
              Stäng
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Jag är överväldigad</DialogTitle>
              <DialogDescription>
                Låt oss göra det enklare. Välj den enda sak som känns viktigast just nu — resten flyttar vi undan
                i två dagar så det inte syns.
              </DialogDescription>
            </DialogHeader>

            {activeTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Du har inga aktiva uppgifter just nu. Ta en paus — det finns inget som väntar.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto py-2">
                {activeTasks.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedId(task.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                      selectedId === task.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {selectedId === task.id ? (
                      <CheckCircle2 size={22} className="text-primary shrink-0" />
                    ) : (
                      <Circle size={22} className="text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1">{task.title}</span>
                    {task.id === suggested?.id && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
                        Föreslagen
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeTasks.length > 0 && (
              <Button
                onClick={handleConfirm}
                disabled={!selectedTask}
                className="w-full h-14 rounded-2xl text-lg font-medium shadow-sm mt-2"
              >
                <Moon size={20} className="mr-2" />
                Sätt fokus & skjut upp resten
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
