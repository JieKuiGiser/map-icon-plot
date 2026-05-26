import { parseSvgString } from "./parse.js";
import type { LoadSvgOptions } from "./types.js";

/**
 * Fetch URL as text and parse as SVG Document.
 */
export async function loadSvgFromUrl(
  url: string,
  init?: LoadSvgOptions,
): Promise<Document> {
  const { baseUrl: _b, ...req } = init ?? {};
  const res = await fetch(url, req);
  if (!res.ok) {
    throw new Error(`map-icon-plot: fetch failed ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return parseSvgString(text);
}
