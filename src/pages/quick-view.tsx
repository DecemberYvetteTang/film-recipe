import { Camera, Check, FilePlus2, Loader2, SlidersHorizontal } from "lucide-react";
import { ChipGroup } from "@/components/film-recipe/chip-group";
import { RecipeCard } from "@/components/film-recipe/recipe-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brandLabels, brandModels, sceneTags, styleTags, subjectTags } from "@/data/taxonomy";
import type { CameraBrand, Recipe } from "@/domain/recipe";

const brands: CameraBrand[] = ["fuji", "ricoh"];

interface QuickViewProps {
  activeScenes: string[];
  activeStyles: string[];
  activeSubjects: string[];
  brand: CameraBrand;
  clearFilters: () => void;
  commonFirst: boolean;
  filteredRecipes: Recipe[];
  isLoading: boolean;
  onBrandChange: (brand: CameraBrand) => void;
  onCreate: () => void;
  onOpenDetail: (recipe: Recipe) => void;
  sampleUrls: Record<string, string>;
  setActiveScenes: (items: string[]) => void;
  setActiveStyles: (items: string[]) => void;
  setActiveSubjects: (items: string[]) => void;
  setCommonFirst: (enabled: boolean) => void;
}

export function QuickView({
  activeScenes,
  activeStyles,
  activeSubjects,
  brand,
  clearFilters,
  commonFirst,
  filteredRecipes,
  isLoading,
  onBrandChange,
  onCreate,
  onOpenDetail,
  sampleUrls,
  setActiveScenes,
  setActiveStyles,
  setActiveSubjects,
  setCommonFirst
}: QuickViewProps) {
  const hasFilters = activeScenes.length + activeSubjects.length + activeStyles.length > 0;

  return (
    <section className="space-y-4" aria-label="Film Recipe 快查">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase leading-[17px] tracking-[0] text-muted-foreground">
            Film Recipe
          </p>
          <h1 className="text-2xl font-bold leading-8 tracking-[0] text-foreground">配方快查</h1>
        </div>
        <Button variant="secondary" size="icon" aria-label="筛选设置">
          <SlidersHorizontal size={18} />
        </Button>
      </div>

      <Tabs value={brand} onValueChange={(value) => onBrandChange(value as CameraBrand)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {brands.map((item) => (
            <TabsTrigger key={item} value={item}>
              {item === "fuji" ? "Fuji" : "Ricoh"}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-primary" />
            <CardTitle>{brandLabels[brand]}</CardTitle>
          </div>
          <CardDescription>{brandModels[brand].join(" / ")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterGroup label="场景" items={sceneTags} activeItems={activeScenes} onChange={setActiveScenes} />
          <FilterGroup label="题材" items={subjectTags} activeItems={activeSubjects} onChange={setActiveSubjects} />
          <FilterGroup label="风格" items={styleTags.slice(0, 5)} activeItems={activeStyles} onChange={setActiveStyles} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold leading-5"
          onClick={() => setCommonFirst(!commonFirst)}
        >
          <span className="grid size-5 place-items-center rounded-full border border-primary/30 bg-card text-primary">
            {commonFirst ? <Check size={13} /> : null}
          </span>
          常用优先
        </button>
        <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters}>
          清空
        </Button>
      </div>

      {isLoading ? (
        <section className="grid min-h-[286px] place-items-center rounded-2xl border border-dashed border-border bg-card px-8 text-center">
          <Loader2 className="animate-spin text-primary" size={28} />
        </section>
      ) : filteredRecipes.length > 0 ? (
        <section className="columns-2 gap-3" aria-label="配方列表">
          {filteredRecipes.map((recipe) => {
            const cover = recipe.sampleImages[0];
            return (
              <RecipeCard
                key={recipe.id}
                title={recipe.name}
                status={recipe.status}
                tags={[...recipe.scenes, ...recipe.subjects, ...recipe.styles].slice(0, 4)}
                sampleSource={cover?.sourceType ?? "暂无样张"}
                sampleUrl={cover ? sampleUrls[cover.assetId] : undefined}
                onClick={() => onOpenDetail(recipe)}
                className="mb-5"
              />
            );
          })}
        </section>
      ) : (
        <section
          className="grid min-h-[286px] place-items-center rounded-2xl border border-dashed border-border bg-card px-8 text-center"
          aria-label="配方列表"
        >
          <div className="space-y-4">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-primary">
              <FilePlus2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-7 tracking-[0]">还没有{brandLabels[brand]}配方</h2>
              <p className="mt-2 text-[15px] leading-[22px] text-muted-foreground">
                新建一条配方后，这里会用样张瀑布流帮你快速挑选今天想用的风格。
              </p>
            </div>
            <Button type="button" onClick={onCreate}>
              新建第一条配方
            </Button>
          </div>
        </section>
      )}
    </section>
  );
}

interface FilterGroupProps {
  label: string;
  items: string[];
  activeItems: string[];
  onChange: (items: string[]) => void;
}

function FilterGroup({ label, items, activeItems, onChange }: FilterGroupProps) {
  return (
    <div className="space-y-2" aria-label={label}>
      <p className="text-xs font-medium leading-[17px] text-muted-foreground">{label}</p>
      <ChipGroup items={items} activeItems={activeItems} onChange={onChange} />
    </div>
  );
}
