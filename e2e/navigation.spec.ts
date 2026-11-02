import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?demo=1");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("manages, searches and persists bookmarks", async ({ page }) => {
  await page.getByRole("button", { name: "为京东添加第一个网址" }).click();
  await page.getByLabel("网站名称").fill("OpenAI 文档");
  await page.getByRole("textbox", { name: "网址", exact: true }).fill("platform.openai.com/docs");
  await expect(page.getByRole("combobox", { name: "分类", exact: true })).toHaveValue("jd");
  await page.getByLabel(/备注/).fill("开发时常用");
  await page.getByRole("button", { name: "添加网址" }).click();

  await expect(page.getByRole("link", { name: "打开 OpenAI 文档" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "打开 OpenAI 文档" })).toBeVisible();

  await page.getByRole("textbox", { name: "搜索网址", exact: true }).fill("开发");
  await expect(page.getByRole("link", { name: "打开 OpenAI 文档" })).toBeVisible();
  await page.getByLabel("清空搜索").click();

  await page.getByRole("button", { name: "编辑 OpenAI 文档" }).click();
  await page.getByLabel("网站名称").fill("OpenAI 开发文档");
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(page.getByRole("link", { name: "打开 OpenAI 开发文档" })).toBeVisible();

  await page.getByRole("button", { name: "删除 OpenAI 开发文档" }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByRole("link", { name: "打开 OpenAI 开发文档" })).toHaveCount(0);
});

test("exports, imports and restores a backup", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "为天猫添加第一个网址" }).click();
  await page.getByLabel("网站名称").fill("备份示例");
  await page.getByRole("textbox", { name: "网址", exact: true }).fill("backup.example.com");
  await page.getByRole("button", { name: "添加网址" }).click();

  await page.getByRole("button", { name: "打开设置" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /导出备份/ }).click();
  const download = await downloadPromise;
  const backupPath = testInfo.outputPath("backup.json");
  await download.saveAs(backupPath);
  await page.getByRole("button", { name: "关闭弹窗" }).click();

  await page.getByRole("button", { name: "删除 备份示例" }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await page.getByRole("button", { name: "确认导入" }).click();
  await expect(page.getByRole("link", { name: "打开 备份示例" })).toBeVisible();
});

test("persists the selected theme", async ({ page }) => {
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.getByRole("radio", { name: "深色" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
