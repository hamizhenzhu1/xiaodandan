import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("../src/services/supabase", () => ({
  supabase: { auth: authMocks },
}));

import { AuthScreen } from "../src/features/auth/AuthScreen";

describe("AuthScreen", () => {
  beforeEach(() => {
    authMocks.signInWithPassword.mockReset().mockResolvedValue({ error: null });
    authMocks.signUp.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  });

  it("logs in with the submitted email and password", async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);

    await user.type(screen.getByLabelText("邮箱"), "friend@example.com");
    await user.type(screen.getByLabelText("密码"), "secret12");
    await user.click(screen.getByRole("button", { name: "登录收藏夹" }));

    expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
      email: "friend@example.com",
      password: "secret12",
    });
  });

  it("explains that a new user must confirm their email", async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);

    await user.click(screen.getByRole("tab", { name: "注册" }));
    await user.type(screen.getByLabelText("邮箱"), "new@example.com");
    await user.type(screen.getByLabelText("密码"), "secret12");
    await user.click(screen.getByRole("button", { name: "注册账号" }));

    expect(await screen.findByText(/打开邮箱中的确认链接/)).toBeVisible();
  });
});
