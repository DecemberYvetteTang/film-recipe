export type CameraBrand = "fuji" | "ricoh";

export type RecipeStatus = "想试" | "常用";

export type SampleImageSourceType = "我拍摄" | "作者参考图";

export interface SampleImage {
  id: string;
  dataUrl: string;
  sourceType: SampleImageSourceType;
  caption?: string;
}

export interface SourceScreenshot {
  id: string;
  dataUrl: string;
  ocrText?: string;
  capturedAt: string;
}

export interface FujiParams {
  filmSimulation?: string;
  dynamicRange?: string;
  dRangePriority?: string;
  grainEffect?: string;
  colorChromeEffect?: string;
  colorChromeFxBlue?: string;
  whiteBalance?: string;
  whiteBalanceShift?: string;
  highlight?: string;
  shadow?: string;
  color?: string;
  sharpness?: string;
  highIsoNoiseReduction?: string;
  clarity?: string;
  exposureCompensation?: string;
  isoSuggestion?: string;
  notes?: string;
}

export interface RicohParams {
  imageControl?: string;
  saturation?: string;
  hue?: string;
  highLowKey?: string;
  contrast?: string;
  contrastHighlight?: string;
  contrastShadow?: string;
  sharpness?: string;
  shading?: string;
  peripheralIllumination?: string;
  whiteBalance?: string;
  whiteBalanceShift?: string;
  exposureCompensation?: string;
  isoSuggestion?: string;
  notes?: string;
}

export interface Recipe {
  id: string;
  name: string;
  brand: CameraBrand;
  compatibleModels: string[];
  scenes: string[];
  subjects: string[];
  styles: string[];
  status: RecipeStatus;
  sampleImages: SampleImage[];
  sourceScreenshots: SourceScreenshot[];
  ocrText: string;
  params: FujiParams | RicohParams;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
