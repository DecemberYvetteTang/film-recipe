import { FileImage, Loader2, RotateCcw, Upload } from "lucide-react";
import { ChipGroup } from "@/components/film-recipe/chip-group";
import { Field } from "@/components/film-recipe/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { brandModels, sceneTags, styleTags, subjectTags } from "@/data/taxonomy";
import { fujiFilmSimulationGroups } from "@/domain/fuji-film-simulations";
import { groupParamFields } from "@/domain/param-fields";
import type { CameraBrand, RecipeStatus, SampleImageSourceType } from "@/domain/recipe";
import type { RecipeFormState } from "@/types/recipe-form";

const brands: CameraBrand[] = ["fuji", "ricoh"];
const statuses: RecipeStatus[] = ["常用", "想试"];
const sampleSourceTypes: SampleImageSourceType[] = ["我拍摄", "作者参考图"];

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

export function NewRecipeView({
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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" asChild>
              <label htmlFor="sample-file">
                <Upload size={16} />
                {sampleFile ? "更换样张" : "上传样张"}
              </label>
            </Button>
            <ChipGroup
              items={sampleSourceTypes}
              activeItems={[form.sampleSourceType]}
              size="button"
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
                    {form.brand === "fuji" && field.key === "filmSimulation" ? (
                      <Select
                        value={form.params[field.key] ?? ""}
                        placeholder="选择胶片模拟"
                        groups={fujiFilmSimulationGroups}
                        onValueChange={(value) => onParamChange(field.key, value)}
                      />
                    ) : (
                      <Input value={form.params[field.key] ?? ""} onChange={(event) => onParamChange(field.key, event.target.value)} />
                    )}
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
