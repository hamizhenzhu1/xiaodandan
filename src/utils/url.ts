export function getNavigableUrl(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) return undefined;
  return `https://${trimmed}`;
}

export function getHostname(url: string): string {
  try {
    const navigableUrl = getNavigableUrl(url);
    return navigableUrl ? new URL(navigableUrl).hostname.replace(/^www\./, "") : url;
  } catch {
    return url;
  }
}

export function getFaviconUrl(url: string): string {
  try {
    const navigableUrl = getNavigableUrl(url);
    return navigableUrl ? `${new URL(navigableUrl).origin}/favicon.ico` : "";
  } catch {
    return "";
  }
}
