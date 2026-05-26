import { resolveTemplate } from "./resolve.js";
import type { SvgStyleInput, SvgStyleRules } from "./types.js";

function getSvgRoot(doc: Document): SVGSVGElement | null {
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    return null;
  }
  return root as unknown as SVGSVGElement;
}

function readSvgLengthPx(svg: SVGSVGElement, dim: "width" | "height"): number {
  try {
    const base =
      dim === "width" ? svg.width?.baseVal?.value : svg.height?.baseVal?.value;
    if (typeof base === "number" && base > 0 && Number.isFinite(base)) {
      return base;
    }
  } catch {
    /* JSDOM / partial SVG DOM */
  }
  const raw = svg.getAttribute(dim);
  if (!raw) {
    return NaN;
  }
  const n = parseFloat(String(raw).replace(/px$/i, "").trim());
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

/**
 * Scale root SVG width/height attributes (same idea as legacy mapPlotting).
 */
function applyRootScale(svg: SVGSVGElement, scale: number): void {
  if (!Number.isFinite(scale) || scale <= 0) {
    return;
  }
  const w = readSvgLengthPx(svg, "width");
  const h = readSvgLengthPx(svg, "height");
  if (Number.isFinite(w)) {
    svg.setAttribute("width", String(w * scale));
  }
  if (Number.isFinite(h)) {
    svg.setAttribute("height", String(h * scale));
  }
}

/**
 * Clone document so callers keep an immutable original if needed.
 */
export function cloneSvgDocument(doc: Document): Document {
  return doc.cloneNode(true) as Document;
}

/**
 * Apply declarative rules + optional root scale to an SVG document (mutates in place).
 */
export function applySvgStyleRules(
  doc: Document,
  rules: SvgStyleRules,
  input: SvgStyleInput,
): void {
  const svg = getSvgRoot(doc);
  if (!svg) {
    throw new Error("map-icon-plot: document root is not an <svg> element");
  }

  const rs = rules.rootScale;
  if (rs?.mode === "svgWidthHeight") {
    const field = rs.field ?? "scale";
    const raw = input[field];
    const num =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? parseFloat(raw)
          : NaN;
    const scale = Number.isFinite(num) ? num : (rs.defaultValue ?? 1);
    applyRootScale(svg, scale);
  }

  for (const layer of rules.layers) {
    let nodes: Element[];
    try {
      nodes = Array.from(svg.querySelectorAll(layer.select));
    } catch {
      continue;
    }
    for (const el of nodes) {
      for (const [attr, tmpl] of Object.entries(layer.map)) {
        const value = resolveTemplate(tmpl, input);
        if (value === "" && tmpl.startsWith("$.")) {
          continue;
        }
        el.setAttribute(attr, value);
      }
    }
  }
}

export function serializeSvgDocument(doc: Document): string {
  return new XMLSerializer().serializeToString(doc.documentElement);
}
