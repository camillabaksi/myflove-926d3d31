import { useState } from "react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveFloatingElement } from "@/components/myflove/motion";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed, ShoppingCart, Trash2, Star, Sparkles, History } from "lucide-react";
import { useMealFavorites, type MealRecipe } from "@/hooks/use-meal-favorites";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CollapsibleSection from "@/components/collapsible-section";

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
  const { favorites, recent, toggleFavorite, isFavorite } = useMealFavorites();

  const picks = [...favorites, ...recent].slice(0, 8);

  const applyRecipe = (r: MealRecipe) => {
    setDish(r.dish);
    if (r.ingredients.length) setIngredients(r.ingredients.join(", "));
  };

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
            <label htmlFor="meal-dish" className="text-sm font-medium">
              Maträtt
            </label>
            <div className="flex gap-2">
              <Input
                id="meal-dish"
                value={dish}
                onChange={(e) => setDish(e.target.value)}
                placeholder="T.ex. Pasta bolognese"
                className="h-12 rounded-2xl flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                disabled={!dish.trim()}
                aria-label={isFavorite(dish) ? "Ta bort favorit" : "Spara som favorit"}
                onClick={() =>
                  toggleFavorite(
                    dish,
                    ingredients
                      .split(",")
                      .map((i) => i.trim())
                      .filter(Boolean),
                  )
                }
                className="h-12 w-12 rounded-2xl shrink-0"
              >
                <Star
                  size={20}
                  className={isFavorite(dish) ? "fill-gold text-gold" : "text-muted-foreground"}
                />
              </Button>
            </div>
          </div>

          {picks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Favoriter & tidigare veckor
              </p>
              <div className="flex flex-wrap gap-2">
                {picks.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => applyRecipe(r)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-sm hover:border-primary/50"
                  >
                    {r.favorite ? (
                      <Star size={13} className="fill-gold text-gold" />
                    ) : (
                      <History size={13} />
                    )}
                    {r.dish}
                  </button>
                ))}
              </div>
            </div>
          )}
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
  const [plans, setPlans] = useCloudSyncedStorage<MealPlan[]>("myflow-meal-plans", []);
  const { addItem, isShared } = useSharedShoppingList();
  const { toast } = useToast();
  const [editing, setEditing] = useState<EditingSlot | null>(null);
  const {
    favorites,
    recent,
    remember,
    toggleFavorite,
    remove: removeRecipe,
    suggest,
  } = useMealFavorites();

  const findPlan = (weekday: number, mealType: string) =>
    plans.find((p) => p.weekday === weekday && p.mealType === mealType);

  const upsertPlan = (weekday: number, mealType: string, dish: string, ingredients: string[]) => {
    if (dish) remember(dish, ingredients);
    setPlans((prev) => {
      const rest = prev.filter((p) => !(p.weekday === weekday && p.mealType === mealType));
      if (!dish) return rest;
      return [...rest, { weekday, mealType, dish, ingredients }];
    });
  };

  const deletePlan = (weekday: number, mealType: string) => {
    setPlans((prev) => prev.filter((p) => !(p.weekday === weekday && p.mealType === mealType)));
  };

  /** Fyll tomma middagar med favoriter och rätter från tidigare veckor. */
  const suggestWeek = () => {
    const empty = WEEKDAYS.map((_, i) => i).filter((i) => !findPlan(i, "Middag")?.dish);
    if (empty.length === 0) {
      toast({ description: "Alla middagar är redan planerade. 💙" });
      return;
    }
    const picks = suggest(
      empty.length,
      plans.map((p) => p.dish),
    );
    if (picks.length === 0) {
      toast({ description: "Jag har inga favoriter eller tidigare rätter att föreslå än." });
      return;
    }
    setPlans((prev) => {
      let next = [...prev];
      picks.forEach((r, idx) => {
        const weekday = empty[idx]!;
        next = next.filter((p) => !(p.weekday === weekday && p.mealType === "Middag"));
        next.push({ weekday, mealType: "Middag", dish: r.dish, ingredients: r.ingredients });
      });
      return next;
    });
    toast({ description: `${picks.length} middagar föreslagna – ändra fritt.` });
  };

  const applyRecipeToday = (r: MealRecipe) => {
    const weekday = WEEKDAYS.map((_, i) => i).find((i) => !findPlan(i, "Middag")?.dish);
    if (weekday === undefined) {
      toast({ description: "Alla middagar är redan planerade." });
      return;
    }
    upsertPlan(weekday, "Middag", r.dish, r.ingredients);
    toast({ description: `${r.dish} inlagd på ${WEEKDAYS[weekday]!.toLowerCase()}.` });
  };

  const listLabel = isShared ? "familjens inköpslista" : "din inköpslista";

  const sendToShoppingList = (ingredients: string[]) => {
    ingredients.forEach((i) => addItem(i));
    toast({ description: `${ingredients.length} varor tillagda i ${listLabel}!` });
  };

  const sendWeekToShoppingList = () => {
    const all = plans.flatMap((p) => p.ingredients);
    if (all.length === 0) {
      toast({ description: "Inga ingredienser att skicka än." });
      return;
    }
    all.forEach((i) => addItem(i));
    toast({ description: `${all.length} varor tillagda i ${listLabel}!` });
  };

  return (
    <Layout>
      <MyFlovePageGrid area="hem">
        <MyFloveWide>
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl mb-1 flex items-center gap-3">
                  Veckomatlista <MyFloveFloatingElement tone="sun" size={18} />
                </h1>
                <p className="text-sm text-muted-foreground">
                  Planera veckans måltider – för dig själv eller hela familjen.
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                  <ShoppingCart size={12} />
                  {isShared
                    ? "Varor skickas till familjens inköpslista"
                    : "Varor skickas till din egen inköpslista"}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <UtensilsCrossed size={20} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={suggestWeek} className="rounded-2xl h-11">
                <Sparkles className="mr-2" size={16} />
                Föreslå veckan från favoriter
              </Button>
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
            </div>

            {(favorites.length > 0 || recent.length > 0) && (
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                {favorites.length > 0 && (
                  <CollapsibleSection
                    title={
                      <span className="flex items-center gap-2">
                        <Star size={16} className="fill-gold text-gold" /> Mina favoriter
                      </span>
                    }
                    help="Rätter du markerat med stjärna. Tryck på en för att lägga den på idag."
                    headingClassName="font-medium"
                    className="space-y-2"
                  >
                    <div className="flex flex-wrap gap-2">
                      {favorites.map((r) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 pl-3 pr-1 py-1 text-sm"
                        >
                          <button
                            type="button"
                            onClick={() => applyRecipeToday(r)}
                            className="hover:underline"
                          >
                            {r.dish}
                          </button>
                          <button
                            type="button"
                            aria-label={`Ta bort ${r.dish} från favoriter`}
                            onClick={() => toggleFavorite(r.dish)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
                {recent.length > 0 && (
                  <CollapsibleSection
                    title={
                      <span className="flex items-center gap-2">
                        <History size={16} /> Från tidigare veckor
                      </span>
                    }
                    help="Sådant ni ätit förut. Bra när huvudet är tomt och middagen ska bestämmas."
                    headingClassName="font-medium"
                    className="space-y-2"
                  >
                    <div className="flex flex-wrap gap-2">
                      {recent.slice(0, 12).map((r) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 pl-3 pr-1 py-1 text-sm"
                        >
                          <button
                            type="button"
                            onClick={() => applyRecipeToday(r)}
                            className="hover:underline"
                          >
                            {r.dish}
                            {r.useCount > 1 && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ×{r.useCount}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label={`Spara ${r.dish} som favorit`}
                            onClick={() => toggleFavorite(r.dish, r.ingredients)}
                            className="p-1 text-muted-foreground hover:text-gold"
                          >
                            <Star size={13} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Ta bort ${r.dish} ur historiken`}
                            onClick={() => removeRecipe(r.id)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
              </div>
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
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
