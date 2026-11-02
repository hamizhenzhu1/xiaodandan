import { describe, expect, it } from "vitest";
import { getRemovedBookmarkIds } from "../src/services/cloud";
import { createDefaultAppData } from "../src/services/storage";
import type { Bookmark } from "../src/types/app";

function bookmark(id: string): Bookmark {
  return {
    id,
    name: id,
    url: `https://${id}.example.com`,
    categoryId: "tmall",
    order: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("cloud synchronization", () => {
  it("only deletes bookmarks removed from the user's previous snapshot", () => {
    const previous = {
      ...createDefaultAppData(),
      bookmarks: [bookmark("kept"), bookmark("removed")],
    };
    const next = { ...createDefaultAppData(), bookmarks: [bookmark("kept")] };

    expect(getRemovedBookmarkIds(previous, next)).toEqual(["removed"]);
  });

  it("does not treat a newly added bookmark as a deletion", () => {
    const previous = createDefaultAppData();
    const next = { ...createDefaultAppData(), bookmarks: [bookmark("new")] };

    expect(getRemovedBookmarkIds(previous, next)).toEqual([]);
  });
});
