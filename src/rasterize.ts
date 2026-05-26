import { serializeSvgDocument } from "./applyRules.js";
import type { RasterizeOptions } from "./types.js";

/**
 * Rasterize an SVG Document to HTMLCanvasElement (browser only).
 * Uses Blob URL + Image + Canvas2D.
 */
export function svgDocumentToCanvas(
  doc: Document,
  options?: RasterizeOptions,
): Promise<HTMLCanvasElement> {
  const pr = options?.pixelRatio ?? 1;
  const revoke = options?.revokeBlobUrls !== false;

  const svgStr = serializeSvgDocument(doc);
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width || 1;
        const h = img.naturalHeight || img.height || 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(w * pr));
        canvas.height = Math.max(1, Math.ceil(h * pr));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("map-icon-plot: Canvas 2D context unavailable"));
          return;
        }
        if (options?.backgroundColor) {
          ctx.fillStyle = options.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (pr !== 1) {
          ctx.scale(pr, pr);
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (revoke) {
          URL.revokeObjectURL(url);
        }
      }
    };
    img.onerror = () => {
      if (revoke) {
        URL.revokeObjectURL(url);
      }
      reject(new Error("map-icon-plot: failed to decode SVG as image"));
    };
    img.src = url;
  });
}

export function canvasToPngDataUrl(
  canvas: HTMLCanvasElement,
  quality?: number,
): string {
  return canvas.toDataURL("image/png", quality);
}
