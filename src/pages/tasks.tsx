import { useState } from "react";
import Layout from "@/components/layout";
import { useTasks, Task } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, Trash2, CheckCircle2, Circle, CalendarIcon, Moon, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";
import { confirmations } from "@/lib/flow-voice";

export default function Tasks() {
  const { activeTasks, completedTasks, snoozedTasks, addTask, toggleTask, deleteTask, unsnoozeTask } = useTasks();
  const { toast } = useToast();
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleToggle = (task: Task) => {
    toggleTask(task.id);
    if (!task.completed) {
      toast({ description: `${confirmations.taskDone} ${getRandomEncouragement()}` });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(newTask.trim(), dueDate || undefined);
      setNewTask("");
      setDueDate("");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Att göra</h1>
          <p className="text-muted-foreground">Skriv ner det du behöver komma ihåg, ta det i din egen takt.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Vad behöver du göra?"
            className="h-14 rounded-2xl text-lg bg-secondary/50 border-transparent focus-visible:ring-primary md:flex-1"
          />
          <div className="flex gap-3">
            <div className="relative flex-1 md:w-48">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <CalendarIcon size={18} />
              </div>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-14 rounded-2xl text-base bg-secondary/50 border-transparent focus-visible:ring-primary pl-10 w-full"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!newTask.trim()}
              className="h-14 px-6 rounded-2xl shadow-sm shrink-0"
            >
              <Plus size={24} className="md:mr-2" />
              <span className="hidden md:inline">Lägg till</span>
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          {activeTasks.length === 0 && completedTasks.length === 0 && (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
              <p className="text-lg">Inget att göra just nu.</p>
              <p className="text-sm mt-2 opacity-70">Ta en paus och andas.</p>
            </div>
          )}

          {activeTasks.length > 0 && (
            <div className="space-y-3">
              {activeTasks.map(task => (
                <div 
                  key={task.id}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/30 transition-colors gap-3 md:gap-0"
                >
                  <button 
                    onClick={() => handleToggle(task)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div className="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                      <Circle size={28} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg">{task.title}</span>
                      {task.dueDate && (
                        <span className="text-sm text-primary font-medium flex items-center gap-1.5 mt-0.5">
                          <CalendarIcon size={16} />
                          {task.dueDate === new Date().toLocaleDateString('sv-SE').split(' ')[0] ? "Idag" : task.dueDate}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="flex justify-end md:block">
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Ta bort"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-2">Avklarat</h2>
              {completedTasks.map(task => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-card/50 border border-border/50 rounded-2xl opacity-70"
                >
                  <button 
                    onClick={() => handleToggle(task)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div className="text-primary shrink-0">
                      <CheckCircle2 size={28} className="fill-primary/20" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg line-through">{task.title}</span>
                      {task.dueDate && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <CalendarIcon size={16} />
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-3 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {snoozedTasks.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-2 flex items-center gap-2">
                <Moon size={16} />
                Undanstoppat ett tag
              </h2>
              {snoozedTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 border border-dashed border-border rounded-2xl"
                >
                  <div className="flex flex-col">
                    <span className="text-lg text-muted-foreground">{task.title}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <CalendarIcon size={16} />
                      Syns igen {task.snoozedUntil}
                    </span>
                  </div>
                  <button
                    onClick={() => unsnoozeTask(task.id)}
                    className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    aria-label="Visa igen nu"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
