import { describe, expect, it } from "vitest";
import type { Bookmark } from "../src/types/app";
import { filterBookmarks, reorderBookmarks } from "../src/utils/bookmarks";

const bookmarks: Bookmark[] = [
  {
    id: "a",
    name: "设计资料",
    url: "https://design.example.com/",
    categoryId: "work",
    note: "灵感与案例",
    order: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "b",
    name: "学习平台",
    url: "https://learn.example.com/",
    categoryId: "study",
    order: 1,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
];

describe("bookmark collection helpers", () => {
  it("searches name, url and note", () => {
    expect(filterBookmarks(bookmarks, "灵感", "all").map((item) => item.id)).toEqual(["a"]);
    expect(filterBookmarks(bookmarks, "LEARN", "all").map((item) => item.id)).toEqual(["b"]);
  });

  it("combines category and search filters", () => {
    expect(filterBookmarks(bookmarks, "平台", "work")).toHaveLength(0);
    expect(filterBookmarks(bookmarks, "平台", "study")).toHaveLength(1);
  });

  it("reorders and normalizes order values", () => {
    const result = reorderBookmarks(bookmarks, "b", "a");
    expect(result.map((item) => item.id)).toEqual(["b", "a"]);
    expect(result.map((item) => item.order)).toEqual([0, 1]);
  });
});
