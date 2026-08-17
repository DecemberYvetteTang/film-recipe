import { brandModels } from "@/data/taxonomy";
import type { CameraBrand, RecipeStatus, SampleImageSourceType } from "@/domain/recipe";

export interface RecipeFormState {
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

export const initialFormState: RecipeFormState = {
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
