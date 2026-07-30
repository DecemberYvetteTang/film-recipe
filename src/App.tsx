import { useState } from "react";
import { Camera, FilePlus2, SlidersHorizontal } from "lucide-react";
import { BottomNav, type BottomNavItem } from "@/components/film-recipe/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brandLabels, brandModels, sceneTags, styleTags, subjectTags } from "@/data/taxonomy";
import type { CameraBrand } from "@/domain/recipe";

const brands: CameraBrand[] = ["fuji", "ricoh"];

function App() {
  const [brand, setBrand] = useState<CameraBrand>("fuji");
  const [activeNav, setActiveNav] = useState<BottomNavItem>("quick");

  return (
    <main className="min-h-screen px-4 py-6 pb-32">
      <div className="mx-auto w-full max-w-[390px]">
        <section className="space-y-4" aria-label="Film Recipe 快查">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase leading-[17px] tracking-[0] text-muted-foreground">
                Film Recipe
              </p>
              <h1 className="font-serif text-2xl font-bold leading-8 tracking-[0] text-foreground">配方快查</h1>
            </div>
            <Button variant="secondary" size="icon" aria-label="筛选设置">
              <SlidersHorizontal size={18} />
            </Button>
          </div>

          <Tabs value={brand} onValueChange={(value) => setBrand(value as CameraBrand)} className="w-full">
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
            <CardContent className="space-y-3">
              <FilterGroup label="场景" items={sceneTags} activeItems={["阴天"]} />
              <FilterGroup label="题材" items={subjectTags} activeItems={["街拍"]} />
              <div className="rounded-xl border border-border bg-background/42 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold leading-5">风格：{styleTags[1]}</span>
                  <Button variant="ghost" size="sm" className="h-auto px-0 text-muted-foreground">
                    展开
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
            <span className="text-sm font-semibold leading-5">常用优先</span>
            <Button variant="outline" size="sm">
              清空
            </Button>
          </div>

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
              <Button type="button">新建第一条配方</Button>
            </div>
          </section>
        </section>
      </div>

      <BottomNav activeItem={activeNav} onChange={setActiveNav} />
    </main>
  );
}

interface FilterGroupProps {
  label: string;
  items: string[];
  activeItems?: string[];
}

function FilterGroup({ label, items, activeItems = [] }: FilterGroupProps) {
  return (
    <div className="space-y-2" aria-label={label}>
      <p className="text-xs font-medium leading-[17px] text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isActive = activeItems.includes(item);
          return (
            <Badge key={item} variant={isActive ? "default" : "muted"}>
              {item}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export default App;
