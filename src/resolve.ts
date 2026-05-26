import type { SvgStyleInput } from "./types.js";

/**
 * Resolve `$.a.b` from input; returns undefined if missing.
 * Literal values: if template does not start with `$.`, returns as-is.
 */
export function resolveTemplate(
  template: string,
  input: SvgStyleInput,
): string {
  const t = template.trim();
  if (!t.startsWith("$.")) {
    return template;
  }
  const path = t.slice(2).split(".").filter(Boolean);
  let cur: unknown = input;
  for (const key of path) {
    if (cur === null || cur === undefined || typeof cur !== "object") {
      return "";
    }
    cur = (cur as Record<string, unknown>)[key];
  }
  if (cur === null || cur === undefined) {
    return "";
  }
  return String(cur);
}
