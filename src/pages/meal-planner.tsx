import { useState } from "react";
import { useClerk, Show } from "@clerk/react";
import Layout from "@/components/layout";
import {
  useGetMyHousehold,
  useListMealPlans,
  useUpsertMealPlanSlot,
  getGetMyHouseholdQueryKey,
  getListMealPlansQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useShoppingList } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WEEKDAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const MEAL_TYPES = ["Frukost", "Lunch", "Middag"];

interface EditingSlot {
  weekday: number;
  mealType: string;
  dish: string;
  ingredients: string;
}

function EditSlotDialog({
  slot,
  onClose,
}: {
  slot: EditingSlot;
  onClose: () => void;
}) {
  const [dish, setDish] = useState(slot.dish);
  const [ingredients, setIngredients] = useState(slot.ingredients);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upsertMutation = useUpsertMealPlanSlot({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMealPlansQueryKey() });
        onClose();
      },
      onError: () => toast({ description: "Något gick fel. Försök igen.", variant: "destructive" }),
    },
  });

  const handleSave = () => {
    upsertMutation.mutate({
      data: {
        weekday: slot.weekday,
        mealType: slot.mealType,
        dish: dish.trim(),
        ingredients: ingredients
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
      },
    });
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
              name="dish"
              value={dish}
              onChange={(e) => setDish(e.target.value)}
              placeholder="T.ex. Pasta bolognese"
              className="h-12 rounded-2xl"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="meal-ingredients" className="text-sm font-medium">Ingredienser (separera med komma)</label>
            <Input
              id="meal-ingredients"
              name="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="T.ex. pasta, köttfärs, tomatsås"
              className="h-12 rounded-2xl"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={!dish.trim() || upsertMutation.isPending}
            className="w-full h-12 rounded-2xl"
          >
            Spara
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MealPlannerGrid() {
  const { data: household } = useGetMyHousehold({
    query: { queryKey: getGetMyHouseholdQueryKey() },
  });
  const { data: plans = [], isLoading } = useListMealPlans({
    query: { queryKey: getListMealPlansQueryKey() },
  });
  const { addItem } = useShoppingList();
  const { toast } = useToast();
  const [editing, setEditing] = useState<EditingSlot | null>(null);

  if (!household?.id) {
    return (
      <div className="text-center py-16 bg-card/50 border-2 border-dashed border-border rounded-3xl space-y-2">
        <UtensilsCrossed className="mx-auto text-muted-foreground" size={40} />
        <p className="text-lg">Gå med i en familj för att komma åt matlistan.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground">Laddar...</div>;
  }

  const findPlan = (weekday: number, mealType: string) =>
    plans.find((p) => p.weekday === weekday && p.mealType === mealType);

  const sendToShoppingList = (ingredients: string[]) => {
    ingredients.forEach((i) => addItem(i));
    toast({ description: `${ingredients.length} varor tillagda i inköpslistan!` });
  };

  return (
    <div className="space-y-4">
      {WEEKDAYS.map((day, weekday) => (
        <div key={day} className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="font-medium text-lg">{day}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MEAL_TYPES.map((mealType) => {
              const plan = findPlan(weekday, mealType);
              return (
                <div
                  key={mealType}
                  className="border border-border/60 rounded-2xl p-3 hover:border-primary/40 transition-colors group"
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
                    <div className={`text-sm ${plan?.dish ? "font-medium" : "text-muted-foreground italic"}`}>
                      {plan?.dish || "Lägg till maträtt"}
                    </div>
                  </button>
                  {plan && plan.ingredients.length > 0 && (
                    <button
                      onClick={() => sendToShoppingList(plan.ingredients)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ShoppingCart size={14} />
                      Skicka till inköpslista
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {editing && <EditSlotDialog slot={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export default function MealPlannerPage() {
  const { openSignIn } = useClerk();

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Veckomatlista</h1>
          <p className="text-muted-foreground">Planera veckans måltider tillsammans med familjen.</p>
        </div>

        <Show when="signed-out">
          <div className="max-w-md mx-auto text-center py-16 bg-card/50 border-2 border-dashed border-border rounded-3xl space-y-4">
            <UtensilsCrossed className="mx-auto text-muted-foreground" size={40} />
            <p className="text-lg">Logga in för att komma åt matlistan.</p>
            <Button onClick={() => openSignIn()} className="rounded-2xl h-12 px-8">
              Logga in
            </Button>
          </div>
        </Show>

        <Show when="signed-in">
          <MealPlannerGrid />
        </Show>
      </div>
    </Layout>
  );
}
