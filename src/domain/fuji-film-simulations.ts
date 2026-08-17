export interface FujiFilmSimulationGroup {
  name: string;
  options: string[];
}

export const fujiFilmSimulationGroups: FujiFilmSimulationGroup[] = [
  {
    name: "彩色胶片模拟",
    options: [
      "PROVIA / 标准（STD）",
      "Velvia / 鲜艳（V）",
      "ASTIA / 柔和（S）",
      "CLASSIC CHROME / 经典正片（CC）",
      "Classic Neg. / 经典负片（NC）",
      "PRO Neg. Hi",
      "PRO Neg. Std",
      "ETERNA / 影院（E）",
      "ETERNA Bleach Bypass（EB）",
      "Reala ACE（RA）",
      "Nostalgic Neg.（NN）"
    ]
  },
  {
    name: "黑白 & 单色调",
    options: ["ACROS", "MONOCHROME / 黑白", "SEPIA / 棕褐色"]
  }
];
