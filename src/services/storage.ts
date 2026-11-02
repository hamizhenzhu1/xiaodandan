import { appDataSchema } from "../schemas/appData";
import type { AppData } from "../types/app";

export const STORAGE_KEY = "linkhaven.app-data";
export const MAX_IMPORT_BYTES = 1024 * 1024;

export const defaultCategories: AppData["categories"] = [
  { id: "tmall", name: "天猫", order: 0 },
  { id: "jd", name: "京东", order: 1 },
  { id: "dewu", name: "得物", order: 2 },
];

export function ensureMarketplaceCategories(data: AppData): AppData {
  const requiredIds = new Set(defaultCategories.map((category) => category.id));
  const existingById = new Map(data.categories.map((category) => [category.id, category]));
  const marketplaceCategories = defaultCategories.map((category, order) => ({
    ...(existingById.get(category.id) ?? category),
    name: category.name,
    order,
  }));
  const legacyCategories = data.categories
    .filter((category) => !requiredIds.has(category.id))
    .sort((a, b) => a.order - b.order)
    .map((category, index) => ({ ...category, order: marketplaceCategories.length + index }));

  return {
    ...data,
    categories: [...marketplaceCategories, ...legacyCategories],
  };
}

export function createDefaultAppData(): AppData {
  return {
    version: 1,
    bookmarks: [],
    categories: defaultCategories.map((category) => ({ ...category })),
    settings: { theme: "system" },
  };
}

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type LoadResult = {
  data: AppData;
  error?: string;
};

export function loadAppData(storage: StorageLike): LoadResult {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return { data: createDefaultAppData() };

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = appDataSchema.safeParse(parsed);
    if (!result.success) {
      return {
        data: createDefaultAppData(),
        error: "本地数据格式异常，原数据已保留。你可以导入备份或重新开始。",
      };
    }
    return { data: ensureMarketplaceCategories(result.data) };
  } catch {
    return {
      data: createDefaultAppData(),
      error: "本地数据无法读取，原数据已保留。你可以导入备份或重新开始。",
    };
  }
}

export function saveAppData(storage: StorageLike, data: AppData): void {
  const validated = appDataSchema.parse(data);
  storage.setItem(STORAGE_KEY, JSON.stringify(validated));
}

export function parseImportData(raw: string): AppData {
  const parsed: unknown = JSON.parse(raw);
  return ensureMarketplaceCategories(appDataSchema.parse(parsed));
}

export function serializeAppData(data: AppData): string {
  return JSON.stringify(appDataSchema.parse(data), null, 2);
}
