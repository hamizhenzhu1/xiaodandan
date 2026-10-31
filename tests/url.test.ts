import { describe, expect, it } from "vitest";
import { getHostname, normalizeUrl } from "../src/utils/url";

describe("normalizeUrl", () => {
  it("adds https when the protocol is omitted", () => {
    expect(normalizeUrl("example.com/path")).toBe("https://example.com/path");
  });

  it("keeps valid http urls", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects dangerous protocols", () => {
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow("HTTP 或 HTTPS");
  });

  it("rejects incomplete host names", () => {
    expect(() => normalizeUrl("localhost")).toThrow("有效域名");
  });
});

describe("getHostname", () => {
  it("removes the www prefix", () => {
    expect(getHostname("https://www.example.com/path")).toBe("example.com");
  });
});
