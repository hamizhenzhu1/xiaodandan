import type { AppData, Bookmark, BookmarkDraft, Theme } from "../../types/app";
import { reorderBookmarks } from "../../utils/bookmarks";

export type AppAction =
  | { type: "add"; draft: BookmarkDraft }
  | { type: "update"; id: string; draft: BookmarkDraft }
  | { type: "delete"; id: string }
  | { type: "reorder"; activeId: string; overId: string }
  | { type: "theme"; theme: Theme }
  | { type: "import"; data: AppData };

function createBookmark(draft: BookmarkDraft, order: number): Bookmark {
  const now = new Date().toISOString();
  return {
    ...draft,
    note: draft.note || undefined,
    id: crypto.randomUUID(),
    order,
    createdAt: now,
    updatedAt: now,
  };
}

export function appReducer(state: AppData, action: AppAction): AppData {
  switch (action.type) {
    case "add":
      return {
        ...state,
        bookmarks: [...state.bookmarks, createBookmark(action.draft, state.bookmarks.length)],
      };
    case "update":
      return {
        ...state,
        bookmarks: state.bookmarks.map((bookmark) =>
          bookmark.id === action.id
            ? {
                ...bookmark,
                ...action.draft,
                note: action.draft.note || undefined,
                updatedAt: new Date().toISOString(),
              }
            : bookmark,
        ),
      };
    case "delete":
      return {
        ...state,
        bookmarks: state.bookmarks
          .filter((bookmark) => bookmark.id !== action.id)
          .map((bookmark, order) => ({ ...bookmark, order })),
      };
    case "reorder":
      return {
        ...state,
        bookmarks: reorderBookmarks(state.bookmarks, action.activeId, action.overId),
      };
    case "theme":
      return { ...state, settings: { ...state.settings, theme: action.theme } };
    case "import":
      return action.data;
  }
}
