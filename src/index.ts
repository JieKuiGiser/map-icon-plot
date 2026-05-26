export type {
  LoadSvgOptions,
  RasterizeOptions,
  RootScaleConfig,
  RootScaleMode,
  SvgStyleInput,
  SvgStyleLayerRule,
  SvgStyleRules,
} from "./types.js";

export { resolveTemplate } from "./resolve.js";

export {
  applySvgStyleRules,
  cloneSvgDocument,
  serializeSvgDocument,
} from "./applyRules.js";

export { parseSvgString } from "./parse.js";
export { loadSvgFromUrl } from "./load.js";
export { loadSvgFromXhr } from "./xhr.js";

export { svgDocumentToCanvas, canvasToPngDataUrl } from "./rasterize.js";

export { mapPlotStyleToSvgInput, type MapPlotIconStyleLike } from "./adapter.js";

import { applySvgStyleRules } from "./applyRules.js";
import { loadSvgFromUrl } from "./load.js";
import { loadSvgFromXhr } from "./xhr.js";
import { mapPlotStyleToSvgInput } from "./adapter.js";
import type { MapPlotIconStyleLike } from "./adapter.js";
import { gjbCompatibleRules } from "./presets.js";
import type { LoadSvgOptions, RasterizeOptions, SvgStyleInput, SvgStyleRules } from "./types.js";
import { svgDocumentToCanvas } from "./rasterize.js";

/**
 * 对 SVG 文档应用本库**固定**制图规则（与 README 规范一致），原地修改。
 */
export function applyDefaultMapIconStyle(
  doc: Document,
  input: SvgStyleInput,
): void {
  applySvgStyleRules(doc, gjbCompatibleRules, input);
}

/**
 * `fetch` 加载 SVG → 固定规则着色 → 栅格化（推荐主入口）。
 */
export async function rasterizeMapIconFromUrl(
  url: string,
  input: SvgStyleInput,
  options?: RasterizeOptions & { fetchInit?: LoadSvgOptions },
): Promise<HTMLCanvasElement> {
  const doc = await loadSvgFromUrl(url, options?.fetchInit);
  applyDefaultMapIconStyle(doc, input);
  return svgDocumentToCanvas(doc, options);
}

/**
 * `XMLHttpRequest` 加载 → 固定规则 → 栅格化（内网 / 旧项目习惯）。
 */
export async function rasterizeMapIconFromXhr(
  url: string,
  input: SvgStyleInput,
  options?: RasterizeOptions,
): Promise<HTMLCanvasElement> {
  const doc = await loadSvgFromXhr(url);
  applyDefaultMapIconStyle(doc, input);
  return svgDocumentToCanvas(doc, options);
}

/**
 * 与 {@link rasterizeMapIconFromUrl} 相同，样式字段使用 mapPlotting 风格（`color` / `border*` / `scale`）。
 */
export async function rasterizeMapPlotIconFromUrl(
  url: string,
  style: MapPlotIconStyleLike,
  options?: RasterizeOptions & { fetchInit?: LoadSvgOptions },
): Promise<HTMLCanvasElement> {
  return rasterizeMapIconFromUrl(url, mapPlotStyleToSvgInput(style), options);
}

/**
 * 与 {@link rasterizeMapIconFromXhr} 相同，样式为 mapPlotting 风格。
 */
export async function rasterizeMapPlotIconFromXhr(
  url: string,
  style: MapPlotIconStyleLike,
  options?: RasterizeOptions,
): Promise<HTMLCanvasElement> {
  return rasterizeMapIconFromXhr(url, mapPlotStyleToSvgInput(style), options);
}

/**
 * 自定义规则：传入 `SvgStyleRules`（高级用法）。
 */
export async function rasterizeStyledSvgFromUrl(
  url: string,
  rules: SvgStyleRules,
  input: SvgStyleInput,
  options?: RasterizeOptions & { fetchInit?: LoadSvgOptions },
): Promise<HTMLCanvasElement> {
  const doc = await loadSvgFromUrl(url, options?.fetchInit);
  applySvgStyleRules(doc, rules, input);
  return svgDocumentToCanvas(doc, options);
}

/**
 * 自定义规则 + XHR 加载（高级用法）。
 */
export async function rasterizeStyledSvgFromXhr(
  url: string,
  rules: SvgStyleRules,
  input: SvgStyleInput,
  options?: RasterizeOptions,
): Promise<HTMLCanvasElement> {
  const doc = await loadSvgFromXhr(url);
  applySvgStyleRules(doc, rules, input);
  return svgDocumentToCanvas(doc, options);
}
