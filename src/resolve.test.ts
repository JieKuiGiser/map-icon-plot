import { describe, expect, it } from "vitest";
import { resolveTemplate } from "./resolve.js";

describe("resolveTemplate", () => {
  it("resolves $.path", () => {
    expect(resolveTemplate("$.color", { color: "#f00" })).toBe("#f00");
  });
  it("returns literal when no prefix", () => {
    expect(resolveTemplate("#abc", {})).toBe("#abc");
  });
  it("nested path", () => {
    expect(resolveTemplate("$.style.w", { style: { w: "3px" } })).toBe("3px");
  });
});
