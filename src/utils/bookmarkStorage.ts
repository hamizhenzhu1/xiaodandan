const ENCODED_URL_PREFIX = "__linkhaven_v1__";

type StoredUrlData = {
  u: string;
  s: string;
};

export function encodeStoredUrl(url: string, specialNote?: string): string {
  if (!specialNote) return url;
  return `${ENCODED_URL_PREFIX}${JSON.stringify({ u: url, s: specialNote } satisfies StoredUrlData)}`;
}

export function decodeStoredUrl(storedUrl: string): { url: string; specialNote?: string } {
  if (!storedUrl.startsWith(ENCODED_URL_PREFIX)) return { url: storedUrl };

  try {
    const parsed = JSON.parse(storedUrl.slice(ENCODED_URL_PREFIX.length)) as Partial<StoredUrlData>;
    if (typeof parsed.u !== "string" || typeof parsed.s !== "string") return { url: storedUrl };
    return { url: parsed.u, specialNote: parsed.s || undefined };
  } catch {
    return { url: storedUrl };
  }
}
