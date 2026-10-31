export type Theme = "light" | "dark" | "system";

export type Bookmark = {
  id: string;
  name: string;
  url: string;
  categoryId: string;
  note?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  order: number;
};

export type AppData = {
  version: number;
  bookmarks: Bookmark[];
  categories: Category[];
  settings: {
    theme: Theme;
  };
};

export type BookmarkDraft = Pick<Bookmark, "name" | "url" | "categoryId" | "note">;
