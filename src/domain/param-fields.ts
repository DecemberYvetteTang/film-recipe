import type { CameraBrand, FujiParams, RicohParams } from "@/domain/recipe";

export interface ParamField<TParams extends object> {
  key: keyof TParams & string;
  label: string;
  group: string;
}

export const fujiParamFields: Array<ParamField<FujiParams>> = [
  { key: "filmSimulation", label: "胶片模拟", group: "基础色彩" },
  { key: "dynamicRange", label: "动态范围", group: "基础色彩" },
  { key: "dRangePriority", label: "D Range Priority", group: "基础色彩" },
  { key: "grainEffect", label: "颗粒效果", group: "基础色彩" },
  { key: "colorChromeEffect", label: "Color Chrome Effect", group: "基础色彩" },
  { key: "colorChromeFxBlue", label: "Color Chrome FX Blue", group: "基础色彩" },
  { key: "whiteBalance", label: "白平衡", group: "白平衡" },
  { key: "whiteBalanceShift", label: "白平衡偏移", group: "白平衡" },
  { key: "highlight", label: "高光", group: "色调" },
  { key: "shadow", label: "阴影", group: "色调" },
  { key: "color", label: "色彩", group: "色调" },
  { key: "sharpness", label: "锐度", group: "细节" },
  { key: "highIsoNoiseReduction", label: "高 ISO 降噪", group: "细节" },
  { key: "clarity", label: "清晰度", group: "细节" },
  { key: "exposureCompensation", label: "曝光补偿", group: "拍摄建议" },
  { key: "isoSuggestion", label: "ISO 建议", group: "拍摄建议" },
  { key: "notes", label: "参数备注", group: "拍摄建议" }
];

export const ricohParamFields: Array<ParamField<RicohParams>> = [
  { key: "imageControl", label: "图像控制", group: "基础色彩" },
  { key: "saturation", label: "饱和度", group: "基础色彩" },
  { key: "hue", label: "色相", group: "基础色彩" },
  { key: "highLowKey", label: "高/低调", group: "色调" },
  { key: "contrast", label: "对比度", group: "色调" },
  { key: "contrastHighlight", label: "高光对比度", group: "色调" },
  { key: "contrastShadow", label: "阴影对比度", group: "色调" },
  { key: "sharpness", label: "锐度", group: "细节" },
  { key: "shading", label: "明暗", group: "细节" },
  { key: "peripheralIllumination", label: "周边光量", group: "细节" },
  { key: "whiteBalance", label: "白平衡", group: "白平衡" },
  { key: "whiteBalanceShift", label: "白平衡偏移", group: "白平衡" },
  { key: "exposureCompensation", label: "曝光补偿", group: "拍摄建议" },
  { key: "isoSuggestion", label: "ISO 建议", group: "拍摄建议" },
  { key: "notes", label: "参数备注", group: "拍摄建议" }
];

export const paramFieldsByBrand = {
  fuji: fujiParamFields,
  ricoh: ricohParamFields
} satisfies Record<CameraBrand, Array<ParamField<object>>>;

export function groupParamFields(brand: CameraBrand) {
  const groups = new Map<string, Array<ParamField<object>>>();

  paramFieldsByBrand[brand].forEach((field) => {
    const groupFields = groups.get(field.group) ?? [];
    groupFields.push(field);
    groups.set(field.group, groupFields);
  });

  return Array.from(groups.entries()).map(([name, fields]) => ({ name, fields }));
}
