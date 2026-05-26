import type { SvgStyleInput } from "./types.js";

export interface MapPlotIconStyleLike {
  /** 主填充色，映射到内部 `fill` */
  color?: string;
  /** Explicit fill override */
  fill?: string;
  /** Whether stroke is shown (legacy `border`) */
  border?: boolean;
  borderColor?: string;
  borderWidth?: number;
  scale?: number;
}

/**
 * mapPlotting 风格字段 → `SvgStyleInput`（供内置固定规则栅格化使用）。
 */
export function mapPlotStyleToSvgInput(
  style: MapPlotIconStyleLike,
): SvgStyleInput {
  const showStroke = style.border !== false;
  const bw = style.borderWidth ?? 1;
  return {
    fill: style.fill ?? style.color ?? "#ff0000",
    stroke: style.borderColor ?? "#ffffff",
    strokeWidth: showStroke ? `${bw}px` : "0",
    scale: style.scale ?? 1,
  };
}
