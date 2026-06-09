import { describe, it, expect } from "vitest";
import he from "./he";
import en from "./en";
import type { Translations } from "./types";

function t(dict: Translations, key: string): string {
  const parts = key.split(".");
  let val: unknown = dict;
  for (const part of parts) val = (val as Record<string, unknown>)?.[part];
  return typeof val === "string" ? val : key;
}

describe("translations", () => {
  it("he nav.home returns Hebrew", () => {
    expect(t(he, "nav.home")).toBe("הוסף");
  });
  it("en nav.home returns English", () => {
    expect(t(en, "nav.home")).toBe("Add");
  });
  it("returns key for missing translation", () => {
    expect(t(he, "nav.missing")).toBe("nav.missing");
  });
});
