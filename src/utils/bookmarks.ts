import type { Bookmark } from "../types/app";

export function sortBookmarks(bookmarks: Bookmark[]): Bookmark[] {
  return [...bookmarks].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function filterBookmarks(
  bookmarks: Bookmark[],
  query: string,
  categoryId: string,
): Bookmark[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return sortBookmarks(bookmarks).filter((bookmark) => {
    const categoryMatches = categoryId === "all" || bookmark.categoryId === categoryId;
    const queryMatches =
      !normalizedQuery ||
      [bookmark.name, bookmark.url, bookmark.note ?? ""].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    return categoryMatches && queryMatches;
  });
}

export function reorderBookmarks(
  bookmarks: Bookmark[],
  activeId: string,
  overId: string,
): Bookmark[] {
  const sorted = sortBookmarks(bookmarks);
  const oldIndex = sorted.findIndex((bookmark) => bookmark.id === activeId);
  const newIndex = sorted.findIndex((bookmark) => bookmark.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return sorted;

  const [moved] = sorted.splice(oldIndex, 1);
  if (!moved) return sorted;
  sorted.splice(newIndex, 0, moved);
  return sorted.map((bookmark, order) => ({ ...bookmark, order }));
}
