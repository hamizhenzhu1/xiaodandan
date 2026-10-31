export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("请输入网址");

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("请输入有效的网址，例如 example.com");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("网址只支持 HTTP 或 HTTPS 协议");
  }

  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    throw new Error("请输入包含有效域名的网址");
  }

  return parsed.toString();
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getFaviconUrl(url: string): string {
  try {
    return `${new URL(url).origin}/favicon.ico`;
  } catch {
    return "";
  }
}
