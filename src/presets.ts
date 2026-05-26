import type { SvgStyleRules } from "./types.js";

/**
 * 内置固定规则（不对外导出符号）。行为见 README「SVG 制图规范」；
 * 对外请用 `applyDefaultMapIconStyle` / `rasterizeMapIconFromUrl` 等 API。
 */
export const gjbCompatibleRules: SvgStyleRules = {
  version: 1,
  rootScale: {
    mode: "svgWidthHeight",
    field: "scale",
    defaultValue: 1,
  },
  layers: [
    {
      select: "path, rect, circle, ellipse, polygon, polyline",
      map: {
        fill: "$.fill",
        stroke: "$.stroke",
        "stroke-width": "$.strokeWidth",
      },
    },
  ],
};
