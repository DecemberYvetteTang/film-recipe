import { brandLabels } from "@/data/taxonomy";
import { groupParamFields } from "@/domain/param-fields";
import type { Recipe } from "@/domain/recipe";

export function toggleItem(items: string[], item: string) {
  return items.includes(item) ? items.filter((current) => current !== item) : [...items, item];
}

export function matchesEvery(values: string[], filters: string[]) {
  return filters.length === 0 || filters.every((filter) => values.includes(filter));
}

export function compactParams(params: Record<string, string>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
}

export function getFilledParamGroups(recipe: Recipe) {
  const params = recipe.params as Record<string, string | undefined>;

  return groupParamFields(recipe.brand)
    .map((group) => ({
      name: group.name,
      entries: group.fields
        .map((field) => ({
          label: field.label,
          value: params[field.key]
        }))
        .filter((entry): entry is { label: string; value: string } => Boolean(entry.value))
    }))
    .filter((group) => group.entries.length > 0);
}

export function formatRecipeForCopy(recipe: Recipe) {
  const lines = [
    recipe.name,
    `${brandLabels[recipe.brand]} · ${recipe.compatibleModels.join(" / ")}`,
    "",
    ...getFilledParamGroups(recipe).flatMap((group) => [
      `[${group.name}]`,
      ...group.entries.map((entry) => `${entry.label}: ${entry.value}`),
      ""
    ])
  ];

  if (recipe.notes) {
    lines.push("备注", recipe.notes);
  }

  return lines.join("\n").trim();
}
