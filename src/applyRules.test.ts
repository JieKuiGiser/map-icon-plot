import { describe, expect, it } from "vitest";
import { applyDefaultMapIconStyle, serializeSvgDocument } from "./index.js";
import { parseSvgString } from "./parse.js";

const miniSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M0 0 H32 V32 H0 Z" fill="#000"/>
  <rect x="4" y="4" width="8" height="8" fill="#111"/>
</svg>`;

describe("applySvgStyleRules", () => {
  it("applies fill/stroke and scales root", () => {
    const doc = parseSvgString(miniSvg);
    applyDefaultMapIconStyle(doc, {
      fill: "#00ff00",
      stroke: "#ffffff",
      strokeWidth: "2px",
      scale: 2,
    });
    const svg = doc.documentElement;
    expect(svg.getAttribute("width")).toBe("64");
    expect(svg.getAttribute("height")).toBe("64");
    const path = doc.querySelector("path");
    expect(path?.getAttribute("fill")).toBe("#00ff00");
    expect(path?.getAttribute("stroke")).toBe("#ffffff");
    expect(path?.getAttribute("stroke-width")).toBe("2px");
  });

  it("serializes to string", () => {
    const doc = parseSvgString(miniSvg);
    const s = serializeSvgDocument(doc);
    expect(s).toContain("<svg");
    expect(s).toContain("</svg>");
  });
});
