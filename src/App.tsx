import { type ChangeEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Camera,
  Check,
  ChevronLeft,
  Clipboard,
  FileImage,
  FilePlus2,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Upload
} from "lucide-react";
import { BottomNav, type BottomNavItem } from "@/components/film-recipe/bottom-nav";
import { RecipeCard } from "@/components/film-recipe/recipe-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { brandLabels, brandModels, sceneTags, styleTags, subjectTags } from "@/data/taxonomy";
import { groupParamFields } from "@/domain/param-fields";
import type { CameraBrand, Recipe, RecipeStatus, SampleImageSourceType } from "@/domain/recipe";
import { getAsset, getRecipes, replaceRecipes, saveAsset, saveRecipe } from "@/storage/db";
import { recognizeRecipeText } from "@/services/ocr";

const brands: CameraBrand[] = ["fuji", "ricoh"];
const statuses: RecipeStatus[] = ["常用", "想试"];
const sampleSourceTypes: SampleImageSourceType[] = ["我拍摄", "作者参考图"];

type AppView = BottomNavItem | "detail";

interface RecipeFormState {
  name: string;
  brand: CameraBrand;
  compatibleModels: string[];
  scenes: string[];
  subjects: string[];
  styles: string[];
  status: RecipeStatus;
  sampleSourceType: SampleImageSourceType;
  params: Record<string, string>;
  ocrText: string;
  notes: string;
}

const initialFormState: RecipeFormState = {
  name: "",
  brand: "fuji",
  compatibleModels: brandModels.fuji,
  scenes: [],
  subjects: [],
  styles: [],
  status: "想试",
  sampleSourceType: "作者参考图",
  params: {},
  ocrText: "",
  notes: ""
};

function App() {
  const [view, setView] = useState<AppView>("quick");
  const [brand, setBrand] = useState<CameraBrand>("fuji");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [sampleUrls, setSampleUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeScenes, setActiveScenes] = useState<string[]>([]);
  const [activeSubjects, setActiveSubjects] = useState<string[]>([]);
  const [activeStyles, setActiveStyles] = useState<string[]>([]);
  const [commonFirst, setCommonFirst] = useState(true);
  const [form, setForm] = useState<RecipeFormState>(initialFormState);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [samplePreviewUrl, setSamplePreviewUrl] = useState<string | null>(null);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [message, setMessage] = useState("");

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null;

  const filteredRecipes = useMemo(() => {
    const matches = recipes.filter((recipe) => {
      return (
        recipe.brand === brand &&
        matchesEvery(recipe.scenes, activeScenes) &&
        matchesEvery(recipe.subjects, activeSubjects) &&
        matchesEvery(recipe.styles, activeStyles)
      );
    });

    if (!commonFirst) {
      return matches;
    }

    return [...matches].sort((a, b) => Number(b.status === "常用") - Number(a.status === "常用"));
  }, [activeScenes, activeStyles, activeSubjects, brand, commonFirst, recipes]);

  useEffect(() => {
    void loadRecipes();
  }, []);

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

  useEffect(() => {
    if (!sampleFile) {
      setSamplePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(sampleFile);
    setSamplePreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [sampleFile]);

  async function loadRecipes() {
    setIsLoading(true);
    try {
      setRecipes(await getRecipes());
    } finally {
      setIsLoading(false);
    }
  }

  function switchNav(item: BottomNavItem) {
    setView(item);
    setMessage("");

    if (item === "new") {
      resetForm(brand);
    }
  }

  function resetForm(nextBrand = form.brand) {
    setForm({
      ...initialFormState,
      brand: nextBrand,
      compatibleModels: brandModels[nextBrand]
    });
    setSampleFile(null);
    setOcrFile(null);
    setOcrProgress(0);
  }

  function updateForm<K extends keyof RecipeFormState>(key: K, value: RecipeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateFormBrand(nextBrand: CameraBrand) {
    setForm((current) => ({
      ...current,
      brand: nextBrand,
      compatibleModels: brandModels[nextBrand],
      params: {}
    }));
  }

  function updateParam(key: string, value: string) {
    setForm((current) => ({
      ...current,
      params: {
        ...current.params,
        [key]: value
      }
    }));
  }

  async function createRecipe() {
    if (!form.name.trim()) {
      setMessage("先给这条配方取个名字。");
      return;
    }

    const now = new Date().toISOString();
    const asset = sampleFile ? await saveAsset(sampleFile) : null;
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      brand: form.brand,
      compatibleModels: form.compatibleModels,
      scenes: form.scenes,
      subjects: form.subjects,
      styles: form.styles,
      status: form.status,
      sampleImages: asset
        ? [
            {
              id: crypto.randomUUID(),
              assetId: asset.id,
              sourceType: form.sampleSourceType
            }
          ]
        : [],
      ocrText: form.ocrText.trim() || undefined,
      params: compactParams(form.params),
      notes: form.notes.trim(),
      createdAt: now,
      updatedAt: now
    };

    await saveRecipe(recipe);
    await loadRecipes();
    setBrand(recipe.brand);
    setView("quick");
    setMessage("已保存，回到快查页。");
    resetForm(recipe.brand);
  }

  async function runOcr() {
    if (!ocrFile) {
      setMessage("先上传一张参数截图。");
      return;
    }

    setIsRecognizing(true);
    setOcrProgress(0);
    setMessage("");

    try {
      const text = await recognizeRecipeText(ocrFile, setOcrProgress);
      updateForm("ocrText", text);
      setMessage(text ? "识别完成，可以手动整理到参数字段。" : "没有识别到文字，可以换一张更清晰的截图。");
    } catch {
      setMessage("OCR 识别失败。可能是首次加载语言包失败，稍后重试或先手动录入。");
    } finally {
      setIsRecognizing(false);
    }
  }

  function openDetail(recipe: Recipe) {
    setSelectedRecipeId(recipe.id);
    setView("detail");
    setMessage("");
  }

  function clearFilters() {
    setActiveScenes([]);
    setActiveSubjects([]);
    setActiveStyles([]);
  }

  async function copyRecipe(recipe: Recipe) {
    await navigator.clipboard.writeText(formatRecipeForCopy(recipe));
    setMessage("参数已复制。");
  }

  function exportBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      note: "图片不会写入 JSON。导入后如需跨设备使用，需要重新补传样张。",
      recipes
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `film-recipe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as { recipes?: Recipe[] };

      if (!Array.isArray(payload.recipes)) {
        throw new Error("Invalid backup");
      }

      await replaceRecipes(payload.recipes);
      await loadRecipes();
      setView("quick");
      setMessage("已覆盖导入备份。图片不会随 JSON 恢复。");
    } catch {
      setMessage("导入失败，请确认这是 Film Recipe 导出的 JSON 文件。");
    } finally {
      event.target.value = "";
    }
  }

  const activeNav: BottomNavItem = view === "detail" ? "quick" : view;

  return (
    <main className="min-h-screen px-4 py-6 pb-32">
      <div className="mx-auto w-full max-w-[390px]">
        {view === "quick" ? (
          <QuickView
            activeScenes={activeScenes}
            activeStyles={activeStyles}
            activeSubjects={activeSubjects}
            brand={brand}
            clearFilters={clearFilters}
            commonFirst={commonFirst}
            filteredRecipes={filteredRecipes}
            isLoading={isLoading}
            onBrandChange={setBrand}
            onCreate={() => switchNav("new")}
            onOpenDetail={openDetail}
            sampleUrls={sampleUrls}
            setActiveScenes={setActiveScenes}
            setActiveStyles={setActiveStyles}
            setActiveSubjects={setActiveSubjects}
            setCommonFirst={setCommonFirst}
          />
        ) : null}

        {view === "detail" && selectedRecipe ? (
          <DetailView
            message={message}
            onBack={() => setView("quick")}
            onCopy={() => void copyRecipe(selectedRecipe)}
            recipe={selectedRecipe}
            sampleUrls={sampleUrls}
          />
        ) : null}

        {view === "new" ? (
          <NewRecipeView
            form={form}
            isRecognizing={isRecognizing}
            message={message}
            ocrFile={ocrFile}
            ocrProgress={ocrProgress}
            onBrandChange={updateFormBrand}
            onCreate={() => void createRecipe()}
            onOcrFileChange={setOcrFile}
            onParamChange={updateParam}
            onRecognize={() => void runOcr()}
            onReset={() => resetForm()}
            onSampleFileChange={setSampleFile}
            sampleFile={sampleFile}
            samplePreviewUrl={samplePreviewUrl}
            updateForm={updateForm}
          />
        ) : null}

        {view === "backup" ? (
          <BackupView message={message} onExport={exportBackup} onImport={(event) => void importBackup(event)} recipes={recipes} />
        ) : null}
      </div>

      <BottomNav activeItem={activeNav} onChange={switchNav} />
    </main>
  );
}

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

function QuickView({
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

interface DetailViewProps {
  message: string;
  onBack: () => void;
  onCopy: () => void;
  recipe: Recipe;
  sampleUrls: Record<string, string>;
}

function DetailView({ message, onBack, onCopy, recipe, sampleUrls }: DetailViewProps) {
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

interface NewRecipeViewProps {
  form: RecipeFormState;
  isRecognizing: boolean;
  message: string;
  ocrFile: File | null;
  ocrProgress: number;
  onBrandChange: (brand: CameraBrand) => void;
  onCreate: () => void;
  onOcrFileChange: (file: File | null) => void;
  onParamChange: (key: string, value: string) => void;
  onRecognize: () => void;
  onReset: () => void;
  onSampleFileChange: (file: File | null) => void;
  sampleFile: File | null;
  samplePreviewUrl: string | null;
  updateForm: <K extends keyof RecipeFormState>(key: K, value: RecipeFormState[K]) => void;
}

function NewRecipeView({
  form,
  isRecognizing,
  message,
  ocrFile,
  ocrProgress,
  onBrandChange,
  onCreate,
  onOcrFileChange,
  onParamChange,
  onRecognize,
  onReset,
  onSampleFileChange,
  sampleFile,
  samplePreviewUrl,
  updateForm
}: NewRecipeViewProps) {
  return (
    <section className="space-y-4" aria-label="新建配方">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase leading-[17px] tracking-[0] text-muted-foreground">
            New Recipe
          </p>
          <h1 className="text-2xl font-bold leading-8 tracking-[0] text-foreground">新建配方</h1>
        </div>
        <Button variant="secondary" size="icon" aria-label="重置表单" onClick={onReset}>
          <RotateCcw size={18} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
          <CardDescription>先记住这条配方是谁、适合哪些相机和场景。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="配方名称">
            <Input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="例如：阴天冷绿街拍" />
          </Field>

          <Field label="品牌">
            <Tabs value={form.brand} onValueChange={(value) => onBrandChange(value as CameraBrand)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                {brands.map((item) => (
                  <TabsTrigger key={item} value={item}>
                    {item === "fuji" ? "Fuji" : "Ricoh"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </Field>

          <Field label="适用机型">
            <ChipGroup
              items={brandModels[form.brand]}
              activeItems={form.compatibleModels}
              onChange={(items) => updateForm("compatibleModels", items)}
            />
          </Field>

          <Field label="状态">
            <ChipGroup items={statuses} activeItems={[form.status]} onChange={(items) => updateForm("status", (items[0] ?? "想试") as RecipeStatus)} />
          </Field>

          <Field label="标签">
            <div className="space-y-3">
              <ChipGroup items={sceneTags} activeItems={form.scenes} onChange={(items) => updateForm("scenes", items)} />
              <ChipGroup items={subjectTags} activeItems={form.subjects} onChange={(items) => updateForm("subjects", items)} />
              <ChipGroup items={styleTags} activeItems={form.styles} onChange={(items) => updateForm("styles", items)} />
            </div>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>效果样张</CardTitle>
          <CardDescription>这里放用来判断风格的照片，可以是你拍的，也可以是网上参考图。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid h-48 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-background/58">
            {samplePreviewUrl ? (
              <img src={samplePreviewUrl} alt="效果样张预览" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground">
                <FileImage className="mx-auto mb-2" size={26} />
                <p className="text-sm leading-5">暂未上传样张</p>
              </div>
            )}
          </div>
          <input
            id="sample-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => onSampleFileChange(event.target.files?.[0] ?? null)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <label htmlFor="sample-file">
                <Upload size={16} />
                {sampleFile ? "更换样张" : "上传样张"}
              </label>
            </Button>
            <ChipGroup
              items={sampleSourceTypes}
              activeItems={[form.sampleSourceType]}
              onChange={(items) => updateForm("sampleSourceType", (items[0] ?? "作者参考图") as SampleImageSourceType)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>参数截图 OCR</CardTitle>
          <CardDescription>截图只用于辅助识别参数文字，不会出现在详情页。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            id="ocr-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => onOcrFileChange(event.target.files?.[0] ?? null)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <label htmlFor="ocr-file">
                <Upload size={16} />
                {ocrFile ? "更换截图" : "上传截图"}
              </label>
            </Button>
            <Button type="button" onClick={onRecognize} disabled={!ocrFile || isRecognizing}>
              {isRecognizing ? <Loader2 className="animate-spin" size={16} /> : null}
              {isRecognizing ? `${ocrProgress || 1}%` : "识别文字"}
            </Button>
          </div>
          <Textarea
            value={form.ocrText}
            onChange={(event) => updateForm("ocrText", event.target.value)}
            placeholder="OCR 识别结果会出现在这里，也可以直接手动粘贴参数文本。"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>相机参数</CardTitle>
          <CardDescription>按品牌固定模板填写；没用到的字段可以留空。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {groupParamFields(form.brand).map((group, index) => (
            <details key={group.name} open={index === 0} className="rounded-xl border border-border bg-background/46 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold leading-5">{group.name}</summary>
              <div className="mt-4 space-y-3">
                {group.fields.map((field) => (
                  <Field key={field.key} label={field.label}>
                    <Input value={form.params[field.key] ?? ""} onChange={(event) => onParamChange(field.key, event.target.value)} />
                  </Field>
                ))}
              </div>
            </details>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>备注</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="比如：适合阴天街拍，人像肤色偏冷。" />
        </CardContent>
      </Card>

      {message ? <p className="rounded-xl bg-secondary px-4 py-3 text-sm leading-5 text-primary">{message}</p> : null}

      <Button type="button" className="w-full" onClick={onCreate}>
        保存配方
      </Button>
    </section>
  );
}

interface BackupViewProps {
  message: string;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  recipes: Recipe[];
}

function BackupView({ message, onExport, onImport, recipes }: BackupViewProps) {
  return (
    <section className="space-y-4" aria-label="备份">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase leading-[17px] tracking-[0] text-muted-foreground">Backup</p>
        <h1 className="text-2xl font-bold leading-8 tracking-[0] text-foreground">备份</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Archive size={18} className="text-primary" />
            <CardTitle>本机数据</CardTitle>
          </div>
          <CardDescription>当前共有 {recipes.length} 条配方。JSON 导出不会包含图片文件。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" className="w-full" onClick={onExport}>
            导出 JSON
          </Button>
          <input id="backup-file" type="file" accept="application/json" className="sr-only" onChange={onImport} />
          <Button variant="secondary" className="w-full" asChild>
            <label htmlFor="backup-file">导入 JSON 覆盖当前数据</label>
          </Button>
        </CardContent>
      </Card>

      {message ? <p className="rounded-xl bg-secondary px-4 py-3 text-sm leading-5 text-primary">{message}</p> : null}
    </section>
  );
}

interface FieldProps {
  children: ReactNode;
  label: string;
}

function Field({ children, label }: FieldProps) {
  return (
    <div className="block space-y-2">
      <span className="text-sm font-semibold leading-5 text-foreground">{label}</span>
      {children}
    </div>
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

interface ChipGroupProps {
  items: string[];
  activeItems: string[];
  onChange: (items: string[]) => void;
}

function ChipGroup({ items, activeItems, onChange }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = activeItems.includes(item);
        return (
          <button key={item} type="button" onClick={() => onChange(toggleItem(activeItems, item))}>
            <Badge variant={isActive ? "default" : "muted"}>{item}</Badge>
          </button>
        );
      })}
    </div>
  );
}

function toggleItem(items: string[], item: string) {
  return items.includes(item) ? items.filter((current) => current !== item) : [...items, item];
}

function matchesEvery(values: string[], filters: string[]) {
  return filters.length === 0 || filters.every((filter) => values.includes(filter));
}

function compactParams(params: Record<string, string>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
}

function getFilledParamGroups(recipe: Recipe) {
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

function formatRecipeForCopy(recipe: Recipe) {
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

export default App;
