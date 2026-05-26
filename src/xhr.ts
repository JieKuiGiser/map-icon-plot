import { parseSvgString } from "./parse.js";

/**
 * Load SVG via XMLHttpRequest (legacy parity with mapPlotting).
 * Use when `fetch` is blocked or you need `responseXML` behavior.
 */
export function loadSvgFromXhr(
  url: string,
  mimeType: string = "image/svg+xml",
): Promise<Document> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "document";
    if (typeof xhr.overrideMimeType === "function") {
      xhr.overrideMimeType(mimeType);
    }
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(
            `map-icon-plot: XHR failed ${xhr.status} ${xhr.statusText}`,
          ),
        );
        return;
      }
      const doc = xhr.response as Document | null;
      const root = doc?.documentElement;
      if (!root || root.tagName.toLowerCase() !== "svg") {
        const text = xhr.responseText;
        if (typeof text === "string" && text.length > 0) {
          try {
            resolve(parseSvgString(text));
            return;
          } catch (e) {
            reject(e);
            return;
          }
        }
        reject(new Error("map-icon-plot: XHR response is not SVG"));
        return;
      }
      resolve(doc);
    };
    xhr.onerror = () =>
      reject(new Error("map-icon-plot: XHR network error"));
    xhr.send();
  });
}
