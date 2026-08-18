import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

const STORAGE_KEY = "myflove-meal-favorites";

export interface MealRecipe {
  id: string;
  dish: string;
  ingredients: string[];
  /** Stjärnmärkt av dig – ligger alltid överst. */
  favorite?: boolean;
  /** Hur många gånger rätten planerats in. */
  useCount: number;
  lastUsedAt: number;
}

const newId = () => Math.random().toString(36).slice(2, 11);

export const normalizeDish = (dish: string) => dish.toLowerCase().replace(/\s+/g, " ").trim();

export function useMealFavorites() {
  const [recipes, setRecipes] = useCloudSyncedStorage<MealRecipe[]>(STORAGE_KEY, []);

  /** Registrera att en rätt planerats in (bygger upp historiken automatiskt). */
  const remember = useCallback(
    (dish: string, ingredients: string[]) => {
      const clean = dish.trim();
      if (!clean) return;
      const key = normalizeDish(clean);
      setRecipes((prev) => {
        const existing = prev.find((r) => normalizeDish(r.dish) === key);
        if (existing) {
          return prev.map((r) =>
            r.id === existing.id
              ? {
                  ...r,
                  dish: clean,
                  ingredients: ingredients.length ? ingredients : r.ingredients,
                  useCount: r.useCount + 1,
                  lastUsedAt: Date.now(),
                }
              : r,
          );
        }
        return [
          { id: newId(), dish: clean, ingredients, useCount: 1, lastUsedAt: Date.now() },
          ...prev,
        ];
      });
    },
    [setRecipes],
  );

  const toggleFavorite = useCallback(
    (dish: string, ingredients: string[] = []) => {
      const clean = dish.trim();
      if (!clean) return;
      const key = normalizeDish(clean);
      setRecipes((prev) => {
        const existing = prev.find((r) => normalizeDish(r.dish) === key);
        if (existing) {
          return prev.map((r) => (r.id === existing.id ? { ...r, favorite: !r.favorite } : r));
        }
        return [
          {
            id: newId(),
            dish: clean,
            ingredients,
            favorite: true,
            useCount: 0,
            lastUsedAt: Date.now(),
          },
          ...prev,
        ];
      });
    },
    [setRecipes],
  );

  const remove = useCallback(
    (id: string) => setRecipes((prev) => prev.filter((r) => r.id !== id)),
    [setRecipes],
  );

  const isFavorite = useCallback(
    (dish: string) => {
      const key = normalizeDish(dish);
      return recipes.some((r) => normalizeDish(r.dish) === key && r.favorite);
    },
    [recipes],
  );

  const favorites = useMemo(
    () =>
      recipes
        .filter((r) => r.favorite)
        .sort((a, b) => b.useCount - a.useCount || b.lastUsedAt - a.lastUsedAt),
    [recipes],
  );

  /** Tidigare veckors rätter – mest använda och senast planerade först. */
  const recent = useMemo(
    () =>
      recipes
        .filter((r) => !r.favorite && r.useCount > 0)
        .sort((a, b) => b.lastUsedAt - a.lastUsedAt || b.useCount - a.useCount),
    [recipes],
  );

  /**
   * Förslag till veckan: favoriter först, sedan tidigare rätter,
   * utan de rätter som redan ligger i veckan.
   */
  const suggest = useCallback(
    (count: number, exclude: string[] = []): MealRecipe[] => {
      const used = new Set(exclude.map(normalizeDish));
      const pool = [...favorites, ...recent].filter((r) => !used.has(normalizeDish(r.dish)));
      return pool.slice(0, count);
    },
    [favorites, recent],
  );

  return { recipes, favorites, recent, remember, toggleFavorite, remove, isFavorite, suggest };
}
