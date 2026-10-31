import { z } from "zod";

export const themeSchema = z.enum(["light", "dark", "system"]);

export const bookmarkSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  url: z
    .string()
    .url()
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
      message: "网址只支持 HTTP 或 HTTPS 协议",
    }),
  categoryId: z.string().min(1),
  note: z.string().trim().max(200).optional(),
  order: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(20),
  order: z.number().int().nonnegative(),
});

export const appDataSchema = z.object({
  version: z.literal(1),
  bookmarks: z.array(bookmarkSchema).max(2000),
  categories: z.array(categorySchema).min(1).max(100),
  settings: z.object({ theme: themeSchema }),
});

export const bookmarkDraftSchema = z.object({
  name: z.string().trim().min(1, "请输入网站名称").max(40, "名称不能超过 40 个字符"),
  url: z.string().trim().min(1, "请输入网址"),
  categoryId: z.string().min(1, "请选择分类"),
  note: z.string().trim().max(200, "备注不能超过 200 个字符").optional(),
});
