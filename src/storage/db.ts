import type { Recipe } from "@/domain/recipe";

const DB_NAME = "film-recipe";
const DB_VERSION = 1;
const RECIPE_STORE = "recipes";
const ASSET_STORE = "assets";

export interface StoredAsset {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  createdAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(RECIPE_STORE)) {
        db.createObjectStore(RECIPE_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        db.createObjectStore(ASSET_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecipes() {
  const db = await openDatabase();
  const tx = db.transaction(RECIPE_STORE, "readonly");
  const recipes = await requestToPromise<Recipe[]>(tx.objectStore(RECIPE_STORE).getAll());

  return recipes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveRecipe(recipe: Recipe) {
  const db = await openDatabase();
  const tx = db.transaction(RECIPE_STORE, "readwrite");
  await requestToPromise(tx.objectStore(RECIPE_STORE).put(recipe));
}

export async function replaceRecipes(recipes: Recipe[]) {
  const db = await openDatabase();
  const tx = db.transaction(RECIPE_STORE, "readwrite");
  const store = tx.objectStore(RECIPE_STORE);
  await requestToPromise(store.clear());
  await Promise.all(recipes.map((recipe) => requestToPromise(store.put(recipe))));
}

export async function saveAsset(file: File) {
  const db = await openDatabase();
  const asset: StoredAsset = {
    id: crypto.randomUUID(),
    blob: file,
    name: file.name,
    type: file.type,
    createdAt: new Date().toISOString()
  };

  const tx = db.transaction(ASSET_STORE, "readwrite");
  await requestToPromise(tx.objectStore(ASSET_STORE).put(asset));

  return asset;
}

export async function getAsset(assetId: string) {
  const db = await openDatabase();
  const tx = db.transaction(ASSET_STORE, "readonly");
  return requestToPromise<StoredAsset | undefined>(tx.objectStore(ASSET_STORE).get(assetId));
}
