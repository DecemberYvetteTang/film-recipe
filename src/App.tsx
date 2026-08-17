import { type ChangeEvent, useMemo, useState } from "react";
import { BottomNav, type BottomNavItem } from "@/components/film-recipe/bottom-nav";
import { brandModels } from "@/data/taxonomy";
import type { CameraBrand, Recipe } from "@/domain/recipe";
import { useObjectUrl } from "@/hooks/use-object-url";
import { useRecipes } from "@/hooks/use-recipes";
import { useSampleUrls } from "@/hooks/use-sample-urls";
import { compactParams, formatRecipeForCopy, matchesEvery } from "@/lib/recipe-utils";
import { BackupView } from "@/pages/backup-view";
import { DetailView } from "@/pages/detail-view";
import { NewRecipeView } from "@/pages/new-recipe-view";
import { QuickView } from "@/pages/quick-view";
import { recognizeRecipeText } from "@/services/ocr";
import { replaceRecipes, saveAsset, saveRecipe } from "@/storage/db";
import type { AppView } from "@/types/navigation";
import { initialFormState, type RecipeFormState } from "@/types/recipe-form";

function App() {
  const [view, setView] = useState<AppView>("quick");
  const [brand, setBrand] = useState<CameraBrand>("fuji");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [activeScenes, setActiveScenes] = useState<string[]>([]);
  const [activeSubjects, setActiveSubjects] = useState<string[]>([]);
  const [activeStyles, setActiveStyles] = useState<string[]>([]);
  const [commonFirst, setCommonFirst] = useState(true);
  const [form, setForm] = useState<RecipeFormState>(initialFormState);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [message, setMessage] = useState("");

  const { isLoading, recipes, reloadRecipes } = useRecipes();
  const sampleUrls = useSampleUrls(recipes);
  const samplePreviewUrl = useObjectUrl(sampleFile);

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
    await reloadRecipes();
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
      await reloadRecipes();
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

export default App;
