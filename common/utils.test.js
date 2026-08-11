import { describe, expect, it } from "vitest";
import utils from "./utils";

describe("containsSpecialCharacters", () => {
  it("accepts printable ASCII, CR/LF, blanks, and missing values", () => {
    expect(utils.containsSpecialCharacters("Hello\r\nWorld ~")).toBe(false);
    expect(utils.containsSpecialCharacters("   ")).toBe(false);
    expect(utils.containsSpecialCharacters(undefined)).toBe(false);
    expect(utils.containsSpecialCharacters(null)).toBe(false);
  });

  it("detects invalid controls and Unicode", () => {
    expect(utils.containsSpecialCharacters("a\tb")).toBe(true);
    expect(utils.containsSpecialCharacters("café")).toBe(true);
  });
});

describe("normalizeText", () => {
  it("replaces every supported occurrence without trimming or collapsing spaces", () => {
    const result = utils.normalizeText("  A\u00a0B\u2019s\u2013x\t\u200b\u2013  ");

    expect(result.value).toBe("  A B's-x -  ");
    expect(result.replacementCount).toBe(6);
    expect(result.replacements).toEqual({
      "U+0009": 1,
      "U+00A0": 1,
      "U+200B": 1,
      "U+2013": 2,
      "U+2019": 1,
    });
    expect(result.unresolved).toEqual([]);
  });

  it("leaves unknown Unicode unchanged and reports unique code points", () => {
    const result = utils.normalizeText("é😀é");
    expect(result.value).toBe("é😀é");
    expect(result.replacementCount).toBe(0);
    expect(result.unresolved.map((item) => item.code)).toEqual(["U+00E9", "U+1F600"]);
  });

  it("does not coerce non-string values", () => {
    for (const value of [undefined, null, 42, true, new Date(0)]) {
      expect(utils.normalizeText(value)).toMatchObject({ value, replacementCount: 0 });
    }
  });
});
