import { ChevronLeft, Clipboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { brandLabels } from "@/data/taxonomy";
import type { Recipe } from "@/domain/recipe";
import { getFilledParamGroups } from "@/lib/recipe-utils";

interface DetailViewProps {
  message: string;
  onBack: () => void;
  onCopy: () => void;
  recipe: Recipe;
  sampleUrls: Record<string, string>;
}

export function DetailView({ message, onBack, onCopy, recipe, sampleUrls }: DetailViewProps) {
  const cover = recipe.sampleImages[0];
  const coverUrl = cover ? sampleUrls[cover.assetId] : undefined;
  const paramGroups = getFilledParamGroups(recipe);

  return (
    <section className="space-y-4" aria-label="配方详情">
      <Button variant="ghost" className="h-auto px-0" onClick={onBack}>
        <ChevronLeft size={18} />
        返回快查
      </Button>

      <div className="space-y-3">
        <div className="relative h-[280px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#b7c9cc] to-[#849a9a]">
          {coverUrl ? <img src={coverUrl} alt={recipe.name} className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <Badge variant={recipe.status === "常用" ? "default" : "accent"}>{recipe.status}</Badge>
            <h1 className="mt-3 text-2xl font-bold leading-8 tracking-[0] text-white">{recipe.name}</h1>
            <p className="mt-1 text-sm leading-5 text-white/82">
              {brandLabels[recipe.brand]} · {recipe.compatibleModels.join(" / ")}
            </p>
          </div>
        </div>

        {recipe.sampleImages.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recipe.sampleImages.map((image) => (
              <div key={image.id} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {sampleUrls[image.assetId] ? <img src={sampleUrls[image.assetId]} alt="" className="h-full w-full object-cover" /> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>适用场景</CardTitle>
          <CardDescription>{[...recipe.scenes, ...recipe.subjects, ...recipe.styles].join(" / ") || "未设置标签"}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>相机参数</CardTitle>
            <CardDescription>只展示已经保存的参数。</CardDescription>
          </div>
          <Button variant="secondary" size="sm" onClick={onCopy}>
            <Clipboard size={15} />
            复制
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {paramGroups.length > 0 ? (
            paramGroups.map((group) => (
              <div key={group.name} className="space-y-2">
                <h2 className="text-xs font-semibold leading-[17px] text-muted-foreground">{group.name}</h2>
                <div className="overflow-hidden rounded-xl border border-border bg-background/46">
                  {group.entries.map((entry) => (
                    <div key={entry.label} className="grid grid-cols-[108px_1fr] gap-3 border-b border-border/70 px-4 py-3 last:border-b-0">
                      <span className="text-sm leading-5 text-muted-foreground">{entry.label}</span>
                      <span className="font-mono text-sm font-semibold leading-5 text-foreground">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-[15px] leading-[22px] text-muted-foreground">还没有填写具体参数。</p>
          )}
        </CardContent>
      </Card>

      {recipe.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>备注</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-[15px] leading-[24px] text-foreground">{recipe.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      {message ? <p className="rounded-xl bg-secondary px-4 py-3 text-sm leading-5 text-primary">{message}</p> : null}
    </section>
  );
}
