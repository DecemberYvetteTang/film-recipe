import type { CameraBrand } from "../domain/recipe";

export const brandLabels: Record<CameraBrand, string> = {
  fuji: "富士",
  ricoh: "理光"
};

export const brandModels: Record<CameraBrand, string[]> = {
  fuji: ["X-H2", "X100V", "X-E5"],
  ricoh: ["GR IIIx"]
};

export const sceneTags = ["晴天", "阴天", "正午", "蓝调", "夜晚", "室内"];

export const subjectTags = ["街拍", "人像", "风景", "旅行", "日常"];

export const styleTags = [
  "日系",
  "胶片",
  "冷调",
  "暖调",
  "高对比",
  "低饱和",
  "复古",
  "清透",
  "电影感"
];
