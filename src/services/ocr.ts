import { createWorker } from "tesseract.js";

export async function recognizeRecipeText(image: File, onProgress?: (progress: number) => void) {
  const worker = await createWorker(["chi_sim", "eng"], 1, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.(Math.round(message.progress * 100));
      }
    }
  });

  try {
    const result = await worker.recognize(image);
    return result.data.text.trim();
  } finally {
    await worker.terminate();
  }
}
