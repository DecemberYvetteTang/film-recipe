import { useEffect, useState } from "react";
import type { Recipe } from "@/domain/recipe";
import { getAsset } from "@/storage/db";

export function useSampleUrls(recipes: Recipe[]) {
  const [sampleUrls, setSampleUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const assetIds = recipes.flatMap((recipe) => recipe.sampleImages.map((image) => image.assetId));
    let cancelled = false;
    const createdUrls: string[] = [];

    async function loadSampleUrls() {
      const entries = await Promise.all(
        assetIds.map(async (assetId) => {
          const asset = await getAsset(assetId);

          if (!asset) {
            return null;
          }

          const url = URL.createObjectURL(asset.blob);
          createdUrls.push(url);
          return [assetId, url] as const;
        })
      );

      if (cancelled) {
        createdUrls.forEach(URL.revokeObjectURL);
        return;
      }

      setSampleUrls(Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, string]>));
    }

    void loadSampleUrls();

    return () => {
      cancelled = true;
      createdUrls.forEach(URL.revokeObjectURL);
    };
  }, [recipes]);

  return sampleUrls;
}
