import { useCallback, useEffect, useState } from "react";
import type { Recipe } from "@/domain/recipe";
import { getRecipes } from "@/storage/db";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      setRecipes(await getRecipes());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadRecipes();
  }, [reloadRecipes]);

  return {
    isLoading,
    recipes,
    reloadRecipes
  };
}
