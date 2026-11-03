import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { STORAGE_KEY } from "../src/services/storage";

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?demo=1");
    window.localStorage.clear();
  });

  it("adds a bookmark, normalizes its URL and persists it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "为天猫添加第一个网址" }));
    await user.type(screen.getByLabelText("网站名称"), "示例网站");
    await user.type(screen.getByLabelText("网址"), "example.com");
    await user.type(screen.getByLabelText(/备注/), "测试备注");
    await user.click(screen.getByRole("button", { name: "添加网址" }));

    expect(screen.getByRole("link", { name: "打开 示例网站" })).toHaveAttribute(
      "href",
      "https://example.com/",
    );
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toContain("示例网站"));
  });

  it("copies a bookmark note with one click", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "为天猫添加第一个网址" }));
    await user.type(screen.getByLabelText("网站名称"), "复制示例");
    await user.type(screen.getByLabelText("网址"), "copy.example.com");
    await user.type(screen.getByLabelText(/备注/), "需要复制的完整备注");
    await user.click(screen.getByRole("button", { name: "添加网址" }));
    await user.click(screen.getByRole("button", { name: "复制 复制示例 的备注" }));

    expect(writeText).toHaveBeenCalledWith("需要复制的完整备注");
    expect(screen.getByRole("button", { name: "复制 复制示例 的备注" })).toHaveTextContent(
      "已复制",
    );
  });

  it("shows a useful validation error for unsafe URLs", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "添加新网址" }));
    await user.type(screen.getByLabelText("网站名称"), "危险网址");
    await user.type(screen.getByLabelText("网址"), "javascript:alert(1)");
    await user.click(screen.getByRole("button", { name: "添加网址" }));

    expect(await screen.findByText("网址只支持 HTTP 或 HTTPS 协议")).toBeVisible();
    expect(screen.queryByRole("link", { name: "打开 危险网址" })).not.toBeInTheDocument();
  });

  it("deletes a bookmark only after confirmation", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "为天猫添加第一个网址" }));
    await user.type(screen.getByLabelText("网站名称"), "稍后删除");
    await user.type(screen.getByLabelText("网址"), "delete.example.com");
    await user.click(screen.getByRole("button", { name: "添加网址" }));

    await user.click(screen.getByRole("button", { name: "删除 稍后删除" }));
    expect(screen.getByText(/将从栖页中移除/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "确认删除" }));
    expect(screen.queryByRole("link", { name: "打开 稍后删除" })).not.toBeInTheDocument();
  });

  it("filters bookmarks by search text", async () => {
    const user = userEvent.setup();
    render(<App />);
    const samples: Array<[string, string]> = [
      ["设计收藏", "design.example.com"],
      ["学习收藏", "learn.example.com"],
    ];
    for (const [index, [name, url]] of samples.entries()) {
      await user.click(
        screen.getByRole("button", {
          name: index === 0 ? "为天猫添加第一个网址" : "添加新网址",
        }),
      );
      await user.type(screen.getByLabelText("网站名称"), name);
      await user.type(screen.getByLabelText("网址"), url);
      await user.click(screen.getByRole("button", { name: "添加网址" }));
    }

    await user.type(screen.getByLabelText("搜索网址"), "设计");
    expect(screen.getByRole("link", { name: "打开 设计收藏" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "打开 学习收藏" })).not.toBeInTheDocument();
  });

  it("shows the three marketplace sections and preselects the chosen section", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "天猫" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "京东" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "得物" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "为京东添加第一个网址" }));
    expect(screen.getByRole("combobox", { name: "分类" })).toHaveValue("jd");
  });
});
