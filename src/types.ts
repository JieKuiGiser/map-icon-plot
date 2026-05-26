/**
 * Arbitrary style payload from your app (e.g. color, scale, border).
 * Rule map values reference paths with `$.field` or `$.nested.field`.
 */
export type SvgStyleInput = Record<string, unknown>;

/** How to scale the root &lt;svg&gt; before rasterizing */
export type RootScaleMode = "svgWidthHeight" | "none";

export interface RootScaleConfig {
  mode: RootScaleMode;
  /** Key on SvgStyleInput (default `scale`) */
  field?: string;
  /** Used when input[field] is undefined */
  defaultValue?: number;
}

/**
 * One rule block: CSS selector → attribute map.
 * Map values:
 * - `"$.color"` → read `input.color`
 * - plain string → use as literal
 */
export interface SvgStyleLayerRule {
  /** CSS selector scoped to the SVG root (e.g. `path`, `rect`, `[data-role="fill"]`) */
  select: string;
  /** SVG presentation attributes to set (kebab-case keys recommended) */
  map: Record<string, string>;
}

export interface SvgStyleRules {
  version?: number;
  rootScale?: RootScaleConfig;
  /** Applied in order; later layers overwrite earlier on the same element/attr */
  layers: SvgStyleLayerRule[];
}

export interface RasterizeOptions {
  /** Device pixel ratio (default 1) */
  pixelRatio?: number;
  /** Optional canvas background (CSS color) */
  backgroundColor?: string;
  /** Revoke blob/object URLs created internally (default true) */
  revokeBlobUrls?: boolean;
}

export interface LoadSvgOptions extends RequestInit {
  /** Optional base URL for resolving relative redirects */
  baseUrl?: string;
}
