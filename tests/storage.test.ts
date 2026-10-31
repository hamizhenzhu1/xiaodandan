import { describe, expect, it } from "vitest";
import {
  createDefaultAppData,
  loadAppData,
  parseImportData,
  saveAppData,
  serializeAppData,
  STORAGE_KEY,
  type StorageLike,
} from "../src/services/storage";

function createMemoryStorage(initial?: string): StorageLike & { value?: string } {
  return {
    value: initial,
    getItem() {
      return this.value ?? null;
    },
    setItem(_key, value) {
      this.value = value;
    },
  };
}

describe("storage service", () => {
  it("returns defaults when storage is empty", () => {
    const result = loadAppData(createMemoryStorage());
    expect(result.error).toBeUndefined();
    expect(result.data.version).toBe(1);
    expect(result.data.categories).toHaveLength(5);
  });

  it("does not overwrite malformed source data while loading", () => {
    const storage = createMemoryStorage("{bad json");
    const result = loadAppData(storage);
    expect(result.error).toContain("原数据已保留");
    expect(storage.value).toBe("{bad json");
  });

  it("round-trips valid application data", () => {
    const storage = createMemoryStorage();
    const data = createDefaultAppData();
    saveAppData(storage, data);
    expect(storage.value).toContain('"version":1');
    expect(loadAppData(storage).data).toEqual(data);
  });

  it("validates imported JSON", () => {
    const data = createDefaultAppData();
    expect(parseImportData(serializeAppData(data))).toEqual(data);
    expect(() => parseImportData('{"version":2}')).toThrow();
  });

  it("uses a stable storage key", () => {
    expect(STORAGE_KEY).toBe("linkhaven.app-data");
  });
});
