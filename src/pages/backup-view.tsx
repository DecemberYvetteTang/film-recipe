import type { ChangeEvent } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recipe } from "@/domain/recipe";

interface BackupViewProps {
  message: string;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  recipes: Recipe[];
}

export function BackupView({ message, onExport, onImport, recipes }: BackupViewProps) {
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
