import { describe, expect, it } from "vitest";
import { getHostname, getNavigableUrl } from "../src/utils/url";

describe("getNavigableUrl", () => {
  it("creates a clickable address without changing the saved text", () => {
    expect(getNavigableUrl("example.com/path")).toBe("https://example.com/path");
  });

  it("keeps HTTP addresses clickable", () => {
    expect(getNavigableUrl("http://example.com")).toBe("http://example.com");
  });

  it("does not navigate to unsafe protocols even though they can be saved", () => {
    expect(getNavigableUrl("javascript:alert(1)")).toBeUndefined();
  });
});

describe("getHostname", () => {
  it("removes the www prefix", () => {
    expect(getHostname("https://www.example.com/path")).toBe("example.com");
  });
});
