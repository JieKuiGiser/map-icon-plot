/**
 * Parse SVG markup into a Document (browser DOMParser).
 */
export function parseSvgString(svgMarkup: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgMarkup, "image/svg+xml");
  const parsed = doc.documentElement;
  if (!parsed || parsed.tagName.toLowerCase() !== "svg") {
    throw new Error("map-icon-plot: string is not valid SVG markup");
  }
  const err = doc.querySelector("parsererror");
  if (err) {
    throw new Error(
      `map-icon-plot: SVG parse error: ${err.textContent?.trim() ?? "unknown"}`,
    );
  }
  return doc;
}
