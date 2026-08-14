import { useState } from "react";
import Layout from "@/components/layout";
import { useFocus, useReminders } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2, Plus, Sparkles, Bell, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";
import CollapsibleSection from "@/components/collapsible-section";

export default function Dashboard() {
  const { currentFocus, setTodayFocus, toggleFocusCompleted } = useFocus();
  const { activeReminders, addReminder, deleteReminder } = useReminders();
  const { toast } = useToast();
  
  const [inputValue, setInputValue] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [showReminderForm, setShowReminderForm] = useState(false);

  const handleToggleFocus = () => {
    const wasCompleted = currentFocus?.completed;
    toggleFocusCompleted();
    if (!wasCompleted) {
      toast({ description: getRandomEncouragement() });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTodayFocus(inputValue.trim());
      setInputValue("");
    }
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (reminderTitle.trim()) {
      // Create for today if added from dashboard
      const todayStr = new Date().toLocaleDateString('sv-SE').split(' ')[0];
      addReminder(reminderTitle.trim(), todayStr, reminderTime || undefined);
      setReminderTitle("");
      setReminderTime("");
      setShowReminderForm(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 mt-4 md:mt-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dagens fokus</h1>
          <p className="text-muted-foreground text-lg">Vad är den enda saken du verkligen vill få gjord idag?</p>
        </div>

        {!currentFocus ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
            <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                <Target size={32} />
              </div>
              <CollapsibleSection title="Välj en sak" help="Välj en enda sak som räcker för att dagen ska kännas okej. Allt annat är bonus." className="w-full items-center text-center">
                <p className="text-muted-foreground text-sm leading-relaxed -mt-2">
                  Om allt annat misslyckas idag, vad skulle kännas skönt att ha bockat av? Gör det litet och konkret.
                </p>

                <div className="w-full relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="T.ex. Betala hyran..."
                    className="h-14 text-lg rounded-2xl px-6 bg-secondary/50 border-transparent focus-visible:ring-primary focus-visible:border-primary w-full transition-all"
                    autoFocus
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={!inputValue.trim()}
                  className="w-full h-14 rounded-2xl text-lg font-medium shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <Plus className="mr-2" size={24} />
                  Sätt fokus
                </Button>
              </CollapsibleSection>
            </div>
          </form>
        ) : (
          <div className="max-w-md mx-auto">
            <button
              onClick={handleToggleFocus}
              className={`w-full text-left p-8 md:p-10 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden group ${
                currentFocus.completed 
                  ? "bg-primary/10 border-primary/20 text-primary" 
                  : "bg-card border-border hover:border-primary/50 shadow-sm"
              }`}
            >
              {currentFocus.completed && (
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-50" />
              )}
              
              <div className="flex items-start gap-6 relative z-10">
                <div className={`mt-1 rounded-full flex-shrink-0 transition-colors duration-300 ${
                  currentFocus.completed ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                }`}>
                  <CheckCircle2 size={40} className={currentFocus.completed ? "fill-primary text-primary-foreground" : ""} />
                </div>
                <div>
                  <h3 className={`text-2xl md:text-3xl font-medium leading-tight transition-all duration-500 ${
                    currentFocus.completed ? "opacity-70 line-through" : "text-foreground"
                  }`}>
                    {currentFocus.text}
                  </h3>
                  
                  {currentFocus.completed && (
                    <div className="mt-4 flex items-center gap-2 text-primary font-medium animate-in fade-in slide-in-from-bottom-2">
                      <Sparkles size={18} />
                      <span>Fantastiskt jobbat!</span>
                    </div>
                  )}
                </div>
              </div>
            </button>

            {currentFocus.completed && (
              <div className="mt-12 text-center animate-in fade-in duration-700 delay-300">
                <p className="text-muted-foreground mb-4">Du klarade ditt fokus för idag. Allt annat är en bonus.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setTodayFocus("")}
                  className="rounded-xl h-12 px-6 border-border"
                >
                  Byt uppgift
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Reminders Section */}
        <div className="max-w-md mx-auto mt-16 pt-8 border-t border-border">
          <CollapsibleSection
            title={<span className="flex items-center gap-2"><Bell size={24} className="text-primary" />Påminnelser</span>}
            id="Påminnelser"
            headingClassName="text-2xl font-bold"
            actions={
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowReminderForm(!showReminderForm)}
                aria-label={showReminderForm ? "Stäng formulär för ny påminnelse" : "Lägg till ny påminnelse"}
                aria-expanded={showReminderForm}
                className="rounded-xl text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                <Plus size={24} aria-hidden="true" />
              </Button>
            }
          >
          {showReminderForm && (
            <form onSubmit={handleAddReminder} className="bg-card p-4 rounded-2xl border border-border shadow-sm mb-6 space-y-4 animate-in fade-in slide-in-from-top-4">
              <Input
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Vad vill du bli påmind om?"
                className="h-12 rounded-xl"
                autoFocus
              />
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="h-12 rounded-xl flex-1"
                />
                <Button type="submit" disabled={!reminderTitle.trim()} className="h-12 px-6 rounded-xl">
                  Spara
                </Button>
              </div>
            </form>
          )}

          {activeReminders.length === 0 && !showReminderForm && (
            <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
              Inget inplanerat – dagen är din.
            </div>
          )}

          <div className="space-y-3">
            {activeReminders.slice(0, 5).map(reminder => {
              const isToday = reminder.date === new Date().toLocaleDateString('sv-SE').split(' ')[0];
              return (
                <div key={reminder.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl shadow-sm group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      <p className="text-sm text-muted-foreground flex gap-2">
                        {isToday ? "Idag" : reminder.date} 
                        {reminder.time && <span className="text-primary font-medium">{reminder.time}</span>}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteReminder(reminder.id)}
                    className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-destructive/10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
          </CollapsibleSection>
        </div>
      </div>
    </Layout>
  );
}
