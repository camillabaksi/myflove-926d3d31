import { useState } from "react";
import Layout from "@/components/layout";
import { useShoppingList } from "@/hooks/use-data";
import { useLocalStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed, ShoppingCart, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WEEKDAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const MEAL_TYPES = ["Frukost", "Lunch", "Middag"];

interface MealPlan {
  weekday: number;
  mealType: string;
  dish: string;
  ingredients: string[];
}

interface EditingSlot {
  weekday: number;
  mealType: string;
  dish: string;
  ingredients: string;
}

function slotKey(weekday: number, mealType: string) {
  return `${weekday}-${mealType}`;
}

function EditSlotDialog({
  slot,
  onSave,
  onDelete,
  onClose,
}: {
  slot: EditingSlot;
  onSave: (dish: string, ingredients: string[]) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [dish, setDish] = useState(slot.dish);
  const [ingredients, setIngredients] = useState(slot.ingredients);

  const handleSave = () => {
    onSave(
      dish.trim(),
      ingredients
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
    );
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {WEEKDAYS[slot.weekday]} · {slot.mealType}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="meal-dish" className="text-sm font-medium">Maträtt</label>
            <Input
              id="meal-dish"
              value={dish}
              onChange={(e) => setDish(e.target.value)}
              placeholder="T.ex. Pasta bolognese"
              className="h-12 rounded-2xl"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="meal-ingredients" className="text-sm font-medium">
              Ingredienser (separera med komma)
            </label>
            <Input
              id="meal-ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="T.ex. pasta, köttfärs, tomatsås"
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!dish.trim()}
              className="flex-1 h-12 rounded-2xl"
            >
              Spara
            </Button>
            {slot.dish && (
              <Button
                variant="ghost"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="h-12 rounded-2xl text-destructive"
              >
                <Trash2 size={18} />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MealPlannerPage() {
  const [plans, setPlans] = useLocalStorage<MealPlan[]>("myflow-meal-plans", []);
  const { addItem } = useShoppingList();
  const { toast } = useToast();
  const [editing, setEditing] = useState<EditingSlot | null>(null);

  const findPlan = (weekday: number, mealType: string) =>
    plans.find((p) => p.weekday === weekday && p.mealType === mealType);

  const upsertPlan = (weekday: number, mealType: string, dish: string, ingredients: string[]) => {
    setPlans((prev) => {
      const rest = prev.filter((p) => !(p.weekday === weekday && p.mealType === mealType));
      if (!dish) return rest;
      return [...rest, { weekday, mealType, dish, ingredients }];
    });
  };

  const deletePlan = (weekday: number, mealType: string) => {
    setPlans((prev) => prev.filter((p) => !(p.weekday === weekday && p.mealType === mealType)));
  };

  const sendToShoppingList = (ingredients: string[]) => {
    ingredients.forEach((i) => addItem(i));
    toast({ description: `${ingredients.length} varor tillagda i inköpslistan!` });
  };

  const sendWeekToShoppingList = () => {
    const all = plans.flatMap((p) => p.ingredients);
    if (all.length === 0) {
      toast({ description: "Inga ingredienser att skicka än." });
      return;
    }
    all.forEach((i) => addItem(i));
    toast({ description: `${all.length} varor tillagda i inköpslistan!` });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1">Veckomatlista</h1>
            <p className="text-sm text-muted-foreground">
              Planera veckans måltider – för dig själv eller hela familjen.
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UtensilsCrossed size={20} />
          </div>
        </div>

        {plans.length > 0 && (
          <Button
            onClick={sendWeekToShoppingList}
            variant="secondary"
            className="rounded-2xl h-11"
          >
            <ShoppingCart className="mr-2" size={16} />
            Skicka hela veckan till inköpslistan
          </Button>
        )}

        <div className="space-y-4">
          {WEEKDAYS.map((day, weekday) => (
            <div
              key={slotKey(weekday, "day")}
              className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3"
            >
              <h3 className="font-medium text-lg">{day}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MEAL_TYPES.map((mealType) => {
                  const plan = findPlan(weekday, mealType);
                  return (
                    <div
                      key={mealType}
                      className="border border-border/60 rounded-2xl p-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        {mealType}
                      </div>
                      <button
                        onClick={() =>
                          setEditing({
                            weekday,
                            mealType,
                            dish: plan?.dish ?? "",
                            ingredients: plan?.ingredients.join(", ") ?? "",
                          })
                        }
                        className="text-left w-full"
                      >
                        <div
                          className={`text-sm ${
                            plan?.dish ? "font-medium" : "text-muted-foreground italic"
                          }`}
                        >
                          {plan?.dish || "Lägg till maträtt"}
                        </div>
                      </button>
                      {plan && plan.ingredients.length > 0 && (
                        <button
                          onClick={() => sendToShoppingList(plan.ingredients)}
                          className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <ShoppingCart size={14} />
                          Till inköpslista
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <EditSlotDialog
            slot={editing}
            onSave={(dish, ingredients) =>
              upsertPlan(editing.weekday, editing.mealType, dish, ingredients)
            }
            onDelete={() => deletePlan(editing.weekday, editing.mealType)}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </Layout>
  );
}
