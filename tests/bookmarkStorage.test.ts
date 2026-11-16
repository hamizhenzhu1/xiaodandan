import { describe, expect, it } from "vitest";
import { decodeStoredUrl, encodeStoredUrl } from "../src/utils/bookmarkStorage";

describe("bookmark cloud storage", () => {
  it("keeps ordinary URLs unchanged when there is no special note", () => {
    expect(encodeStoredUrl("任意网址内容")).toBe("任意网址内容");
    expect(decodeStoredUrl("任意网址内容")).toEqual({ url: "任意网址内容" });
  });

  it("round-trips a URL and its special note in the existing cloud column", () => {
    const stored = encodeStoredUrl("javascript:alert(1)", "朋友专用");
    expect(decodeStoredUrl(stored)).toEqual({
      url: "javascript:alert(1)",
      specialNote: "朋友专用",
    });
  });
});
